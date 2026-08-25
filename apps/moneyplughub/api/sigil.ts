import { Request, Response } from 'express';
import { db, runInTransaction } from '../../src/backend/db.js';
import crypto from 'crypto';
import {
  computeWealthPulse,
  getVaultTierFromXP,
  getSigilGlowLevel,
  getAscensionTier,
  computeConstellationEnergy,
} from './wealthPulse.js';

export interface BuyPointsRequestBody {
  packId: 'starter' | 'alchemist' | 'archon' | 'sovereign' | string;
}

const XP_PACKS: Record<string, { name: string; xp: number; priceUsd: number }> = {
  starter: { name: 'Starter Sigil Cache', xp: 1000, priceUsd: 9.99 },
  alchemist: { name: 'Alchemist Sigil Forge', xp: 3500, priceUsd: 24.99 },
  archon: { name: 'Archon Power Matrix', xp: 10000, priceUsd: 59.99 },
  sovereign: { name: 'Sovereign Celestial Vault', xp: 25000, priceUsd: 129.99 },
};

/**
 * POST /api/sigil/points/buy
 * Handles XP / Sigil Points purchasing with full reactive cosmic updates.
 */
export async function buyPoints(req: Request, res: Response): Promise<void> {
  try {
    const { packId = 'starter' } = req.body as BuyPointsRequestBody;
    const pack = XP_PACKS[packId] || XP_PACKS.starter;

    // Resolve user ID
    let userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      const firstUser: any = db.prepare('SELECT id, subscriptionTier, subscriptionActive, xp, level, streak_days, referral_count, tier_title, role FROM users ORDER BY created_at ASC LIMIT 1').get();
      userId = firstUser?.id;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    const user: any = db.prepare('SELECT id, subscriptionTier, subscriptionActive, xp, level, streak_days, referral_count, tier_title, role FROM users WHERE id = ?').get(userId);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND' });
      return;
    }

    // Strict Paywall Enforcement
    const subTier = (user.subscriptionTier || 'FREE').toUpperCase();
    const isActive = Number(user.subscriptionActive || 0) === 1 || user.role === 'admin';

    if (subTier === 'FREE' && !isActive) {
      res.status(403).json({
        error: 'PAYWALL_REQUIRED',
        message: 'Direct XP & Sigil Points injection is exclusively unlocked for Creator Plan members.',
      });
      return;
    }

    const currentXp = Number(user.xp || 0);
    const newXp = currentXp + pack.xp;
    const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);

    // 1. Wealth Pulse Calculation
    const refCount = Number(user.referral_count || 0);
    const arrVelocity = Math.max(0.05, refCount * 0.05 + 0.05);
    const streakMultiplier = 1 + (Number(user.streak_days || 1) * 0.1);
    const vaultStability = 1.25;
    const wealthPulse = computeWealthPulse({
      arrVelocity,
      streakMultiplier,
      xp: newXp,
      vaultStability,
    });

    // 2. Vault Shader Morph
    const vaultTier = getVaultTierFromXP(newXp);

    // 3. Sigil Glow Intensification
    const sigilGlow = getSigilGlowLevel(wealthPulse);

    // 4. Tier Ascension Ladder
    const currentAscensionTier = getAscensionTier(currentXp);
    const ascensionTier = getAscensionTier(newXp);
    const previousTierLevel = currentAscensionTier.level;
    const ascended = ascensionTier.level > previousTierLevel;

    // 5. Constellation Energy Calculation
    const annualArr = Math.max(120, (refCount || 1) * 120);
    const activeStars = Math.max(1, refCount || 3);
    const constellationEnergy = computeConstellationEnergy({
      activeStars,
      arr: annualArr,
    });

    const now = new Date().toISOString();
    const transactionId = `tx_xp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Execute SQLite ACID Transaction
    runInTransaction(() => {
      // 1. Inject XP into user vault
      db.prepare(`
        UPDATE users 
        SET xp = ?, 
            level = ?, 
            tier_title = ?, 
            updated_at = ?
        WHERE id = ?
      `).run(newXp, newLevel, ascensionTier.name, now, userId);

      // 2. Log in transactions table
      try {
        db.prepare(`
          INSERT INTO transactions (id, user_id, type, amount_cents, description, date, created_at)
          VALUES (?, ?, 'expense', ?, ?, ?, ?)
        `).run(
          transactionId,
          userId,
          Math.round(pack.priceUsd * 100),
          `Purchased ${pack.name} (+${pack.xp.toLocaleString()} XP)`,
          now.substring(0, 10),
          now
        );
      } catch (e) {
        try {
          db.prepare(`
            INSERT INTO transactions (id, userId, type, amount, description, createdAt)
            VALUES (?, ?, 'points_purchase', ?, ?, ?)
          `).run(transactionId, userId, pack.priceUsd, `Purchased ${pack.name} (+${pack.xp.toLocaleString()} XP)`, now);
        } catch (e2) {}
      }
    });

    res.status(200).json({
      status: 'SUCCESS',
      success: true,
      packId,
      packName: pack.name,
      xpAdded: pack.xp,
      newXP: newXp,
      newLevel,
      tier: ascensionTier.level,
      tierName: ascensionTier.name,
      ascended,
      vaultShader: vaultTier.shader,
      wealthPulse,
      sigilGlow,
      constellationEnergy,
      transactionId,
    });
  } catch (error: any) {
    console.error('Error in buyPoints API:', error);
    res.status(500).json({ error: 'INTERNAL_SIGIL_ERROR', message: error.message });
  }
}

export default buyPoints;
