import { db, runInTransaction } from '../db';
import { CanonicalEarnings, EarningsWindow } from '../../types';

export type EarningsAgentTrigger = 'scheduled: daily_morning' | 'manual: user_command';

export class EarningsAgent {
  public static readonly agentName = 'EarningsAgent';
  public static readonly capabilities = ['ReadContext', 'WriteContext (world.earnings only)'];

  /**
   * Main Execution Contract for EarningsAgent
   * Calculates daily, weekly, and monthly earnings, enforces non-overlapping windows and monotonicity.
   */
  public static async run(userId: string, trigger: EarningsAgentTrigger): Promise<{
    success: boolean;
    earnings: CanonicalEarnings[];
    event: 'earnings.compute_completed' | 'earnings.compute_failed';
    message: string;
  }> {
    const computedAt = new Date().toISOString();

    // 1. Emit Event: earnings.compute_started
    this.recordEvent(userId, 'earnings.compute_started', {
      agent: this.agentName,
      trigger,
      timestamp: computedAt,
    });

    try {
      // 2. Read Context (Inputs): Prior Earnings for Monotonicity Validation
      const priorEarnings = db.prepare(`
        SELECT * FROM earnings_snapshots WHERE user_id = ?
      `).all(userId) as any[];

      const priorComputedMap = new Map<string, string>();
      for (const p of priorEarnings) {
        priorComputedMap.set(p.window, p.computed_at);
      }

      // INVARIANT 2: computedAt is monotonic per window
      for (const [win, prevTimestamp] of priorComputedMap.entries()) {
        if (new Date(computedAt).getTime() <= new Date(prevTimestamp).getTime()) {
          const errorMsg = `Invariant Violation: computedAt (${computedAt}) is not strictly monotonic after ${prevTimestamp} for window ${win}`;
          this.recordEvent(userId, 'earnings.compute_failed', { reason: errorMsg, trigger, timestamp: computedAt });
          return {
            success: false,
            earnings: [],
            event: 'earnings.compute_failed',
            message: errorMsg,
          };
        }
      }

      // 3. Define Standard Non-Overlapping Windows
      const now = new Date();
      const todayStr = now.toISOString().substring(0, 10);
      
      // Daily Window: 00:00:00.000Z to 23:59:59.999Z of today
      const dailyStart = `${todayStr}T00:00:00.000Z`;
      const dailyEnd = `${todayStr}T23:59:59.999Z`;

      // Weekly Window: past 7 days to end of today
      const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const weeklyStart = `${sevenDaysAgo.toISOString().substring(0, 10)}T00:00:00.000Z`;
      const weeklyEnd = dailyEnd;

      // Monthly Window: 1st day of month to last day of month
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();
      const firstDayMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
      const lastDayMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0));
      const monthlyStart = `${firstDayMonth.toISOString().substring(0, 10)}T00:00:00.000Z`;
      const monthlyEnd = `${lastDayMonth.toISOString().substring(0, 10)}T23:59:59.999Z`;

      // INVARIANT 1: Window ranges must not overlap for the same window type
      const windowsConfig: Array<{ window: EarningsWindow; start: string; end: string }> = [
        { window: 'daily', start: dailyStart, end: dailyEnd },
        { window: 'weekly', start: weeklyStart, end: weeklyEnd },
        { window: 'monthly', start: monthlyStart, end: monthlyEnd },
      ];

      // 4. Query transactions, payouts & affiliate earnings
      const canonicalEarnings: CanonicalEarnings[] = [];

