import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return res.status(200).json([
            {
                _id: 'a1',
                event_type: 'MONITOR_MODE_VIOLATION',
                severity: 'HIGH',
                message: 'Transaction flagged by policies but allowed in Monitor Mode. Reasons: Unlimited allowance requested.',
                created_at: new Date().toISOString(),
                acknowledged: false
            }
        ]);
    }
    if (req.method === 'PATCH') {
        return res.status(200).json({ success: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
}
