import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface ChainState {
  contracts: {
    mockUSDT: {
      address: string;
      symbol: string;
      decimals: number;
    };
    maliciousSpender: {
      address: string;
    };
  };
  wallets: {
    user: string;
    maliciousSpender: string;
  };
  initialState: {
    userBalance: string;
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChainState | { error: string; path?: string; cwd?: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    // From apps/frontend/src/pages/api/chain-state.ts, go up to NoahAi root
    const statePath = path.join(process.cwd(), '../../chain/state.json');

    if (!fs.existsSync(statePath)) {
      console.warn('Chain state file not found, using defaults.');
      return res.status(200).json({
        contracts: {
          mockUSDT: {
            address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            symbol: 'USDT',
            decimals: 6
          },
          maliciousSpender: {
            address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
          }
        },
        wallets: {
          user: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          maliciousSpender: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        },
        initialState: {
          userBalance: '1000000000'
        }
      });
    }

    const stateData = fs.readFileSync(statePath, 'utf-8');
    const state: ChainState = JSON.parse(stateData);
    res.status(200).json(state);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Failed to read chain state',
      cwd: process.cwd()
    });
  }
}