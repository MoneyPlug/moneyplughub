import { db, runInTransaction } from '../db';
import { CanonicalInsight } from '../../types';

export type InsightAgentTrigger = 'scheduled: daily_morning' | 'manual: user_command';

export class InsightAgent {
  public static readonly agentName = 'InsightAgent';
  public static readonly capabilities = ['ReadContext', 'WriteContext (world.insights only)', 'ExecuteModule'];

  /**
   * Main Execution Contract for InsightAgent
   * Synthesizes balances, earnings, referral opportunities, and automation health into daily insights.
   */
  public static async generateDailyInsight(
    userId: string, 
    trigger: InsightAgentTrigger,
    targetDate?: string
  ): Promise<{
    success: boolean;
    insight: CanonicalInsight | null;
    event: 'insight.generated' | 'insight.failed';
    message: string;
  }> {
    const timestamp = new Date().toISOString();
    const dateStr = targetDate || timestamp.substring(0, 10);
    const insightId = `ins_${userId}_${dateStr}`;

    try {
      // 1. Read Context (Inputs): Balances, Earnings, Referrals, Automation Runs
      
      // Balances
      const balances = db.prepare(`
        SELECT * FROM balance_snapshots WHERE user_id = ?
      `).all(userId) as any[];

      const totalBalanceCents = balances.reduce((acc, b) => acc + (b.balance_cents || 0), 0);
      const totalBalanceUsd = (totalBalanceCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Earnings
      const dailyEarn = db.prepare(`
        SELECT * FROM earnings_snapshots WHERE user_id = ? AND window = 'daily'
      `).get(userId) as any;
      const dailyGrossUsd = ((dailyEarn?.gross_cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Referral Suggestions
      const latestRefSug = db.prepare(`
        SELECT * FROM referral_suggestions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
      `).get(userId) as any;

      // Automation Runs Today
      const runsToday = db.prepare(`
        SELECT * FROM automation_runs 
        WHERE user_id = ? AND started_at LIKE ?
      `).all(userId, `${dateStr}%`) as any[];

      const successfulRuns = runsToday.filter(r => r.status === 'success').length;
      const failedRuns = runsToday.filter(r => r.status === 'failure').length;

      // 2. Generate Intelligent Summary & Deduplicated Action Suggestions
      const summary = `On ${dateStr}, your total tracked balance is $${totalBalanceUsd} with $${dailyGrossUsd} in daily gross revenue. Your system logged ${successfulRuns} successful automation runs (${failedRuns} failed). Overall financial velocity is healthy with strong liquidity.`;

      const rawSuggestions: string[] = [];

      // Suggestion 1: Referral angle
      if (latestRefSug) {
        rawSuggestions.push(`Deploy short-form content for ${latestRefSug.program}: ${latestRefSug.suggested_action}`);
      } else {
        rawSuggestions.push(`Deploy short-form content reviewing Rakuten's $30 instant invite bonus.`);
      }

      // Suggestion 2: Emergency fund / savings angle
      const efGoal = db.prepare(`SELECT * FROM financial_goals WHERE user_id = ? AND category = 'emergency_fund'`).get(userId) as any;
      if (efGoal) {
        rawSuggestions.push(`Deposit $25–$50 to strengthen your ${efGoal.title} (current progress: $${(efGoal.current_cents / 100).toFixed(2)} / $${(efGoal.target_cents / 100).toFixed(2)}).`);
      } else {
        rawSuggestions.push(`Set up an automated deposit to fund your 6-month emergency reserve.`);
      }

      // Suggestion 3: Debt paydown / Avalanche
      const topDebt = db.prepare(`SELECT * FROM debts WHERE user_id = ? ORDER BY interest_rate DESC LIMIT 1`).get(userId) as any;
      if (topDebt) {
        rawSuggestions.push(`Apply Avalanche paydown towards ${topDebt.name} (${topDebt.interest_rate}% APR) to minimize compounding interest.`);
      }

      // Suggestion 4: Crypto DCA
      rawSuggestions.push(`Review your multi-asset crypto ledger and verify cold storage DCA balances.`);

      // INVARIANT 2: Suggestions array must be deduplicated
      const deduplicatedSuggestions = Array.from(new Set(rawSuggestions));

      // Canonical Insight Object
      const canonicalInsight: CanonicalInsight = {
        insightId,
        date: dateStr,
        summary,
        suggestions: deduplicatedSuggestions,
        timestamp,
      };

      // 3. Write Context (Outputs): context.world.insights[]
      // INVARIANT 1: One insight per date per user (UPSERT on conflict)
      runInTransaction(() => {
        db.prepare(`
          INSERT INTO daily_insights (id, user_id, date, summary, suggestions_json, timestamp, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, date) DO UPDATE SET
            summary = excluded.summary,
            suggestions_json = excluded.suggestions_json,
            timestamp = excluded.timestamp
        `).run(
          canonicalInsight.insightId,
          userId,
          canonicalInsight.date,
          canonicalInsight.summary,
          JSON.stringify(canonicalInsight.suggestions),
          canonicalInsight.timestamp,
          timestamp
        );
      });

      // Emit Event: insight.generated
      this.recordEvent(userId, 'insight.generated', {
        agent: this.agentName,
        insightId,
        date: dateStr,
        trigger,
        suggestionsCount: deduplicatedSuggestions.length,
        timestamp,
      });

      return {
        success: true,
        insight: canonicalInsight,
        event: 'insight.generated',
        message: `InsightAgent successfully synthesized daily financial insights for ${dateStr}.`,
      };
    } catch (err: any) {
      console.error('InsightAgent error:', err);
      this.recordEvent(userId, 'insight.failed', {
        error: err.message,
        trigger,
        timestamp,
      });

      return {
        success: false,
        insight: null,
        event: 'insight.failed',
        message: err.message || 'InsightAgent failed to generate insight.',
      };
    }
  }

  private static recordEvent(
    userId: string,
    eventType: 'insight.generated' | 'insight.failed',
    payload: Record<string, any>
  ): void {
    const id = `evt_ins_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      db.prepare(`
        INSERT INTO insight_events (id, user_id, event_type, payload, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId, eventType, JSON.stringify(payload), new Date().toISOString());
    } catch (e) {
      console.error('Failed to log InsightAgent event:', e);
    }
  }
}
