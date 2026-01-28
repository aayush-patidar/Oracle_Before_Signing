import { v4 as uuidv4 } from 'uuid';
import { IntentService } from './intent';
import { SimulationService } from './simulate';
import { AnalysisService } from './analyze';
import { JudgmentService } from './judge';
import { Queries } from '../db';

export interface Run {
  id: string;
  message: string;
  paymentTxHash?: string;
  currentStage?: any;
  result?: any;
  createdAt: Date;
  listeners: Set<(stage: any) => void>;
}

export class RunManager {
  private runs = new Map<string, Run>();
  private intentService = new IntentService();
  private simulationService = new SimulationService();
  private analysisService = new AnalysisService();
  private judgmentService = new JudgmentService();

  startRun(message: string, paymentTxHash?: string): string {
    const runId = uuidv4();
    const run: Run = {
      id: runId,
      message,
      paymentTxHash,
      createdAt: new Date(),
      listeners: new Set()
    };

    this.runs.set(runId, run);
    return runId;
  }

  async parseIntentPreview(message: string): Promise<any> {
    return await this.intentService.parseIntent(message);
  }

  getRun(runId: string): Run | undefined {
    return this.runs.get(runId);
  }

  on(runId: string, listener: (stage: any) => void): void {
    const run = this.runs.get(runId);
    if (run) {
      run.listeners.add(listener);
    }
  }

  off(runId: string, listener: (stage: any) => void): void {
    const run = this.runs.get(runId);
    if (run) {
      run.listeners.delete(listener);
    }
  }

  private emit(runId: string, stage: any): void {
    const run = this.runs.get(runId);
    if (run) {
      run.currentStage = stage;
      run.listeners.forEach(listener => listener(stage));
    }
  }

  async processRun(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;

    try {
      // Stage 0: Payment Verified (only if paid)
      if (run.paymentTxHash) {
        this.emit(runId, { stage: 'payment_verified', message: 'Payment confirmed!', txHash: run.paymentTxHash });
      }

      // Stage 1: Intent parsing
      this.emit(runId, { stage: 'intent_parse', message: 'Parsing intent...' });
      const intent = await this.intentService.parseIntent(run.message);

      // Stage 2: Fork chain
      this.emit(runId, { stage: 'fork_chain', message: 'Forking chain...' });
      const simulationResult = await this.simulationService.simulateTransaction(intent);

      // Stage 3: Simulate
      this.emit(runId, { stage: 'simulate', message: 'Simulating...' });
      // Simulation is already done in previous step

      // Stage 4: Extract delta
      this.emit(runId, { stage: 'extract_delta', message: 'Extracting reality delta...' });
      const realityDelta = await this.analysisService.extractDelta(simulationResult, intent);

      // Stage 5: Judge
      this.emit(runId, { stage: 'judge', message: 'Judging...' });
      const judgment = await this.judgmentService.makeJudgment(intent, realityDelta, simulationResult);

      // Check Policy Mode & Handle Monitor/Enforce Logic
      let status = judgment.judgment === 'ALLOW' ? 'ALLOWED' : (judgment.override_allowed ? 'PENDING' : 'DENIED');
      let nextStep = this.determineNextStep(judgment);
      const severity = judgment.judgment === 'DENY' ? 'HIGH' : (judgment.override_allowed ? 'MEDIUM' : 'LOW');

      try {
        const policies = await Queries.getPolicies();
        console.log(`[RunManager] Policy Check: ${policies.length} policies found.`);

        // Global Enforce only if ALL policies are ENFORCE
        const isGlobalEnforce = policies.length > 0 && policies.every((p: any) => p.mode === 'ENFORCE' && p.enabled);

        if (!isGlobalEnforce && (status === 'DENIED' || status === 'PENDING')) {
          console.log(`⚠️ Monitor Mode Active: Flagging transaction ${runId} but NOT blocking.`);

          // Create Alert instead of blocking
          // Schema matches: event_type, severity, message, transaction_id
          await Queries.addAlert({
            severity: 'HIGH',
            event_type: 'MONITOR_MODE_VIOLATION',
            message: `Transaction flagged by policies but allowed in Monitor Mode. Reasons: ${judgment.reasoning_bullets.join(', ')}`,
            transaction_id: runId
          });

          // Override status to ALLOWED for the user
          status = 'ALLOWED';
          nextStep = 'READY_TO_SIGN';

          // Add a note to judgment for the UI
          (judgment as any).monitor_mode_override = true;
          (judgment as any).warning = "Transaction violates policies but is allowed in Monitor Mode.";
        }
      } catch (err) {
        console.error('Failed to apply policy mode logic:', err);
      }

      // FIX: If transaction is BLOCKED, balance should remain unchanged
      // The simulation shows potential spend, but blocked transactions don't execute
      if (nextStep === 'BLOCKED') {
        console.log(`🛡️ Transaction BLOCKED: Resetting balance_after to balance_before (${realityDelta.delta.balance_before} USDT)`);
        realityDelta.delta.balance_after = realityDelta.delta.balance_before;
      }

      // Stage 6: Final
      const finalResult = {
        stage: 'final',
        intent_json: intent,
        tx_request: simulationResult.txRequest,
        timeline: simulationResult.timeline,
        reality_delta: realityDelta,
        judgment,
        next_step: nextStep
      };

      run.result = finalResult;
      this.emit(runId, finalResult);

      // Save transaction to database for Dashboard visibility
      // Skip saving to transactions if it's a Monitor Mode violation (it goes to Alerts only)
      const isMonitorViolation = (judgment as any).monitor_mode_override;

      if (!isMonitorViolation) {
        try {
          await Queries.addTransaction({
            intent_id: runId,
            from_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // User wallet
            to_address: simulationResult.txRequest.to,
            function_name: 'approve',
            status: status,
            createdAt: new Date().toISOString(), // Use createdAt (standard)
            created_at: new Date().toISOString(), // Keep created_at for legacy compat
            severity: severity
          });
          console.log('✅ Transaction saved to dashboard');
        } catch (dbError) {
          console.error('Failed to save transaction to DB:', dbError);
        }
      }

    } catch (error) {
      console.error('Run processing error:', error);
      this.emit(runId, {
        stage: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private determineNextStep(judgment: any): string {
    if (judgment.judgment === 'ALLOW') {
      return 'READY_TO_SIGN';
    } else if (judgment.override_allowed) {
      return 'NEED_JUSTIFICATION';
    } else {
      return 'BLOCKED';
    }
  }
}