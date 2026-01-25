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
    // Try multiple paths for robustness (Vercel vs Local)
    const pathsToCheck = [
      path.join(process.cwd(), 'public', 'state.json'),              // Production/Vercel
      path.join(process.cwd(), 'apps', 'frontend', 'public', 'state.json'), // Monorepo Root
      path.join(process.cwd(), '../../chain/state.json')             // Local Dev
    ];

    let statePath = '';
    for (const p of pathsToCheck) {
      if (fs.existsSync(p)) {
        statePath = p;
        break;
      }
    }

    if (!statePath) {
      console.warn('Chain state file not found, using Monad Testnet defaults.');
      return res.status(200).json({
        contracts: {
          mockUSDT: {
            address: '0xf187ba9BdF5aE32D7F75A537CE7399D0855410C6',
            symbol: 'USDT',
            decimals: 6
          },
          maliciousSpender: {
            address: '0x1F95a95810FB99bb2781545b89E2791AD87DfAFb'
          }
        },
        wallets: {
          user: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          maliciousSpender: '0x1F95a95810FB99bb2781545b89E2791AD87DfAFb' // Using spender as malicious wallet for demo
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