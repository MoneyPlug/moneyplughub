import { Router, Response } from 'express';
import { z } from 'zod';
import { db, runInTransaction, recordAuditLog } from '../db';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { CommissionEntry, AdminStats, AuditLog, User, ApiResponse } from '../../types';

const router = Router();

// Apply auth + requireAdmin middleware
router.use(authenticateToken, requireAdmin);

/**
 * System Overview & Aggregate Financial Audit Statistics
 */
router.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const usersCount = Number((db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0);
  const referralsCount = Number((db.prepare('SELECT COUNT(*) as count FROM users WHERE referrer_user_id IS NOT NULL').get() as any)?.count || 0);

  const commissionStats = db.prepare(`
    SELECT 
      COUNT(*) as total_commissions_count,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_commissions_count,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approved_commissions_count,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as paid_commissions_count,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) as total_pending_cents,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN amount_cents ELSE 0 END), 0) as total_approved_cents,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) as total_paid_cents,
      COALESCE(SUM(amount_cents), 0) as total_volume_cents
    FROM commission_ledger
  `).get() as any;

  const stats: AdminStats = {
    total_users: usersCount,
    total_referrals: referralsCount,
    total_commissions_count: Number(commissionStats?.total_commissions_count || 0),
    pending_commissions_count: Number(commissionStats?.pending_commissions_count || 0),
    approved_commissions_count: Number(commissionStats?.approved_commissions_count || 0),
    paid_commissions_count: Number(commissionStats?.paid_commissions_count || 0),
    total_pending_cents: Number(commissionStats?.total_pending_cents || 0),
    total_approved_cents: Number(commissionStats?.total_approved_cents || 0),
    total_paid_cents: Number(commissionStats?.total_paid_cents || 0),
    total_volume_cents: Number(commissionStats?.total_volume_cents || 0),
  };

  res.json({
    success: true,
    data: stats
  });
});

/**
 * Audit Commission Ledger with User Relational Details
 */
router.get('/commissions', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  let query = `
    SELECT 
      c.id, c.referrer_user_id, c.referred_user_id, c.amount_cents, 
      c.currency, c.status, c.notes, c.created_at, c.updated_at,
      r.display_name as referrer_name,
      r.email as referrer_email,
      u.display_name as referred_name,
      u.email as referred_email
    FROM commission_ledger c
    JOIN users r ON c.referrer_user_id = r.id
    JOIN users u ON c.referred_user_id = u.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (status && ['pending', 'approved', 'paid'].includes(status)) {
    query += ` AND c.status = ?`;
    params.push(status);
  }

  if (search && search.trim()) {
    query += ` AND (r.display_name LIKE ? OR r.email LIKE ? OR u.display_name LIKE ? OR u.email LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY c.created_at DESC`;

  const ledger = db.prepare(query).all(...params) as unknown as CommissionEntry[];

  res.json({
    success: true,
    data: ledger
  });
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'paid']),
  notes: z.string().optional(),
});

/**
 * Update Individual Commission Status (Approve / Mark as Paid)
 */
router.patch('/commissions/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const commissionId = req.params.id;
  const parseResult = updateStatusSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({ 
      success: false, 
      error: parseResult.error.errors.map(e => e.message).join(', ') 
    });
    return;
  }

  const { status, notes } = parseResult.data;
  const adminUser = req.user!;

  const existingCommission = db.prepare(`
    SELECT * FROM commission_ledger WHERE id = ?
  `).get(commissionId) as unknown as CommissionEntry | undefined;

  if (!existingCommission) {
    res.status(404).json({ success: false, error: 'Commission ledger entry not found.' });
    return;
  }

  const now = new Date().toISOString();
  const updatedNotes = notes !== undefined ? notes : existingCommission.notes;

  try {
    runInTransaction(() => {
      db.prepare(`
        UPDATE commission_ledger 
        SET status = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `).run(status, updatedNotes, now, commissionId);

      recordAuditLog(
        adminUser.id,
        `COMMISSION_STATUS_CHANGED_${status.toUpperCase()}`,
        'commission_ledger',
        commissionId,
        {
          old_status: existingCommission.status,
          new_status: status,
          amount_cents: existingCommission.amount_cents,
          referrer_id: existingCommission.referrer_user_id,
          notes: updatedNotes
        }
      );
    });

    res.json({
      success: true,
      message: `Commission entry status successfully transitioned to '${status}'.`,
      data: {
        id: commissionId,
        status,
        notes: updatedNotes,
        updated_at: now,
      }
    });
  } catch (err: any) {
    console.error('Failed to update commission:', err);
    res.status(500).json({ success: false, error: 'Failed to update commission due to database error.' });
  }
});

const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one commission ID required'),
  status: z.enum(['approved', 'paid']),
});

/**
 * Bulk Payout Approval / Payout Processing
 */
router.post('/commissions/bulk-status', (req: AuthenticatedRequest, res: Response) => {
  const parseResult = bulkStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ 
      success: false, 
      error: parseResult.error.errors.map(e => e.message).join(', ') 
    });
    return;
  }

  const { ids, status } = parseResult.data;
  const adminUser = req.user!;
  const now = new Date().toISOString();

  try {
    runInTransaction(() => {
      const updateStmt = db.prepare(`
        UPDATE commission_ledger 
        SET status = ?, updated_at = ? 
        WHERE id = ?
      `);

      for (const id of ids) {
        updateStmt.run(status, now, id);
      }

      recordAuditLog(
        adminUser.id,
        `BULK_COMMISSION_STATUS_${status.toUpperCase()}`,
        'commission_ledger',
        null,
        { count: ids.length, ids, new_status: status }
      );
    });

    res.json({
      success: true,
      message: `Successfully updated ${ids.length} commission entries to '${status}'.`
    });
  } catch (err: any) {
    console.error('Bulk update error:', err);
    res.status(500).json({ success: false, error: 'Bulk update failed.' });
  }
});

/**
 * List all registered users and their referral performance
 */
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const users = db.prepare(`
    SELECT 
      u.id, u.email, u.display_name, u.role, u.referral_code, 
      u.referrer_user_id, u.referral_count, u.created_at, u.updated_at,
      r.display_name as referrer_name,
      r.email as referrer_email,
      COALESCE(SUM(c.amount_cents), 0) as total_earned_cents
    FROM users u
    LEFT JOIN users r ON u.referrer_user_id = r.id
    LEFT JOIN commission_ledger c ON c.referrer_user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();

  res.json({
    success: true,
    data: users
  });
});

