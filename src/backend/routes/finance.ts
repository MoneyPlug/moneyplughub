import { Router, Response } from 'express';
import { z } from 'zod';
import { db, runInTransaction, recordAuditLog } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  Account, Transaction, BudgetCategory, Debt, 
  FinancialGoal, RecurringBill, NetWorthSummary 
} from '../../types';

const router = Router();
router.use(authenticateToken);

/**
 * Net Worth & Master Financial Overview Snapshot
 */
router.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const currentMonth = new Date().toISOString().substring(0, 7);

  // 1. Assets and Liabilities
  const accounts = db.prepare(`
    SELECT * FROM accounts WHERE user_id = ?
  `).all(userId) as unknown as Account[];

  let totalAssetsCents = 0;
  let totalLiabilitiesCents = 0;

  for (const acc of accounts) {
    if (acc.is_liability) {
      totalLiabilitiesCents += acc.balance_cents;
    } else {
      totalAssetsCents += acc.balance_cents;
    }
  }

  // 2. Budget Control (Limit vs Spent in current month)
  const budgetSum = db.prepare(`
    SELECT COALESCE(SUM(monthly_limit_cents), 0) as total_limit
    FROM budgets 
    WHERE user_id = ? AND month = ?
  `).get(userId, currentMonth) as any;

  const spentSum = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) as total_spent
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND date LIKE ?
  `).get(userId, `${currentMonth}%`) as any;

  const budgetLimitCents = Number(budgetSum?.total_limit || 0);
  const budgetSpentCents = Number(spentSum?.total_spent || 0);
  const budgetRemainingCents = Math.max(0, budgetLimitCents - budgetSpentCents);

  // 3. Emergency Fund Goal
  const emergencyGoal = db.prepare(`
    SELECT target_cents, current_cents 
    FROM financial_goals 
    WHERE user_id = ? AND category = 'emergency_fund'
    ORDER BY created_at DESC LIMIT 1
  `).get(userId) as any;

  // 4. Total Debts
  const debtSum = db.prepare(`
    SELECT COALESCE(SUM(total_balance_cents), 0) as total_debt
    FROM debts WHERE user_id = ?
  `).get(userId) as any;

  const user = db.prepare(`
    SELECT xp, level, streak_days, tier_title FROM users WHERE id = ?
  `).get(userId) as any;

  const summary: NetWorthSummary = {
    total_assets_cents: totalAssetsCents,
    total_liabilities_cents: totalLiabilitiesCents,
    net_worth_cents: totalAssetsCents - totalLiabilitiesCents,
    budget_limit_cents: budgetLimitCents,
    budget_spent_cents: budgetSpentCents,
    budget_remaining_cents: budgetRemainingCents,
    emergency_fund_target_cents: Number(emergencyGoal?.target_cents || 1500000),
    emergency_fund_current_cents: Number(emergencyGoal?.current_cents || 0),
    total_debt_cents: Number(debtSum?.total_debt || totalLiabilitiesCents),
    xp: Number(user?.xp || 0),
    level: Number(user?.level || 1),
    streak_days: Number(user?.streak_days || 1),
    tier_title: user?.tier_title || 'Novice Plug',
  };

  res.json({
    success: true,
    data: summary
  });
});

/**
 * List Accounts
 */
router.get('/accounts', (req: AuthenticatedRequest, res: Response) => {
  const accounts = db.prepare(`
    SELECT * FROM accounts WHERE user_id = ? ORDER BY is_liability ASC, balance_cents DESC
  `).all(req.user!.id) as unknown as Account[];

  res.json({ success: true, data: accounts });
});

/**
 * Add Account
 */
const addAccountSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['bank', 'crypto', 'investment', 'cash', 'credit_card', 'loan']),
  balance_cents: z.number().int(),
  institution: z.string().default('Self-Managed'),
  is_liability: z.boolean().default(false),
});

router.post('/accounts', (req: AuthenticatedRequest, res: Response) => {
  const parsed = addAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    return;
  }

  const { name, type, balance_cents, institution, is_liability } = parsed.data;
  const id = `acc_${req.user!.id}_${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO accounts (id, user_id, name, type, balance_cents, currency, institution, is_liability, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?)
  `).run(id, req.user!.id, name, type, balance_cents, institution, is_liability ? 1 : 0, now, now);

  res.status(201).json({ success: true, message: 'Account added successfully', data: { id } });
});

/**
 * Budget Control & Categories
 */
router.get('/budget', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const currentMonth = new Date().toISOString().substring(0, 7);

  const budgets = db.prepare(`
    SELECT b.id, b.user_id, b.category, b.monthly_limit_cents, b.month, b.created_at,
           COALESCE(SUM(t.amount_cents), 0) as spent_cents
    FROM budgets b
    LEFT JOIN transactions t ON t.user_id = b.user_id AND t.category = b.category AND t.type = 'expense' AND t.date LIKE ?
    WHERE b.user_id = ? AND b.month = ?
    GROUP BY b.id
  `).all(`${currentMonth}%`, userId, currentMonth) as unknown as BudgetCategory[];

  res.json({ success: true, data: budgets });
});

/**
 * Add / Update Budget Category
 */
const budgetSchema = z.object({
  category: z.string().min(2),
  monthly_limit_cents: z.number().int().positive(),
});

router.post('/budget', (req: AuthenticatedRequest, res: Response) => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    return;
  }

  const { category, monthly_limit_cents } = parsed.data;
  const userId = req.user!.id;
  const currentMonth = new Date().toISOString().substring(0, 7);
  const now = new Date().toISOString();
  const id = `b_${userId}_${Date.now()}`;

  db.prepare(`
    INSERT OR REPLACE INTO budgets (id, user_id, category, monthly_limit_cents, month, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, category, monthly_limit_cents, currentMonth, now);

  res.json({ success: true, message: 'Budget category updated!' });
});

