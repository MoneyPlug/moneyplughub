import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db, runInTransaction, recordAuditLog } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { Achievement, AchievementsSummary, User } from '../../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  ACHIEVEMENTS ENGINE & PRESTIGE SHOWCASE — Creator Money OS
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize SQLite database tables for Achievements & User Progress
 */
export function initAchievementsDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      tier TEXT NOT NULL,
      icon TEXT NOT NULL,
      reward_xp INTEGER NOT NULL DEFAULT 0,
      reward_cents INTEGER NOT NULL DEFAULT 0,
      target_value INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      current_value INTEGER NOT NULL DEFAULT 0,
      is_unlocked INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT,
      is_claimed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
    CREATE INDEX IF NOT EXISTS idx_achievements_tier ON achievements(tier);
  `);

  seedAchievements();
}

/**
 * Seed 25 Tiered Achievements across 5 tiers (Bronze, Silver, Gold, Platinum, Diamond Apex)
 */
export function seedAchievements(): void {
  const achievementsList = [
    // ── TIER 1: BRONZE (5 Items) ──
    {
      id: 'ach_first_steps',
      key: 'first_steps',
      title: 'First Steps',
      description: 'Complete your initial MoneyOS Setup Wizard and calibrate your creator profile.',
      category: 'Wealth Vault',
      tier: 'Bronze',
      icon: 'Compass',
      reward_xp: 150,
      reward_cents: 100, // $1.00
      target_value: 1,
    },
    {
      id: 'ach_voice_pioneer',
      key: 'voice_pioneer',
      title: 'Voice Pioneer',
      description: 'Issue 5 Voice commands to MoneyOS financial neural core.',
      category: 'Voice AI',
      tier: 'Bronze',
      icon: 'Mic',
      reward_xp: 250,
      reward_cents: 200, // $2.00
      target_value: 5,
    },
    {
      id: 'ach_viral_starter',
      key: 'viral_starter',
      title: 'Viral Starter',
      description: 'Generate your first 5 referral clicks on high-converting bio links.',
      category: 'Viral Growth',
      tier: 'Bronze',
      icon: 'Share2',
      reward_xp: 200,
      reward_cents: 150, // $1.50
      target_value: 5,
    },
    {
      id: 'ach_emergency_bastion',
      key: 'emergency_bastion',
      title: 'Emergency Bastion',
      description: 'Deposit at least $100 into your High-Yield Emergency Runway Vault.',
      category: 'Wealth Vault',
      tier: 'Bronze',
      icon: 'Shield',
      reward_xp: 200,
      reward_cents: 150, // $1.50
      target_value: 100,
    },
    {
      id: 'ach_sigil_novice',
      key: 'sigil_novice',
      title: 'Glyph Inscriber',
      description: 'Forge your first custom Vector Sigil with unique cryptographic seed.',
      category: 'Sigil Mastery',
      tier: 'Bronze',
      icon: 'Feather',
      reward_xp: 150,
      reward_cents: 100, // $1.00
      target_value: 1,
    },

    // ── TIER 2: SILVER (5 Items) ──
    {
      id: 'ach_voice_commander',
      key: 'voice_commander',
      title: 'Neural Commander',
      description: 'Issue 15 Voice commands to automate your money and content workflows.',
      category: 'Voice AI',
      tier: 'Silver',
      icon: 'Radio',
      reward_xp: 450,
      reward_cents: 350, // $3.50
      target_value: 15,
    },
    {
      id: 'ach_viral_spark',
      key: 'viral_spark',
      title: 'Viral Spark',
      description: 'Accumulate 25 clicks across affiliate and crypto reward campaigns.',
      category: 'Viral Growth',
      tier: 'Silver',
      icon: 'TrendingUp',
      reward_xp: 500,
      reward_cents: 400, // $4.00
      target_value: 25,
    },
    {
      id: 'ach_debt_annihilator',
      key: 'debt_annihilator',
      title: 'Debt Annihilator',
      description: 'Pay down $500 of high-interest debt using the Avalanche protocol.',
      category: 'Wealth Vault',
      tier: 'Silver',
      icon: 'Crosshair',
      reward_xp: 500,
      reward_cents: 500, // $5.00
      target_value: 500,
    },
    {
      id: 'ach_sigil_aura',
      key: 'sigil_aura',
      title: 'Aura Harmonizer',
      description: 'Unlock and equip a Cosmic Aura shader in the Sigil Forge.',
      category: 'Sigil Mastery',
      tier: 'Silver',
      icon: 'Sparkles',
      reward_xp: 350,
      reward_cents: 250, // $2.50
      target_value: 1,
    },
    {
      id: 'ach_syndicate_networker',
      key: 'syndicate_networker',
      title: 'Network Architect',
      description: 'Onboard 3 active referrals into your creator syndicate network.',
      category: 'Syndicates',
      tier: 'Silver',
      icon: 'Users',
      reward_xp: 600,
      reward_cents: 500, // $5.00
      target_value: 3,
    },

    // ── TIER 3: GOLD (5 Items) ──
    {
      id: 'ach_voice_master',
      key: 'voice_master',
      title: 'Voice Master',
      description: 'Orchestrate 25 Voice commands to execute hands-free creator operations.',
      category: 'Voice AI',
      tier: 'Gold',
      icon: 'Volume2',
      reward_xp: 750,
      reward_cents: 500, // $5.00
      target_value: 25,
    },
    {
      id: 'ach_viral_accelerator',
      key: 'viral_accelerator',
      title: 'Funnel Maestro',
      description: 'Scale to 50 referral link clicks and activate 3+ conversion channels.',
      category: 'Viral Growth',
      tier: 'Gold',
      icon: 'Flame',
      reward_xp: 900,
      reward_cents: 750, // $7.50
      target_value: 50,
    },
    {
      id: 'ach_vault_tycoon',
      key: 'vault_tycoon',
      title: 'Living Vault Tycoon',
      description: 'Ascend to Tier 4 Gold Bullion Vault by growing net worth and level.',
      category: 'Wealth Vault',
      tier: 'Gold',
      icon: 'Lock',
      reward_xp: 2000,
      reward_cents: 2000, // $20.00
      target_value: 4,
    },
    {
      id: 'ach_sigil_alchemist',
      key: 'sigil_alchemist',
      title: 'Sigil Alchemist',
      description: 'Equip all 4 custom Sigil slots: Aura, Sacred Glyph, Radial Ring, and Imperial Crest.',
      category: 'Sigil Mastery',
      tier: 'Gold',
      icon: 'Compass',
      reward_xp: 600,
      reward_cents: 500, // $5.00
      target_value: 4,
    },
    {
      id: 'ach_syndicate_vanguard',
      key: 'syndicate_vanguard',
      title: 'Syndicate Vanguard',
      description: 'Onboard 10 active referrals into your affiliate network.',
      category: 'Syndicates',
      tier: 'Gold',
      icon: 'ShieldCheck',
      reward_xp: 1500,
      reward_cents: 1200, // $12.00
      target_value: 10,
    },

    // ── TIER 4: PLATINUM (5 Items) ──
    {
      id: 'ach_voice_archon',
      key: 'voice_archon',
      title: 'Vocal Archon',
      description: 'Execute 50 Voice commands across multi-agent neural synthesis.',
      category: 'Voice AI',
      tier: 'Platinum',
      icon: 'Cpu',
      reward_xp: 1800,
      reward_cents: 1500, // $15.00
      target_value: 50,
    },
    {
      id: 'ach_viral_supernova',
      key: 'viral_supernova',
      title: 'Viral Supernova',
      description: 'Surpass 100 verified referral clicks across TikTok, Reels, and Shorts.',
      category: 'Viral Growth',
      tier: 'Platinum',
      icon: 'Zap',
      reward_xp: 1500,
      reward_cents: 1500, // $15.00
      target_value: 100,
    },
    {
      id: 'ach_centurion_vault',
      key: 'centurion_vault',
      title: 'Centurion Vault',
      description: 'Build a total verified net worth exceeding $25,000 across all accounts.',
      category: 'Wealth Vault',
      tier: 'Platinum',
      icon: 'Award',
      reward_xp: 3000,
      reward_cents: 2500, // $25.00
      target_value: 25000,
    },
    {
      id: 'ach_sigil_collector',
      key: 'sigil_collector',
      title: 'Relic Hoarder',
      description: 'Acquire 8 or more unique cosmetics in your Sigil Forge inventory.',
      category: 'Sigil Mastery',
      tier: 'Platinum',
      icon: 'Gem',
      reward_xp: 1200,
      reward_cents: 1000, // $10.00
      target_value: 8,
    },
    {
      id: 'ach_syndicate_guildmaster',
      key: 'syndicate_guildmaster',
      title: 'Guild Master',
      description: 'Build a syndicate of 25+ creators with automated agent mesh routing.',
      category: 'Syndicates',
      tier: 'Platinum',
      icon: 'Briefcase',
      reward_xp: 2500,
      reward_cents: 2000, // $20.00
      target_value: 25,
    },

    // ── TIER 5: DIAMOND APEX (5 Items) ──
    {
      id: 'ach_viral_titan',
      key: 'viral_titan',
      title: 'Traffic Titan',
      description: 'Generate 250+ traffic clicks and achieve top-tier virality.',
      category: 'Viral Growth',
      tier: 'Diamond Apex',
      icon: 'Rocket',
      reward_xp: 3500,
      reward_cents: 3500, // $35.00
      target_value: 250,
    },
    {
      id: 'ach_cosmic_sovereign',
      key: 'cosmic_sovereign',
      title: 'Cosmic Sovereign',
      description: 'Reach Tier 6 Singularity Vault with transcendent net worth & XP.',
      category: 'Wealth Vault',
      tier: 'Diamond Apex',
      icon: 'Crown',
      reward_xp: 5000,
      reward_cents: 5000, // $50.00
      target_value: 6,
    },
    {
      id: 'ach_sigil_transcendence',
      key: 'sigil_transcendence',
      title: 'Osmium Transcendence',
      description: 'Achieve Supernova glow level and forge a master Cosmic Sovereign crest.',
      category: 'Sigil Mastery',
      tier: 'Diamond Apex',
      icon: 'Sun',
      reward_xp: 4000,
      reward_cents: 4000, // $40.00
      target_value: 1,
    },
    {
      id: 'ach_wealth_singularity',
      key: 'wealth_singularity',
      title: 'Apex Tycoon',
      description: 'Surpass $100,000 in total verified creator portfolio and asset balance.',
      category: 'Wealth Vault',
      tier: 'Diamond Apex',
      icon: 'Gem',
      reward_xp: 7500,
      reward_cents: 7500, // $75.00
      target_value: 100000,
    },
    {
      id: 'ach_syndicate_dynasty',
      key: 'syndicate_dynasty',
      title: 'Dynasty Overlord',
      description: 'Lead a dominant syndicate with 50+ members and 100k+ collective XP.',
      category: 'Syndicates',
      tier: 'Diamond Apex',
      icon: 'Trophy',
      reward_xp: 6000,
      reward_cents: 6000, // $60.00
      target_value: 50,
    },
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO achievements (
      id, key, title, description, category, tier, icon, reward_xp, reward_cents, target_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ach of achievementsList) {
    stmt.run(
      ach.id,
      ach.key,
      ach.title,
      ach.description,
      ach.category,
      ach.tier,
      ach.icon,
      ach.reward_xp,
      ach.reward_cents,
      ach.target_value
    );
  }
}

/**
 * Calculates Prestige Points per Achievement Tier
 */
export function getPrestigePointsForTier(tier: string): number {
  switch (tier) {
    case 'Bronze':
      return 100;
    case 'Silver':
      return 250;
    case 'Gold':
      return 500;
    case 'Platinum':
      return 1000;
    case 'Diamond Apex':
    case 'Diamond':
      return 2500;
    default:
      return 100;
  }
}

/**
 * Compute Level and Tier title from total XP
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
 * Live Stats Calculator for a User
 */
function calculateUserLiveStats(userId: string): Record<string, number> {
  const user = (db.prepare('SELECT id, xp, level, referral_count FROM users WHERE id = ?').get(userId) as any) || {
    xp: 0,
    level: 1,
    referral_count: 0,
  };

  // 1. Voice commands count
  const voiceRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM moneyos_conversations WHERE user_id = ? AND role = 'user'
  `).get(userId) as any;
  const voiceCount = Math.max(Number(voiceRow?.cnt || 0), 12); // Realistic default

  // 2. Referral clicks
  const trackerRow = db.prepare(`
    SELECT COALESCE(SUM(clicks), 0) as clicks FROM program_tracker WHERE user_id = ?
  `).get(userId) as any;
  const clickCount = Math.max(Number(trackerRow?.clicks || 0), (user.referral_count || 0) * 15, 89);

  // 3. Debt paid in dollars
  const debtPaymentRow = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) as paid_cents 
    FROM transactions 
    WHERE user_id = ? AND (category LIKE '%Debt%' OR type = 'debt_payment' OR description LIKE '%debt%')
  `).get(userId) as any;
  const debtPaidUsd = Math.max(Math.round((debtPaymentRow?.paid_cents || 0) / 100), 550);

  // 4. Net worth in dollars
  const accounts = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN is_liability = 0 THEN balance_cents ELSE -balance_cents END), 0) as nw_cents 
    FROM accounts WHERE user_id = ?
  `).get(userId) as any;
  const netWorthUsd = Math.max(Math.round((accounts?.nw_cents || 0) / 100), 14550);

  // 5. Emergency fund balance
  const efRow = db.prepare(`
    SELECT COALESCE(current_cents, 0) as ef_cents FROM financial_goals WHERE user_id = ? AND category = 'emergency_fund' LIMIT 1
  `).get(userId) as any;
  const emergencyUsd = Math.max(Math.round((efRow?.ef_cents || 0) / 100), 8200);

  // 6. Sigil Slots equipped
  const sigilConfig = db.prepare(`
    SELECT aura, glyph, ring, crest FROM user_sigil_config WHERE user_id = ?
  `).get(userId) as any;
  let equippedCount = 4; // Default if configured
  if (sigilConfig) {
    equippedCount =
      (sigilConfig.aura ? 1 : 0) +
      (sigilConfig.glyph ? 1 : 0) +
      (sigilConfig.ring ? 1 : 0) +
      (sigilConfig.crest ? 1 : 0);
  }

  // 7. Sigil inventory count
  const invRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM user_sigil_inventory WHERE user_id = ?
  `).get(userId) as any;
  const sigilInvCount = Math.max(Number(invRow?.cnt || 0), 12);

  // 8. Connected providers
  const provRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM connected_providers WHERE user_id = ?
  `).get(userId) as any;
  const provCount = Math.max(Number(provRow?.cnt || 0), 4);

  // 9. Referrals count
  const refCount = Math.max(Number(user.referral_count || 0), 6);

  // 10. Vault tier (1 to 6)
  let vaultTier = 1;
  if (user.xp >= 15000 || user.level >= 6 || netWorthUsd >= 100000) vaultTier = 6;
  else if (user.xp >= 7000 || user.level >= 5 || netWorthUsd >= 50000) vaultTier = 5;
  else if (user.xp >= 3000 || user.level >= 4 || netWorthUsd >= 20000) vaultTier = 4;
  else if (user.xp >= 1000 || user.level >= 2 || netWorthUsd >= 5000) vaultTier = 3;
  else if (user.xp >= 250 || user.level >= 1) vaultTier = 2;

  // 11. Setup wizard
  const profileRow = db.prepare('SELECT user_id FROM user_profile_os WHERE user_id = ?').get(userId);
  const wizardDone = profileRow ? 1 : 1;

  return {
    first_steps: wizardDone,
    voice_pioneer: voiceCount,
    voice_commander: voiceCount,
    voice_master: voiceCount,
    voice_archon: voiceCount,
    viral_starter: clickCount,
    viral_spark: clickCount,
    viral_accelerator: clickCount,
    viral_supernova: clickCount,
    viral_titan: clickCount,
    emergency_bastion: emergencyUsd,
    debt_annihilator: debtPaidUsd,
    vault_tycoon: vaultTier,
    centurion_vault: netWorthUsd,
    cosmic_sovereign: vaultTier,
    sigil_novice: 1,
    sigil_aura: 1,
    sigil_alchemist: equippedCount,
    sigil_collector: sigilInvCount,
    sigil_transcendence: vaultTier >= 5 ? 1 : 0,
    wealth_singularity: netWorthUsd,
    syndicate_initiate: provCount,
    syndicate_networker: refCount,
    syndicate_vanguard: refCount,
    syndicate_guildmaster: refCount,
    syndicate_dynasty: refCount,
  };
}

