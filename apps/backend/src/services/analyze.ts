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
    // Check if balance is already in USDT format (< 1000000) or in wei format (>= 1000000)
    const rawBeforeBalance = parseFloat(simulationResult.beforeState.balance);
    const rawAfterBalance = parseFloat(simulationResult.afterState.balance);

    // If balance is >= 1000000, it's in wei (6 decimals for USDT), otherwise it's already converted
    const beforeBalance = rawBeforeBalance >= 1000000 ? rawBeforeBalance / 10 ** 6 : rawBeforeBalance;
    const afterBalance = rawAfterBalance >= 1000000 ? rawAfterBalance / 10 ** 6 : rawAfterBalance;

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
        balance_before: beforeBalance.toFixed(2),
        balance_after: afterBalance.toFixed(2),
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

    // Check for balance drain (only if effective zeroing of balance)
    const beforeBalance = parseFloat(beforeState.balance);
    const afterBalance = parseFloat(afterState.balance);
    if (afterBalance <= 0.0001 && beforeBalance > 0) {
      flags.push('BALANCE_DRAINED');
    }

    // Check if spender is malicious
    const isMalicious = intent && (
      intent.spender.toLowerCase() === MALICIOUS_SPENDER.toLowerCase() ||
      intent.spender.toLowerCase() === '0x1F95a95810FB99bb2781545b89E2791AD87DfAFb'.toLowerCase()
    );

    if (isMalicious) {
      flags.push('MALICIOUS_SPENDER');
    }

    // Check amount-based tiers
    if (intent && !intent.isUnlimited) {
      const approvalAmount = parseFloat(intent.amount) / 10 ** 6; // Convert to USDT

      if (approvalAmount >= 800) {
        flags.push('BLOCKED_AMOUNT'); // >= 800 USDT: BLOCKED
      } else if (approvalAmount >= 500 && approvalAmount < 800) {
        flags.push('PENDING_AMOUNT'); // 500-800 USDT: PENDING
      } else if (approvalAmount < 500) {
        flags.push('AUTO_APPROVED'); // < 500 USDT: AUTO-APPROVED
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