import { Router, Response } from 'express';
import { db, runInTransaction } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { QuestTask, LeaderboardEntry, ApiResponse } from '../../types';

const router = Router();
router.use(authenticateToken);

function computeLevelAndTier(xp: number): { level: number; tier_title: string } {
  if (xp >= 10000) return { level: 10, tier_title: 'Cosmic Money Plug' };
  if (xp >= 5000) return { level: 6, tier_title: 'Diamond Stacker' };
  if (xp >= 2500) return { level: 5, tier_title: 'Grand Money Plug' };
  if (xp >= 1200) return { level: 4, tier_title: 'Wealth Builder' };
  if (xp >= 600) return { level: 3, tier_title: 'Crypto Stacker' };
  if (xp >= 250) return { level: 2, tier_title: 'Budget Apprentice' };
  return { level: 1, tier_title: 'Novice Plug' };
}

/**
 * List Active Quests / Tasks with User Claim State
 */
router.get('/quests', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const tasks = db.prepare(`
    SELECT t.*, 
           COALESCE(ut.status, 'available') as user_status
    FROM tasks t
    LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = ?
    WHERE t.is_active = 1
  `).all(userId) as unknown as QuestTask[];

  res.json({
    success: true,
    data: tasks
  });
});

/**
 * Server-Side Quest Verification
 * 
 * Each quest verifies real database state before awarding XP.
 * Users CANNOT cheat — XP is only granted when the action is proven.
 */
function verifyQuestCompletion(userId: string, taskId: string): { verified: boolean; reason: string } {
  switch (taskId) {
    case 'task_budget_checkin': {
      // Verify: user has at least 1 budget category set
      const budgetCount = db.prepare(
        'SELECT COUNT(*) as cnt FROM budgets WHERE user_id = ?'
      ).get(userId) as any;
      if (Number(budgetCount?.cnt || 0) < 1) {
        return { verified: false, reason: 'You need to create at least 1 budget category first. Go to Budget Control to set up your budget.' };
      }
      return { verified: true, reason: '' };
    }

    case 'task_debt_avalanche': {
      // Verify: user has made at least 1 debt payment transaction
      const debtPayment = db.prepare(
        "SELECT COUNT(*) as cnt FROM transactions WHERE user_id = ? AND (category = 'Debt Payment' OR category = 'debt_payment' OR description LIKE '%debt%')"
      ).get(userId) as any;
      if (Number(debtPayment?.cnt || 0) < 1) {
        return { verified: false, reason: 'You need to make at least 1 debt payment first. Use MoneyOS to say "pay $50 on my credit card".' };
      }
      return { verified: true, reason: '' };
    }

    case 'task_emergency_fund': {
      // Verify: user has a savings/HYSA account with at least $25 (2500 cents)
      const savings = db.prepare(
        "SELECT balance_cents FROM accounts WHERE user_id = ? AND (type = 'savings' OR type = 'hysa' OR name LIKE '%savings%' OR name LIKE '%emergency%') ORDER BY balance_cents DESC LIMIT 1"
      ).get(userId) as any;
      if (!savings || Number(savings.balance_cents || 0) < 2500) {
        return { verified: false, reason: 'You need at least $25.00 in a savings account. Transfer money to your savings first.' };
      }
      return { verified: true, reason: '' };
    }

    case 'task_crypto_stack': {
      // Verify: user has at least 1 crypto wallet with a balance
      const wallet = db.prepare(
        'SELECT COUNT(*) as cnt FROM crypto_wallets WHERE user_id = ? AND balance > 0'
      ).get(userId) as any;
      if (Number(wallet?.cnt || 0) < 1) {
        return { verified: false, reason: 'You need at least 1 crypto wallet with a balance. Go to the Crypto Ledger to set one up.' };
      }
      return { verified: true, reason: '' };
    }

    case 'task_refer_friend': {
      // Verify: user has referred at least 1 person
      const user = db.prepare(
        'SELECT referral_count FROM users WHERE id = ?'
      ).get(userId) as any;
      if (Number(user?.referral_count || 0) < 1) {
        return { verified: false, reason: 'You need to refer at least 1 friend who signs up. Share your referral link!' };
      }
      return { verified: true, reason: '' };
    }

    case 'task_networth_sync': {
      // Verify: user has at least 2 connected accounts
      const accountCount = db.prepare(
        'SELECT COUNT(*) as cnt FROM accounts WHERE user_id = ?'
      ).get(userId) as any;
      if (Number(accountCount?.cnt || 0) < 2) {
        return { verified: false, reason: 'You need at least 2 linked accounts to calculate net worth. Add more accounts in the dashboard.' };
      }
      return { verified: true, reason: '' };
    }

    default:
      // Unknown quest — block by default (safe fail)
      return { verified: false, reason: 'This quest cannot be verified. Contact support.' };
  }
}

/**
 * Daily cooldown check — daily quests can only be claimed once per 24 hours
 */
function checkDailyCooldown(userId: string, taskId: string, taskType: string): { allowed: boolean; reason: string } {
  if (taskType !== 'daily') return { allowed: true, reason: '' };

  const lastClaim = db.prepare(
    "SELECT claimed_at FROM user_tasks WHERE user_id = ? AND task_id = ? AND status = 'claimed' ORDER BY claimed_at DESC LIMIT 1"
  ).get(userId, taskId) as any;

  if (lastClaim?.claimed_at) {
    const lastTime = new Date(lastClaim.claimed_at).getTime();
    const now = Date.now();
    const hoursSince = (now - lastTime) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      return { allowed: false, reason: `Daily quest cooldown: ${hoursLeft}h remaining. Come back later!` };
    }
  }
  return { allowed: true, reason: '' };
}

