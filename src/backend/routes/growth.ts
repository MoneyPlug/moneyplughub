import { Router, Response } from 'express';
import { db, runInTransaction, recordAuditLog } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config';
import { generateSigil } from './sigil';

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  GROWTH ENGINE — The Nuclear Viral Machine
//  10 mechanics that made Discord, Snapchat, Fortnite,
//  CashApp, TikTok, Coinbase, Duolingo & Clubhouse explode.
//  All unified in one engine. Cost: $0/month.
// ═══════════════════════════════════════════════════════════════════

// ── Schema ───────────────────────────────────────────────────────
try { db.exec(`
  -- XP Milestones (triggered once when threshold is crossed)
  CREATE TABLE IF NOT EXISTS xp_milestones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK(trigger_type IN ('referral_count','xp_total','level','streak_days','clicks')),
    trigger_value INTEGER NOT NULL,
    reward_xp INTEGER NOT NULL DEFAULT 0,
    reward_badge TEXT,
    reward_realm TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  -- Tracks which milestones a user has unlocked
  CREATE TABLE IF NOT EXISTS user_milestones (
    user_id TEXT NOT NULL,
    milestone_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    PRIMARY KEY (user_id, milestone_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (milestone_id) REFERENCES xp_milestones(id)
  );

  -- Referral streaks
  CREATE TABLE IF NOT EXISTS referral_streaks (
    user_id TEXT PRIMARY KEY,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_referral_date TEXT,
    referrals_today INTEGER NOT NULL DEFAULT 0,
    today_date TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Boost events (admin-created time-limited XP/commission multipliers)
  CREATE TABLE IF NOT EXISTS boost_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    xp_multiplier REAL NOT NULL DEFAULT 1.0,
    commission_multiplier REAL NOT NULL DEFAULT 1.0,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  -- User badges/unlockables
  CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT,
    description TEXT,
    unlocked_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);

  -- Realms (gated access areas)
  CREATE TABLE IF NOT EXISTS realms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    unlock_type TEXT NOT NULL CHECK(unlock_type IN ('referral_count','level','tier','xp','invite_only')),
    unlock_value TEXT NOT NULL,
    icon TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  -- User realm access
  CREATE TABLE IF NOT EXISTS user_realms (
    user_id TEXT NOT NULL,
    realm_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    PRIMARY KEY (user_id, realm_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (realm_id) REFERENCES realms(id)
  );

  -- Seasonal leaderboards
  CREATE TABLE IF NOT EXISTS leaderboard_seasons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('weekly','monthly','seasonal')),
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leaderboard_entries (
    season_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    referrals_earned INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (season_id, user_id),
    FOREIGN KEY (season_id) REFERENCES leaderboard_seasons(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- ═══ SEED DATA ═══

  -- XP Milestones (⚡1: Leveling Addiction + ⚡3: Referral Quests)
  INSERT OR IGNORE INTO xp_milestones (id, name, description, trigger_type, trigger_value, reward_xp, reward_badge) VALUES
    ('ms_click_50',     '50 Clicks',          'Your link got 50 clicks',                  'clicks',         50,    50,    'Click Magnet'),
    ('ms_ref_1',        'First Blood',        'Get your first referral signup',            'referral_count', 1,     500,   'Recruiter'),
    ('ms_ref_5',        'Squad Builder',       'Hit 5 referral signups',                   'referral_count', 5,     500,   'Squad Leader'),
    ('ms_ref_10',       'Growth Hacker',       'Hit 10 referral signups',                  'referral_count', 10,    1000,  'Growth Hacker'),
    ('ms_ref_25',       'Network Builder',     'Hit 25 referral signups',                  'referral_count', 25,    2500,  'Network King'),
    ('ms_ref_50',       'Viral Machine',       'Hit 50 referral signups',                  'referral_count', 50,    5000,  'Viral Machine'),
    ('ms_ref_100',      'Legendary Plug',      'Hit 100 referral signups',                 'referral_count', 100,   10000, 'Legendary Plug'),
    ('ms_xp_1000',      'XP Stacker',          'Earn 1,000 total XP',                      'xp_total',       1000,  200,   'XP Stacker'),
    ('ms_xp_5000',      'XP Machine',          'Earn 5,000 total XP',                      'xp_total',       5000,  500,   'XP Machine'),
    ('ms_xp_10000',     'XP Legend',           'Earn 10,000 total XP',                     'xp_total',       10000, 1000,  'XP Legend'),
    ('ms_xp_50000',     'Cosmic Stacker',      'Earn 50,000 total XP',                     'xp_total',       50000, 5000,  'Cosmic Stacker'),
    ('ms_level_5',      'Rising Star',         'Reach Level 5',                            'level',          5,     500,   'Rising Star'),
    ('ms_level_10',     'Cosmic Plug',         'Reach Level 10',                           'level',          10,    2000,  'Cosmic Plug'),
    ('ms_streak_7',     'Week Warrior',        'Maintain a 7-day referral streak',          'streak_days',    7,     2000,  'Week Warrior'),
    ('ms_streak_30',    'Monthly Grinder',     'Maintain a 30-day referral streak',         'streak_days',    30,    10000, 'Monthly Grinder'),
    ('ms_streak_100',   'Unstoppable',         'Maintain a 100-day referral streak',        'streak_days',    100,   50000, 'Unstoppable');

  -- Realms (⚡9: Invite-Only Realms)
  INSERT OR IGNORE INTO realms (id, name, slug, description, unlock_type, unlock_value, icon) VALUES
    ('realm_creator',   'Creator Realm',    'creator',    'Exclusive tools for content creators',          'referral_count', '10',        '🎨'),
    ('realm_money',     'Money Realm',      'money',      'Advanced financial instruments and analytics',  'tier',           'Gold',      '💰'),
    ('realm_content',   'Content Realm',    'content',    'AI-powered content generation suite',           'level',          '15',        '📹'),
    ('realm_primordia', 'Primordia Realm',  'primordia',  'The inner sanctum — ultimate power tools',      'xp',             '25000',     '🪐'),
    ('realm_diamond',   'Diamond Vault',    'diamond',    'Diamond-tier exclusive wealth strategies',       'tier',           'Diamond',   '💎');

  -- Active Season
  INSERT OR IGNORE INTO leaderboard_seasons (id, name, type, starts_at, ends_at, created_at) VALUES
    ('season_w_current', 'This Week',   'weekly',   date('now','weekday 0','-6 days'), date('now','weekday 0'), datetime('now')),
    ('season_m_current', 'This Month',  'monthly',  date('now','start of month'),      date('now','start of month','+1 month'), datetime('now')),
    ('season_1',         'Season 1: Genesis', 'seasonal', '2026-08-01', '2026-10-31', datetime('now'));
`); } catch(e) { /* tables exist */ }


