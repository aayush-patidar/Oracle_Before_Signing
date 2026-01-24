import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({
        totalTransactions: 12,
        pendingTransactions: 2,
        allowedTransactions: 8,
        deniedTransactions: 2,
        criticalAlerts: 1,
        highAlerts: 3,
        recentAlerts: [
            {
                event_type: 'MONITOR_MODE_VIOLATION',
                severity: 'HIGH',
                message: 'Transaction flagged by policies but allowed in Monitor Mode.',
                created_at: new Date().toISOString()
            }
        ]
    });
}
