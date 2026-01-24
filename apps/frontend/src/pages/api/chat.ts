import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const runId = 'demo-' + Math.random().toString(36).substring(7);
        return res.status(200).json({ runId });
    }

    if (req.method === 'GET' && req.query.stream) {
        // Note: Standard Pages router handles streaming differently, but for the demo UI
        // we will return the final judgment directly to ensure the UI doesn't hang.
        return res.status(200).json({
            stage: 'final',
            judgment: {
                judgment: 'DENY',
                reasoning_summary: 'This transaction grants unlimited spending power to a non-verified contract.',
                reasoning_bullets: ['Unlimited allowance requested', 'Contract is not on the whitelist'],
                override_allowed: true,
                risk_score: 85
            }
        });
    }

    res.status(404).json({ error: 'Not found' });
}
