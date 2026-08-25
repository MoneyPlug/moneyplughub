import { db, runInTransaction } from '../db';
import { BalanceAgent } from '../agents/balanceAgent';
import { EarningsAgent } from '../agents/earningsAgent';
import { ReferralAgent } from '../agents/referralAgent';
import { AutomationAgent } from '../agents/automationAgent';
import { InsightAgent } from '../agents/insightAgent';
import { 
  OrchestratorStatus, 
  OrchestratorTask, 
  OrchestratorState, 
  OrchestratorEvent 
} from '../../types';

export class StarterOrchestrator {
  public static readonly moduleName = 'StarterOrchestrator';
  public static readonly maxConcurrent = 2;
  public static readonly cooldownMs = 5000; // 5s cooldown
  public static readonly failureThreshold = 3; // 3 failures -> degraded mode

  // In-memory runtime semaphore & cooldown tracking
  private static activeRunsMap = new Map<string, number>();
  private static lastRunMap = new Map<string, number>();

  /**
   * Main entry point for user commands and scheduled triggers
   */
  public static async executeCommand(
    userId: string,
    task: OrchestratorTask,
    source: 'user_command' | 'scheduled_tick' | 'daily_loop_start' = 'user_command',
    payload?: any
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    status: OrchestratorStatus;
  }> {
    const now = Date.now();
    const timestamp = new Date(now).toISOString();

    // 1. Emit Event: orchestrator.command_received
    this.recordEvent(userId, 'orchestrator.command_received', {
      task,
      source,
      timestamp,
    });

    // 2. Read Context: Check System State (Degraded check)
    let state = this.getState(userId);
    if (state.status === 'degraded' && task !== 'daily_loop') {
      const errorMsg = `Overload Prevention: System is in DEGRADED mode (${state.degradedReason}). Please recover system state.`;
      return { success: false, error: errorMsg, status: 'degraded' };
    }

    // 3. Overload Rule: Max Concurrent Agent Runs (2)
    const currentActive = this.activeRunsMap.get(userId) || 0;
    if (currentActive >= this.maxConcurrent) {
      const errorMsg = `Overload Prevention: Maximum concurrent agent runs (${this.maxConcurrent}) reached. Please wait.`;
      return { success: false, error: errorMsg, status: 'busy' };
    }

    // 4. Overload Rule: Cooldown Between Runs (5s) for user commands
    const lastRunTime = this.lastRunMap.get(userId) || 0;
    const elapsed = now - lastRunTime;
    if (elapsed < this.cooldownMs && source === 'user_command' && lastRunTime > 0) {
      const remainingSec = Math.ceil((this.cooldownMs - elapsed) / 1000);
      const errorMsg = `Overload Prevention: Cooldown active. Please wait ${remainingSec}s before running next command.`;
      return { success: false, error: errorMsg, status: 'cooldown' };
    }

    // Acquire run lock
    this.activeRunsMap.set(userId, currentActive + 1);
    this.lastRunMap.set(userId, now);

    // 5. Emit Event: orchestrator.task_routed (INVARIANT: Every routed task emits a routing event)
    this.recordEvent(userId, 'orchestrator.task_routed', {
      task,
      routedTo: this.getTargetModule(task),
      source,
      timestamp,
    });

    try {
      let resultData: any = null;

      // 6. Execute Module (INVARIANT: All side effects occur through allowed modules)
      switch (task) {
        case 'balance_pull':
          resultData = await BalanceAgent.run(userId, 'manual: user_command');
          if (!resultData.success) throw new Error(resultData.message);
          break;

        case 'earnings_calc':
          resultData = await EarningsAgent.run(userId, 'manual: user_command');
          if (!resultData.success) throw new Error(resultData.message);
          break;

        case 'referral_suggest':
          resultData = await ReferralAgent.runDailySuggestion(userId, 'manual: user_command', payload?.preferredSlug);
          if (!resultData.success) throw new Error(resultData.message);
          break;

        case 'automation_tick':
          resultData = await AutomationAgent.onScheduleTick(userId, 'all');
          break;

        case 'insight_generate':
          resultData = await InsightAgent.generateDailyInsight(userId, 'manual: user_command');
          if (!resultData.success) throw new Error(resultData.message);
          break;

        case 'daily_loop':
          resultData = await this.runDailyLoop(userId);
          break;

        default:
          throw new Error(`Unknown orchestrator task: ${task}`);
      }

      // Success: Reset consecutive failures and update state
      this.updateStateOnSuccess(userId, timestamp);

      return {
        success: true,
        data: resultData,
        status: 'operational',
      };
    } catch (err: any) {
      console.error('StarterOrchestrator error:', err);
      this.handleFailure(userId, err.message || 'Execution failure');

      const currentState = this.getState(userId);
      return {
        success: false,
        error: err.message,
        status: currentState.status,
      };
    } finally {
      // Release lock
      const active = this.activeRunsMap.get(userId) || 1;
      this.activeRunsMap.set(userId, Math.max(0, active - 1));
    }
  }

