import { Router, Request, Response } from 'express';
import { db, runInTransaction } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * 📊 Dashboard Overview - Live Snapshot
 */
router.get('/overview', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const todayStr = new Date().toISOString().substring(0, 10);

  // 1. Today's Actions (top from xp_actions)
  const todayActions = db.prepare(`
    SELECT * FROM xp_actions 
    WHERE user_id = ? 
    ORDER BY CASE status WHEN 'To Do' THEN 1 WHEN 'Doing' THEN 2 ELSE 3 END, xp_value DESC 
    LIMIT 4
  `).all(userId) as any[];

  // 2. Earnings Today (Rollup from program_tracker & earnings_snapshots)
  const earningsTodayRow = db.prepare(`
    SELECT COALESCE(SUM(earnings_cents), 0) as total_cents 
    FROM program_tracker 
    WHERE user_id = ? AND date = ?
  `).get(userId, todayStr) as any;

  const earningsSnapshot = db.prepare(`
    SELECT gross_cents FROM earnings_snapshots WHERE user_id = ? AND window = 'daily'
  `).get(userId) as any;

  const totalEarningsCents = Math.max(earningsTodayRow?.total_cents || 0, earningsSnapshot?.gross_cents || 21500);

  // 3. Content Queue (next 3 posts)
  const contentQueue = db.prepare(`
    SELECT * FROM content_queue 
    WHERE user_id = ? 
    ORDER BY CASE status WHEN 'Ready to Post' THEN 1 WHEN 'Scripted' THEN 2 WHEN 'Editing' THEN 3 ELSE 4 END 
    LIMIT 3
  `).all(userId) as any[];

  // 4. Automations Running (Make.com + Zapier workflows)
  const automations = db.prepare(`
    SELECT * FROM automations_map WHERE user_id = ?
  `).all(userId) as any[];

  const activeAutomationsCount = automations.filter(a => a.status === 'Active').length;

  // 5. Rakuten Link
  const rakutenProg = db.prepare(`
    SELECT destination_url FROM crypto_referral_programs WHERE slug = 'rakuten'
  `).get() as any;

  const rakutenLink = rakutenProg?.destination_url || 'https://www.rakuten.com/r/CASHPL19';

  res.json({
    success: true,
    data: {
      todayActions,
      earningsTodayCents: totalEarningsCents,
      contentQueue,
      automationsRunning: {
        activeCount: activeAutomationsCount,
        totalCount: automations.length,
        status: activeAutomationsCount === automations.length ? '100% Operational' : 'Action Required',
      },
      rakutenLink,
    },
  });
});

/**
 * 1. 👤 User Profile (DB)
 */
router.get('/db/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  const profile = db.prepare('SELECT * FROM user_profile_os WHERE user_id = ?').get(userId) as any;

  res.json({
    success: true,
    data: {
      name: user.display_name,
      email: user.email,
      ...profile,
    },
  });
});

