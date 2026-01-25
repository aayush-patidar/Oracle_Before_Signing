import type { NextApiRequest, NextApiResponse } from 'next';
import { getTransactions, getAlerts } from '@/lib/demo-store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const txs = getTransactions();
    const alerts = getAlerts();

    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const critical = alerts.filter((a: any) => a.severity === 'CRITICAL').length;
    const high = alerts.filter((a: any) => a.severity === 'HIGH').length;

    res.status(200).json({
        totalTransactions: txs.length,
        pendingTransactions: txs.filter((t: any) => t.status === 'PENDING').length,
        allowedTransactions: txs.filter((t: any) => t.status === 'ALLOWED').length,
        deniedTransactions: txs.filter((t: any) => t.status === 'DENIED').length,
        criticalAlerts: critical,
        highAlerts: high,
        recentAlerts: alerts.slice(0, 5),
        totalAlerts: alerts.length
    });
}
