import type { NextApiRequest, NextApiResponse } from 'next';
import { getAlerts, addAlert } from '@/lib/demo-store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        const alerts = getAlerts();
        return res.status(200).json(alerts);
    }

    if (req.method === 'POST') {
        const newAlert = addAlert(req.body);
        return res.status(200).json(newAlert);
    }

    if (req.method === 'PATCH') {
        return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
