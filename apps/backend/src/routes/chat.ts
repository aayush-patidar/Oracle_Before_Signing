import { FastifyPluginAsync } from 'fastify';
import { RunManager } from '../services/runManager';
import { verifyPaymentTx, getX402Config } from '../services/x402';
import { Queries } from '../db';

interface ChatRequest {
  message: string;
}

export const chatRoutes: FastifyPluginAsync<{ runManager: RunManager }> = async (fastify, options) => {
  const { runManager } = options;

  fastify.post<{
    Body: ChatRequest;
  }>('/api/chat', async (request, reply) => {
    try {
      const { message } = request.body;
      const paymentTx = request.headers['x-payment-tx'] as string;
      const config = getX402Config();

      // 1. NoahAI Intent Parsing (FREE)
      const intentPreview = await runManager.parseIntentPreview(message);

      // 2. Cyrene Simulation/Judgment (PAID) - Check for payment
      if (!paymentTx) {
        return reply.code(402).send({
          error: 'PAYMENT_REQUIRED',
          protocol: 'x402',
          priceWei: config.priceWei,
          chainId: config.chainId,
          payTo: config.payTo,
          memo: 'OBS_SIMULATION_RUN',
          reason: 'MISSING_PAYMENT',
          runPreview: { intent: intentPreview }
        });
      }

      // 3. Verify Payment
      const verification = await verifyPaymentTx(paymentTx);
      if (!verification.ok) {
        return reply.code(402).send({
          error: 'PAYMENT_REQUIRED',
          protocol: 'x402',
          priceWei: config.priceWei,
          chainId: config.chainId,
          payTo: config.payTo,
          memo: 'OBS_SIMULATION_RUN',
          reason: verification.reason || 'INVALID_PAYMENT',
          runPreview: { intent: intentPreview }
        });
      }

      // 4. Log payment to DB
      await Queries.addPayment({
        txHash: paymentTx,
        payer: verification.payer,
        amountWei: verification.amountWei,
        memo: 'OBS_SIMULATION_RUN'
      });

      // 5. Success -> Start paid run
      const runId = runManager.startRun(message, paymentTx);

      // Start full processing in background
      runManager.processRun(runId);

      return { runId };
    } catch (error: any) {
      console.error('Chat processing error:', error);
      return reply.code(400).send({
        error: 'BAD_REQUEST',
        message: error.message || 'Failed to process request'
      });
    }
  });
};