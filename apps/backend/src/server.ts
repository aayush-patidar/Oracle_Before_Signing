// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Log loaded environment variables for debugging
console.log('🔧 Environment Variables Loaded:');
console.log('  X402_PAY_TO:', process.env.X402_PAY_TO || 'NOT SET');
console.log('  X402_CHAIN_ID:', process.env.X402_CHAIN_ID || 'NOT SET');
console.log('  RPC_URL:', process.env.RPC_URL || 'NOT SET');

import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as fs from 'fs';
import { chatRoutes } from './routes/chat';
import { streamRoutes } from './routes/stream';
import { enterpriseRoutes } from './routes/enterprise';
import { RunManager } from './services/runManager';
import { initializeDatabase } from './db';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: true
});

// Initialize run manager
const runManager = new RunManager();

// Register plugins
fastify.register(cors, {
  origin: true // Allow all origins for demo
});

// Register routes
fastify.register(chatRoutes, { runManager });
fastify.register(streamRoutes, { runManager });
fastify.register(enterpriseRoutes);

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'OBS Backend',
    port: PORT
  };
});

// Root endpoint
fastify.get('/', async () => {
  return {
    message: 'OBS Backend API Server',
    endpoints: {
      health: '/health',
      'chain-state': '/api/chain-state',
      chat: '/api/chat',
      stream: '/api/stream',
      contracts: '/api/contracts',
      policies: '/api/policies',
      transactions: '/api/transactions',
      dashboard: '/api/dashboard'
    }
  };
});

// Chain state endpoint
fastify.get('/api/chain-state', async (request, reply) => {
  try {
    const chainStatePath = path.join(process.cwd(), '..', '..', 'chain', 'state.json');
    if (fs.existsSync(chainStatePath)) {
      const chainState = JSON.parse(fs.readFileSync(chainStatePath, 'utf-8'));
      return chainState;
    }

    // Fallback: return mock data if state.json doesn't exist
    return {
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
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      error: 'Failed to load chain state',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
const start = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    await fastify.listen({ port: PORT, host: HOST });
    console.log(`\n✅ OBS Backend listening at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
  } catch (err) {
    fastify.log.error(err);
    console.error(`\n❌ Failed to start backend on ${HOST}:${PORT}`);
    process.exit(1);
  }
};

start();