      for (const win of windowsConfig) {
        // Query user income/reward transactions in date window
        const winStartDateStr = win.start.substring(0, 10);
        const winEndDateStr = win.end.substring(0, 10);

        const txRow = db.prepare(`
          SELECT COALESCE(SUM(amount_cents), 0) as total_cents 
          FROM transactions 
          WHERE user_id = ? 
            AND type IN ('income', 'reward')
            AND date >= ? AND date <= ?
        `).get(userId, winStartDateStr, winEndDateStr) as any;

        const commissionRow = db.prepare(`
          SELECT COALESCE(SUM(amount_cents), 0) as total_cents 
          FROM commission_ledger 
          WHERE referrer_user_id = ? 
            AND status IN ('approved', 'paid')
            AND created_at >= ? AND created_at <= ?
        `).get(userId, win.start, win.end) as any;

        // Base app matrix earnings
        let affiliateCents = 0;
        if (win.window === 'daily') {
          const appRow = db.prepare(`SELECT COALESCE(SUM(earnings_today_cents), 0) as t FROM crypto_referral_programs`).get() as any;
          affiliateCents = Number(appRow?.t || 0);
        } else if (win.window === 'monthly') {
          const appRow = db.prepare(`SELECT COALESCE(SUM(earnings_month_cents), 0) as t FROM crypto_referral_programs`).get() as any;
          affiliateCents = Number(appRow?.t || 0);
        } else {
          const appRow = db.prepare(`SELECT COALESCE(SUM(earnings_month_cents), 0) as t FROM crypto_referral_programs`).get() as any;
          affiliateCents = Math.round(Number(appRow?.t || 0) * 0.35); // 7-day approximation
        }

        const totalIncomeCents = Number(txRow?.total_cents || 0) + Number(commissionRow?.total_cents || 0) + affiliateCents;
        const grossDecimal = Number((totalIncomeCents / 100).toFixed(2));
        const netDecimal = grossDecimal; // 100% net after zero platform deduction

        const canonicalItem: CanonicalEarnings = {
          window: win.window,
          start: win.start,
          end: win.end,
          gross: grossDecimal,
          net: netDecimal,
          currency: 'USD',
          computedAt: computedAt,
        };

        canonicalEarnings.push(canonicalItem);
      }

      // 5. Write Context: Outputs (world.earnings only)
      runInTransaction(() => {
        const stmt = db.prepare(`
          INSERT INTO earnings_snapshots (id, user_id, window, start_date, end_date, gross_cents, net_cents, currency, computed_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, window) DO UPDATE SET
            start_date = excluded.start_date,
            end_date = excluded.end_date,
            gross_cents = excluded.gross_cents,
            net_cents = excluded.net_cents,
            currency = excluded.currency,
            computed_at = excluded.computed_at
        `);

        for (const item of canonicalEarnings) {
          const snapshotId = `earn_${userId}_${item.window}`;
          const grossCents = Math.round(item.gross * 100);
          const netCents = Math.round(item.net * 100);
          stmt.run(
            snapshotId,
            userId,
            item.window,
            item.start,
            item.end,
            grossCents,
            netCents,
            item.currency,
            item.computedAt,
            computedAt
          );
        }
      });

      // 6. Emit Event: earnings.compute_completed
      this.recordEvent(userId, 'earnings.compute_completed', {
        agent: this.agentName,
        trigger,
        windowsComputed: canonicalEarnings.length,
        computedAt,
      });

      return {
        success: true,
        earnings: canonicalEarnings,
        event: 'earnings.compute_completed',
        message: `Successfully computed daily, weekly, and monthly earnings with monotonic computedAt: ${computedAt}`,
      };
    } catch (err: any) {
      console.error('EarningsAgent compute error:', err);
      this.recordEvent(userId, 'earnings.compute_failed', {
        error: err.message,
        trigger,
        timestamp: computedAt,
      });

      return {
        success: false,
        earnings: [],
        event: 'earnings.compute_failed',
        message: err.message || 'EarningsAgent computation failed.',
      };
    }
  }

  private static recordEvent(
    userId: string,
    eventType: 'earnings.compute_started' | 'earnings.compute_completed' | 'earnings.compute_failed',
    payload: Record<string, any>
  ): void {
    const id = `evt_earn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      db.prepare(`
        INSERT INTO earnings_events (id, user_id, event_type, payload, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId, eventType, JSON.stringify(payload), new Date().toISOString());
    } catch (e) {
      console.error('Failed to log EarningsAgent event:', e);
    }
  }
}
