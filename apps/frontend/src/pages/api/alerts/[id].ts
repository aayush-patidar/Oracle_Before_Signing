import type { NextApiRequest, NextApiResponse } from 'next';
import { acknowledgeAlert } from '@/lib/demo-store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;

    if (req.method === 'PATCH') {
        const updatedAlert = acknowledgeAlert(id as string);
        if (updatedAlert) {
            return res.status(200).json(updatedAlert);
        } else {
            return res.status(404).json({ error: 'Alert not found' });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
