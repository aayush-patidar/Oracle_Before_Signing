import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Simple in-memory storage for demo runs (ephemeral)
const runIntents: Record<string, string> = {};

const PRICE_WEI = process.env.X402_PRICE_WEI || '500000000000000'; // 0.0005 ETH (default)
const PAY_TO = process.env.X402_PAY_TO || '0x598a82A1e968D29A2666847C39bCa5adf5640684';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-payment-tx');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        const { message } = req.body;
        const paymentTx = req.headers['x-payment-tx'];

        const isApprove = message?.toLowerCase().includes('approve') || message?.toLowerCase().includes('grant');

        if (isApprove && !paymentTx) {
            return res.status(402).json({
                error: 'Payment Required',
                priceWei: PRICE_WEI,
                payTo: PAY_TO,
                message: 'Simulation of this transaction requires a security fee.'
            });
        }

        const runId = 'demo-' + Math.random().toString(36).substring(7);
        // Save the intent to provide a dynamic response in the subsequent GET request
        runIntents[runId] = message || '';

        return res.status(200).json({ runId, verified: !!paymentTx, txHash: paymentTx });
    }

    if (req.method === 'GET' && req.query.runId) {
        const runId = req.query.runId as string;
        const intent = (runIntents[runId] || '').toLowerCase();

        // Dynamic Logic based on Intent
        let responseData: any;

        // Case 1: Unlimited / High Risk
        if (intent.includes('unlimited') || intent.includes('max') || intent.includes('huge')) {
            responseData = {
                stage: 'final',
                judgment: {
                    judgment: 'DENY',
                    reasoning_summary: 'High risk detected: Unlimited spending power requested.',
                    reasoning_bullets: [
                        'MaxUint256 allowance requested',
                        'Spender address is not verified',
                        'Potential drainer pattern recognized'
                    ],
                    override_allowed: true,
                    risk_score: 98
                },
                reality_delta: {
                    delta: { balance_before: '1,000 USDT', balance_after: '0 USDT (Potential Drain)' },
                    risk_flags: ['CRITICAL_EXPOSURE', 'UNLIMITED_APPROVAL']
                },
                timeline: [
                    { time: 'T+0s', event: 'Approval signed', status: 'critical' },
                    { time: 'T+12s', event: 'Unauthorized Sweep Initiated', status: 'critical' },
                    { time: 'T+15s', event: 'Wallet Emptied', status: 'danger' }
                ]
            };
        }
        // Case 2: Small Amounts (Safe)
        else if (intent.match(/\b(10|50|100)\b/) || (intent.includes('usdt') && intent.match(/\b([1-9][0-9]{0,2})\b/))) {
            responseData = {
                stage: 'final',
                judgment: {
                    judgment: 'ALLOW',
                    reasoning_summary: 'Transaction within safe corporate limits.',
                    reasoning_bullets: [
                        'Amount is below the daily threshold',
                        'Target contract matches trusted protocol pattern',
                        'No malicious sub-calls detected'
                    ],
                    override_allowed: false,
                    risk_score: 5
                },
                reality_delta: {
                    delta: { balance_before: '1,000 USDT', balance_after: '900 USDT (Expected)' },
                    risk_flags: []
                },
                timeline: [
                    { time: 'T+0s', event: 'Approval signed', status: 'success' },
                    { time: 'T+5s', event: 'Limit verified', status: 'success' },
                    { time: 'T+10s', event: 'Transaction confirmed', status: 'success' }
                ]
            };
        }
        // Case 3: Medium Amounts / Generic
        else {
            responseData = {
                stage: 'final',
                judgment: {
                    judgment: 'ALLOW',
                    warning: 'MEDIUM RISK: Non-whitelisted contract',
                    reasoning_summary: 'Transaction allowed but flagged for manual review.',
                    reasoning_bullets: [
                        'Amount exceeds standard convenience limit',
                        'Spender is a known Router but not whitelisted',
                        'Partial exposure to the contract detected'
                    ],
                    override_allowed: true,
                    risk_score: 45
                },
                reality_delta: {
                    delta: { balance_before: '1,000 USDT', balance_after: '0 USDT (Exposure Risk)' },
                    risk_flags: ['UNWHITELISTED_SPENDER', 'MEDIUM_THRESHOLD_EXCEEDED']
                },
                timeline: [
                    { time: 'T+0s', event: 'Approval signed', status: 'warning' },
                    { time: 'T+8s', event: 'Exposure log generated', status: 'warning' },
                    { time: 'T+15s', event: 'Transaction monitored', status: 'success' }
                ]
            };
        }

        return res.status(200).json(responseData);
    }

    res.status(404).json({ error: 'Not found' });
}
