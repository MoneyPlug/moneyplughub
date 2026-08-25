import { Router, Response } from 'express';
import { db, runInTransaction } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Get Plug-In OS Affiliate Dashboard Data
 */
router.get('/dashboard', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  // 1. Affiliate Settings
  let settings = db.prepare('SELECT * FROM affiliate_settings WHERE user_id = ?').get(userId) as any;
  if (!settings) {
    const now = new Date().toISOString();
    const defaultLink = `https://stan.store/moneyplughub/p/plugin-os?aff=${user.referral_code || 'MONEYPLUGS'}`;
    db.prepare(`
      INSERT INTO affiliate_settings (
        user_id, stan_affiliate_link, weekly_tiktok_target, weekly_tiktok_completed,
        weekly_ig_target, weekly_ig_completed, weekly_yt_target, weekly_yt_completed, updated_at
      ) VALUES (?, ?, 5, 0, 3, 0, 2, 0, ?)
    `).run(userId, defaultLink, now);

    settings = {
      user_id: userId,
      stan_affiliate_link: defaultLink,
      weekly_tiktok_target: 5,
      weekly_tiktok_completed: 0,
      weekly_ig_target: 3,
      weekly_ig_completed: 0,
      weekly_yt_target: 2,
      weekly_yt_completed: 0,
      updated_at: now,
    };
  }

  // 2. Aggregate Stats from Commission Ledger & Program Clicks
  const commStats = db.prepare(`
    SELECT 
      COUNT(*) as activations,
      COALESCE(SUM(amount_cents), 0) as total_earnings_cents
    FROM commission_ledger 
    WHERE referrer_user_id = ?
  `).get(userId) as any;

  const clickCount = (db.prepare(`
    SELECT COUNT(*) as cnt FROM program_clicks 
    WHERE slug = 'plugin-os' OR program_id = 'prog_pluginos'
  `).get() as any)?.cnt || 0;

  const activations = commStats?.activations || 0;
  const totalEarningsCents = commStats?.total_earnings_cents || 0;
  const conversionRate = clickCount > 0 ? ((activations / clickCount) * 100).toFixed(1) : '0';

  // 3. Payout Tracker Logs
  let payoutLogs = db.prepare(`
    SELECT * FROM affiliate_payout_logs WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId) as any[];

  if (payoutLogs.length === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO affiliate_payout_logs (id, user_id, week_label, clicks, activations, earnings_cents, status, payout_date, created_at)
      VALUES (?, ?, 'This week', ?, ?, ?, 'Pending', '-', ?)
    `).run(`payout_${userId}_init`, userId, clickCount, activations, totalEarningsCents, now);

    payoutLogs = db.prepare('SELECT * FROM affiliate_payout_logs WHERE user_id = ?').all(userId) as any[];
  }

  res.json({
    success: true,
    data: {
      affiliateLink: settings.stan_affiliate_link || `https://stan.store/moneyplughub/p/plugin-os?aff=${user.referral_code}`,
      smartLink: `/go/plugin-os`,
      stats: {
        totalEarningsCents,
        activations,
        clicks: clickCount,
        conversionRate: `${conversionRate}%`,
      },
      weeklyTargets: {
        tiktok: { target: settings.weekly_tiktok_target, completed: settings.weekly_tiktok_completed },
        igReels: { target: settings.weekly_ig_target, completed: settings.weekly_ig_completed },
        youtubeShorts: { target: settings.weekly_yt_target, completed: settings.weekly_yt_completed },
      },
      payoutLogs,
    },
  });
});

/**
 * Update Custom Stan Affiliate Link
 */
router.post('/link', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { link } = req.body;

  if (!link || typeof link !== 'string') {
    res.status(400).json({ success: false, error: 'Valid link URL is required' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO affiliate_settings (user_id, stan_affiliate_link, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      stan_affiliate_link = excluded.stan_affiliate_link,
      updated_at = excluded.updated_at
  `).run(userId, link, now);

  res.json({
    success: true,
    message: 'Affiliate link updated successfully.',
  });
});

/**
 * Update Weekly Targets / Increment Output Progress
 */
router.post('/targets', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { platform, delta } = req.body as { platform: 'tiktok' | 'ig' | 'yt'; delta: number };

  const column = 
    platform === 'tiktok' ? 'weekly_tiktok_completed' :
    platform === 'ig' ? 'weekly_ig_completed' :
    platform === 'yt' ? 'weekly_yt_completed' : null;

  if (!column) {
    res.status(400).json({ success: false, error: 'Invalid platform (tiktok, ig, yt)' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE affiliate_settings
    SET ${column} = MAX(0, ${column} + ?), updated_at = ?
    WHERE user_id = ?
  `).run(delta || 1, now, userId);

  // Award XP if completing target
  db.prepare('UPDATE users SET xp = xp + 25, updated_at = ? WHERE id = ?').run(now, userId);

  res.json({
    success: true,
    message: `Updated weekly ${platform} progress (+25 XP)`,
  });
});

/**
 * Log / Add Weekly Payout Entry
 */
router.post('/payout-log', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { week_label, clicks, activations, earnings_cents, status = 'Pending', payout_date = '-' } = req.body;

  if (!week_label) {
    res.status(400).json({ success: false, error: 'week_label is required' });
    return;
  }

  const id = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO affiliate_payout_logs (id, user_id, week_label, clicks, activations, earnings_cents, status, payout_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, week_label, clicks || 0, activations || 0, earnings_cents || 0, status, payout_date, now);

  res.json({
    success: true,
    message: 'Weekly payout log recorded.',
  });
});

export default router;
