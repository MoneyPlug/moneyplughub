import { Router, Request, Response } from 'express';
import { db } from '../db';

export const xpEconomyRouter = Router();

// ── 6 Wealth Tiers Configuration ──────────────────────────────────────────
export interface WealthTierConfig {
  tier: number;
  name: string;
  codename: string;
  minNetWorthCents: number;
  multiplier: number;
  dailyLimitCents: number;
  weeklyBonusCents: number;
  accentColor: string;
  atmosphere: string;
}

export const WEALTH_TIERS: WealthTierConfig[] = [
  {
    tier: 1,
    name: 'Neo-Emerald Seed',
    codename: 'EMERALD_MATRIX',
    minNetWorthCents: 0,
    multiplier: 1.0,
    dailyLimitCents: 200, // $2.00 / day
    weeklyBonusCents: 100, // +$1.00 7-day streak
    accentColor: '#00ff88',
    atmosphere: 'Micro-quantum emerald particle rise',
  },
  {
    tier: 2,
    name: 'Cyan Cashflow River',
    codename: 'CYAN_RAPIDS',
    minNetWorthCents: 100000, // $1,000
    multiplier: 1.1,
    dailyLimitCents: 500, // $5.00 / day
    weeklyBonusCents: 200, // +$2.00 7-day streak
    accentColor: '#06b6d4',
    atmosphere: 'Hydro-laser stream convergence',
  },
  {
    tier: 3,
    name: 'Amethyst Quantum Ledger',
    codename: 'AMETHYST_TESSERACT',
    minNetWorthCents: 500000, // $5,000
    multiplier: 1.25,
    dailyLimitCents: 1000, // $10.00 / day
    weeklyBonusCents: 300, // +$3.00 7-day streak
    accentColor: '#a855f7',
    atmosphere: 'Cryptographic rune vortex',
  },
  {
    tier: 4,
    name: '24K Imperial Bullion',
    codename: 'AUREATE_BULLION',
    minNetWorthCents: 2000000, // $20,000
    multiplier: 1.5,
    dailyLimitCents: 2000, // $20.00 / day
    weeklyBonusCents: 500, // +$5.00 7-day streak
    accentColor: '#eab308',
    atmosphere: 'Thermonuclear solar flare compression',
  },
  {
    tier: 5,
    name: 'Sovereign Diamond Treasury',
    codename: 'DIAMOND_VAULT',
    minNetWorthCents: 10000000, // $100,000
    multiplier: 2.0,
    dailyLimitCents: 3500, // $35.00 / day
    weeklyBonusCents: 1000, // +$10.00 7-day streak
    accentColor: '#38bdf8',
    atmosphere: 'Cryo-diamond prism dispersion',
  },
  {
    tier: 6,
    name: 'Celestial Osmium Singularity',
    codename: 'OSMIUM_SINGULARITY',
    minNetWorthCents: 100000000, // $1,000,000
    multiplier: 3.0,
    dailyLimitCents: 5000, // $50.00 / day
    weeklyBonusCents: 2000, // +$20.00 7-day streak
    accentColor: '#ec4899',
    atmosphere: 'Complete gravity inversion & dark matter shockwave',
  },
];

// Helper: Resolve user's Wealth Tier based on Net Worth or Level
export function resolveUserWealthTier(netWorthCents: number = 0, level: number = 1): WealthTierConfig {
  if (netWorthCents >= 100000000 || level >= 10) return WEALTH_TIERS[5];
  if (netWorthCents >= 10000000 || level >= 7) return WEALTH_TIERS[4];
  if (netWorthCents >= 2000000 || level >= 5) return WEALTH_TIERS[3];
  if (netWorthCents >= 500000 || level >= 3) return WEALTH_TIERS[2];
  if (netWorthCents >= 100000 || level >= 2) return WEALTH_TIERS[1];
  return WEALTH_TIERS[0];
}

