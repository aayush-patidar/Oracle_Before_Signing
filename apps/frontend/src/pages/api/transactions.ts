import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json([
        {
            id: 't1',
            from_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            to_address: '0x1F95a95810FB99bb2781545b89E2791AD87DfAFb',
            function_name: 'approve',
            status: 'DENIED',
            createdAt: new Date().toISOString(),
            severity: 'HIGH'
        }
    ]);
}