// ═══════════════════════════════════════════════════════════════════
//  CORE: Tier Booster Multiplier (⚡4)
// ═══════════════════════════════════════════════════════════════════
function getTierBooster(tierTitle: string): number {
  const boosters: Record<string, number> = {
    'Novice Plug': 1.0,
    'Budget Apprentice': 1.0,
    'Crypto Stacker': 1.05,
    'Wealth Builder': 1.10,
    'Grand Money Plug': 1.20,
    'Diamond Stacker': 1.30,
    'Cosmic Money Plug': 1.50,
  };
  return boosters[tierTitle] || 1.0;
}

// ═══════════════════════════════════════════════════════════════════
//  CORE: Active Boost Event Multiplier (⚡8)
// ═══════════════════════════════════════════════════════════════════
function getActiveBoostMultiplier(): { xp: number; commission: number; eventName: string | null } {
  const event = db.prepare(`
    SELECT * FROM boost_events 
    WHERE is_active = 1 AND starts_at <= datetime('now') AND ends_at > datetime('now')
    ORDER BY xp_multiplier DESC LIMIT 1
  `).get() as any;
  
  return event
    ? { xp: event.xp_multiplier, commission: event.commission_multiplier, eventName: event.name }
    : { xp: 1.0, commission: 1.0, eventName: null };
}

// ═══════════════════════════════════════════════════════════════════
//  CORE: Daily Referral Multiplier (⚡6)
// ═══════════════════════════════════════════════════════════════════
function getDailyMultiplier(userId: string): number {
  const today = new Date().toISOString().substring(0, 10);
  const streak = db.prepare('SELECT * FROM referral_streaks WHERE user_id = ?').get(userId) as any;
  if (!streak || streak.today_date !== today) return 2.0; // First referral of the day = 2×
  if (streak.referrals_today < 5) return 1.5; // First 5 of the day
  return 1.0;
}

