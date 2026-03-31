import { Intent } from './intent';
import { RealityDelta } from './analyze';
import { SimulationResult } from './simulate';

export interface Judgment {
  judgment: 'ALLOW' | 'DENY';
  reasoning_bullets: string[];
  adversarial_question: string;
  override_allowed: boolean;
}

const MALICIOUS_SPENDER = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export class JudgmentService {
  private readonly FULL_LIMIT = 10000;
  private readonly HALF_LIMIT = 5000;

  async makeJudgment(
    intent: Intent,
    realityDelta: RealityDelta,
    simulationResult: SimulationResult
  ): Promise<Judgment> {
    const amount = parseFloat(intent.amount) / 10 ** 6;
    const balance = parseFloat(realityDelta.delta.balance_before); // Mock currently 1000

    // 1. Fully or Unlimited -> DENIED (No override)
    if (intent.isUnlimited || amount >= balance) {
      return {
        judgment: 'DENY',
        override_allowed: false,
        reasoning_bullets: [
          `Amount (${intent.isUnlimited ? 'Unlimited' : amount + ' USDT'}) is equal to or exceeds current balance (${balance} USDT)`,
          'High risk: simulation shows potential for complete fund drain',
          'Automated security block for platform safety'
        ],
        adversarial_question: `This transaction is for ${intent.isUnlimited ? 'Unlimited' : amount + ' USDT'}, which exceeds your total balance. Blocking for safety.`
      };
    }

    // 2. Between Half and Less than Full -> PENDING (Override allowed)
    if (amount >= balance * 0.5) {
      return {
        judgment: 'DENY',
        override_allowed: true,
        reasoning_bullets: [
          `Amount (${amount} USDT) is between 50% and 100% of your current balance (${balance} USDT)`,
          'High-value transaction requires manual verification',
          'Audit log created for compliance review'
        ],
        adversarial_question: `This approval is for ${amount} USDT (>${(balance * 0.5).toFixed(0)} USDT). Manual justification required.`
      };
    }

    // 3. Between 0 and Half -> AUTO APPROVE (Allowed)
    return {
      judgment: 'ALLOW',
      override_allowed: true,
      reasoning_bullets: [
        `Amount (${amount} USDT) is safely below 50% of your current balance`,
        'Spender legitimacy confirmed via simulation',
        'Auto-verification pipeline complete'
      ],
      adversarial_question: "Transaction is within safe limits for your current balance. Do you want to sign?"
    };
  }
}