/**
 * View System Audit Log Timeline
 */
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const logs = db.prepare(`
    SELECT 
      a.id, a.actor_user_id, a.action, a.target_entity, 
      a.target_id, a.details, a.created_at,
      u.email as actor_email
    FROM audit_logs a
    LEFT JOIN users u ON a.actor_user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 100
  `).all() as unknown as AuditLog[];

  res.json({
    success: true,
    data: logs
  });
});

/**
 * Comprehensive System & Database Metrics Summary
 */
router.get('/metrics-summary', (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. User & Identity Metrics
    const userSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COALESCE(SUM(xp), 0) as total_xp,
        COALESCE(AVG(level), 1) as avg_level,
        COALESCE(AVG(streak_days), 1) as avg_streak,
        COALESCE(SUM(referral_count), 0) as total_referral_invites
      FROM users
    `).get() as any;

    // Archetype distribution
    let archetypeDistribution: any[] = [];
    try {
      archetypeDistribution = db.prepare(`
        SELECT archetype, archetype_title, COUNT(*) as count
        FROM user_adaptive_profiles
        GROUP BY archetype
      `).all() as any[];
    } catch {}

    // 2. Financial & ACID Ledger Metrics
    const accountsSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_accounts,
        COALESCE(SUM(CASE WHEN is_liability = 0 THEN balance_cents ELSE 0 END), 0) as total_assets_cents,
        COALESCE(SUM(CASE WHEN is_liability = 1 THEN balance_cents ELSE 0 END), 0) as total_liabilities_cents
      FROM accounts
    `).get() as any;

    const txSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount_cents), 0) as total_volume_cents,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END), 0) as total_income_cents,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END), 0) as total_expense_cents,
        COALESCE(SUM(CASE WHEN type = 'transfer' THEN amount_cents ELSE 0 END), 0) as total_transfer_cents
      FROM transactions
    `).get() as any;

    const debtSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_debts,
        COALESCE(SUM(total_balance_cents), 0) as total_debt_balance_cents,
        COALESCE(AVG(interest_rate), 0) as avg_interest_rate
      FROM debts
    `).get() as any;

    const goalsSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_goals,
        COALESCE(SUM(target_cents), 0) as total_target_cents,
        COALESCE(SUM(current_cents), 0) as total_saved_cents
      FROM financial_goals
    `).get() as any;

    // 3. Referral & Growth Web Metrics
    let clickCount = 0;
    try {
      clickCount = Number((db.prepare('SELECT COUNT(*) as count FROM referral_clicks').get() as any)?.count || 0);
    } catch {}

    const commissionSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_commissions,
        COALESCE(SUM(amount_cents), 0) as total_commission_cents,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) as paid_cents,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount_cents ELSE 0 END), 0) as approved_cents,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) as pending_cents
      FROM commission_ledger
    `).get() as any;

    let programs: any[] = [];
    try {
      programs = db.prepare(`
        SELECT id, name, category, payout_amount, total_clicks, total_earnings_cents, status
        FROM crypto_referral_programs
        ORDER BY total_clicks DESC
        LIMIT 6
      `).all() as any[];
    } catch {}

    // 4. Database Table Row Counts
    const tableNames = [
      'users', 'accounts', 'transactions', 'debts', 'budgets', 
      'financial_goals', 'recurring_bills', 'commission_ledger', 
      'crypto_wallets', 'crypto_ledger', 'crypto_referral_programs', 
      'tasks', 'user_tasks', 'support_tickets', 'audit_logs', 'user_adaptive_profiles'
    ];

    const tablesMetric = tableNames.map(name => {
      let count = 0;
      try {
        count = Number((db.prepare(`SELECT COUNT(*) as c FROM ${name}`).get() as any)?.c || 0);
      } catch {}
      return { tableName: name, rowCount: count };
    });

    // 5. Recent Activity Stream
    const recentTx = db.prepare(`
      SELECT 'transaction' as event_type, id, type as subtype, amount_cents, description, date as created_at, user_id
      FROM transactions
      ORDER BY created_at DESC
      LIMIT 10
    `).all() as any[];

    const recentCommissions = db.prepare(`
      SELECT 'commission' as event_type, id, status as subtype, amount_cents, notes as description, created_at, referrer_user_id as user_id
      FROM commission_ledger
      ORDER BY created_at DESC
      LIMIT 5
    `).all() as any[];

    const activityFeed = [...recentTx, ...recentCommissions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12);

    res.json({
      success: true,
      data: {
        users: {
          totalUsers: Number(userSummary?.total_users || 0),
          totalXp: Number(userSummary?.total_xp || 0),
          avgLevel: Math.round(Number(userSummary?.avg_level || 1)),
          avgStreak: Math.round(Number(userSummary?.avg_streak || 1)),
          totalReferralInvites: Number(userSummary?.total_referral_invites || 0),
          archetypes: archetypeDistribution
        },
        financials: {
          totalAccounts: Number(accountsSummary?.total_accounts || 0),
          totalAssetsCents: Number(accountsSummary?.total_assets_cents || 0),
          totalLiabilitiesCents: Number(accountsSummary?.total_liabilities_cents || 0),
          netWorthCents: Number(accountsSummary?.total_assets_cents || 0) - Number(accountsSummary?.total_liabilities_cents || 0),
          totalTransactions: Number(txSummary?.total_transactions || 0),
          totalVolumeCents: Number(txSummary?.total_volume_cents || 0),
          totalIncomeCents: Number(txSummary?.total_income_cents || 0),
          totalExpenseCents: Number(txSummary?.total_expense_cents || 0),
          totalTransferCents: Number(txSummary?.total_transfer_cents || 0),
          totalDebts: Number(debtSummary?.total_debts || 0),
          totalDebtBalanceCents: Number(debtSummary?.total_debt_balance_cents || 0),
          avgInterestRate: Number(debtSummary?.avg_interest_rate || 0).toFixed(1),
          totalGoals: Number(goalsSummary?.total_goals || 0),
          totalTargetCents: Number(goalsSummary?.total_target_cents || 0),
          totalSavedCents: Number(goalsSummary?.total_saved_cents || 0)
        },
        growth: {
          totalClicks: clickCount,
          totalCommissions: Number(commissionSummary?.total_commissions || 0),
          totalCommissionCents: Number(commissionSummary?.total_commission_cents || 0),
          paidCents: Number(commissionSummary?.paid_cents || 0),
          approvedCents: Number(commissionSummary?.approved_cents || 0),
          pendingCents: Number(commissionSummary?.pending_cents || 0),
          programs
        },
        database: {
          tables: tablesMetric,
          totalTables: tablesMetric.length,
          totalRecords: tablesMetric.reduce((acc, curr) => acc + curr.rowCount, 0),
          journalMode: 'WAL',
          status: 'Healthy'
        },
        recentActivity: activityFeed
      }
    });
  } catch (err: any) {
    console.error('Metrics summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to load metrics summary' });
  }
});

export default router;