  /**
   * Daily Loop Sequence: Balance -> Earnings -> Referral Suggestion -> Daily Insights
   */
  public static async runDailyLoop(userId: string): Promise<any> {
    const balances = await BalanceAgent.run(userId, 'scheduled: daily_morning');
    const earnings = await EarningsAgent.run(userId, 'scheduled: daily_morning');
    const referral = await ReferralAgent.runDailySuggestion(userId, 'scheduled: daily_referral_suggestion');
    const insights = await InsightAgent.generateDailyInsight(userId, 'scheduled: daily_morning');

    return {
      balances: balances.balances,
      earnings: earnings.earnings,
      referral: referral.suggestion,
      script: referral.script,
      insight: insights.insight,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Recovers orchestrator from degraded state and resets cooldown
   */
  public static recover(userId: string): OrchestratorState {
    const now = new Date().toISOString();
    
    // Clear runtime cooldown and locks
    this.lastRunMap.delete(userId);
    this.activeRunsMap.set(userId, 0);

    runInTransaction(() => {
      db.prepare(`
        INSERT INTO orchestrator_state (user_id, status, consecutive_failures, last_run_at, degraded_reason, updated_at)
        VALUES (?, 'operational', 0, ?, NULL, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          status = 'operational',
          consecutive_failures = 0,
          degraded_reason = NULL,
          updated_at = excluded.updated_at
      `).run(userId, now, now);
    });

    this.recordEvent(userId, 'orchestrator.recovered', {
      timestamp: now,
      message: 'System manually recovered to operational state.',
    });

    return this.getState(userId);
  }

  /**
   * Get Live Orchestrator State
   */
  public static getState(userId: string): OrchestratorState {
    const row = db.prepare(`
      SELECT * FROM orchestrator_state WHERE user_id = ?
    `).get(userId) as any;

    const currentActive = this.activeRunsMap.get(userId) || 0;
    const lastRunTime = this.lastRunMap.get(userId) || 0;
    const now = Date.now();
    const elapsed = now - lastRunTime;

    let derivedStatus: OrchestratorStatus = 'operational';

    if (row && row.status === 'degraded') {
      derivedStatus = 'degraded';
    } else if (currentActive >= this.maxConcurrent) {
      derivedStatus = 'busy';
    } else if (elapsed < this.cooldownMs && lastRunTime > 0) {
      derivedStatus = 'cooldown';
    }

    return {
      status: derivedStatus,
      activeRuns: currentActive,
      consecutiveFailures: row?.consecutive_failures || 0,
      lastRunAt: row?.last_run_at || null,
      maxConcurrent: this.maxConcurrent,
      cooldownSeconds: 5,
      degradedReason: row?.degraded_reason || null,
    };
  }

  private static getTargetModule(task: OrchestratorTask): string {
    switch (task) {
      case 'balance_pull': return 'BalanceAgent';
      case 'earnings_calc': return 'EarningsAgent';
      case 'referral_suggest': return 'ReferralAgent';
      case 'automation_tick': return 'AutomationAgent';
      case 'insight_generate': return 'InsightAgent';
      case 'daily_loop': return 'MultiAgentMesh';
    }
  }

  private static updateStateOnSuccess(userId: string, timestamp: string): void {
    runInTransaction(() => {
      db.prepare(`
        INSERT INTO orchestrator_state (user_id, status, consecutive_failures, last_run_at, degraded_reason, updated_at)
        VALUES (?, 'operational', 0, ?, NULL, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          status = 'operational',
          consecutive_failures = 0,
          last_run_at = excluded.last_run_at,
          degraded_reason = NULL,
          updated_at = excluded.updated_at
      `).run(userId, timestamp, timestamp);
    });
  }

  private static handleFailure(userId: string, reason: string): void {
    const now = new Date().toISOString();
    const state = this.getState(userId);
    const newFailures = state.consecutiveFailures + 1;

    let newStatus: OrchestratorStatus = 'operational';
    let degradedReason: string | null = null;

    if (newFailures >= this.failureThreshold) {
      newStatus = 'degraded';
      degradedReason = `Tripped fail-safe: ${newFailures} consecutive task failures (${reason})`;

      this.recordEvent(userId, 'orchestrator.degraded', {
        reason: degradedReason,
        consecutiveFailures: newFailures,
        timestamp: now,
      });
    }

    runInTransaction(() => {
      db.prepare(`
        INSERT INTO orchestrator_state (user_id, status, consecutive_failures, last_run_at, degraded_reason, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          status = excluded.status,
          consecutive_failures = excluded.consecutive_failures,
          degraded_reason = excluded.degraded_reason,
          updated_at = excluded.updated_at
      `).run(userId, newStatus, newFailures, now, degradedReason, now);
    });
  }

  private static recordEvent(
    userId: string,
    eventType: 
      | 'orchestrator.task_routed'
      | 'orchestrator.command_received'
      | 'orchestrator.degraded'
      | 'orchestrator.recovered',
    payload: Record<string, any>
  ): void {
    const id = `evt_orch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      db.prepare(`
        INSERT INTO orchestrator_events (id, user_id, event_type, payload, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId, eventType, JSON.stringify(payload), new Date().toISOString());
    } catch (e) {
      console.error('Failed to log StarterOrchestrator event:', e);
    }
  }
}