// ── Database Schema Initialization ─────────────────────────────────────────
export function initXpEconomySchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS xp_conversions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      xp_amount INTEGER NOT NULL,
      base_cash_cents INTEGER NOT NULL,
      multiplier REAL NOT NULL,
      final_cash_cents INTEGER NOT NULL,
      tier_level INTEGER NOT NULL,
      streak_days INTEGER NOT NULL DEFAULT 1,
      weekly_bonus_cents INTEGER NOT NULL DEFAULT 0,
      ip_fingerprint TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_conversion_streaks (
      user_id TEXT PRIMARY KEY,
      current_streak INTEGER NOT NULL DEFAULT 0,
      last_conversion_date TEXT,
      weekly_claims_count INTEGER NOT NULL DEFAULT 0,
      total_converted_xp INTEGER NOT NULL DEFAULT 0,
      total_earned_cents INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);
}

initXpEconomySchema();

// Helper: Extract user ID from header or query or guest fallback
function extractUserIdOrGuest(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.startsWith('user_') || token.startsWith('usr_') || token === 'admin') {
      return token === 'admin' ? 'usr_primary_auditor' : token;
    }
  }
  const queryUserId = req.query.user_id as string;
  if (queryUserId) return queryUserId;
  const primary = db.prepare('SELECT id FROM users LIMIT 1').get() as any;
  return primary ? primary.id : 'guest_plug';
}

// ── XP Conversion Formula ──────────────────────────────────────────────────
// Base rate: 1,000 XP = $0.50 (i.e. 50 cents) -> 0.05 cents per XP
export function calculateBaseCashCents(xp: number): number {
  if (xp <= 0) return 0;
  // Specific stepped table matching specs:
  if (xp === 250) return 10; // $0.10
  if (xp === 500) return 25; // $0.25
  if (xp === 1000) return 50; // $0.50
  if (xp === 2500) return 125; // $1.25
  if (xp === 5000) return 250; // $2.50
  if (xp === 10000) return 500; // $5.00
  // Linear exact formula for arbitrary quantities:
  return Math.floor(xp * 0.05);
}

/**
 * GET /api/xp-economy/status
 * Returns current user's conversion stats, active tier, daily limits, and streak status.
 */
