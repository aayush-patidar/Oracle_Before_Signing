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
      res.status(404).json({
        error: 'Chain state file not found.',
        path: statePath,
        cwd: process.cwd()
      });
      return;
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