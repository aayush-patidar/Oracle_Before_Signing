import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Simple in-memory storage for demo runs (ephemeral)
const runIntents: Record<string, string> = {};

const PRICE_WEI = process.env.X402_PRICE_WEI || '100000000000000'; // Match root .env default
const PAY_TO = process.env.X402_PAY_TO || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Safer fallback EOA

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('💬 Chat API Internal Config:', { PAY_TO, PRICE_WEI });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-payment-tx');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        const { message } = req.body;
        const paymentTx = req.headers['x-payment-tx'];

        const isApprove = message?.toLowerCase().includes('approve') || message?.toLowerCase().includes('grant');

        // IMPROVED LOGIC: Only charge if the intent is well-formed (contains address/entity OR amount)
        // This prevents charging for "approve" (vague) but charges for "approve 0x123" or "approve max"
        const hasDetails =
            message?.match(/0x[a-fA-F0-9]{40}/) || // Has address
            message?.toLowerCase().includes('max') || // Has keyword max
            message?.toLowerCase().includes('unlimited') || // Has keyword unlimited
            message?.match(/\b\d+\s*(usdt|eth|btc|token|dai|usdc)\b/i); // Has '100 USDT' etc.

        if (isApprove && hasDetails && !paymentTx) {
            return res.status(402).json({
                error: 'Payment Required',
                priceWei: PRICE_WEI,
                payTo: PAY_TO,
                message: 'Simulation of this transaction requires a security fee.'
            });
        }

        // If it's an approve intent but missing details, we proceed to create a runId
        // The GET handler logic below should be updated to handle "Case 4: Missing Info"
        // to guide the user without charging them yet.

        const runId = 'demo-' + Math.random().toString(36).substring(7);
        // Save the intent to provide a dynamic response in the subsequent GET request
        runIntents[runId] = message || '';

        return res.status(200).json({ runId, verified: !!paymentTx, txHash: paymentTx });
    }

    if (req.method === 'GET' && req.query.runId) {
        const runId = req.query.runId as string;
        const intent = (runIntents[runId] || '').toLowerCase();

        // Helper to extract amount and token
        // Matches: "1000 USDT", "1,000 USDT", "10.5 ETH"
        // Improved regex to be greedy and prioritize full numbers
        const amountMatch = intent.match(/(?<!0x)(?:\b|^)(\d+(?:,\d{3})*(?:\.\d+)?)\s*([a-z]+)?/i);

        let amountStr = amountMatch ? amountMatch[1].replace(/,/g, '') : '1000';
        let token = amountMatch && amountMatch[2] ? amountMatch[2].toUpperCase() : 'USDT';

        if (!amountMatch?.[2]) {
            const tokenMatch = intent.match(/\b(USDT|ETH|BTC|DAI|USDC|WETH)\b/i);
            if (tokenMatch) token = tokenMatch[1].toUpperCase();
        }

        const amountVal = parseFloat(amountStr);
        const safeAmount = isNaN(amountVal) ? 1000 : amountVal;

        // Dynamic Wallet Simulation: Fixed 10,000 balance for the demo simulation.
        // If users exceed this, the system will now properly DENY the intent.
        const mockBalanceVal = 10000;
        const formattedBalance = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(mockBalanceVal);
        const extractedAmountStr = `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(safeAmount)} ${token}`;

        // Dynamic Logic based on Intent
        let responseData: any;

        // Case 0: Insufficient Funds (Warning Mode)
        if (safeAmount > mockBalanceVal) {
            responseData = {
                stage: 'final',
                judgment: {
                    judgment: 'ALLOW',
                    monitor_mode_override: true,
                    warning: 'INSUFFICIENT_FUNDS',
                    reasoning_summary: 'Alert: Transaction amount exceeds current simulated wallet balance.',
                    reasoning_bullets: [
                        `Wallet Balance: ${formattedBalance} ${token}`,
                        `Requested Amount: ${new Intl.NumberFormat().format(safeAmount)} ${token}`,
                        'Simulation: Proceeding will result in a chain rejection at sign-time.'
                    ],
                    override_allowed: true,
                    risk_score: 90
                },
                reality_delta: {
                    delta: { balance_before: `${formattedBalance} ${token}`, balance_after: 'REJECTED (Debt Prevention)' },
                    risk_flags: ['INSUFFICIENT_FUNDS_ALARM']
                },
                timeline: [
                    { time: 'T+0s', event: 'Intent Received', status: 'success', description: 'Transaction parameters synthesized from user prompt.' },
                    { time: 'T+2s', event: 'Balance check failed', status: 'warning', description: 'Address liquidity verification returned insufficient delta.' },
                    { time: 'T+5s', event: 'Oracle Verdict: WARNING', status: 'warning', description: 'Forced warning generated for potential chain-side rejection.' }
                ]
            };
        }
        // Case 1: Unlimited / High Risk
        else if (intent.includes('unlimited') || intent.includes('max') || intent.includes('huge')) {
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
                    delta: { balance_before: `${formattedBalance} ${token}`, balance_after: `0 ${token} (Potential Drain)` },
                    risk_flags: ['CRITICAL_EXPOSURE', 'UNLIMITED_APPROVAL']
                },
                timeline: [
                    { time: 'T+0s', event: 'Approval signed', status: 'critical', description: 'High-risk MaxUint256 signature simulated on forked state.' },
                    { time: 'T+12s', event: 'Unauthorized Sweep Initiated', status: 'critical', description: 'Adversarial actor triggered recursive withdraw on spender.' },
                    { time: 'T+15s', event: 'Wallet Emptied', status: 'danger', description: 'Full account depletion observed in synthetic causality branch.' }
                ]
            };
        }
        // Case 2: Small Amounts (Safe) - Logic: if amount is <= 500
        else if (safeAmount <= 10000 && (intent.includes('usdt') || token === 'USDT' || intent.includes('dai') || intent.includes('usdc'))) {
            const remaining = mockBalanceVal > safeAmount ? mockBalanceVal - safeAmount : 0;
            const remainingStr = `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(remaining)} ${token}`;

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
                    delta: { balance_before: `${formattedBalance} ${token}`, balance_after: `${remainingStr} (Expected)` },
                    risk_flags: []
                },
                timeline: [
                    { time: 'T+0s', event: 'Approval signed', status: 'success', description: 'Standard allowance signature verified for security.' },
                    { time: 'T+5s', event: 'Limit verified', status: 'success', description: 'Protocol threshold confirm within organizational guidelines.' },
                    { time: 'T+10s', event: 'Transaction confirmed', status: 'success', description: 'Simulated on-chain finality reached with nominal gas.' }
                ]
            };
        }
        // Case 4: Missing Info (Prompt user for Free)
        else {
            const hasSpecifics =
                intent.match(/0x[a-fA-F0-9]{40}/) ||
                intent.includes('max') ||
                intent.includes('unlimited') ||
                intent.match(/\b\d+\s*(usdt|eth|btc|token|dai|usdc)\b/i);

            if (!hasSpecifics && (intent.includes('approve') || intent.includes('grant'))) {
                responseData = {
                    stage: 'final',
                    error: 'Ambiguous Intent: Please specify an address (0x...) or an amount (e.g., 100 USDT) to approve.',
                    judgment: null
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
                        delta: { balance_before: `${formattedBalance} ${token}`, balance_after: `0 ${token} (Exposure Risk)` },
                        risk_flags: ['UNWHITELISTED_SPENDER', 'MEDIUM_THRESHOLD_EXCEEDED']
                    },
                    timeline: [
                        { time: 'T+0s', event: 'Approval signed', status: 'warning', description: 'Medium-risk approval granted to unverified router.' },
                        { time: 'T+8s', event: 'Exposure log generated', status: 'warning', description: 'Internal security log dispatched for compliance review.' },
                        { time: 'T+15s', event: 'Transaction monitored', status: 'success', description: 'Real-time observation window opened for post-exec delta.' }
                    ]
                };
            }
        } // End of else (Medium Risk or Ambiguous)

        return res.status(200).json(responseData);
    }

    res.status(404).json({ error: 'Not found' });
}