router.patch('/db/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { behavior_type, energy_pattern, friction_points, strengths, current_focus, stress_level, notes } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE user_profile_os 
    SET 
      behavior_type = COALESCE(?, behavior_type),
      energy_pattern = COALESCE(?, energy_pattern),
      friction_points = COALESCE(?, friction_points),
      strengths = COALESCE(?, strengths),
      current_focus = COALESCE(?, current_focus),
      stress_level = COALESCE(?, stress_level),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE user_id = ?
  `).run(behavior_type, energy_pattern, friction_points, strengths, current_focus, stress_level, notes, now, userId);

  res.json({ success: true, message: 'User Profile DB updated.' });
});

/**
 * 2. ⚡ XP Actions (DB) - with Views: Today, Quick Wins (<5 min), Money-First
 */
router.get('/db/xp-actions', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const view = req.query.view as string || 'all';

  let query = 'SELECT * FROM xp_actions WHERE user_id = ?';
  const params: any[] = [userId];

  if (view === 'quick_wins') {
    query += " AND (time_required LIKE '%1 min%' OR time_required LIKE '%2 min%' OR time_required LIKE '%3 min%' OR time_required LIKE '%4 min%' OR time_required LIKE '%5 min%')";
  } else if (view === 'money_first') {
    query += " AND category = 'Money'";
  } else if (view === 'today') {
    query += " AND status != 'Done'";
  }

  query += " ORDER BY CASE status WHEN 'To Do' THEN 1 WHEN 'Doing' THEN 2 ELSE 3 END, xp_value DESC";

  const rows = db.prepare(query).all(...params) as any[];
  res.json({ success: true, data: rows });
});

router.post('/db/xp-actions/:id/toggle', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const item = db.prepare('SELECT * FROM xp_actions WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!item) {
    res.status(404).json({ success: false, error: 'Action not found' });
    return;
  }

  const nextStatus = item.status === 'To Do' ? 'Doing' : item.status === 'Doing' ? 'Done' : 'To Do';
  const now = new Date().toISOString();

  db.prepare('UPDATE xp_actions SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, id);

  let earnedXp = 0;
  if (nextStatus === 'Done') {
    earnedXp = item.xp_value || 50;
    db.prepare('UPDATE users SET xp = xp + ?, updated_at = ? WHERE id = ?').run(earnedXp, now, userId);
  }

  res.json({
    success: true,
    status: nextStatus,
    earnedXp,
    message: nextStatus === 'Done' ? `Completed! +${earnedXp} XP Awarded.` : `Status updated to ${nextStatus}`,
  });
});

/**
 * 3. 💰 Referral Programs (DB) - with Views: High Payout, Easy Wins, Needs Setup
 */
router.get('/db/programs', (req: Request, res: Response) => {
  const view = (req.query.view as string) || 'all';

  let query = 'SELECT * FROM crypto_referral_programs WHERE 1=1';

  if (view === 'high_payout') {
    query += " ORDER BY earnings_today_cents DESC";
  } else if (view === 'easy_wins') {
    query += " AND (tags LIKE '%instant%' OR tags LIKE '%receipts%' OR tags LIKE '%gas%') ORDER BY total_clicks DESC";
  } else if (view === 'needs_setup') {
    query += " AND (status = 'pending' OR destination_url LIKE '%[Paste%')";
  } else {
    query += " ORDER BY CASE name WHEN 'Rakuten' THEN 1 WHEN 'Cash App' THEN 2 WHEN 'Plug-In OS' THEN 3 ELSE 4 END";
  }

  const rows = db.prepare(query).all() as any[];
  res.json({ success: true, data: rows });
});

/**
 * 4. 📈 Program Tracker (DB) - with Views: This Week, Top Earners, By Platform
 */
router.get('/db/program-tracker', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const view = req.query.view as string || 'all';

  let query = 'SELECT * FROM program_tracker WHERE user_id = ?';

  if (view === 'top_earners') {
    query += ' ORDER BY earnings_cents DESC';
  } else if (view === 'by_platform') {
    query += ' ORDER BY source_platform ASC, earnings_cents DESC';
  } else {
    query += ' ORDER BY date DESC, earnings_cents DESC';
  }

  const rows = db.prepare(query).all(userId) as any[];
  res.json({ success: true, data: rows });
});

/**
 * 5. 🎥 Content Queue (DB) - with Views: Today's Posts, Ready to Post, High Performers
 */
router.get('/db/content-queue', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const view = req.query.view as string || 'all';

  let query = 'SELECT * FROM content_queue WHERE user_id = ?';

  if (view === 'today_posts' || view === 'ready_to_post') {
    query += " AND (status = 'Ready to Post' OR status = 'Scripted')";
  } else if (view === 'high_performers') {
    query += " AND views > 1000 ORDER BY views DESC";
  } else {
    query += " ORDER BY CASE status WHEN 'Ready to Post' THEN 1 WHEN 'Scripted' THEN 2 WHEN 'Idea' THEN 3 ELSE 4 END";
  }

  const rows = db.prepare(query).all(userId) as any[];
  res.json({ success: true, data: rows });
});

/**
 * 6. 🔁 Automations (DB) - with Views: Active, Needs Fixing
 */
router.get('/db/automations', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const view = req.query.view as string || 'all';

  let query = 'SELECT * FROM automations_map WHERE user_id = ?';

  if (view === 'active') {
    query += " AND status = 'Active'";
  } else if (view === 'needs_fixing') {
    query += " AND status = 'Error'";
  }

  const rows = db.prepare(query).all(userId) as any[];
  res.json({ success: true, data: rows });
});

/**
 * 7. 🧠 Self-Understanding (DB) - with Views: This Week's Patterns, Confirmed Insights, New Observations
 */
router.get('/db/self-understanding', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const view = req.query.view as string || 'all';

  let query = 'SELECT * FROM self_understanding_patterns WHERE user_id = ?';

  if (view === 'confirmed') {
    query += ' AND confirmed = 1';
  } else if (view === 'new') {
    query += ' AND confirmed = 0';
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(userId) as any[];
  res.json({ success: true, data: rows });
});

router.post('/db/self-understanding/:id/confirm', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const item = db.prepare('SELECT * FROM self_understanding_patterns WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!item) {
    res.status(404).json({ success: false, error: 'Pattern not found' });
    return;
  }

  const newConfirmed = item.confirmed ? 0 : 1;
  db.prepare('UPDATE self_understanding_patterns SET confirmed = ? WHERE id = ?').run(newConfirmed, id);

  res.json({
    success: true,
    confirmed: newConfirmed,
    message: newConfirmed ? 'Insight confirmed.' : 'Insight moved to unconfirmed observations.',
  });
});

/**
 * Scratchpad Notes
 */
router.get('/scratchpad', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const row = db.prepare('SELECT content FROM scratchpad_notes WHERE user_id = ?').get(userId) as any;
  res.json({ success: true, data: row?.content || '' });
});

router.post('/scratchpad', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { content } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO scratchpad_notes (user_id, content, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      content = excluded.content,
      updated_at = excluded.updated_at
  `).run(userId, content || '', now);

  res.json({ success: true, message: 'Scratchpad saved.' });
});

export default router;
