import { db, runInTransaction } from '../db';
import { CanonicalBalance, ConnectedProvider, Account } from '../../types';

export interface BalanceAgentContext {
  settings: {
    connections: ConnectedProvider[];
  };
  world: {
    accounts: Account[];
    balances: CanonicalBalance[];
  };
}

export type BalanceAgentTrigger = 'scheduled: daily_morning' | 'manual: user_command';

export class BalanceAgent {
  public static readonly agentName = 'BalanceAgent';
  public static readonly capabilities = ['ReadContext', 'WriteContext (world.balances only)'];

  /**
   * Main Execution Contract for BalanceAgent
   * Pulls balances from connected apps, validates invariants, and writes canonical snapshot.
   */
  public static async run(userId: string, trigger: BalanceAgentTrigger): Promise<{
    success: boolean;
    balances: CanonicalBalance[];
    event: 'balance.pull_completed' | 'balance.pull_failed';
    message: string;
  }> {
    const asOf = new Date().toISOString();

    // 1. Emit Event: balance.pull_started
    this.recordEvent(userId, 'balance.pull_started', {
      agent: this.agentName,
      trigger,
      timestamp: asOf,
    });

    try {
      // 2. Read Context (Inputs)
      const connections = db.prepare(`
        SELECT * FROM connected_providers 
        WHERE user_id = ? AND status = 'connected'
      `).all(userId) as unknown as ConnectedProvider[];

      const accounts = db.prepare(`
        SELECT * FROM accounts 
        WHERE user_id = ?
      `).all(userId) as unknown as Account[];

      // INVARIANT 1: No balance write without a connected provider.
      if (connections.length === 0) {
        const errorMsg = 'Invariant Violation: No connected provider available for user.';
        this.recordEvent(userId, 'balance.pull_failed', {
          reason: errorMsg,
          trigger,
          timestamp: asOf,
        });
        return {
          success: false,
          balances: [],
          event: 'balance.pull_failed',
          message: errorMsg,
        };
      }

      // 3. Transform & Aggregate Balances (Canonical Balance Schema)
      const seenAccountIds = new Set<string>();
      const canonicalBalances: CanonicalBalance[] = [];

      for (const account of accounts) {
        // INVARIANT 3: Deduplicate by accountId
        if (seenAccountIds.has(account.id)) {
          continue;
        }
        seenAccountIds.add(account.id);

        // Find matching or default active provider
        const matchedProvider = connections.find(c => 
          account.institution.toLowerCase().includes(c.provider_name.toLowerCase()) ||
          c.provider_type === account.type ||
          (account.is_liability && c.provider_type === 'card')
        ) || connections[0];

        // Standard USD decimal representation (e.g., 3450.00 from 345000 cents)
        const balanceUsd = Number((account.balance_cents / 100).toFixed(2));

        // INVARIANT 2: All balances stamped with asOf
        const canonicalItem: CanonicalBalance = {
          accountId: account.id,
          provider: matchedProvider.provider_name,
          balance: balanceUsd,
          currency: account.currency || 'USD',
          asOf: asOf,
        };

        canonicalBalances.push(canonicalItem);
      }

      // 4. Write Context: Outputs (world.balances only)
      runInTransaction(() => {
        const stmt = db.prepare(`
          INSERT INTO balance_snapshots (id, user_id, account_id, provider, balance_cents, currency, as_of, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, account_id) DO UPDATE SET
            provider = excluded.provider,
            balance_cents = excluded.balance_cents,
            currency = excluded.currency,
            as_of = excluded.as_of
        `);

        for (const item of canonicalBalances) {
          const snapshotId = `snap_${userId}_${item.accountId}`;
          const balanceCents = Math.round(item.balance * 100);
          stmt.run(snapshotId, userId, item.accountId, item.provider, balanceCents, item.currency, item.asOf, asOf);
        }

        // Update provider last_sync_at timestamps
        db.prepare(`
          UPDATE connected_providers 
          SET last_sync_at = ? 
          WHERE user_id = ? AND status = 'connected'
        `).run(asOf, userId);
      });

      // 5. Emit Event: balance.pull_completed
      this.recordEvent(userId, 'balance.pull_completed', {
        agent: this.agentName,
        trigger,
        syncedAccountsCount: canonicalBalances.length,
        asOf,
      });

      return {
        success: true,
        balances: canonicalBalances,
        event: 'balance.pull_completed',
        message: `Successfully synchronized ${canonicalBalances.length} account balances with asOf: ${asOf}`,
      };
    } catch (err: any) {
      console.error('BalanceAgent execution error:', err);
      this.recordEvent(userId, 'balance.pull_failed', {
        error: err.message,
        trigger,
        timestamp: asOf,
      });

      return {
        success: false,
        balances: [],
        event: 'balance.pull_failed',
        message: err.message || 'BalanceAgent sync failed.',
      };
    }
  }

  /**
   * Internal Event Log Persistence
   */
  private static recordEvent(
    userId: string,
    eventType: 'balance.pull_started' | 'balance.pull_completed' | 'balance.pull_failed',
    payload: Record<string, any>
  ): void {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      db.prepare(`
        INSERT INTO balance_events (id, user_id, event_type, payload, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId, eventType, JSON.stringify(payload), new Date().toISOString());
    } catch (e) {
      console.error('Failed to log BalanceAgent event:', e);
    }
  }
}