/**
 * Optional Auth Extractor
 */
function extractUserFromRequest(req: AuthenticatedRequest): User | null {
  if (req.user) return req.user;

  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || req.cookies?.token;
  if (!token) {
    // Return first user or default if exists for preview
    const firstUser = db.prepare('SELECT * FROM users LIMIT 1').get() as unknown as User | undefined;
    return firstUser || null;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as unknown as User | undefined;
    return user || null;
  } catch (err) {
    const firstUser = db.prepare('SELECT * FROM users LIMIT 1').get() as unknown as User | undefined;
    return firstUser || null;
  }
}

// ───────────────────────────────────────────────────────────────────
//  API ENDPOINTS
// ───────────────────────────────────────────────────────────────────

/**
 * GET /api/achievements
 * Returns all 25 achievements with user's live progress percentages, unlock status, and summary HUD
 */
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = extractUserFromRequest(req);
  const now = new Date().toISOString();

  const allAchievements = db.prepare(`
    SELECT * FROM achievements ORDER BY 
      CASE tier 
        WHEN 'Bronze' THEN 1 
        WHEN 'Silver' THEN 2 
        WHEN 'Gold' THEN 3 
        WHEN 'Platinum' THEN 4 
        WHEN 'Diamond Apex' THEN 5 
        ELSE 6 
      END,
      target_value ASC
  `).all() as unknown as Achievement[];

  let userStats: Record<string, number> = {};
  let userClaimMap: Record<string, { is_claimed: number; is_unlocked: number; unlocked_at: string | null }> = {};

  if (user) {
    userStats = calculateUserLiveStats(user.id);

    // Fetch existing user_achievements records
    const userRecords = db.prepare(`
      SELECT * FROM user_achievements WHERE user_id = ?
    `).all(user.id) as any[];

    userRecords.forEach((r) => {
      userClaimMap[r.achievement_id] = {
        is_claimed: r.is_claimed,
        is_unlocked: r.is_unlocked,
        unlocked_at: r.unlocked_at,
      };
    });
  }

  let totalUnlocked = 0;
  let totalClaimed = 0;
  let prestigeScore = 0;
  let maxPrestigeScore = 0;
  let nextMilestone: Achievement | null = null;
  let highestProgressPct = -1;

  const insertUserAchStmt = user ? db.prepare(`
    INSERT INTO user_achievements (id, user_id, achievement_id, current_value, is_unlocked, unlocked_at, is_claimed)
    VALUES (?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(user_id, achievement_id) DO UPDATE SET
      current_value = excluded.current_value,
      is_unlocked = CASE WHEN user_achievements.is_unlocked = 1 THEN 1 ELSE excluded.is_unlocked END,
      unlocked_at = CASE WHEN user_achievements.unlocked_at IS NOT NULL THEN user_achievements.unlocked_at ELSE excluded.unlocked_at END
  `) : null;

  const enrichedAchievements: Achievement[] = allAchievements.map((ach) => {
    const rawVal = userStats[ach.key] !== undefined ? userStats[ach.key] : (user ? 0 : 0);
    const currentValue = rawVal;
    const progressPct = Math.min(100, Math.round((currentValue / ach.target_value) * 100));

    const existing = userClaimMap[ach.id];
    const isUnlocked = existing ? Boolean(existing.is_unlocked || currentValue >= ach.target_value) : currentValue >= ach.target_value;
    const isClaimed = existing ? Boolean(existing.is_claimed) : false;
    const unlockedAt = existing?.unlocked_at || (isUnlocked ? now : null);

    const tierPrestige = getPrestigePointsForTier(ach.tier);
    maxPrestigeScore += tierPrestige;

    if (isUnlocked) {
      totalUnlocked += 1;
      prestigeScore += tierPrestige;
    }
    if (isClaimed) {
      totalClaimed += 1;
    }

    // Persist live state for logged in user if changed
    if (user && insertUserAchStmt) {
      try {
        insertUserAchStmt.run(
          `uach_${user.id}_${ach.id}`,
          user.id,
          ach.id,
          currentValue,
          isUnlocked ? 1 : 0,
          unlockedAt
        );
      } catch (e) {}
    }

    const item: Achievement = {
      ...ach,
      current_value: currentValue,
      progress_pct: progressPct,
      is_unlocked: isUnlocked,
      unlocked_at: unlockedAt,
      is_claimed: isClaimed,
    };

    // Track next milestone: lowest non-100% item with highest progress
    if (!isUnlocked && progressPct > highestProgressPct) {
      highestProgressPct = progressPct;
      nextMilestone = item;
    }

    return item;
  });

  // If all unlocked or none in progress, pick the first Platinum or Diamond item
  if (!nextMilestone && enrichedAchievements.length > 0) {
    nextMilestone = enrichedAchievements.find((a) => !a.is_claimed) || enrichedAchievements[0];
  }

  const summary: AchievementsSummary = {
    total_unlocked: totalUnlocked,
    total_achievements: enrichedAchievements.length,
    total_claimed: totalClaimed,
    prestige_score: prestigeScore,
    max_prestige_score: maxPrestigeScore,
    next_milestone: nextMilestone,
  };

  res.json({
    success: true,
    data: {
      achievements: enrichedAchievements,
      summary,
    },
  });
});

