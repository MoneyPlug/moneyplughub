import { Router, Request, Response } from 'express';
import { db, runInTransaction } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { Syndicate, SyndicateMember, MySyndicateResponse, ApiResponse } from '../../types';

const router = Router();

/**
 * Ensure SQLite Schema Initialization for Creator Syndicates & Guild Wars
 */
export function initSyndicatesSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS syndicates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tag TEXT NOT NULL UNIQUE COLLATE NOCASE,
      emblem_sigil TEXT NOT NULL,
      description TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      total_net_worth_cents INTEGER NOT NULL DEFAULT 0,
      total_referrals INTEGER NOT NULL DEFAULT 0,
      weekly_score INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 1,
      member_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS syndicate_members (
      id TEXT PRIMARY KEY,
      syndicate_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('founder', 'officer', 'member')),
      contributed_xp INTEGER NOT NULL DEFAULT 0,
      joined_at TEXT NOT NULL,
      FOREIGN KEY (syndicate_id) REFERENCES syndicates(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_syndicates_score ON syndicates(weekly_score DESC);
    CREATE INDEX IF NOT EXISTS idx_syndicates_tag ON syndicates(tag);
    CREATE INDEX IF NOT EXISTS idx_syndicate_members_syndicate ON syndicate_members(syndicate_id);
    CREATE INDEX IF NOT EXISTS idx_syndicate_members_user ON syndicate_members(user_id);
  `);

  // Seed 4 Top Default Syndicates if missing
  const countResult = db.prepare('SELECT COUNT(*) as count FROM syndicates').get() as { count: number };
  if (!countResult || countResult.count === 0) {
    const defaultSyndicates = [
      {
        id: 'syn_vortex_cyber',
        name: '[VORTEX] Cyber Syndicate',
        tag: 'VRTX',
        emblem_sigil: 'CYBER-DRAGON',
        description: 'Elite cybernetic growth operators dominating cross-platform revenue networks, viral loops, and high-frequency affiliate automation.',
        creator_id: 'sys_vortex_creator',
        total_net_worth_cents: 485000000, // $4,850,000
        total_referrals: 1240,
        weekly_score: 142500,
        streak_days: 14,
        member_count: 84,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'syn_apex_sovereign',
        name: '[APEX] Sovereign Capital Guild',
        tag: 'APEX',
        emblem_sigil: 'SOVEREIGN-EMP',
        description: 'High-conviction sovereign wealth accumulators and automated cash flow builders compounding cold-storage reserves and digital capital.',
        creator_id: 'sys_apex_creator',
        total_net_worth_cents: 620000000, // $6,200,000
        total_referrals: 980,
        weekly_score: 118200,
        streak_days: 11,
        member_count: 62,
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
      {
        id: 'syn_pulse_tiktok',
        name: '[PULSE] TikTok Viral Growth Army',
        tag: 'PLSE',
        emblem_sigil: 'VIRAL-PULSE',
        description: 'Rapid distribution squad deploying short-form funnel architectures, algorithmic sound pairing, and affiliate conversion hooks daily.',
        creator_id: 'sys_pulse_creator',
        total_net_worth_cents: 290000000, // $2,900,000
        total_referrals: 1560,
        weekly_score: 95400,
        streak_days: 9,
        member_count: 128,
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'syn_quant_matrix',
        name: '[QUANT] Matrix Alchemists',
        tag: 'QNTM',
        emblem_sigil: 'QUANT-MATRIX',
        description: 'Algorithmic yield engineers and statistical referral alchemists utilizing custom automation scripts and AI worker fleets.',
        creator_id: 'sys_quant_creator',
        total_net_worth_cents: 375000000, // $3,750,000
        total_referrals: 740,
        weekly_score: 88900,
        streak_days: 7,
        member_count: 45,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ];

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO syndicates (
        id, name, tag, emblem_sigil, description, creator_id,
        total_net_worth_cents, total_referrals, weekly_score, streak_days, member_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const syn of defaultSyndicates) {
      insertStmt.run(
        syn.id,
        syn.name,
        syn.tag,
        syn.emblem_sigil,
        syn.description,
        syn.creator_id,
        syn.total_net_worth_cents,
        syn.total_referrals,
        syn.weekly_score,
        syn.streak_days,
        syn.member_count,
        syn.created_at
      );
    }
  }
}

// Ensure schema is ready on route import
initSyndicatesSchema();

/**
 * Helper to optionally parse user from token without throwing 401
 */
function getOptionalUserId(req: Request): string | null {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)
      || (req as any).cookies?.token;
    if (!token) return null;
    const jwt = require('jsonwebtoken');
    const { config } = require('../config');
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    return decoded.userId || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/syndicates
 * List all syndicates ranked by weekly score in descending order
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const currentUserId = getOptionalUserId(req);

    // Fetch user's current syndicate id if authenticated
    let userSyndicateId: string | null = null;
    if (currentUserId) {
      const mem = db.prepare('SELECT syndicate_id FROM syndicate_members WHERE user_id = ?').get(currentUserId) as { syndicate_id: string } | undefined;
      if (mem) {
        userSyndicateId = mem.syndicate_id;
      }
    }

    const rows = db.prepare(`
      SELECT s.*, 
             u.display_name as creator_name
      FROM syndicates s
      LEFT JOIN users u ON u.id = s.creator_id
      ORDER BY s.weekly_score DESC, s.total_net_worth_cents DESC
    `).all() as any[];

    const rankedSyndicates: Syndicate[] = rows.map((s, index) => ({
      id: s.id,
      name: s.name,
      tag: s.tag,
      emblem_sigil: s.emblem_sigil,
      description: s.description,
      creator_id: s.creator_id,
      creator_name: s.creator_name || 'Guild Overseer',
      total_net_worth_cents: Number(s.total_net_worth_cents || 0),
      total_referrals: Number(s.total_referrals || 0),
      weekly_score: Number(s.weekly_score || 0),
      streak_days: Number(s.streak_days || 1),
      member_count: Number(s.member_count || 1),
      created_at: s.created_at,
      rank: index + 1,
      is_user_syndicate: s.id === userSyndicateId,
    }));

    res.json({
      success: true,
      data: rankedSyndicates,
      total_count: rankedSyndicates.length,
      current_season: 'Season 4: Cyber Dawn Guild Wars',
    });
  } catch (err: any) {
    console.error('Error fetching syndicates:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve syndicates directory.' });
  }
});

/**
 * GET /api/syndicates/my
 * Get current user's syndicate status & communal buff
 */
router.get('/my', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Check if user is in any syndicate
    const membership = db.prepare(`
      SELECT sm.*, u.display_name, u.email, u.tier_title, u.level
      FROM syndicate_members sm
      JOIN users u ON u.id = sm.user_id
      WHERE sm.user_id = ?
    `).get(userId) as any;

    if (!membership) {
      const topSyndicate = db.prepare(`
        SELECT tag, name, weekly_score FROM syndicates ORDER BY weekly_score DESC LIMIT 1
      `).get() as any;

      const responseData: MySyndicateResponse = {
        syndicate: null,
        membership: null,
        communal_buff: {
          active: false,
          name: 'Guildless Operative',
          multiplier: 1.0,
          badge: '⚡ No Active Guild Buff',
          description: 'Join or found a Creator Syndicate to unlock the passive +15% Guild XP Multiplier and compete in weekly prize pools.',
          expires_in_hours: 0,
          perks: [
            'Unlock +15% Guild XP & Commission Multiplier upon joining',
            'Compete in weekly Guild War prize pools',
            'Display your Guild Sigil & Tag across leaderboards',
          ],
        },
        war_status: {
          season: 'Season 4: Cyber Dawn Guild Wars',
          round: 12,
          ends_in_days: 3,
          rank: null,
          weekly_target_score: 100000,
          prize_pool_cents: 2500000,
          leaderboard_summary: {
            first_place_tag: topSyndicate?.tag || 'VRTX',
            first_place_name: topSyndicate?.name || '[VORTEX] Cyber Syndicate',
            first_place_score: Number(topSyndicate?.weekly_score || 142500),
            user_syndicate_gap: Number(topSyndicate?.weekly_score || 142500),
          },
        },
      };

      res.json({
        success: true,
        data: responseData,
      });
      return;
    }

    // Fetch full syndicate details
    const syndicateRow = db.prepare(`
      SELECT s.*, u.display_name as creator_name
      FROM syndicates s
      LEFT JOIN users u ON u.id = s.creator_id
      WHERE s.id = ?
    `).get(membership.syndicate_id) as any;

    if (!syndicateRow) {
      // Clean up orphaned membership
      db.prepare('DELETE FROM syndicate_members WHERE user_id = ?').run(userId);
      res.json({
        success: true,
        data: {
          syndicate: null,
          membership: null,
          communal_buff: {
            active: false,
            name: 'Guildless Operative',
            multiplier: 1.0,
            badge: '⚡ No Active Guild Buff',
            description: 'Join a syndicate to unlock the +15% Guild XP Multiplier.',
            expires_in_hours: 0,
            perks: [],
          },
          war_status: {
            season: 'Season 4: Cyber Dawn Guild Wars',
            round: 12,
            ends_in_days: 3,
            rank: null,
            weekly_target_score: 100000,
            prize_pool_cents: 2500000,
            leaderboard_summary: {
              first_place_tag: 'VRTX',
              first_place_name: '[VORTEX] Cyber Syndicate',
              first_place_score: 142500,
              user_syndicate_gap: 142500,
            },
          },
        },
      });
      return;
    }

    // Compute rank
    const higherCount = db.prepare(`
      SELECT COUNT(*) as count FROM syndicates WHERE weekly_score > ?
    `).get(syndicateRow.weekly_score) as { count: number };
    const currentRank = (higherCount?.count || 0) + 1;

    // First place info
    const topSyndicate = db.prepare(`
      SELECT tag, name, weekly_score FROM syndicates ORDER BY weekly_score DESC LIMIT 1
    `).get() as any;

    const formattedSyndicate: Syndicate = {
      id: syndicateRow.id,
      name: syndicateRow.name,
      tag: syndicateRow.tag,
      emblem_sigil: syndicateRow.emblem_sigil,
      description: syndicateRow.description,
      creator_id: syndicateRow.creator_id,
      creator_name: syndicateRow.creator_name || 'Guild Overseer',
      total_net_worth_cents: Number(syndicateRow.total_net_worth_cents || 0),
      total_referrals: Number(syndicateRow.total_referrals || 0),
      weekly_score: Number(syndicateRow.weekly_score || 0),
      streak_days: Number(syndicateRow.streak_days || 1),
      member_count: Number(syndicateRow.member_count || 1),
      created_at: syndicateRow.created_at,
      rank: currentRank,
      is_user_syndicate: true,
    };

    const formattedMembership: SyndicateMember = {
      id: membership.id,
      syndicate_id: membership.syndicate_id,
      user_id: membership.user_id,
      role: membership.role,
      contributed_xp: Number(membership.contributed_xp || 0),
      joined_at: membership.joined_at,
      display_name: membership.display_name,
      email: membership.email,
      tier_title: membership.tier_title,
      level: membership.level,
    };

    const responseData: MySyndicateResponse = {
      syndicate: formattedSyndicate,
      membership: formattedMembership,
      communal_buff: {
        active: true,
        name: 'Communal Guild Power',
        multiplier: 1.15,
        badge: '⚡ +15% Guild XP Multiplier Active',
        description: 'All syndicate members receive a passive +15% XP & commission velocity multiplier on all quests and daily actions.',
        expires_in_hours: 168,
        perks: [
          '+15% XP & Commission Velocity Multiplier',
          'Communal Guild War Treasury Dividends',
          'Holographic Sigil Badge on Global Leaderboards',
          'Shared Guild War Raid Battles & Multiplier Boosts',
        ],
      },
      war_status: {
        season: 'Season 4: Cyber Dawn Guild Wars',
        round: 12,
        ends_in_days: 3,
        rank: currentRank,
        weekly_target_score: 150000,
        prize_pool_cents: 2500000,
        leaderboard_summary: {
          first_place_tag: topSyndicate?.tag || 'VRTX',
          first_place_name: topSyndicate?.name || '[VORTEX] Cyber Syndicate',
          first_place_score: Number(topSyndicate?.weekly_score || 142500),
          user_syndicate_gap: Math.max(0, Number(topSyndicate?.weekly_score || 142500) - formattedSyndicate.weekly_score),
        },
      },
    };

    res.json({
      success: true,
      data: responseData,
    });
  } catch (err: any) {
    console.error('Error fetching user syndicate:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve personal syndicate status.' });
  }
});

/**
 * POST /api/syndicates/create
 * Create a new creator syndicate
 */
router.post('/create', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, tag, emblem_sigil, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 60) {
      res.status(400).json({ success: false, error: 'Syndicate name must be between 3 and 60 characters.' });
      return;
    }

    if (!tag || typeof tag !== 'string' || tag.trim().length < 2 || tag.trim().length > 8) {
      res.status(400).json({ success: false, error: 'Guild tag must be 2 to 8 alphanumeric characters.' });
      return;
    }

    const cleanTag = tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanTag) {
      res.status(400).json({ success: false, error: 'Guild tag contains invalid characters.' });
      return;
    }

    const cleanName = name.trim();
    const cleanSigil = (emblem_sigil && typeof emblem_sigil === 'string' ? emblem_sigil.trim() : 'CYBER-DRAGON').toUpperCase();
    const cleanDesc = description && typeof description === 'string' && description.trim().length >= 10
      ? description.trim()
      : `Official creator guild established by ${req.user!.display_name}. Focused on collective revenue scaling and viral syndication.`;

    // Check unique tag
    const existingTag = db.prepare('SELECT id FROM syndicates WHERE UPPER(tag) = ?').get(cleanTag);
    if (existingTag) {
      res.status(400).json({ success: false, error: `Guild tag [${cleanTag}] is already registered by another syndicate.` });
      return;
    }

    // Check unique name
    const existingName = db.prepare('SELECT id FROM syndicates WHERE UPPER(name) = ?').get(cleanName.toUpperCase());
    if (existingName) {
      res.status(400).json({ success: false, error: `Syndicate name "${cleanName}" is already taken.` });
      return;
    }

    // Calculate user initial contribution
    const userRow = db.prepare('SELECT xp, referral_count FROM users WHERE id = ?').get(userId) as any;
    const userNetWorth = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN is_liability = 0 THEN balance_cents ELSE -balance_cents END), 0) as net_worth_cents
      FROM accounts
      WHERE user_id = ?
    `).get(userId) as any;

    const initialXp = Math.max(500, Number(userRow?.xp || 0));
    const initialNetWorth = Math.max(0, Number(userNetWorth?.net_worth_cents || 0));
    const initialReferrals = Number(userRow?.referral_count || 0);
    const initialScore = initialXp + 2500; // Founding bonus score
    const now = new Date().toISOString();
    const newSyndicateId = `syn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const memberId = `sm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    runInTransaction(() => {
      // If user is in another syndicate, decrement old syndicate count & remove membership
      const oldMembership = db.prepare('SELECT syndicate_id FROM syndicate_members WHERE user_id = ?').get(userId) as { syndicate_id: string } | undefined;
      if (oldMembership) {
        db.prepare('UPDATE syndicates SET member_count = MAX(1, member_count - 1) WHERE id = ?').run(oldMembership.syndicate_id);
        db.prepare('DELETE FROM syndicate_members WHERE user_id = ?').run(userId);
      }

      // Insert new syndicate
      db.prepare(`
        INSERT INTO syndicates (
          id, name, tag, emblem_sigil, description, creator_id,
          total_net_worth_cents, total_referrals, weekly_score, streak_days, member_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
      `).run(
        newSyndicateId,
        cleanName,
        cleanTag,
        cleanSigil,
        cleanDesc,
        userId,
        initialNetWorth,
        initialReferrals,
        initialScore,
        now
      );

      // Insert founder membership
      db.prepare(`
        INSERT INTO syndicate_members (
          id, syndicate_id, user_id, role, contributed_xp, joined_at
        ) VALUES (?, ?, ?, 'founder', ?, ?)
      `).run(
        memberId,
        newSyndicateId,
        userId,
        initialXp,
        now
      );
    });

    const createdSyndicate = db.prepare('SELECT * FROM syndicates WHERE id = ?').get(newSyndicateId) as unknown as Syndicate;

    res.status(201).json({
      success: true,
      message: `🎉 Syndicate [${cleanTag}] ${cleanName} created! +15% Guild XP Multiplier active.`,
      data: createdSyndicate,
    });
  } catch (err: any) {
    console.error('Error creating syndicate:', err);
    res.status(500).json({ success: false, error: 'Failed to create syndicate.' });
  }
});

