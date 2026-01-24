import type { NextApiRequest, NextApiResponse } from 'next';

const mockPolicies = [
    { id: '1', name: 'Standard Transaction Limit', description: 'Flag transactions over 5,000 USDT', mode: 'ENFORCE', type: 'LIMIT', enabled: true, created_at: new Date().toISOString() },
    { id: '2', name: 'Malicious Contract Guard', description: 'Block known drainer addresses', mode: 'ENFORCE', type: 'SECURITY', enabled: true, created_at: new Date().toISOString() },
    { id: '3', name: 'Approve Spender Analysis', description: 'Analyze intent of ERC20 approvals', mode: 'MONITOR', type: 'ALLOWANCE', enabled: true, created_at: new Date().toISOString() }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return res.status(200).json(mockPolicies);
    }
    if (req.method === 'POST') {
        const { mode } = req.body;
        return res.status(200).json({ success: true, mode: mode || 'UPDATED' });
    }
    res.status(405).json({ error: 'Method not allowed' });
}