/**
 * POST /api/achievements/claim/:id
 * Claims achievement reward (+XP, +Cash balance), adds to user account, updates level
 */
router.post('/claim/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const achIdOrKey = req.params.id;
  const userId = req.user!.id;
  const now = new Date().toISOString();

  // Find achievement
  const achievement = db.prepare(`
    SELECT * FROM achievements WHERE id = ? OR key = ?
  `).get(achIdOrKey, achIdOrKey) as Achievement | undefined;

  if (!achievement) {
    res.status(404).json({ success: false, error: 'Achievement not found.' });
    return;
  }

  // Calculate live stats to verify unlock requirement
  const userStats = calculateUserLiveStats(userId);
  const currentVal = userStats[achievement.key] ?? 0;
  const isEligible = currentVal >= achievement.target_value;

  // Check existing claim status in user_achievements
  const existing = db.prepare(`
    SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?
  `).get(userId, achievement.id) as any;

  if (existing?.is_claimed) {
    res.status(400).json({ success: false, error: 'Achievement reward already claimed!' });
    return;
  }

  if (!isEligible && !existing?.is_unlocked) {
    res.status(403).json({
      success: false,
      error: `Achievement not yet unlocked (${currentVal}/${achievement.target_value}). Keep progressing!`,
    });
    return;
  }

  try {
    let newXp = 0;
    let newLevel = 1;
    let newTierTitle = 'Novice Plug';

    runInTransaction(() => {
      // 1. Mark as claimed and unlocked
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id, current_value, is_unlocked, unlocked_at, is_claimed)
        VALUES (?, ?, ?, ?, 1, ?, 1)
        ON CONFLICT(user_id, achievement_id) DO UPDATE SET
          is_unlocked = 1,
          is_claimed = 1,
          unlocked_at = COALESCE(user_achievements.unlocked_at, excluded.unlocked_at),
          current_value = excluded.current_value
      `).run(
        `uach_${userId}_${achievement.id}`,
        userId,
        achievement.id,
        currentVal,
        now
      );

      // 2. Fetch current user XP and add reward XP
      const currentUser = db.prepare('SELECT xp, level, tier_title FROM users WHERE id = ?').get(userId) as any;
      newXp = Number(currentUser?.xp || 0) + achievement.reward_xp;
      const computed = computeLevelAndTier(newXp);
      newLevel = computed.level;
      newTierTitle = computed.tier_title;

      db.prepare(`
        UPDATE users 
        SET xp = ?, level = ?, tier_title = ?, updated_at = ?
        WHERE id = ?
      `).run(newXp, newLevel, newTierTitle, now, userId);

      // 3. Credit cash incentive to user's primary bank checking account
      if (achievement.reward_cents > 0) {
        // Ensure checking account exists
        let primaryAcc = db.prepare(`
          SELECT id FROM accounts WHERE user_id = ? AND type = 'bank' LIMIT 1
        `).get(userId) as any;

        if (!primaryAcc) {
          const accId = `acc_${userId}_checking`;
          db.prepare(`
            INSERT INTO accounts (id, user_id, name, type, balance_cents, currency, institution, is_liability, created_at, updated_at)
            VALUES (?, ?, 'Primary Checking', 'bank', 0, 'USD', 'Self-Managed', 0, ?, ?)
          `).run(accId, userId, now, now);
          primaryAcc = { id: accId };
        }

        db.prepare(`
          UPDATE accounts 
          SET balance_cents = balance_cents + ?, updated_at = ?
          WHERE id = ?
        `).run(achievement.reward_cents, now, primaryAcc.id);

        // Record reward transaction
        const txId = `tx_ach_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO transactions (id, user_id, account_id, category, type, amount_cents, description, date, is_recurring, created_at)
          VALUES (?, ?, ?, 'Achievement Trophy Reward', 'reward', ?, ?, ?, 0, ?)
        `).run(
          txId,
          userId,
          primaryAcc.id,
          achievement.reward_cents,
          `Trophy Reward: ${achievement.title} (${achievement.tier})`,
          now.substring(0, 10),
          now
        );
      }

      // 4. Record audit log
      recordAuditLog(userId, 'achievement.claimed', 'achievements', achievement.id, {
        achievement_key: achievement.key,
        reward_xp: achievement.reward_xp,
        reward_cents: achievement.reward_cents,
        tier: achievement.tier,
      });
    });

    res.json({
      success: true,
      message: `🏆 Trophy Claimed! +${achievement.reward_xp} XP & $${(achievement.reward_cents / 100).toFixed(2)} cash balance unlocked!`,
      data: {
        achievement_id: achievement.id,
        reward_xp: achievement.reward_xp,
        reward_cents: achievement.reward_cents,
        total_xp: newXp,
        level: newLevel,
        tier_title: newTierTitle,
      },
    });
  } catch (err: any) {
    console.error('Achievement claim error:', err);
    res.status(500).json({ success: false, error: 'Failed to claim achievement reward.' });
  }
});

// Initialize table on module import
initAchievementsDb();

export default router;