/**
 * POST /api/syndicates/:id/join
 * Join an existing syndicate
 */
router.post('/:id/join', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const syndicateId = req.params.id;

    const targetSyndicate = db.prepare('SELECT * FROM syndicates WHERE id = ?').get(syndicateId) as unknown as Syndicate | undefined;
    if (!targetSyndicate) {
      res.status(404).json({ success: false, error: 'Syndicate not found.' });
      return;
    }

    const currentMembership = db.prepare('SELECT * FROM syndicate_members WHERE user_id = ?').get(userId) as unknown as SyndicateMember | undefined;
    if (currentMembership && currentMembership.syndicate_id === syndicateId) {
      res.status(400).json({ success: false, error: 'You are already an active member of this syndicate.' });
      return;
    }

    const userRow = db.prepare('SELECT xp, referral_count FROM users WHERE id = ?').get(userId) as any;
    const userNetWorth = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN is_liability = 0 THEN balance_cents ELSE -balance_cents END), 0) as net_worth_cents
      FROM accounts
      WHERE user_id = ?
    `).get(userId) as any;

    const userXpContribution = Math.max(100, Number(userRow?.xp || 0));
    const userNetWorthCents = Math.max(0, Number(userNetWorth?.net_worth_cents || 0));
    const userReferrals = Number(userRow?.referral_count || 0);
    const now = new Date().toISOString();
    const newMemberId = `sm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    runInTransaction(() => {
      // If user was in another syndicate, decrement previous syndicate
      if (currentMembership) {
        db.prepare('UPDATE syndicates SET member_count = MAX(1, member_count - 1) WHERE id = ?').run(currentMembership.syndicate_id);
        db.prepare('DELETE FROM syndicate_members WHERE user_id = ?').run(userId);
      }

      // Insert new membership
      db.prepare(`
        INSERT INTO syndicate_members (
          id, syndicate_id, user_id, role, contributed_xp, joined_at
        ) VALUES (?, ?, ?, 'member', ?, ?)
      `).run(
        newMemberId,
        syndicateId,
        userId,
        userXpContribution,
        now
      );

      // Increment target syndicate metrics
      db.prepare(`
        UPDATE syndicates
        SET member_count = member_count + 1,
            weekly_score = weekly_score + ?,
            total_net_worth_cents = total_net_worth_cents + ?,
            total_referrals = total_referrals + ?
        WHERE id = ?
      `).run(
        userXpContribution,
        userNetWorthCents,
        userReferrals,
        syndicateId
      );
    });

    const updatedSyndicate = db.prepare('SELECT * FROM syndicates WHERE id = ?').get(syndicateId) as unknown as Syndicate;

    res.json({
      success: true,
      message: `⚡ Joined [${updatedSyndicate.tag}] ${updatedSyndicate.name}! +15% Guild XP multiplier activated.`,
      data: {
        syndicate: updatedSyndicate,
        member_id: newMemberId,
      },
    });
  } catch (err: any) {
    console.error('Error joining syndicate:', err);
    res.status(500).json({ success: false, error: 'Failed to join syndicate.' });
  }
});

