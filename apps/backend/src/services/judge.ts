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
  async makeJudgment(
    intent: Intent,
    realityDelta: RealityDelta,
    simulationResult: SimulationResult
  ): Promise<Judgment> {
    // Hard DENY rules (no exceptions)
    if (this.shouldDeny(intent, realityDelta)) {
      return this.createDenyJudgment(intent, realityDelta);
    }

    // ALLOW rules
    if (this.shouldAllow(intent, realityDelta)) {
      return this.createAllowJudgment(intent, realityDelta);
    }

    // Risky but not malicious - allow override
    return this.createRiskyDenyJudgment(intent, realityDelta);
  }

  private shouldDeny(intent: Intent, realityDelta: RealityDelta): boolean {
    // DENY if spender is malicious
    if (intent.spender.toLowerCase() === MALICIOUS_SPENDER.toLowerCase()) {
      return true;
    }

    // DENY if unlimited approval
    if (intent.isUnlimited || realityDelta.delta.allowance_after === MAX_UINT) {
      return true;
    }

    // DENY if balance was drained in simulation
    const beforeBalance = parseFloat(realityDelta.delta.balance_before);
    const afterBalance = parseFloat(realityDelta.delta.balance_after);
    if (afterBalance < beforeBalance) {
      return true;
    }

    // DENY if approval > 20% of balance equivalent
    if (!intent.isUnlimited) {
      const approvalAmount = parseFloat(intent.amount) / 10**6; // Convert to USDT
      const balance = parseFloat(realityDelta.delta.balance_before);
      if (approvalAmount > balance * 0.2) {
        return true;
      }
    }

    return false;
  }

  private shouldAllow(intent: Intent, realityDelta: RealityDelta): boolean {
    // ALLOW if small amount (<= 10 USDT)
    if (!intent.isUnlimited) {
      const amount = parseFloat(intent.amount) / 10**6; // Convert to USDT
      if (amount <= 10) {
        return true;
      }
    }

    // ALLOW if spender is not malicious and no drain occurred
    const balanceDrained = parseFloat(realityDelta.delta.balance_after) <
                          parseFloat(realityDelta.delta.balance_before);

    if (intent.spender.toLowerCase() !== MALICIOUS_SPENDER.toLowerCase() && !balanceDrained) {
      return true;
    }

    return false;
  }

  private createDenyJudgment(intent: Intent, realityDelta: RealityDelta): Judgment {
    const reasoning: string[] = [];
    let question = '';
    let overrideAllowed = false;

    if (realityDelta.risk_flags.includes('MALICIOUS_SPENDER')) {
      reasoning.push('Spender is in malicious list');
      reasoning.push('Simulation shows complete fund drain');
      question = 'This approval gives permanent spending power and simulation shows your funds reach 0. Why is this acceptable?';
      overrideAllowed = false; // No override for malicious
    } else if (realityDelta.risk_flags.includes('UNLIMITED_APPROVAL')) {
      reasoning.push('Unlimited approval detected');
      reasoning.push('Grants permanent spending authority');
      question = 'This gives unlimited access to your tokens forever. Are you sure this is necessary?';
      overrideAllowed = false; // No override for unlimited
    } else if (realityDelta.risk_flags.includes('BALANCE_DRAINED')) {
      reasoning.push('Simulation shows balance drain');
      reasoning.push('Funds would be lost if spender is compromised');
      question = 'The simulation shows your balance going to zero. Do you understand this risk?';
      overrideAllowed = false;
    } else if (realityDelta.risk_flags.includes('LARGE_APPROVAL')) {
      reasoning.push('Large approval amount detected');
      reasoning.push('Exceeds safe threshold for token approvals');
      question = 'This approval is unusually large. Have you verified the spender\'s legitimacy?';
      overrideAllowed = true; // Allow override for large but not unlimited
    }

    return {
      judgment: 'DENY',
      reasoning_bullets: reasoning,
      adversarial_question: question,
      override_allowed: overrideAllowed
    };
  }

  private createAllowJudgment(intent: Intent, realityDelta: RealityDelta): Judgment {
    return {
      judgment: 'ALLOW',
      reasoning_bullets: [
        'Small approval amount',
        'Spender appears safe',
        'No simulation risks detected'
      ],
      adversarial_question: 'If this spender misbehaves, you can revoke later—do you still want to proceed?',
      override_allowed: true
    };
  }

  private createRiskyDenyJudgment(intent: Intent, realityDelta: RealityDelta): Judgment {
    return {
      judgment: 'DENY',
      reasoning_bullets: [
        'Approval amount exceeds safe threshold',
        'Potential risk to funds',
        'Override available with justification'
      ],
      adversarial_question: 'This approval seems risky. Why do you believe this spender is trustworthy?',
      override_allowed: true
    };
  }
}