// ═══════════════════════════════════════════════════════════════════
//  CORE: Calculate total XP with all multipliers applied
// ═══════════════════════════════════════════════════════════════════
export function calculateXPWithMultipliers(baseXP: number, userId: string): {
  totalXP: number;
  breakdown: { base: number; tierBoost: number; eventMulti: number; dailyMulti: number; eventName: string | null };
} {
  const user = db.prepare('SELECT tier_title FROM users WHERE id = ?').get(userId) as any;
  const tierBoost = getTierBooster(user?.tier_title || 'Novice Plug');
  const eventMulti = getActiveBoostMultiplier();
  const dailyMulti = getDailyMultiplier(userId);

  const totalXP = Math.round(baseXP * tierBoost * eventMulti.xp * dailyMulti);

  return {
    totalXP,
    breakdown: {
      base: baseXP,
      tierBoost,
      eventMulti: eventMulti.xp,
      dailyMulti,
      eventName: eventMulti.eventName,
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CORE: Process referral event (called from auth.ts on signup)
//  Handles: streaks, milestones, badges, realm unlocks, leaderboard
// ═══════════════════════════════════════════════════════════════════
export function processReferralEvent(referrerUserId: string): {
  xpAwarded: number;
  milestonesUnlocked: string[];
  badgesEarned: string[];
  realmsUnlocked: string[];
  streakInfo: { current: number; isNew: boolean };
} {
  const now = new Date().toISOString();
  const today = now.substring(0, 10);
  const result = {
    xpAwarded: 0,
    milestonesUnlocked: [] as string[],
    badgesEarned: [] as string[],
    realmsUnlocked: [] as string[],
    streakInfo: { current: 0, isNew: false },
  };

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(referrerUserId) as any;
  if (!user) return result;

  // ── 1. Update Referral Streak (⚡2) ──
  let streak = db.prepare('SELECT * FROM referral_streaks WHERE user_id = ?').get(referrerUserId) as any;
  
  if (!streak) {
    db.prepare(`INSERT INTO referral_streaks (user_id, current_streak, longest_streak, last_referral_date, referrals_today, today_date, updated_at)
      VALUES (?, 1, 1, ?, 1, ?, ?)`).run(referrerUserId, today, today, now);
    streak = { current_streak: 1, referrals_today: 1, today_date: today };
    result.streakInfo = { current: 1, isNew: true };
  } else {
    const lastDate = streak.last_referral_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
    
    let newStreak = streak.current_streak;
    let refsToday = streak.today_date === today ? streak.referrals_today + 1 : 1;

    if (lastDate === today) {
      // Same day, just increment today count
    } else if (lastDate === yesterday) {
      // Consecutive day — streak continues
      newStreak += 1;
      result.streakInfo.isNew = true;
    } else {
      // Streak broken — reset
      newStreak = 1;
      result.streakInfo.isNew = true;
    }

    const longest = Math.max(newStreak, streak.longest_streak);
    db.prepare(`UPDATE referral_streaks SET current_streak = ?, longest_streak = ?, last_referral_date = ?, referrals_today = ?, today_date = ?, updated_at = ? WHERE user_id = ?`)
      .run(newStreak, longest, today, refsToday, today, now, referrerUserId);
    
    result.streakInfo.current = newStreak;
    streak.current_streak = newStreak;
    streak.referrals_today = refsToday;

    // ── Streak bonuses (⚡2) ──
    if (refsToday === 1) result.xpAwarded += 200;  // 1 referral/day
    if (refsToday === 3) result.xpAwarded += 500;  // 3 referrals/day bonus
  }

  // ── 2. Check & Award Milestones (⚡1 + ⚡3) ──
  const refCount = (user.referral_count || 0) + 1; // +1 because this referral just happened
  const userXP = user.xp || 0;
  const userLevel = user.level || 1;
  const streakDays = streak?.current_streak || 1;

  const milestones = db.prepare('SELECT * FROM xp_milestones WHERE is_active = 1').all() as any[];
  
  for (const ms of milestones) {
    // Check if already unlocked
    const already = db.prepare('SELECT 1 FROM user_milestones WHERE user_id = ? AND milestone_id = ?').get(referrerUserId, ms.id);
    if (already) continue;

    let triggered = false;
    switch (ms.trigger_type) {
      case 'referral_count': triggered = refCount >= ms.trigger_value; break;
      case 'xp_total':       triggered = userXP >= ms.trigger_value; break;
      case 'level':          triggered = userLevel >= ms.trigger_value; break;
      case 'streak_days':    triggered = streakDays >= ms.trigger_value; break;
    }

    if (triggered) {
      db.prepare('INSERT INTO user_milestones (user_id, milestone_id, unlocked_at) VALUES (?, ?, ?)').run(referrerUserId, ms.id, now);
      result.xpAwarded += ms.reward_xp;
      result.milestonesUnlocked.push(ms.name);

      // Award badge if milestone has one (⚡10)
      if (ms.reward_badge) {
        const badgeId = `badge_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        db.prepare('INSERT OR IGNORE INTO user_badges (id, user_id, badge_type, badge_name, description, unlocked_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(badgeId, referrerUserId, 'milestone', ms.reward_badge, ms.description, now);
        result.badgesEarned.push(ms.reward_badge);
      }
    }
  }

  // ── 3. Check Realm Unlocks (⚡9) ──
  const realms = db.prepare('SELECT * FROM realms WHERE is_active = 1').all() as any[];
  
  for (const realm of realms) {
    const alreadyUnlocked = db.prepare('SELECT 1 FROM user_realms WHERE user_id = ? AND realm_id = ?').get(referrerUserId, realm.id);
    if (alreadyUnlocked) continue;

    let unlocked = false;
    switch (realm.unlock_type) {
      case 'referral_count': unlocked = refCount >= parseInt(realm.unlock_value); break;
      case 'level':          unlocked = userLevel >= parseInt(realm.unlock_value); break;
      case 'xp':             unlocked = userXP >= parseInt(realm.unlock_value); break;
      case 'tier':           unlocked = user.tier_title === realm.unlock_value || 
                                         tierRank(user.tier_title) >= tierRank(realm.unlock_value); break;
    }

    if (unlocked) {
      db.prepare('INSERT INTO user_realms (user_id, realm_id, unlocked_at) VALUES (?, ?, ?)').run(referrerUserId, realm.id, now);
      result.realmsUnlocked.push(realm.name);

      // Badge for realm unlock
      const badgeId = `badge_realm_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      db.prepare('INSERT OR IGNORE INTO user_badges (id, user_id, badge_type, badge_name, badge_icon, description, unlocked_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(badgeId, referrerUserId, 'realm', `${realm.name} Access`, realm.icon, `Unlocked ${realm.name}`, now);
      result.badgesEarned.push(`${realm.name} Access`);
    }
  }

  // ── 4. Apply Multipliers to XP (⚡4 + ⚡6 + ⚡8) ──
  const baseReferralXP = 350;
  const { totalXP } = calculateXPWithMultipliers(baseReferralXP + result.xpAwarded, referrerUserId);
  result.xpAwarded = totalXP;

  // ── 5. Update Seasonal Leaderboard (⚡5) ──
  const activeSeasons = db.prepare(
    "SELECT id FROM leaderboard_seasons WHERE is_active = 1 AND starts_at <= date('now') AND ends_at > date('now')"
  ).all() as any[];

  for (const season of activeSeasons) {
    db.prepare(`
      INSERT INTO leaderboard_entries (season_id, user_id, xp_earned, referrals_earned, updated_at)
      VALUES (?, ?, ?, 1, ?)
      ON CONFLICT(season_id, user_id) DO UPDATE SET 
        xp_earned = xp_earned + ?, referrals_earned = referrals_earned + 1, updated_at = ?
    `).run(season.id, referrerUserId, totalXP, now, totalXP, now);
  }

  // ── 6. Credit the XP to user ──
  db.prepare('UPDATE users SET xp = xp + ?, updated_at = ? WHERE id = ?').run(totalXP, now, referrerUserId);

  return result;
}

function tierRank(tier: string): number {
  const ranks: Record<string, number> = {
    'Novice Plug': 0, 'Budget Apprentice': 1, 'Crypto Stacker': 2,
    'Wealth Builder': 3, 'Grand Money Plug': 4, 'Diamond Stacker': 5, 'Cosmic Money Plug': 6,
    'Bronze': 0, 'Silver': 1, 'Gold': 2, 'Platinum': 3, 'Diamond': 4,
  };
  return ranks[tier] ?? 0;
}


// ═══════════════════════════════════════════════════════════════════
//  API: Growth Dashboard
//  GET /api/growth/dashboard
// ═══════════════════════════════════════════════════════════════════

router.get('/dashboard', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const user = db.prepare('SELECT xp, level, tier_title, referral_count FROM users WHERE id = ?').get(userId) as any;
  const streak = db.prepare('SELECT * FROM referral_streaks WHERE user_id = ?').get(userId) as any;
  const badges = db.prepare('SELECT * FROM user_badges WHERE user_id = ? ORDER BY unlocked_at DESC').all(userId) as any[];
  const milestones = db.prepare(`
    SELECT m.*, CASE WHEN um.user_id IS NOT NULL THEN 1 ELSE 0 END as unlocked
    FROM xp_milestones m
    LEFT JOIN user_milestones um ON um.milestone_id = m.id AND um.user_id = ?
    WHERE m.is_active = 1
    ORDER BY m.trigger_value ASC
  `).all(userId) as any[];
  const realms = db.prepare(`
    SELECT r.*, CASE WHEN ur.user_id IS NOT NULL THEN 1 ELSE 0 END as unlocked
    FROM realms r
    LEFT JOIN user_realms ur ON ur.realm_id = r.id AND ur.user_id = ?
    WHERE r.is_active = 1
  `).all(userId) as any[];

  const boost = getActiveBoostMultiplier();
  const tierBoost = getTierBooster(user?.tier_title || 'Novice Plug');
  const dailyMulti = getDailyMultiplier(userId);

  // Next milestone to unlock
  const nextMilestone = milestones.find((m: any) => !m.unlocked);

  res.json({
    success: true,
    data: {
      xp: user?.xp || 0,
      level: user?.level || 1,
      tier: user?.tier_title || 'Novice Plug',
      referral_count: user?.referral_count || 0,

      streak: streak ? {
        current: streak.current_streak,
        longest: streak.longest_streak,
        referrals_today: streak.referrals_today,
        last_date: streak.last_referral_date,
      } : { current: 0, longest: 0, referrals_today: 0, last_date: null },

      multipliers: {
        tier_boost: `${(tierBoost * 100 - 100).toFixed(0)}%`,
        tier_boost_value: tierBoost,
        daily_multiplier: `${dailyMulti}×`,
        event_multiplier: boost.xp > 1 ? `${boost.xp}×` : null,
        event_name: boost.eventName,
        total_multiplier: `${(tierBoost * boost.xp * dailyMulti).toFixed(1)}×`,
      },

      milestones: milestones.map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        type: m.trigger_type,
        target: m.trigger_value,
        reward_xp: m.reward_xp,
        badge: m.reward_badge,
        unlocked: !!m.unlocked,
      })),

      next_milestone: nextMilestone ? {
        name: nextMilestone.name,
        type: nextMilestone.trigger_type,
        target: nextMilestone.trigger_value,
        reward_xp: nextMilestone.reward_xp,
      } : null,

      badges: badges.map((b: any) => ({
        name: b.badge_name,
        type: b.badge_type,
        icon: b.badge_icon,
        description: b.description,
        unlocked_at: b.unlocked_at,
      })),

      realms: realms.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        icon: r.icon,
        description: r.description,
        unlock_type: r.unlock_type,
        unlock_value: r.unlock_value,
        unlocked: !!r.unlocked,
      })),
    }
  });
});