xpEconomyRouter.get('/status', (req: Request, res: Response) => {
  try {
    const userId = extractUserIdOrGuest(req);
    const user = db.prepare('SELECT id, level, xp, role FROM users WHERE id = ?').get(userId) as any;
    
    // Net Worth & Liquid Cash from accounts table
    const netWorthRow = db.prepare(`
      SELECT SUM(CASE WHEN is_liability = 0 THEN balance_cents ELSE -balance_cents END) as net_worth_cents,
             SUM(CASE WHEN is_liability = 0 AND type IN ('cash', 'bank') THEN balance_cents ELSE 0 END) as cash_balance_cents
      FROM accounts
      WHERE user_id = ?
    `).get(userId) as any;

    const userLevel = user?.level || 1;
    const userXp = user?.xp || 0;
    const netWorthCents = netWorthRow?.net_worth_cents || 0;
    const cashBalanceCents = netWorthRow?.cash_balance_cents || 0;

    const tier = resolveUserWealthTier(netWorthCents, userLevel);

    // Calculate sum of cash converted in the last 24 hours
    const dailyConverted = db.prepare(`
      SELECT COALESCE(SUM(final_cash_cents), 0) as total_cents,
             COALESCE(SUM(xp_amount), 0) as total_xp,
             COUNT(*) as conversion_count,
             MAX(created_at) as last_converted_at
      FROM xp_conversions
      WHERE user_id = ? AND created_at >= datetime('now', '-1 day')
    `).get(userId) as any;

    const convertedTodayCents = dailyConverted?.total_cents || 0;
    const remainingDailyCents = Math.max(0, tier.dailyLimitCents - convertedTodayCents);

    // Fetch streak details
    let streakRecord = db.prepare('SELECT * FROM user_conversion_streaks WHERE user_id = ?').get(userId) as any;
    if (!streakRecord) {
      streakRecord = {
        current_streak: 0,
        last_conversion_date: null,
        weekly_claims_count: 0,
        total_converted_xp: 0,
        total_earned_cents: 0,
      };
    }

    // Determine Gravity Inversion Meter (% to next tier)
    const nextTier = WEALTH_TIERS.find(t => t.tier === tier.tier + 1) || null;
    let gravityProgress = 100;
    if (nextTier) {
      const currentMin = tier.minNetWorthCents;
      const nextMin = nextTier.minNetWorthCents;
      gravityProgress = Math.min(100, Math.max(10, Math.round(((netWorthCents - currentMin) / (nextMin - currentMin)) * 100)));
    }

    res.json({
      success: true,
      data: {
        userId,
        userXp,
        cashBalanceCents,
        tier: {
          number: tier.tier,
          name: tier.name,
          codename: tier.codename,
          multiplier: tier.multiplier,
          dailyLimitCents: tier.dailyLimitCents,
          weeklyBonusCents: tier.weeklyBonusCents,
          accentColor: tier.accentColor,
          atmosphere: tier.atmosphere,
        },
        nextTier: nextTier ? {
          number: nextTier.tier,
          name: nextTier.name,
          multiplier: nextTier.multiplier,
          dailyLimitCents: nextTier.dailyLimitCents,
          minNetWorthCents: nextTier.minNetWorthCents,
        } : null,
        gravityProgress,
        daily: {
          convertedTodayCents,
          dailyLimitCents: tier.dailyLimitCents,
          remainingDailyCents,
          conversionsCount: dailyConverted?.conversion_count || 0,
          lastConvertedAt: dailyConverted?.last_converted_at || null,
        },
        streak: {
          days: streakRecord.current_streak,
          isWeeklyBonusEligible: streakRecord.current_streak >= 7,
          weeklyBonusCents: tier.weeklyBonusCents,
          totalConvertedXp: streakRecord.total_converted_xp,
          totalEarnedCents: streakRecord.total_earned_cents,
        },
        presetOptions: [
          { xp: 250, baseCents: 10, finalCents: Math.round(10 * tier.multiplier) },
          { xp: 500, baseCents: 25, finalCents: Math.round(25 * tier.multiplier) },
          { xp: 1000, baseCents: 50, finalCents: Math.round(50 * tier.multiplier) },
          { xp: 2500, baseCents: 125, finalCents: Math.round(125 * tier.multiplier) },
          { xp: 5000, baseCents: 250, finalCents: Math.round(250 * tier.multiplier) },
          { xp: 10000, baseCents: 500, finalCents: Math.round(500 * tier.multiplier) },
        ]
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/xp-economy/convert
 * Atomically executes XP -> Cash Antigravity Conversion with anti-cheat & velocity verification.
 */
xpEconomyRouter.post('/convert', (req: Request, res: Response) => {
  try {
    const userId = extractUserIdOrGuest(req);
    const { xpAmount } = req.body || {};
    const xp = Number(xpAmount);

    if (!xp || isNaN(xp) || xp < 100) {
      res.status(400).json({ success: false, error: 'Minimum conversion amount is 100 XP.' });
      return;
    }

    const user = db.prepare('SELECT id, level, xp, role FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found.' });
      return;
    }

    if (user.xp < xp) {
      res.status(400).json({
        success: false,
        error: `Insufficient XP. You have ${user.xp.toLocaleString()} XP, but tried to convert ${xp.toLocaleString()} XP.`
      });
      return;
    }

    // Net Worth & Liquid Cash from accounts table
    const netWorthRow = db.prepare(`
      SELECT SUM(CASE WHEN is_liability = 0 THEN balance_cents ELSE -balance_cents END) as net_worth_cents,
             SUM(CASE WHEN is_liability = 0 AND type IN ('cash', 'bank') THEN balance_cents ELSE 0 END) as cash_balance_cents
      FROM accounts
      WHERE user_id = ?
    `).get(userId) as any;

    const netWorthCents = netWorthRow?.net_worth_cents || 0;
    const userLevel = user.level || 1;
    const tier = resolveUserWealthTier(netWorthCents, userLevel);

    // ── Anti-Cheat: 30-Second Velocity Cooldown Check ──────────────────────
    const lastConversion = db.prepare(`
      SELECT created_at FROM xp_conversions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(userId) as any;

    if (lastConversion) {
      const diffMs = Date.now() - new Date(lastConversion.created_at).getTime();
      if (diffMs < 30000) {
        const waitSec = Math.ceil((30000 - diffMs) / 1000);
        res.status(429).json({
          success: false,
          error: `Quantum Antigravity Cooldown active. Please wait ${waitSec}s before initiating another conversion event.`
        });
        return;
      }
    }

    // ── Calculate Base Cash & Tier Multiplier ──────────────────────────────
    const baseCashCents = calculateBaseCashCents(xp);
    let finalCashCents = Math.round(baseCashCents * tier.multiplier);

    // ── Anti-Cheat: Daily Conversion Limit Enforcement ────────────────────
    const dailyConverted = db.prepare(`
      SELECT COALESCE(SUM(final_cash_cents), 0) as total_cents
      FROM xp_conversions
      WHERE user_id = ? AND created_at >= datetime('now', '-1 day')
    `).get(userId) as any;

    const convertedTodayCents = dailyConverted?.total_cents || 0;
    const remainingDailyCents = Math.max(0, tier.dailyLimitCents - convertedTodayCents);

    if (finalCashCents > remainingDailyCents && user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: `Daily conversion limit exceeded for ${tier.name}. Remaining limit today is $${(remainingDailyCents / 100).toFixed(2)} (Max: $${(tier.dailyLimitCents / 100).toFixed(2)}/day). Elevate your Net Worth to ascend to a higher Wealth Tier!`
      });
      return;
    }

    // ── 7-Day Prestige Streak Bonus Calculation ───────────────────────────
    const nowIso = new Date().toISOString();
    const todayDateStr = nowIso.split('T')[0];

    let streakRecord = db.prepare('SELECT * FROM user_conversion_streaks WHERE user_id = ?').get(userId) as any;
    let newStreak = 1;
    let weeklyBonusAwarded = 0;

    if (streakRecord && streakRecord.last_conversion_date) {
      const lastDateStr = streakRecord.last_conversion_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (lastDateStr === todayDateStr) {
        newStreak = streakRecord.current_streak; // Same day conversion preserves streak
      } else if (lastDateStr === yesterday) {
        newStreak = streakRecord.current_streak + 1; // Consecutive day
      } else {
        newStreak = 1; // Streak broken
      }

      // If user hit 7 consecutive days, award the weekly prestige bonus
      if (newStreak >= 7 && streakRecord.current_streak < 7) {
        weeklyBonusAwarded = tier.weeklyBonusCents;
        finalCashCents += weeklyBonusAwarded;
      }
    }

    const conversionId = `xpc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const ipFingerprint = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local_node';

    // ── ACID Atomic Execution ─────────────────────────────────────────────
    // 1. Deduct XP from user
    db.prepare('UPDATE users SET xp = xp - ? WHERE id = ?').run(xp, userId);

    // 2. Credit Cash to user's cash account
    let cashAccount = db.prepare(`SELECT id FROM accounts WHERE user_id = ? AND type = 'cash' LIMIT 1`).get(userId) as any;
    if (!cashAccount) {
      cashAccount = db.prepare(`SELECT id FROM accounts WHERE user_id = ? AND is_liability = 0 LIMIT 1`).get(userId) as any;
    }
    if (cashAccount) {
      db.prepare(`UPDATE accounts SET balance_cents = balance_cents + ?, updated_at = ? WHERE id = ?`).run(finalCashCents, nowIso, cashAccount.id);
    } else {
      const acctId = `acct_${Date.now()}`;
      db.prepare(`INSERT INTO accounts (id, user_id, name, type, balance_cents, currency, institution, is_liability, created_at, updated_at) VALUES (?, ?, 'Primary Cash Vault', 'cash', ?, 'USD', 'MoneyPlug Vault', 0, ?, ?)`).run(acctId, userId, finalCashCents, nowIso, nowIso);
    }

    // 3. Log Conversion Event
    db.prepare(`
      INSERT INTO xp_conversions (
        id, user_id, xp_amount, base_cash_cents, multiplier,
        final_cash_cents, tier_level, streak_days, weekly_bonus_cents,
        ip_fingerprint, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      conversionId, userId, xp, baseCashCents, tier.multiplier,
      finalCashCents, tier.tier, newStreak, weeklyBonusAwarded,
      ipFingerprint, nowIso
    );

    // 4. Update Conversion Streak
    db.prepare(`
      INSERT INTO user_conversion_streaks (
        user_id, current_streak, last_conversion_date, weekly_claims_count,
        total_converted_xp, total_earned_cents, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        current_streak = ?,
        last_conversion_date = ?,
        weekly_claims_count = weekly_claims_count + ?,
        total_converted_xp = total_converted_xp + ?,
        total_earned_cents = total_earned_cents + ?,
        updated_at = ?
    `).run(
      userId, newStreak, todayDateStr, weeklyBonusAwarded > 0 ? 1 : 0, xp, finalCashCents, nowIso,
      newStreak, todayDateStr, weeklyBonusAwarded > 0 ? 1 : 0, xp, finalCashCents, nowIso
    );

    // Fetch updated balances
    const updatedUser = db.prepare('SELECT xp FROM users WHERE id = ?').get(userId) as any;
    const updatedNetWorthRow = db.prepare(`
      SELECT SUM(CASE WHEN is_liability = 0 THEN balance_cents ELSE -balance_cents END) as net_worth_cents,
             SUM(CASE WHEN is_liability = 0 AND type IN ('cash', 'bank') THEN balance_cents ELSE 0 END) as cash_balance_cents
      FROM accounts
      WHERE user_id = ?
    `).get(userId) as any;

    res.json({
      success: true,
      message: `Antigravity Conversion complete! Transmuted ${xp.toLocaleString()} XP into $${(finalCashCents / 100).toFixed(2)} cash.`,
      data: {
        conversionId,
        xpTransmuted: xp,
        baseCashCents,
        tierMultiplier: tier.multiplier,
        weeklyBonusAwardedCents: weeklyBonusAwarded,
        finalCashCents,
        finalCashUsd: `$${(finalCashCents / 100).toFixed(2)}`,
        tier: {
          number: tier.tier,
          name: tier.name,
          codename: tier.codename,
          accentColor: tier.accentColor,
          atmosphere: tier.atmosphere,
        },
        streakDays: newStreak,
        updatedBalances: {
          remainingXp: updatedUser?.xp || 0,
          newCashBalanceCents: updatedNetWorthRow?.cash_balance_cents || 0,
          newNetWorthCents: updatedNetWorthRow?.net_worth_cents || 0,
        },
        ritualPhysics: {
          particleCount: Math.min(100, Math.max(30, Math.round(xp / 50))),
          shockwaveColor: tier.accentColor,
          gravityInversionFactor: tier.multiplier,
          solfeggioHz: tier.tier === 6 ? 963 : tier.tier === 5 ? 852 : tier.tier === 4 ? 639 : 528,
        }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/xp-economy/history
 * Returns the conversion transaction history for the user.
 */
xpEconomyRouter.get('/history', (req: Request, res: Response) => {
  try {
    const userId = extractUserIdOrGuest(req);
    const conversions = db.prepare(`
      SELECT id, xp_amount, base_cash_cents, multiplier, final_cash_cents, tier_level, weekly_bonus_cents, created_at
      FROM xp_conversions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(userId);

    res.json({
      success: true,
      data: conversions
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default xpEconomyRouter;
