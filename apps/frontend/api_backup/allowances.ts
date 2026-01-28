import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllowances, addAllowance, removeAllowance, removeMultipleAllowances } from '@/lib/demo-store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        const allowances = getAllowances();
        return res.status(200).json({ allowances });
    }

    if (req.method === 'POST') {
        const newAllowance = addAllowance(req.body);
        return res.status(200).json(newAllowance);
    }

    if (req.method === 'DELETE') {
        const { id, ids } = req.query;
        if (ids) {
            const idArray = (ids as string).split(',').map(Number);
            removeMultipleAllowances(idArray);
        } else if (id) {
            removeAllowance(Number(id));
        }
        return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
