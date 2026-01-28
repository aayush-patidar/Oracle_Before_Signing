import type { NextApiRequest, NextApiResponse } from 'next';
import { getTransactions, addTransaction } from '@/lib/demo-store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        const txs = getTransactions();
        return res.status(200).json(txs);
    }

    if (req.method === 'POST') {
        const newTx = addTransaction(req.body);
        return res.status(200).json(newTx);
    }

    res.status(405).json({ error: 'Method not allowed' });
}