/**
 * GET /api/syndicates/:id/members
 * Retrieve member roster of a specific syndicate
 */
router.get('/:id/members', (req: Request, res: Response) => {
  try {
    const syndicateId = req.params.id;

    const members = db.prepare(`
      SELECT sm.id, sm.syndicate_id, sm.user_id, sm.role, sm.contributed_xp, sm.joined_at,
             u.display_name, u.tier_title, u.level, u.streak_days
      FROM syndicate_members sm
      JOIN users u ON u.id = sm.user_id
      WHERE sm.syndicate_id = ?
      ORDER BY 
        CASE WHEN sm.role = 'founder' THEN 1 WHEN sm.role = 'officer' THEN 2 ELSE 3 END,
        sm.contributed_xp DESC
      LIMIT 100
    `).all(syndicateId) as any[];

    res.json({
      success: true,
      data: members,
    });
  } catch (err: any) {
    console.error('Error fetching syndicate members:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve syndicate members.' });
  }
});

/**
 * POST /api/syndicates/leave
 * Leave current syndicate
 */
router.post('/leave', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const membership = db.prepare('SELECT * FROM syndicate_members WHERE user_id = ?').get(userId) as SyndicateMember | undefined;

    if (!membership) {
      res.status(400).json({ success: false, error: 'You are not currently in any syndicate.' });
      return;
    }

    runInTransaction(() => {
      db.prepare('UPDATE syndicates SET member_count = MAX(1, member_count - 1) WHERE id = ?').run(membership.syndicate_id);
      db.prepare('DELETE FROM syndicate_members WHERE user_id = ?').run(userId);
    });

    res.json({
      success: true,
      message: 'You have left the syndicate. Communal buff deactivated.',
    });
  } catch (err: any) {
    console.error('Error leaving syndicate:', err);
    res.status(500).json({ success: false, error: 'Failed to leave syndicate.' });
  }
});

export default router;
