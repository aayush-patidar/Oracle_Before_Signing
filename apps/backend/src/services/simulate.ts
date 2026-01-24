import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { Intent } from './intent';

export interface SimulationResult {
  txRequest: {
    to: string;
    data: string;
    value: string;
  };
  timeline: TimelineStep[];
  beforeState: ChainState;
  afterState: ChainState;
  logs: any[];
}

export interface TimelineStep {
  block: number;
  description: string;
  timestamp: number;
}

export interface ChainState {
  balance: string;
  allowance: string;
}

const MALICIOUS_SPENDER = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const USER_WALLET = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

export class SimulationService {
  private provider: ethers.JsonRpcProvider;
  private chainState: any;

  constructor() {
    // Connect to Hardhat network
    this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    // Load chain state or use defaults
    try {
      const statePath = path.join(process.cwd(), '..', '..', 'chain', 'state.json');
      if (fs.existsSync(statePath)) {
        this.chainState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      } else {
        throw new Error('state.json not found');
      }
    } catch (error) {
      console.warn('Could not load chain state, using defaults');
      this.chainState = {
        contracts: {
          mockUSDT: {
            address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            symbol: 'USDT',
            decimals: 6
          },
          maliciousSpender: {
            address: MALICIOUS_SPENDER
          }
        },
        wallets: {
          user: USER_WALLET,
          maliciousSpender: MALICIOUS_SPENDER
        }
      };
    }
  }

  async simulateTransaction(intent: Intent): Promise<SimulationResult> {
    try {
      // Try to connect to provider with a short timeout (1s)
      // If it takes longer, we assume it's unreachable and mocking is needed
      const networkCheck = this.provider.getNetwork();
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 1000)
      );

      await Promise.race([networkCheck, timeout]);

      return await this.executeSimulation(intent);
    } catch (error) {
      console.warn('⚠️ Simulation provider unavailable/timed out, falling back to mock simulation');
      return this.mockSimulation(intent);
    }
  }

  private async executeSimulation(intent: Intent): Promise<SimulationResult> {
    if (intent.type !== 'erc20_approve') {
      throw new Error('Only ERC20 approve transactions are supported');
    }

    // Build transaction
    const txRequest = this.buildApproveTransaction(intent);

    // Get initial state
    const beforeState = await this.getChainState();

    const timeline: TimelineStep[] = [
      {
        block: 0,
        description: 'Initial state',
        timestamp: Date.now()
      }
    ];

    // Execute approval
    await this.executeTransaction(txRequest);

    timeline.push({
      block: 1,
      description: 'Approval executed',
      timestamp: Date.now()
    });

    // Check if we should simulate drain
    const shouldDrain = this.shouldSimulateDrain(intent);

    if (shouldDrain) {
      await this.simulateDrain();
      timeline.push({
        block: 19, // Fake block +18
        description: 'Drain executed by malicious spender',
        timestamp: Date.now()
      });
    }

    // Get final state
    const afterState = await this.getChainState();

    return {
      txRequest,
      timeline,
      beforeState,
      afterState,
      logs: []
    };
  }

  private mockSimulation(intent: Intent): SimulationResult {
    const txRequest = this.buildApproveTransaction(intent);

    const beforeState = {
      balance: '1000000000', // 1000 USDT
      allowance: '0'
    };

    const timeline: TimelineStep[] = [
      { block: 0, description: 'Initial state evaluated', timestamp: Date.now() },
      { block: 1, description: `Approval for ${intent.amount} USDT simulated`, timestamp: Date.now() }
    ];

    let afterState = { ...beforeState, allowance: intent.amount };

    // Identify if it's a "risky" transaction for the demo
    // If approving the known malicious spender (even with case difference)
    const isRiskySpender = intent.spender.toLowerCase() === MALICIOUS_SPENDER.toLowerCase() ||
      intent.spender.toLowerCase() === '0x1F95a95810FB99bb2781545b89E2791AD87DfAFb'.toLowerCase(); // Monad Spender

    if (isRiskySpender && intent.isUnlimited) {
      timeline.push({
        block: 18,
        description: '🚨 POTENTIAL DRAIN DETECTED: Spender drains 1000 USDT',
        timestamp: Date.now()
      });
      afterState.balance = '0'; // Drained!
    }

    return {
      txRequest,
      timeline,
      beforeState,
      afterState,
      logs: []
    };
  }

  private buildApproveTransaction(intent: Intent): { to: string; data: string; value: string } {
    const iface = new ethers.Interface([
      'function approve(address spender, uint256 amount) returns (bool)'
    ]);

    const data = iface.encodeFunctionData('approve', [intent.spender, intent.amount]);

    return {
      to: intent.token.address,
      data,
      value: '0'
    };
  }

  private async executeTransaction(txRequest: { to: string; data: string; value: string }): Promise<void> {
    const signer = await this.provider.getSigner(0);
    const tx = await signer.sendTransaction({
      to: txRequest.to,
      data: txRequest.data,
      value: txRequest.value
    });
    await tx.wait();
  }

  private shouldSimulateDrain(intent: Intent): boolean {
    return intent.spender.toLowerCase() === MALICIOUS_SPENDER.toLowerCase() && intent.isUnlimited;
  }

  private async simulateDrain(): Promise<void> {
    const maliciousSpenderAbi = [
      'function drain(address token, address from, address to) external'
    ];
    const maliciousSpender = new ethers.Contract(
      MALICIOUS_SPENDER,
      maliciousSpenderAbi,
      await this.provider.getSigner(0)
    );

    const tx = await maliciousSpender.drain(
      this.chainState.contracts.mockUSDT.address,
      USER_WALLET,
      MALICIOUS_SPENDER
    );

    await tx.wait();
  }

  private async getChainState(): Promise<ChainState> {
    const tokenAbi = [
      'function balanceOf(address) view returns (uint256)',
      'function allowance(address, address) view returns (uint256)'
    ];

    const token = new ethers.Contract(
      this.chainState.contracts.mockUSDT.address,
      tokenAbi,
      this.provider
    );

    const [balance, allowance] = await Promise.all([
      token.balanceOf(USER_WALLET),
      token.allowance(USER_WALLET, MALICIOUS_SPENDER)
    ]);

    return {
      balance: balance.toString(),
      allowance: allowance.toString()
    };
  }
}