/**
 * Debts List
 */
router.get('/debts', (req: AuthenticatedRequest, res: Response) => {
  const debts = db.prepare(`
    SELECT * FROM debts WHERE user_id = ? ORDER BY interest_rate DESC
  `).all(req.user!.id) as unknown as Debt[];

  res.json({ success: true, data: debts });
});

/**
 * Pay Down Debt with XP Gamification Bonus
 */
const payDebtSchema = z.object({
  amount_cents: z.number().int().positive(),
  from_account_id: z.string().optional(),
});

router.post('/debts/:id/pay', (req: AuthenticatedRequest, res: Response) => {
  const debtId = req.params.id;
  const userId = req.user!.id;
  const parsed = payDebtSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    return;
  }

  const { amount_cents, from_account_id } = parsed.data;
  const now = new Date().toISOString();

  try {
    runInTransaction(() => {
      // 1. Update debt balance
      db.prepare(`
        UPDATE debts 
        SET total_balance_cents = MAX(0, total_balance_cents - ?), updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(amount_cents, now, debtId, userId);

      // 2. Grant XP bonus (+150 XP) and increase streak
      db.prepare(`
        UPDATE users 
        SET xp = xp + 150, updated_at = ?
        WHERE id = ?
      `).run(now, userId);

      // 3. Log transaction
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const accId = from_account_id || `acc_${userId}_checking`;
      db.prepare(`
        INSERT INTO transactions (id, user_id, account_id, category, type, amount_cents, description, date, is_recurring, created_at)
        VALUES (?, ?, ?, 'Debt Payoff', 'debt_payment', ?, 'Debt Principal Payment (+150 XP Earned)', ?, 0, ?)
      `).run(txId, userId, accId, amount_cents, now.substring(0, 10), now);
    });

    res.json({
      success: true,
      message: `🎉 Debt payment applied! You earned +150 XP towards your level!`,
      xp_earned: 150
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to record debt payment.' });
  }
});

/**
 * Financial Goals & Emergency Fund
 */
router.get('/goals', (req: AuthenticatedRequest, res: Response) => {
  const goals = db.prepare(`
    SELECT * FROM financial_goals WHERE user_id = ? ORDER BY target_cents DESC
  `).all(req.user!.id) as unknown as FinancialGoal[];

  res.json({ success: true, data: goals });
});

/**
 * Deposit / Contribute to Goal (+100 XP)
 */
const depositGoalSchema = z.object({
  amount_cents: z.number().int().positive(),
});

router.post('/goals/:id/deposit', (req: AuthenticatedRequest, res: Response) => {
  const goalId = req.params.id;
  const userId = req.user!.id;
  const parsed = depositGoalSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    return;
  }

  const { amount_cents } = parsed.data;
  const now = new Date().toISOString();

  try {
    runInTransaction(() => {
      db.prepare(`
        UPDATE financial_goals 
        SET current_cents = current_cents + ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(amount_cents, now, goalId, userId);

      db.prepare(`
        UPDATE users 
        SET xp = xp + 100, updated_at = ?
        WHERE id = ?
      `).run(now, userId);
    });

    res.json({
      success: true,
      message: `🎯 Goal stash updated! +100 XP awarded to your profile.`,
      xp_earned: 100
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update goal.' });
  }
});

/**
 * Recurring Bills & Subscriptions
 */
router.get('/recurring', (req: AuthenticatedRequest, res: Response) => {
  const recurring = db.prepare(`
    SELECT * FROM recurring_bills WHERE user_id = ? ORDER BY next_due_date ASC
  `).all(req.user!.id) as unknown as RecurringBill[];

  res.json({ success: true, data: recurring });
});

/**
 * Transactions Feed
 */
router.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const txs = db.prepare(`
    SELECT t.*, a.name as account_name
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE t.user_id = ?
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT 100
  `).all(req.user!.id) as unknown as Transaction[];

  res.json({ success: true, data: txs });
});

/**
 * Log Transaction (Expense/Income) with +25 XP reward
 */
const logTxSchema = z.object({
  account_id: z.string(),
  category: z.string().min(2),
  type: z.enum(['expense', 'income', 'transfer', 'debt_payment', 'crypto_buy', 'reward']),
  amount_cents: z.number().int().positive(),
  description: z.string().min(2),
  date: z.string(),
});

router.post('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const parsed = logTxSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    return;
  }

  const { account_id, category, type, amount_cents, description, date } = parsed.data;
  const userId = req.user!.id;
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  try {
    runInTransaction(() => {
      db.prepare(`
        INSERT INTO transactions (id, user_id, account_id, category, type, amount_cents, description, date, is_recurring, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(txId, userId, account_id, category, type, amount_cents, description, date, now);

      // Reward +25 XP for active habit logging
      db.prepare(`
        UPDATE users SET xp = xp + 25, updated_at = ? WHERE id = ?
      `).run(now, userId);
    });

    res.status(201).json({
      success: true,
      message: 'Transaction logged! +25 XP Habit Bonus added.',
      xp_earned: 25,
      data: { id: txId }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to record transaction.' });
  }
});

export default router;