// ═══════════════════════════════════════════════════════════════════
//  API: Seasonal Leaderboards (⚡5)
//  GET /api/growth/leaderboard/:type  (weekly|monthly|seasonal)
// ═══════════════════════════════════════════════════════════════════

router.get('/leaderboard/:type', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const type = req.params.type;
  const userId = req.user!.id;

  if (!['weekly', 'monthly', 'seasonal'].includes(type)) {
    res.status(400).json({ success: false, error: 'Type must be weekly, monthly, or seasonal' });
    return;
  }

  const season = db.prepare(
    "SELECT * FROM leaderboard_seasons WHERE type = ? AND is_active = 1 AND starts_at <= date('now') AND ends_at > date('now') ORDER BY created_at DESC LIMIT 1"
  ).get(type) as any;

  if (!season) {
    res.json({ success: true, data: { season: null, entries: [], your_rank: null } });
    return;
  }

  const entries = db.prepare(`
    SELECT le.*, u.display_name, u.tier_title, u.level, u.referral_code
    FROM leaderboard_entries le
    JOIN users u ON u.id = le.user_id
    WHERE le.season_id = ?
    ORDER BY le.xp_earned DESC
    LIMIT 50
  `).all(season.id) as any[];

  const yourEntry = entries.findIndex((e: any) => e.user_id === userId);

  res.json({
    success: true,
    data: {
      season: { id: season.id, name: season.name, type: season.type, ends_at: season.ends_at },
      entries: entries.map((e: any, i: number) => ({
        rank: i + 1,
        display_name: e.display_name,
        tier: e.tier_title,
        level: e.level,
        xp_earned: e.xp_earned,
        referrals: e.referrals_earned,
        sigil_url: `/api/sigil/${e.referral_code}?size=48`,
        is_you: e.user_id === userId,
      })),
      your_rank: yourEntry >= 0 ? yourEntry + 1 : null,
    }
  });
});


