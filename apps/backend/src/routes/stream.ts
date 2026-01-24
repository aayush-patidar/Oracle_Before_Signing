import { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { RunManager } from '../services/runManager';

export const streamRoutes: FastifyPluginAsync<{ runManager: RunManager }> = async (fastify: FastifyInstance, options: FastifyPluginOptions & { runManager: RunManager }) => {
  const { runManager } = options;

  fastify.get('/api/stream/:runId', {
    schema: {
      params: {
        type: 'object',
        required: ['runId'],
        properties: {
          runId: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { runId: string } }>, reply: FastifyReply) => {
    const { runId } = request.params;

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    const run = runManager.getRun(runId);
    if (!run) {
      reply.code(404).send({ error: 'Run not found' });
      return;
    }

    // Send current state immediately
    if (run.currentStage) {
      reply.raw.write(`data: ${JSON.stringify(run.currentStage)}\n\n`);
    }

    // Listen for updates
    const onUpdate = (stage: any) => {
      reply.raw.write(`data: ${JSON.stringify(stage)}\n\n`);
    };

    runManager.on(runId, onUpdate);

    // Clean up on client disconnect
    request.raw.on('close', () => {
      runManager.off(runId, onUpdate);
    });

    // Keep connection alive
    const keepAlive: NodeJS.Timeout = setInterval(() => {
      reply.raw.write(': keepalive\n\n');
    }, 30000);

    request.raw.on('close', () => {
      clearInterval(keepAlive);
    });
  });
};