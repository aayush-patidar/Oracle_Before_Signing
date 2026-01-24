import { SimulationResult } from './simulate';
import { Intent } from './intent';

export interface RealityDelta {
  wallet: string;
  token: {
    symbol: string;
    address: string;
  };
  delta: {
    balance_before: string;
    balance_after: string;
    allowance_before: string;
    allowance_after: string;
  };
  risk_flags: string[];
  irreversible: boolean;
}

const MALICIOUS_SPENDER = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const USER_WALLET = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export class AnalysisService {
  async extractDelta(simulationResult: SimulationResult, intent?: Intent): Promise<RealityDelta> {
    const beforeBalance = parseFloat(simulationResult.beforeState.balance) / 10**6; // Convert from wei to USDT
    const afterBalance = parseFloat(simulationResult.afterState.balance) / 10**6;
    const beforeAllowance = simulationResult.beforeState.allowance;
    const afterAllowance = simulationResult.afterState.allowance;

    // Determine risk flags
    const riskFlags = this.determineRiskFlags(
      simulationResult.beforeState,
      simulationResult.afterState,
      intent
    );

    // Check if irreversible (balance drained or unlimited approval)
    const irreversible = this.isIrreversible(
      beforeBalance,
      afterBalance,
      afterAllowance
    );

    return {
      wallet: USER_WALLET,
      token: {
        symbol: 'USDT',
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // MockUSDT address
      },
      delta: {
        balance_before: beforeBalance.toFixed(6),
        balance_after: afterBalance.toFixed(6),
        allowance_before: beforeAllowance,
        allowance_after: afterAllowance
      },
      risk_flags: riskFlags,
      irreversible
    };
  }

  private determineRiskFlags(
    beforeState: any,
    afterState: any,
    intent?: Intent
  ): string[] {
    const flags: string[] = [];

    // Check for unlimited approval
    if (afterState.allowance === MAX_UINT) {
      flags.push('UNLIMITED_APPROVAL');
    }

    // Check for balance drain
    const beforeBalance = parseFloat(beforeState.balance);
    const afterBalance = parseFloat(afterState.balance);
    if (afterBalance < beforeBalance) {
      flags.push('BALANCE_DRAINED');
    }

    // Check if spender is malicious
    if (intent && intent.spender.toLowerCase() === MALICIOUS_SPENDER.toLowerCase()) {
      flags.push('MALICIOUS_SPENDER');
    }

    // Check for large approval (> 20% of balance equivalent)
    if (intent && !intent.isUnlimited) {
      const approvalAmount = parseFloat(intent.amount);
      const balanceEquivalent = parseFloat(beforeState.balance);
      if (approvalAmount > balanceEquivalent * 0.2) {
        flags.push('LARGE_APPROVAL');
      }
    }

    return flags;
  }

  private isIrreversible(
    beforeBalance: number,
    afterBalance: number,
    afterAllowance: string
  ): boolean {
    // Irreversible if balance was drained
    if (afterBalance < beforeBalance) {
      return true;
    }

    // Irreversible if unlimited approval granted
    if (afterAllowance === MAX_UINT) {
      return true;
    }

    return false;
  }
}