// ═══════════════════════════════════════════════════════════════════
//  API: Share Card Generator (⚡7) — Fullscreen Interactive Visual
//  GET /api/growth/share-card/:code
// ═══════════════════════════════════════════════════════════════════

router.get(['/share-card/:code', '/achievement-card/:code'], (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const user = db.prepare(
    'SELECT id, display_name, referral_code, xp, level, tier_title, referral_count FROM users WHERE referral_code = ? COLLATE NOCASE'
  ).get(code) as any;

  if (!user) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Referral Card Not Found</title></head>
        <body style="background:#070a14;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h2>⚠️ Invalid Referral Code</h2>
            <p style="color:#64748b;">Code <code>${code}</code> was not found.</p>
            <a href="/" style="color:#00ff88;text-decoration:none;">← Return Home</a>
          </div>
        </body>
      </html>
    `);
    return;
  }

  // Load custom Sigil configuration (aura, glyph, ring, crest) saved from Sigil Forge
  let customConfig: any = {};
  if (user?.id) {
    const cfg = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(user.id) as any;
    if (cfg) {
      customConfig = {
        aura: cfg.aura || null,
        glyph: cfg.glyph || null,
        ring: cfg.ring || null,
        crest: cfg.crest || null,
      };
    }
  }

  // Allow query overrides for preview testing (e.g. ?aura=aura_primordial_gold)
  if (req.query.aura) customConfig.aura = req.query.aura as string;
  if (req.query.glyph) customConfig.glyph = req.query.glyph as string;
  if (req.query.ring) customConfig.ring = req.query.ring as string;
  if (req.query.crest) customConfig.crest = req.query.crest as string;

  const sigil = generateSigil(user.referral_code, 350, customConfig);
  const sigilB64 = Buffer.from(sigil).toString('base64');
  const referralLink = `${config.appUrl}/api/referrals/track/${user.referral_code}`;

  const tierColors: Record<string, { hex: string; glow: string; name: string }> = {
    'Novice Plug': { hex: '#94a3b8', glow: 'rgba(148,163,184,0.3)', name: 'Novice Plug' },
    'Budget Apprentice': { hex: '#38bdf8', glow: 'rgba(56,189,248,0.4)', name: 'Budget Apprentice' },
    'Crypto Stacker': { hex: '#22c55e', glow: 'rgba(34,197,94,0.4)', name: 'Crypto Stacker' },
    'Wealth Builder': { hex: '#eab308', glow: 'rgba(234,179,8,0.4)', name: 'Wealth Builder' },
    'Grand Money Plug': { hex: '#a855f7', glow: 'rgba(168,85,247,0.5)', name: 'Grand Money Plug' },
    'Diamond Stacker': { hex: '#06b6d4', glow: 'rgba(6,182,212,0.5)', name: 'Diamond Stacker' },
    'Cosmic Money Plug': { hex: '#f43f5e', glow: 'rgba(244,63,94,0.6)', name: 'Cosmic Money Plug' },
  };
  const tier = tierColors[user.tier_title] || { hex: '#00ff88', glow: 'rgba(0,255,136,0.4)', name: user.tier_title || 'Novice Plug' };

  // 1200x630 Scalable High-Res SVG Card
  const cardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070a14"/>
      <stop offset="50%" stop-color="#0b1124"/>
      <stop offset="100%" stop-color="#140f2d"/>
    </linearGradient>
    <radialGradient id="aura" cx="25%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${tier.hex}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#070a14" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <rect width="1200" height="630" fill="url(#aura)"/>
  
  <!-- Outer Cosmic Border -->
  <rect x="8" y="8" width="1184" height="614" rx="28" fill="none" stroke="${tier.hex}" stroke-width="3" stroke-opacity="0.45"/>
  <rect x="18" y="18" width="1164" height="594" rx="20" fill="none" stroke="${tier.hex}" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="8 6"/>

  <!-- Left: Glowing Procedural Sigil -->
  <g transform="translate(60, 140)">
    <circle cx="175" cy="175" r="190" fill="${tier.hex}" fill-opacity="0.06" filter="url(#glow)"/>
    <image href="data:image/svg+xml;base64,${sigilB64}" x="0" y="0" width="350" height="350"/>
  </g>

  <!-- Right: Identity & Leveling Stats -->
  <g transform="translate(480, 120)">
    <!-- Brand / Ecosystem Header -->
    <text x="0" y="30" fill="#64748b" font-family="'JetBrains Mono', monospace, sans-serif" font-size="16" font-weight="700" letter-spacing="4">MONEYPLUGHUB • CREATOR MONEY OS</text>
    
    <!-- User Display Name -->
    <text x="0" y="105" fill="#ffffff" font-family="Inter, -apple-system, sans-serif" font-size="52" font-weight="900" letter-spacing="-1">${escSvg(user.display_name)}</text>
    
    <!-- Tier Badge & Level Pill -->
    <rect x="0" y="130" width="360" height="42" rx="12" fill="${tier.hex}" fill-opacity="0.15" stroke="${tier.hex}" stroke-width="1.5"/>
    <circle cx="20" cy="151" r="6" fill="${tier.hex}"/>
    <text x="36" y="157" fill="${tier.hex}" font-family="Inter, sans-serif" font-size="18" font-weight="800">${escSvg(tier.name)} • Level ${user.level || 1}</text>

    <!-- Metrics Grid -->
    <g transform="translate(0, 205)">
      <!-- XP -->
      <rect x="0" y="0" width="180" height="75" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
      <text x="18" y="28" fill="#64748b" font-family="sans-serif" font-size="12" font-weight="700">STORED XP</text>
      <text x="18" y="58" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="800">${(user.xp || 0).toLocaleString()}</text>

      <!-- Referrals -->
      <rect x="195" y="0" width="180" height="75" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
      <text x="213" y="28" fill="#64748b" font-family="sans-serif" font-size="12" font-weight="700">REFERRALS</text>
      <text x="213" y="58" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="800">${user.referral_count || 0}</text>

      <!-- Multiplier -->
      <rect x="390" y="0" width="180" height="75" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
      <text x="408" y="28" fill="#64748b" font-family="sans-serif" font-size="12" font-weight="700">STATUS MULTIPLIER</text>
      <text x="408" y="58" fill="${tier.hex}" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="800">${getTierBooster(user.tier_title)}×</text>
    </g>

    <!-- CTA Button Block -->
    <g transform="translate(0, 315)">
      <rect x="0" y="0" width="460" height="60" rx="16" fill="${tier.hex}" filter="url(#glow)" opacity="0.95"/>
      <text x="230" y="38" fill="#070a14" font-family="Inter, sans-serif" font-size="20" font-weight="900" text-anchor="middle" letter-spacing="1">JOIN MY PRIVATE NETWORK →</text>
    </g>
  </g>

  <!-- Footer Info Bar -->
  <line x1="60" y1="560" x2="1140" y2="560" stroke="#1e293b" stroke-width="1"/>
  <text x="60" y="590" fill="#475569" font-family="'JetBrains Mono', monospace" font-size="13">AUTHENTICATED DETERMINISTIC SIGIL HASH • SHA-256(${user.referral_code})</text>
  <text x="1140" y="590" fill="${tier.hex}" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="800" text-anchor="end">${user.referral_code}</text>
</svg>`;

  // 1. JSON Request
  if (req.query.format === 'json') {
    const b64 = Buffer.from(cardSvg).toString('base64');
    res.json({
      success: true,
      data: {
        referral_code: user.referral_code,
        display_name: user.display_name,
        tier: user.tier_title,
        level: user.level,
        svg_data_uri: `data:image/svg+xml;base64,${b64}`,
        share_url: `${config.appUrl}/api/growth/share-card/${user.referral_code}`,
      }
    });
    return;
  }

  // 2. Direct SVG Image Request (e.g. for <img src="..." /> or ?format=svg)
  if (req.query.format === 'svg' || req.query.raw === '1' || req.headers.accept?.includes('image/svg+xml')) {
    res.set({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' });
    res.send(cardSvg);
    return;
  }

  // 3. Fullscreen Immersive HTML Presentation (Default for browser URLs)
  res.set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escSvg(user.display_name)} — Creator Money OS Share Card</title>
  
  <!-- OpenGraph / Twitter Meta Tags -->
  <meta property="og:title" content="${escSvg(user.display_name)} • ${escSvg(tier.name)} (Level ${user.level || 1})">
  <meta property="og:description" content="Claim your starter XP & join my private wealth network with code ${user.referral_code}">
  <meta property="og:image" content="${config.appUrl}/api/growth/share-card/${user.referral_code}?format=svg">
  <meta name="twitter:card" content="summary_large_image">
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100vw;
      height: 100vh;
      background-color: #070a14;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    /* Ambient animated cosmic backdrops */
    .cosmic-glow {
      position: absolute;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, ${tier.glow} 0%, rgba(7,10,20,0) 70%);
      pointer-events: none;
      filter: blur(80px);
      z-index: 0;
      animation: pulseGlow 6s ease-in-out infinite alternate;
    }

    @keyframes pulseGlow {
      0% { transform: scale(0.9) translate(-10%, -10%); opacity: 0.5; }
      100% { transform: scale(1.15) translate(10%, 10%); opacity: 0.85; }
    }

    /* Card Frame that fits 100% of viewport seamlessly */
    .card-container {
      position: relative;
      z-index: 10;
      width: 94vw;
      max-width: 1200px;
      height: auto;
      max-height: 85vh;
      aspect-ratio: 1200 / 630;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 28px;
      box-shadow: 0 30px 80px -20px rgba(0,0,0,0.9), 0 0 50px -10px ${tier.glow};
      overflow: hidden;
      transition: transform 0.3s ease;
    }

    .card-container svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Action Toolbar below card */
    .action-bar {
      position: relative;
      z-index: 20;
      margin-top: 24px;
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 800;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .btn-primary {
      background: ${tier.hex};
      color: #070a14;
      box-shadow: 0 10px 25px -5px ${tier.glow};
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }

    .btn-secondary {
      background: #0f172a;
      color: #e2e8f0;
      border-color: #334155;
    }
    .btn-secondary:hover {
      background: #1e293b;
      color: #fff;
      transform: translateY(-2px);
    }

    /* Toast notification */
    #toast {
      position: fixed;
      bottom: 30px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid ${tier.hex};
      color: ${tier.hex};
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      font-family: monospace;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 100;
      pointer-events: none;
      backdrop-filter: blur(12px);
    }
    #toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    @media (max-width: 768px) {
      .card-container {
        width: 96vw;
        max-height: 75vh;
      }
      .btn {
        padding: 10px 18px;
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="cosmic-glow"></div>

  <!-- Fullscreen Responsive Card -->
  <div class="card-container" id="cardContainer">
    ${cardSvg}
  </div>

  <!-- Interactive Controls Bar -->
  <div class="action-bar">
    <a href="${referralLink}" class="btn btn-primary">
      🚀 Join My Network (Claim Starter XP)
    </a>

    <button onclick="copyRefLink()" class="btn btn-secondary" id="copyBtn">
      📋 Copy Referral Link
    </button>

    <button onclick="toggleFullscreen()" class="btn btn-secondary">
      🖥️ Fullscreen Mode
    </button>

    <a href="/api/growth/share-card/${user.referral_code}?format=svg" download="share-card-${user.referral_code}.svg" class="btn btn-secondary">
      💾 Download 4K SVG
    </a>
  </div>

  <div id="toast">📋 Referral link copied to clipboard!</div>

  <script>
    const refLink = "${referralLink}";

    function copyRefLink() {
      navigator.clipboard.writeText(refLink).then(() => {
        showToast("✨ Copied: " + refLink);
      }).catch(() => {
        showToast("👉 Link: " + refLink);
      });
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3500);
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Fullscreen request error:", err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    // Auto click on card redirects to invite link
    document.getElementById('cardContainer').addEventListener('click', () => {
      window.location.href = refLink;
    });
    document.getElementById('cardContainer').style.cursor = 'pointer';
  </script>
</body>
</html>`);
});

function escSvg(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


// ═══════════════════════════════════════════════════════════════════
//  ADMIN: Boost Event Management (⚡8)
//  POST /api/growth/boost-events
//  GET  /api/growth/boost-events
// ═══════════════════════════════════════════════════════════════════

router.post('/boost-events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') { res.status(403).json({ success: false, error: 'Admin only' }); return; }

  const { name, description, xp_multiplier = 2.0, commission_multiplier = 1.0, starts_at, ends_at } = req.body;
  if (!name || !starts_at || !ends_at) { res.status(400).json({ success: false, error: 'name, starts_at, ends_at required' }); return; }

  const id = `boost_${Date.now()}`;
  db.prepare('INSERT INTO boost_events (id, name, description, xp_multiplier, commission_multiplier, starts_at, ends_at, created_at) VALUES (?,?,?,?,?,?,?,datetime(\'now\'))')
    .run(id, name, description || '', xp_multiplier, commission_multiplier, starts_at, ends_at);

  recordAuditLog(req.user!.id, 'BOOST_EVENT_CREATED', 'boost_events', id, { name, xp_multiplier });
  res.json({ success: true, message: `🚀 Boost event "${name}" created (${xp_multiplier}× XP)`, data: { id } });
});

router.get('/boost-events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const events = db.prepare('SELECT * FROM boost_events ORDER BY starts_at DESC LIMIT 20').all();
  const active = getActiveBoostMultiplier();
  res.json({ success: true, data: { events, active_event: active.eventName, active_xp_multi: active.xp } });
});

// Active boost status (public)
router.get('/active-boost', (_req, res) => {
  const boost = getActiveBoostMultiplier();
  res.json({ success: true, data: boost });
});


export default router;
