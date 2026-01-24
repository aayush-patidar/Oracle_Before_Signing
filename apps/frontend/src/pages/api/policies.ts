import type { NextApiRequest, NextApiResponse } from 'next';
import { getDemoMode, setDemoMode } from '@/lib/demo-store';

export default function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        const mode = getDemoMode();
        const policiesWithMode = [
            { id: '1', name: 'Standard Transaction Limit', description: 'Flag transactions over 5,000 USDT', mode, type: 'LIMIT', enabled: true, created_at: new Date().toISOString() },
            { id: '2', name: 'Malicious Contract Guard', description: 'Block known drainer addresses', mode, type: 'SECURITY', enabled: true, created_at: new Date().toISOString() },
            { id: '3', name: 'Approve Spender Analysis', description: 'Analyze intent of ERC20 approvals', mode, type: 'ALLOWANCE', enabled: true, created_at: new Date().toISOString() }
        ];
        return res.status(200).json(policiesWithMode);
    }

    if (req.method === 'POST') {
        const { mode } = req.body;
        if (mode === 'ENFORCE' || mode === 'MONITOR') {
            setDemoMode(mode);
        }
        return res.status(200).json({ success: true, mode: getDemoMode() });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
