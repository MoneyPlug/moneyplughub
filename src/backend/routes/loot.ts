import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, runInTransaction, recordAuditLog } from '../db';
import { config } from '../config';
import { User } from '../../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  DAILY MYSTERY LOOT CRATE & GACHA ENGINE — Creator Money OS
// ═══════════════════════════════════════════════════════════════════

// ── Database Schema Initialization ────────────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_loot_claims (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_value TEXT NOT NULL,
      reward_description TEXT NOT NULL,
      streak_days INTEGER NOT NULL DEFAULT 1,
      claimed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_daily_loot_user ON daily_loot_claims(user_id);
    CREATE INDEX IF NOT EXISTS idx_daily_loot_claimed_at ON daily_loot_claims(claimed_at);
  `);
} catch (e: any) {
  console.error('Daily Loot Table Init Warning:', e.message);
}

/**
 * Level & Tier computation helper
 */
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
 * Resolve authenticated user or guest identifier
 */
function resolveUserOrGuest(req: Request): {
  userId: string;
  isAuthenticated: boolean;
  user?: User;
} {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)
    || req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      const user = db.prepare(`
        SELECT id, email, display_name, role, referral_code, referrer_user_id, referral_count, xp, level, streak_days, tier_title, created_at, updated_at
        FROM users
        WHERE id = ?
      `).get(decoded.userId) as unknown as User | undefined;

      if (user) {
        return {
          userId: user.id,
          isAuthenticated: true,
          user,
        };
      }
    } catch {
      // invalid token, fallback to guest
    }
  }

  // Fallback to guest ID from header, query, cookie or client IP
  const explicitGuestId = (req.headers['x-guest-id'] as string)
    || (req.query.guest_id as string)
    || (req.body?.guest_id as string)
    || req.cookies?.guest_id;

  if (explicitGuestId && typeof explicitGuestId === 'string' && explicitGuestId.trim().length > 0) {
    return {
      userId: explicitGuestId.trim(),
      isAuthenticated: false,
    };
  }

  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const ipHash = crypto.createHash('md5').update(clientIp).digest('hex').substring(0, 12);
  return {
    userId: `guest_${ipHash}`,
    isAuthenticated: false,
  };
}

/**
 * Helper to compute eligibility & streak state
 */
function computeEligibility(userId: string): {
  eligible: boolean;
  secondsRemaining: number;
  streakDays: number;
  nextBonusMultiplier: number;
  lastClaimedAt: string | null;
} {
  const lastClaim = db.prepare(`
    SELECT * FROM daily_loot_claims 
    WHERE user_id = ? 
    ORDER BY claimed_at DESC 
    LIMIT 1
  `).get(userId) as any;

  if (!lastClaim || !lastClaim.claimed_at) {
    return {
      eligible: true,
      secondsRemaining: 0,
      streakDays: 1,
      nextBonusMultiplier: 1.0,
      lastClaimedAt: null,
    };
  }

  const lastClaimTime = new Date(lastClaim.claimed_at).getTime();
  const now = Date.now();
  const msElapsed = now - lastClaimTime;
  const cooldownMs = 24 * 60 * 60 * 1000; // 24 Hours cooldown
  const gracePeriodMs = 48 * 60 * 60 * 1000; // 48 Hours streak preservation window

  if (msElapsed < cooldownMs) {
    const secondsRemaining = Math.ceil((cooldownMs - msElapsed) / 1000);
    const currentStreak = Number(lastClaim.streak_days || 1);
    const nextBonusMultiplier = Number((1.0 + (currentStreak - 1) * 0.05).toFixed(2));

    return {
      eligible: false,
      secondsRemaining,
      streakDays: currentStreak,
      nextBonusMultiplier,
      lastClaimedAt: lastClaim.claimed_at,
    };
  }

  // Cooldown passed — eligible to open
  let nextStreak = 1;
  if (msElapsed <= gracePeriodMs) {
    nextStreak = Number(lastClaim.streak_days || 1) + 1;
  } else {
    nextStreak = 1; // Streak broken if > 48h
  }

  const nextBonusMultiplier = Number((1.0 + (nextStreak - 1) * 0.05).toFixed(2));

  return {
    eligible: true,
    secondsRemaining: 0,
    streakDays: nextStreak,
    nextBonusMultiplier,
    lastClaimedAt: lastClaim.claimed_at,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/loot/daily/status
 * Checks if user/guest is eligible for daily crate (cooldown 24h from last claim, or instant for first-time visitors).
 * Returns { eligible: boolean, secondsRemaining: number, streakDays: number, nextBonusMultiplier: number, lastClaimedAt: string | null }
 */
router.get('/daily/status', (req: Request, res: Response) => {
  try {
    const { userId, isAuthenticated, user } = resolveUserOrGuest(req);
    const status = computeEligibility(userId);

    res.json({
      success: true,
      data: {
        ...status,
        userId,
        isAuthenticated,
        userLevel: user?.level || 1,
        userTier: user?.tier_title || 'Novice Plug',
      },
    });
  } catch (err: any) {
    console.error('Error fetching loot crate status:', err);
    res.status(500).json({ success: false, error: 'Failed to check loot crate eligibility.' });
  }
});

/**
 * POST /api/loot/daily/open
 * Opens the daily loot crate with weighted drop table:
 *  * 40% Common: +150 to +350 XP + $0.50 cash credit
 *  * 30% Rare: +500 XP + $2.00 cash credit + 2x Golden Hour XP multiplier (active 1 hour)
 *  * 20% Epic: +1,000 XP + $5.00 cash credit + Exclusive Rare Sigil Component
 *  * 10% Legendary Mythic: +2,500 XP + $10.00 cash credit + 3x Golden Hour Multiplier + Mythic Gold Bullion Aura
 * Updates user's balance and XP in database, records claim, returns full drop metadata.
 */
router.post('/daily/open', (req: Request, res: Response) => {
  try {
    const { userId, isAuthenticated, user } = resolveUserOrGuest(req);
    const eligibility = computeEligibility(userId);

    if (!eligibility.eligible) {
      const hoursLeft = (eligibility.secondsRemaining / 3600).toFixed(1);
      res.status(429).json({
        success: false,
        error: `Daily Loot Crate on cooldown: ${hoursLeft}h remaining (${eligibility.secondsRemaining}s). Come back tomorrow!`,
        data: {
          eligible: false,
          secondsRemaining: eligibility.secondsRemaining,
          streakDays: eligibility.streakDays,
          nextBonusMultiplier: eligibility.nextBonusMultiplier,
          lastClaimedAt: eligibility.lastClaimedAt,
        },
      });
      return;
    }

    const streakDays = eligibility.streakDays;
    const streakMultiplier = eligibility.nextBonusMultiplier;

    // ── Weighted Drop Table Roll (0.0 to 100.0) ──
    const roll = Math.random() * 100;
    const now = new Date();
    const nowIso = now.toISOString();
    const todayStr = nowIso.substring(0, 10);
    const claimId = `claim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    let rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' = 'Common';
    let baseXp = 250;
    let cashCreditCents = 50; // $0.50
    let multiplierAwarded: number | null = null;
    let multiplierDurationHours: number | null = null;
    let sigilUnlocked: string | null = null;
    let sigilName: string | null = null;
    let rewardType = 'common_crate';
    let rewardValue = '';
    let rewardDescription = '';
    let perks: string[] = [];
    let badgeAccent = '#38ef7d';

    if (roll < 40) {
      // 40% Common: +150 to +350 XP + $0.50 cash credit
      rarity = 'Common';
      baseXp = Math.floor(Math.random() * (350 - 150 + 1)) + 150;
      cashCreditCents = 50; // $0.50
      rewardType = 'common_crate';
      badgeAccent = '#38ef7d';
      perks = [
        `+${baseXp} Base XP (${streakMultiplier}× Streak applied)`,
        '$0.50 Direct Bank Credit',
        'Standard Daily Creator Energy',
      ];
    } else if (roll < 70) {
      // 30% Rare: +500 XP + $2.00 cash credit + 2x Golden Hour XP multiplier (active 1 hour)
      rarity = 'Rare';
      baseXp = 500;
      cashCreditCents = 200; // $2.00
      multiplierAwarded = 2.0;
      multiplierDurationHours = 1;
      rewardType = 'rare_crate';
      badgeAccent = '#38bdf8';
      perks = [
        `+${baseXp} High-Velocity XP (${streakMultiplier}× Streak applied)`,
        '$2.00 Instant Cash Credit',
        '⚡ 2× Golden Hour XP Multiplier (1 Hour Active)',
      ];
    } else if (roll < 90) {
      // 20% Epic: +1,000 XP + $5.00 cash credit + Exclusive Rare Sigil Component
      rarity = 'Epic';
      baseXp = 1000;
      cashCreditCents = 500; // $5.00
      const epicSigils = [
        { id: 'glyph_octagram', name: 'Celestial Octagram Core' },
        { id: 'glyph_flower_of_life', name: 'Flower of Life Sacred Matrix' },
        { id: 'ring_particle_flux', name: 'Particle Flux Stream Orbital' },
        { id: 'ring_hex_shield_grid', name: 'Honeycomb Aegis Barrier' },
        { id: 'aura_quantum_ice', name: 'Glacial Quantum Frost Aura' },
        { id: 'crest_halo_ascendance', name: 'Ascendant Tri-Halo Crest' },
      ];
      const pickedSigil = epicSigils[Math.floor(Math.random() * epicSigils.length)];
      sigilUnlocked = pickedSigil.id;
      sigilName = pickedSigil.name;
      rewardType = 'epic_crate';
      badgeAccent = '#c084fc';
      perks = [
        `+${baseXp} Stacker XP (${streakMultiplier}× Streak applied)`,
        '$5.00 Direct Cash Credit',
        `🔮 Exclusive Sigil Component: ${pickedSigil.name}`,
      ];
    } else {
      // 10% Legendary Mythic: +2,500 XP + $10.00 cash credit + 3x Golden Hour Multiplier + Mythic Gold Bullion Aura
      rarity = 'Legendary';
      baseXp = 2500;
      cashCreditCents = 1000; // $10.00
      multiplierAwarded = 3.0;
      multiplierDurationHours = 1;
      sigilUnlocked = 'aura_primordial_gold';
      sigilName = 'Primordia Molten Gold Bullion Aura';
      rewardType = 'legendary_crate';
      badgeAccent = '#ffd700';
      perks = [
        `+${baseXp} Sovereign XP (${streakMultiplier}× Streak applied)`,
        '$10.00 Sovereign Cash Credit',
        '⚡ 3× Golden Hour XP Multiplier (1 Hour Active)',
        '👑 Mythic 24K Gold Bullion Aura Shader',
      ];
    }

    const totalXpEarned = Math.round(baseXp * streakMultiplier);
    rewardValue = `+${totalXpEarned} XP, $${(cashCreditCents / 100).toFixed(2)} USD${multiplierAwarded ? `, ${multiplierAwarded}x Boost` : ''}${sigilUnlocked ? `, Sigil: ${sigilUnlocked}` : ''}`;
    rewardDescription = `${rarity} Daily Mystery Crate: +${totalXpEarned} XP + $${(cashCreditCents / 100).toFixed(2)} Cash${multiplierAwarded ? ` + ${multiplierAwarded}x Golden Hour Boost` : ''}${sigilName ? ` + ${sigilName}` : ''}`;

    let newTotalXp = totalXpEarned;
    let newLevel = 1;
    let newTier = 'Novice Plug';

    runInTransaction(() => {
      // 1. Record Claim in daily_loot_claims
      db.prepare(`
        INSERT INTO daily_loot_claims (id, user_id, reward_type, reward_value, reward_description, streak_days, claimed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(claimId, userId, rewardType, rewardValue, rewardDescription, streakDays, nowIso);

      // 2. If authenticated user, update balance, XP, level, transactions, surge events, and sigil inventory
      if (isAuthenticated && user) {
        // Fetch latest XP from DB
        const currentUser = db.prepare('SELECT xp, level, tier_title FROM users WHERE id = ?').get(userId) as any;
        newTotalXp = (Number(currentUser?.xp) || 0) + totalXpEarned;
        const levelData = computeLevelAndTier(newTotalXp);
        newLevel = levelData.level;
        newTier = levelData.tier_title;

        // Update user XP, level, tier_title, and streak_days
        db.prepare(`
          UPDATE users 
          SET xp = ?, level = ?, tier_title = ?, streak_days = ?, updated_at = ?
          WHERE id = ?
        `).run(newTotalXp, newLevel, newTier, streakDays, nowIso, userId);

        // Credit cash reward to bank/checking account
        if (cashCreditCents > 0) {
          const bankAccount = db.prepare(`
            SELECT id FROM accounts WHERE user_id = ? AND type = 'bank' LIMIT 1
          `).get(userId) as any;

          const targetAccountId = bankAccount?.id || `acc_${userId}_checking`;

          // If account exists in accounts table, update balance
          db.prepare(`
            UPDATE accounts 
            SET balance_cents = balance_cents + ?, updated_at = ?
            WHERE user_id = ? AND id = ?
          `).run(cashCreditCents, nowIso, userId, targetAccountId);

          // Record reward transaction
          const txId = `tx_loot_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          try {
            db.prepare(`
              INSERT INTO transactions (id, user_id, account_id, category, type, amount_cents, description, date, is_recurring, created_at)
              VALUES (?, ?, ?, 'Daily Loot Reward', 'reward', ?, ?, ?, 0, ?)
            `).run(txId, userId, targetAccountId, cashCreditCents, `Daily Mystery Crate: ${rarity} Drop ($${(cashCreditCents / 100).toFixed(2)})`, todayStr, nowIso);
          } catch {}
        }

        // Apply Golden Hour Surge Multiplier (if awarded)
        if (multiplierAwarded && multiplierDurationHours) {
          const surgeId = `surge_loot_${Date.now()}`;
          const expiresAt = new Date(now.getTime() + multiplierDurationHours * 60 * 60 * 1000).toISOString();
          try {
            db.prepare(`
              INSERT INTO viral_surge_events (id, user_id, surge_type, multiplier, started_at, expires_at, is_active, created_at)
              VALUES (?, ?, 'velocity_spike', ?, ?, ?, 1, ?)
            `).run(surgeId, userId, multiplierAwarded, nowIso, expiresAt, nowIso);
          } catch {}
        }

        // Grant Rare/Mythic Sigil Component to Inventory (if awarded)
        if (sigilUnlocked) {
          try {
            const invId = `inv_${userId}_${sigilUnlocked}`;
            db.prepare(`
              INSERT OR IGNORE INTO user_sigil_inventory (id, user_id, item_id, is_equipped, purchased_at)
              VALUES (?, ?, ?, 0, ?)
            `).run(invId, userId, sigilUnlocked, nowIso);
          } catch {}
        }

        // Audit Log
        recordAuditLog(userId, 'DAILY_MYSTERY_LOOT_OPENED', 'daily_loot_claims', claimId, {
          rarity,
          baseXp,
          totalXpEarned,
          cashCreditCents,
          streakDays,
          multiplierAwarded,
          sigilUnlocked,
        });
      }
    });

    res.json({
      success: true,
      message: `🎉 ${rarity.toUpperCase()} Daily Mystery Loot Crate Opened! +${totalXpEarned} XP & $${(cashCreditCents / 100).toFixed(2)} added!`,
      data: {
        claimId,
        rarity,
        badgeAccent,
        baseXp,
        xpEarned: totalXpEarned,
        cashCredit: cashCreditCents / 100,
        cashCreditCents,
        cashCreditFormatted: `$${(cashCreditCents / 100).toFixed(2)}`,
        rewardType,
        rewardDescription,
        perks,
        sigilUnlocked,
        sigilName,
        multiplierAwarded,
        multiplierDurationHours,
        streakDays,
        nextBonusMultiplier: Number((1.0 + streakDays * 0.05).toFixed(2)),
        totalXp: newTotalXp,
        newLevel,
        newTier,
        claimedAt: nowIso,
        isGuest: !isAuthenticated,
      },
    });
  } catch (err: any) {
    console.error('Error opening daily loot crate:', err);
    res.status(500).json({ success: false, error: 'Failed to open daily loot crate.' });
  }
});

