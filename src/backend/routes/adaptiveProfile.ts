import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db';

const router = Router();

export type ArchetypeType = 
  | 'viral_growth_mogul' 
  | 'vault_guardian' 
  | 'mystic_alchemist' 
  | 'cypherpunk_quant' 
  | 'sovereign_operator';

export interface AdaptiveProfile {
  userId: string;
  archetype: ArchetypeType;
  archetypeTitle: string;
  archetypeTagline: string;
  archetypeEmblem: string;
  paletteTheme: 'emerald' | 'violet' | 'cyan' | 'gold' | 'ruby';
  voicePreset: string;
  voiceSpeed: number;
  voiceGreeting: string;
  uiPriorityTabs: string[];
  actionCount: number;
  isCalibrated: boolean;
  affinityScores: {
    growth: number;
    vault: number;
    alchemist: number;
    quant: number;
    sovereign: number;
  };
}

const ARCHETYPE_TEMPLATES: Record<ArchetypeType, {
  title: string;
  tagline: string;
  emblem: string;
  palette: 'emerald' | 'violet' | 'cyan' | 'gold' | 'ruby';
  voicePreset: string;
  voiceSpeed: number;
  voiceGreeting: string;
  uiPriority: string[];
}> = {
  viral_growth_mogul: {
    title: 'Viral Growth Mogul',
    tagline: 'High-velocity distribution architect scaling affiliate MRR & viral creator funnels.',
    emblem: 'Rocket',
    palette: 'gold',
    voicePreset: 'creator_mode',
    voiceSpeed: 1.12,
    voiceGreeting: 'Signal verified, Growth Mogul. Your viral distribution funnel is active.',
    uiPriority: ['referral-hub', 'generate', 'overview', 'quests', 'moneyos'],
  },
  vault_guardian: {
    title: 'Living Vault Guardian',
    tagline: 'Disciplined wealth compounder eliminating debt and fortifying liquidity shields.',
    emblem: 'ShieldCheck',
    palette: 'emerald',
    voicePreset: 'vault_explanation',
    voiceSpeed: 0.96,
    voiceGreeting: 'Opening the Living Vault, Guardian. Your financial baseline is secure.',
    uiPriority: ['net-worth', 'debts', 'budget', 'overview', 'moneyos'],
  },
  mystic_alchemist: {
    title: 'Mystic Alchemist',
    tagline: 'Cryptographic visionary transmuting creative intent into procedural sigils & digital artifacts.',
    emblem: 'Compass',
    palette: 'violet',
    voicePreset: 'sigil_forge',
    voiceSpeed: 0.90,
    voiceGreeting: 'Transmuting intent into yield, Alchemist. Your holographic sigil is charging.',
    uiPriority: ['sigil-forge', 'v5', 'quests', 'leaderboard', 'overview'],
  },
  cypherpunk_quant: {
    title: 'Cypherpunk Quant',
    tagline: 'Algorithmic sovereign deploying autonomous ledgers, crypto yield & rapid execution.',
    emblem: 'Zap',
    palette: 'cyan',
    voicePreset: 'active_ai_studio',
    voiceSpeed: 1.15,
    voiceGreeting: 'Autonomous telemetry synchronized, Quant. Yield routing is operational.',
    uiPriority: ['crypto', 'v5', 'net-worth', 'referral-hub', 'overview'],
  },
  sovereign_operator: {
    title: 'Sovereign Operator',
    tagline: 'Balanced multi-hyphenate creator orchestrating all financial & distribution chambers.',
    emblem: 'Crown',
    palette: 'emerald',
    voicePreset: 'general_conversation',
    voiceSpeed: 1.00,
    voiceGreeting: 'Welcome back, Sovereign Operator. Systems aligned across all chambers.',
    uiPriority: ['overview', 'referral-hub', 'sigil-forge', 'net-worth', 'moneyos'],
  },
};

function extractUserId(req: Request): string {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)
      || (req as any).cookies?.token;
    if (!token) return 'demo_guest_user';
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    return decoded.userId || 'demo_guest_user';
  } catch {
    return 'demo_guest_user';
  }
}

function ensureAdaptiveTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_adaptive_profiles (
      user_id TEXT PRIMARY KEY,
      archetype TEXT NOT NULL DEFAULT 'sovereign_operator',
      archetype_title TEXT NOT NULL DEFAULT 'Sovereign Operator',
      archetype_tagline TEXT NOT NULL DEFAULT 'Balanced multi-hyphenate orchestrating all financial chambers.',
      archetype_emblem TEXT NOT NULL DEFAULT 'Crown',
      palette_theme TEXT NOT NULL DEFAULT 'emerald',
      voice_preset TEXT NOT NULL DEFAULT 'general_conversation',
      voice_speed REAL NOT NULL DEFAULT 1.0,
      voice_greeting TEXT NOT NULL DEFAULT 'Welcome back, Sovereign Operator.',
      ui_priority_tabs TEXT NOT NULL DEFAULT '["overview","referral-hub","sigil-forge","net-worth","moneyos"]',
      question_answers TEXT NOT NULL DEFAULT '{}',
      action_count INTEGER NOT NULL DEFAULT 0,
      action_history TEXT NOT NULL DEFAULT '[]',
      affinity_scores TEXT NOT NULL DEFAULT '{"growth":20,"vault":20,"alchemist":20,"quant":20,"sovereign":20}',
      is_calibrated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function getOrInitProfile(userId: string): any {
  ensureAdaptiveTable();
  let row = db.prepare('SELECT * FROM user_adaptive_profiles WHERE user_id = ?').get(userId) as any;
  if (!row) {
    const now = new Date().toISOString();
    const tmpl = ARCHETYPE_TEMPLATES.sovereign_operator;
    db.prepare(`
      INSERT INTO user_adaptive_profiles (
        user_id, archetype, archetype_title, archetype_tagline, archetype_emblem,
        palette_theme, voice_preset, voice_speed, voice_greeting, ui_priority_tabs,
        question_answers, action_count, action_history, affinity_scores, is_calibrated,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      'sovereign_operator',
      tmpl.title,
      tmpl.tagline,
      tmpl.emblem,
      tmpl.palette,
      tmpl.voicePreset,
      tmpl.voiceSpeed,
      tmpl.voiceGreeting,
      JSON.stringify(tmpl.uiPriority),
      JSON.stringify({}),
      0,
      JSON.stringify([]),
      JSON.stringify({ growth: 20, vault: 20, alchemist: 20, quant: 20, sovereign: 20 }),
      0,
      now,
      now
    );
    row = db.prepare('SELECT * FROM user_adaptive_profiles WHERE user_id = ?').get(userId) as any;
  }
  return row;
}

function resolveTopArchetype(scores: { growth: number; vault: number; alchemist: number; quant: number; sovereign: number }): ArchetypeType {
  const entries: [ArchetypeType, number][] = [
    ['viral_growth_mogul', scores.growth],
    ['vault_guardian', scores.vault],
    ['mystic_alchemist', scores.alchemist],
    ['cypherpunk_quant', scores.quant],
    ['sovereign_operator', scores.sovereign],
  ];

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * GET /api/profile/adaptive
 */
router.get('/adaptive', (req: Request, res: Response) => {
  const userId = extractUserId(req);
  const row = getOrInitProfile(userId);

  res.json({
    success: true,
    data: {
      userId: row.user_id,
      archetype: row.archetype,
      archetypeTitle: row.archetype_title,
      archetypeTagline: row.archetype_tagline,
      archetypeEmblem: row.archetype_emblem,
      paletteTheme: row.palette_theme,
      voicePreset: row.voice_preset,
      voiceSpeed: row.voice_speed,
      voiceGreeting: row.voice_greeting,
      uiPriorityTabs: JSON.parse(row.ui_priority_tabs || '[]'),
      actionCount: row.action_count,
      isCalibrated: Boolean(row.is_calibrated),
      affinityScores: JSON.parse(row.affinity_scores || '{}'),
      questionAnswers: JSON.parse(row.question_answers || '{}'),
    }
  });
});

/**
 * POST /api/profile/calibrate-questions
 * Evaluates the 3 explicit diagnostic questions.
 */
router.post('/calibrate-questions', (req: Request, res: Response) => {
  const userId = extractUserId(req);
  const { ambition, rhythm, voicePreference } = req.body;

  const row = getOrInitProfile(userId);
  const affinities = JSON.parse(row.affinity_scores || '{}');

  // 1. Ambition scoring
  if (ambition === 'growth') { affinities.growth += 35; }
  else if (ambition === 'vault') { affinities.vault += 35; }
  else if (ambition === 'alchemist') { affinities.alchemist += 35; }
  else if (ambition === 'quant') { affinities.quant += 35; }
  else { affinities.sovereign += 35; }

  // 2. Rhythm scoring
  if (rhythm === 'sprinter') { affinities.growth += 15; affinities.quant += 15; }
  else if (rhythm === 'steady') { affinities.vault += 20; affinities.sovereign += 10; }
  else if (rhythm === 'hands_free') { affinities.quant += 15; affinities.alchemist += 15; }

  // 3. Voice preference scoring
  if (voicePreference === 'tactical') { affinities.growth += 15; }
  else if (voicePreference === 'guardian') { affinities.vault += 15; }
  else if (voicePreference === 'mythic') { affinities.alchemist += 15; }

  const newArchetype = resolveTopArchetype(affinities);
  const tmpl = ARCHETYPE_TEMPLATES[newArchetype];
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE user_adaptive_profiles
    SET archetype = ?, archetype_title = ?, archetype_tagline = ?, archetype_emblem = ?,
        palette_theme = ?, voice_preset = ?, voice_speed = ?, voice_greeting = ?,
        ui_priority_tabs = ?, question_answers = ?, affinity_scores = ?, updated_at = ?
    WHERE user_id = ?
  `).run(
    newArchetype,
    tmpl.title,
    tmpl.tagline,
    tmpl.emblem,
    tmpl.palette,
    tmpl.voicePreset,
    tmpl.voiceSpeed,
    tmpl.voiceGreeting,
    JSON.stringify(tmpl.uiPriority),
    JSON.stringify({ ambition, rhythm, voicePreference }),
    JSON.stringify(affinities),
    now,
    userId
  );

  const updated = getOrInitProfile(userId);
  res.json({
    success: true,
    message: `🎉 Neural Calibration complete: You are a ${tmpl.title}!`,
    data: {
      archetype: updated.archetype,
      archetypeTitle: updated.archetype_title,
      archetypeTagline: updated.archetype_tagline,
      archetypeEmblem: updated.archetype_emblem,
      paletteTheme: updated.palette_theme,
      voiceGreeting: updated.voice_greeting,
      uiPriorityTabs: JSON.parse(updated.ui_priority_tabs || '[]'),
      actionCount: updated.action_count,
      isCalibrated: Boolean(updated.is_calibrated),
      affinityScores: JSON.parse(updated.affinity_scores || '{}'),
    }
  });
});

/**
 * POST /api/profile/track-action
 * Passively tracks an interaction event. After 5 actions, finalizes calibration.
 */
router.post('/track-action', (req: Request, res: Response) => {
  const userId = extractUserId(req);
  const { actionName, category } = req.body;

  const row = getOrInitProfile(userId);
  const affinities = JSON.parse(row.affinity_scores || '{}');
  const history: any[] = JSON.parse(row.action_history || '[]');

  history.push({ actionName, category, timestamp: Date.now() });
  if (history.length > 20) history.shift();

  // Shift affinities based on passive action
  if (category === 'growth' || category === 'referral') affinities.growth = (affinities.growth || 0) + 12;
  else if (category === 'vault' || category === 'debt' || category === 'budget') affinities.vault = (affinities.vault || 0) + 12;
  else if (category === 'alchemist' || category === 'sigil' || category === 'forge') affinities.alchemist = (affinities.alchemist || 0) + 12;
  else if (category === 'quant' || category === 'crypto' || category === 'yield') affinities.quant = (affinities.quant || 0) + 12;
  else if (category === 'voice' || category === 'chat') affinities.sovereign = (affinities.sovereign || 0) + 8;

  const newActionCount = (row.action_count || 0) + 1;
  const isNowCalibrated = newActionCount >= 5 || Boolean(row.is_calibrated);

  const topArchetype = resolveTopArchetype(affinities);
  const tmpl = ARCHETYPE_TEMPLATES[topArchetype];
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE user_adaptive_profiles
    SET archetype = ?, archetype_title = ?, archetype_tagline = ?, archetype_emblem = ?,
        palette_theme = ?, voice_preset = ?, voice_speed = ?, voice_greeting = ?,
        ui_priority_tabs = ?, action_count = ?, action_history = ?, affinity_scores = ?,
        is_calibrated = ?, updated_at = ?
    WHERE user_id = ?
  `).run(
    topArchetype,
    tmpl.title,
    tmpl.tagline,
    tmpl.emblem,
    tmpl.palette,
    tmpl.voicePreset,
    tmpl.voiceSpeed,
    tmpl.voiceGreeting,
    JSON.stringify(tmpl.uiPriority),
    newActionCount,
    JSON.stringify(history),
    JSON.stringify(affinities),
    isNowCalibrated ? 1 : 0,
    now,
    userId
  );

  const updated = getOrInitProfile(userId);
  res.json({
    success: true,
    data: {
      archetype: updated.archetype,
      archetypeTitle: updated.archetype_title,
      archetypeTagline: updated.archetype_tagline,
      archetypeEmblem: updated.archetype_emblem,
      paletteTheme: updated.palette_theme,
      voiceGreeting: updated.voice_greeting,
      uiPriorityTabs: JSON.parse(updated.ui_priority_tabs || '[]'),
      actionCount: updated.action_count,
      isCalibrated: Boolean(updated.is_calibrated),
      affinityScores: JSON.parse(updated.affinity_scores || '{}'),
      justCompleted: !row.is_calibrated && isNowCalibrated,
    }
  });
});

export default router;