/**
 * Claim Quest Reward (Cash Incentive + XP + Level Update)
 * Now with SERVER-SIDE VERIFICATION — impossible to cheat.
 */
router.post('/quests/:id/claim', (req: AuthenticatedRequest, res: Response) => {
  const taskId = req.params.id;
  const userId = req.user!.id;
  const now = new Date().toISOString();

  const task = db.prepare(`
    SELECT * FROM tasks WHERE id = ? AND is_active = 1
  `).get(taskId) as unknown as QuestTask | undefined;

  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  // ── Anti-Cheat Layer 1: Daily cooldown for daily quests ──
  const cooldown = checkDailyCooldown(userId, taskId, task.task_type);
  if (!cooldown.allowed) {
    res.status(429).json({ success: false, error: cooldown.reason });
    return;
  }

  // ── Anti-Cheat Layer 2: Milestone duplicate check ──
  if (task.task_type === 'milestone' || task.task_type === 'one_time') {
    const existingUserTask = db.prepare(`
      SELECT * FROM user_tasks WHERE user_id = ? AND task_id = ? AND status = 'claimed'
    `).get(userId, taskId) as any;

    if (existingUserTask) {
      res.status(400).json({ success: false, error: 'This milestone has already been claimed!' });
      return;
    }
  }

  // ── Anti-Cheat Layer 3: Server-side verification ──
  const verification = verifyQuestCompletion(userId, taskId);
  if (!verification.verified) {
    res.status(403).json({ 
      success: false, 
      error: `⚠️ Quest not verified: ${verification.reason}` 
    });
    return;
  }

  try {
    let newXp = 0;
    let newLevel = 1;
    let newTier = 'Novice Plug';

    runInTransaction(() => {
      // 1. Mark task as claimed
      db.prepare(`
        INSERT OR REPLACE INTO user_tasks (id, user_id, task_id, status, completed_at, claimed_at)
        VALUES (?, ?, ?, 'claimed', ?, ?)
      `).run(`ut_${userId}_${taskId}`, userId, taskId, now, now);

      // 2. Fetch current user XP and calculate new Level/Tier
      const currentUser = db.prepare('SELECT xp, level, tier_title FROM users WHERE id = ?').get(userId) as any;
      newXp = Number(currentUser.xp || 0) + task.reward_xp;
      const computed = computeLevelAndTier(newXp);
      newLevel = computed.level;
      newTier = computed.tier_title;

      db.prepare(`
        UPDATE users 
        SET xp = ?, level = ?, tier_title = ?, updated_at = ?
        WHERE id = ?
      `).run(newXp, newLevel, newTier, now, userId);

      // 3. Credit cash incentive to primary checking account
      if (task.reward_cents > 0) {
        db.prepare(`
          UPDATE accounts 
          SET balance_cents = balance_cents + ?, updated_at = ?
          WHERE user_id = ? AND type = 'bank'
        `).run(task.reward_cents, now, userId);

        // Record reward transaction
        const txId = `tx_reward_${Date.now()}`;
        db.prepare(`
          INSERT INTO transactions (id, user_id, account_id, category, type, amount_cents, description, date, is_recurring, created_at)
          VALUES (?, ?, (SELECT id FROM accounts WHERE user_id = ? AND type = 'bank' LIMIT 1), 'Quest Reward', 'reward', ?, ?, ?, 0, ?)
        `).run(txId, userId, userId, task.reward_cents, `Quest Reward: ${task.title}`, now.substring(0, 10), now);
      }
    });

    res.json({
      success: true,
      message: `🎉 Quest Claimed! +${task.reward_xp} XP & $${(task.reward_cents / 100).toFixed(2)} cash reward added!`,
      data: {
        xp_earned: task.reward_xp,
        reward_cents: task.reward_cents,
        total_xp: newXp,
        level: newLevel,
        tier_title: newTier,
      }
    });
  } catch (err: any) {
    console.error('Quest claim error:', err);
    res.status(500).json({ success: false, error: 'Failed to claim quest reward.' });
  }
});

/**
 * Leaderboard Rankings (XP, Net Worth, Referral Count)
 */
router.get('/leaderboard', (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;

  const rawUsers = db.prepare(`
    SELECT u.id as user_id, u.display_name, u.xp, u.level, u.tier_title, u.streak_days, u.referral_count,
           COALESCE(SUM(CASE WHEN a.is_liability = 0 THEN a.balance_cents ELSE -a.balance_cents END), 0) as net_worth_cents
    FROM users u
    LEFT JOIN accounts a ON a.user_id = u.id
    GROUP BY u.id
    ORDER BY u.xp DESC, net_worth_cents DESC
    LIMIT 50
  `).all() as any[];

  const leaderboard: LeaderboardEntry[] = rawUsers.map((item, index) => ({
    rank: index + 1,
    user_id: item.user_id,
    display_name: item.display_name,
    xp: Number(item.xp || 0),
    level: Number(item.level || 1),
    tier_title: item.tier_title || 'Novice Plug',
    streak_days: Number(item.streak_days || 1),
    net_worth_cents: Number(item.net_worth_cents || 0),
    referral_count: Number(item.referral_count || 0),
    is_current_user: item.user_id === currentUserId,
  }));

  res.json({
    success: true,
    data: leaderboard
  });
});

export default router;