/**
 * GET /api/loot/drop-rates
 * Returns weighted drop rates and reward specs
 */
router.get('/drop-rates', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        rarity: 'Common',
        chancePct: 40,
        color: '#38ef7d',
        rewards: '+150 to +350 XP + $0.50 Direct Bank Credit',
        perks: ['Standard Daily Energy Cache', '$0.50 Instant Cash Credit', 'Daily Streak Multiplier Eligible'],
      },
      {
        rarity: 'Rare',
        chancePct: 30,
        color: '#38bdf8',
        rewards: '+500 XP + $2.00 Cash Credit + 2× Golden Hour Multiplier',
        perks: ['+500 High-Velocity XP', '$2.00 Instant Cash Credit', '⚡ 2× Golden Hour XP Multiplier (1h Active)'],
      },
      {
        rarity: 'Epic',
        chancePct: 20,
        color: '#c084fc',
        rewards: '+1,000 XP + $5.00 Cash Credit + Exclusive Rare Sigil Component',
        perks: ['+1,000 Epic Stacker XP', '$5.00 Instant Cash Credit', '🔮 Exclusive Rare Sigil Component Unlocked'],
      },
      {
        rarity: 'Legendary',
        chancePct: 10,
        color: '#ffd700',
        rewards: '+2,500 XP + $10.00 Cash Credit + 3× Golden Hour + Mythic Gold Bullion Aura',
        perks: ['+2,500 Sovereign Supreme XP', '$10.00 Instant Cash Credit', '⚡ 3× Golden Hour Multiplier (1h Active)', '👑 Mythic 24K Gold Bullion Aura Shader'],
      },
    ],
  });
});

/**
 * GET /api/loot/history
 * Returns user's recent loot crate claim logs
 */
router.get('/history', (req: Request, res: Response) => {
  try {
    const { userId } = resolveUserOrGuest(req);
    const claims = db.prepare(`
      SELECT * FROM daily_loot_claims 
      WHERE user_id = ? 
      ORDER BY claimed_at DESC 
      LIMIT 20
    `).all(userId) as any[];

    res.json({
      success: true,
      data: claims,
    });
  } catch (err: any) {
    console.error('Error fetching loot history:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch loot history.' });
  }
});

export default router;
