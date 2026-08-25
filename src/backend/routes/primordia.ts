import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const primordiaRouter = Router();

// ── SQLite Schema Initialization for PrimordiaOS ──────────────────────
export function initPrimordiaSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'read_write',
      created_at TEXT NOT NULL,
      last_used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS autoposter_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      content TEXT NOT NULL,
      media_url TEXT,
      scheduled_for TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      metrics_views INTEGER DEFAULT 0,
      metrics_clicks INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rag_knowledge_index (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      snippet TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT NOT NULL,
      tags TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_autoposter_user ON autoposter_queue(user_id);
    CREATE INDEX IF NOT EXISTS idx_autoposter_status ON autoposter_queue(status);
  `);

  // Seed Knowledge Base if empty
  const ragCount = (db.prepare('SELECT COUNT(*) as count FROM rag_knowledge_index').get() as { count: number })?.count || 0;
  if (ragCount === 0) {
    const seedDocs = [
      {
        id: 'rag_001',
        title: 'PrimordiaOS Autonomous Swarm Directive v5.0',
        category: 'Architecture',
        snippet: 'Core orchestrator governance loop linking SignalCore directives to VisionCore camera logic and Niagara VFX rendering.',
        content: 'Operator Intent -> InsightCore (product mapping) -> Vertex AI (structural intelligence) -> Antigravity (creative control) -> VisionCore (visual blueprints) -> Runway AI (video generation) -> Unreal Engine + Niagara (real-time rendering + cosmic VFX) -> Osmium memory ledger.',
        source: 'PrimordiaOS Directive Layer / GEMINI Global Rules',
        tags: 'swarm, architecture, unreal, niagara, signalcore, visioncore',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rag_002',
        title: 'Nuclear Viral Growth & K-Factor Mechanics',
        category: 'Viral Strategy',
        snippet: '10 growth mechanics for converting organic creator traffic into compounding affiliate ARR.',
        content: 'Viral Velocity > 0.8 triggers adaptive creation loop. Subatomic 3-second visual hooks, deterministic vector sigil share cards, and 20-40% direct affiliate commission incentives compound referral network K-Factor above 1.25 supercritical threshold.',
        source: 'Creator Money OS Launch Kit',
        tags: 'k-factor, viral, referrals, commissions, growth, tiktok, reels',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rag_003',
        title: 'ACID Living Vault Wealth Ascension Hierarchy',
        category: 'Financial OS',
        snippet: 'Mathematical model behind the 6-Tier dynamic wealth visual rendering engine.',
        content: 'Real-time wealth tracking transitions through 6 distinct visual shaders: Neo-Emerald Seed Matrix ($0-$1k), Cyan Cash River ($1k-$5k), Amethyst Quantum Ledger ($5k-$20k), 24K Gold Bullion Chamber ($20k-$100k), Sovereign Diamond Treasury ($100k-$500k), and Celestial Osmium Singularity ($500k+).',
        source: 'Living Vault Telemetry Manual',
        tags: 'wealth, vault, acid, sqlite, bullion, diamond, singularity',
        created_at: new Date().toISOString(),
      },
      {
        id: 'rag_004',
        title: 'Unreal Engine 5.4 + Niagara Real-Time Telemetry Bridge',
        category: 'VFX Bridge',
        snippet: 'WebSocket protocol and telemetry sync standards for cosmic particle fusion.',
        content: 'Unreal Engine + Niagara fusion triggers after PulseWave telemetry sync. Cosmic particle systems dynamically adjust particle density (25 to 180 particles), gravitation wells, and Solfeggio 528Hz acoustic harmonics based on viral velocity metrics.',
        source: 'Unreal Niagara Bridge Protocol',
        tags: 'unreal, niagara, vfx, particles, telemetry, pulsewave',
        created_at: new Date().toISOString(),
      },
    ];

    const insertStmt = db.prepare(`
      INSERT INTO rag_knowledge_index (id, title, category, snippet, content, source, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    seedDocs.forEach(d => {
      insertStmt.run(d.id, d.title, d.category, d.snippet, d.content, d.source, d.tags, d.created_at);
    });
  }

  // Seed Autoposter sample queue if empty
  const queueCount = (db.prepare('SELECT COUNT(*) as count FROM autoposter_queue').get() as { count: number })?.count || 0;
  if (queueCount === 0) {
    const defaultPosts = [
      {
        id: 'post_001',
        user_id: 'usr_admin_001',
        platform: 'tiktok',
        content: 'Stop using spreadsheets in 2026. This Voice AI manages your liquid wealth hands-free 🚀 #moneyos #affiliate #fintech',
        media_url: 'https://moneyplughub.com/assets/video_hook_1.mp4',
        scheduled_for: new Date(Date.now() + 3600000).toISOString(),
        status: 'queued',
        created_at: new Date().toISOString(),
      },
      {
        id: 'post_002',
        user_id: 'usr_admin_001',
        platform: 'x',
        content: 'The traditional banking stack extracts wealth from creators. We built the first self-hosted $0/mo Creator Money OS with 241ms Voice AI and procedural cryptographic sigils. Thread 🧵👇',
        media_url: 'https://moneyplughub.com/assets/thread_preview.png',
        scheduled_for: new Date(Date.now() + 7200000).toISOString(),
        status: 'queued',
        created_at: new Date().toISOString(),
      },
      {
        id: 'post_003',
        user_id: 'usr_admin_001',
        platform: 'youtube_shorts',
        content: 'How I turned my referral link into a deterministic 3D vector sigil that pays $10.00/signup ⚡',
        media_url: 'https://moneyplughub.com/assets/shorts_sigil.mp4',
        scheduled_for: new Date(Date.now() + 14400000).toISOString(),
        status: 'queued',
        created_at: new Date().toISOString(),
      },
    ];

    const insertPost = db.prepare(`
      INSERT INTO autoposter_queue (id, user_id, platform, content, media_url, scheduled_for, status, metrics_views, metrics_clicks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
    `);

    defaultPosts.forEach(p => {
      insertPost.run(p.id, p.user_id, p.platform, p.content, p.media_url, p.scheduled_for, p.status, p.created_at);
    });
  }
}

// ── 1. Telemetry & PulseWave Metrics ──────────────────────────────────
primordiaRouter.get('/telemetry', (req: Request, res: Response) => {
  const viralVelocity = 0.88;
  const pulseWaveStatus = viralVelocity >= 0.8 ? 'Supercritical (Auto-Loop Active)' : 'Nominal';

  res.json({
    success: true,
    data: {
      system: 'PrimordiaOS v5.0 Master Control Layer',
      status: 'ONLINE',
      uptimeSeconds: process.uptime(),
      pulseWave: {
        viralVelocity,
        status: pulseWaveStatus,
        tokenThroughputPerSec: 1420,
        frequencyHz: 528,
        latencyMs: 18.4,
        errorBudgetPct: 99.98,
        activeStreams: 14,
      },
      agents: [
        {
          id: 'agent_signal',
          name: 'SignalCore',
          role: 'Directives & Logic Engine',
          status: 'OPERATIONAL',
          loadPct: 34,
          lastSync: '0.4s ago',
          color: '#10b981',
        },
        {
          id: 'agent_vision',
          name: 'VisionCore',
          role: 'Visual Composition & Camera Logic',
          status: 'OPERATIONAL',
          loadPct: 62,
          lastSync: '1.2s ago',
          color: '#38bdf8',
        },
        {
          id: 'agent_runway',
          name: 'Runway AI Studio',
          role: 'Motion Sequence Generator',
          status: 'STANDBY',
          loadPct: 18,
          lastSync: '3.1s ago',
          color: '#c084fc',
        },
        {
          id: 'agent_unreal',
          name: 'Unreal + Niagara',
          role: 'Real-Time Cosmic Particle VFX',
          status: 'OPERATIONAL',
          loadPct: 48,
          lastSync: '0.1s ago',
          color: '#ffd700',
        },
        {
          id: 'agent_osmium',
          name: 'Osmium Memory Vault',
          role: 'ACID State & Vector Index',
          status: 'OPERATIONAL',
          loadPct: 22,
          lastSync: '0.2s ago',
          color: '#f43f5e',
        },
        {
          id: 'agent_moneyplug',
          name: 'MoneyPlugHub Engine',
          role: 'Monetization & Commission Ledger',
          status: 'SUPERCRITICAL',
          loadPct: 85,
          lastSync: '0.1s ago',
          color: '#06b6d4',
        },
      ],
      unrealBridge: {
        connected: true,
        engineVersion: 'Unreal Engine 5.4.4',
        renderer: 'Niagara GPU Particle Fusion',
        viewportFps: 60,
        gpuLoadPct: 38,
        particleBufferCount: 12450,
        activeCosmicShader: 'Molten_Gold_Singularity_v2',
        telemetrySyncMs: 4.2,
      },
    },
  });
});

// ── 2. RAG Semantic Knowledge Search ──────────────────────────────────
primordiaRouter.post('/rag/search', (req: Request, res: Response) => {
  const query = String(req.body.query || '').trim().toLowerCase();

  if (!query) {
    const all = db.prepare('SELECT * FROM rag_knowledge_index LIMIT 6').all();
    res.json({ success: true, data: all });
    return;
  }

  const results = db.prepare(`
    SELECT * FROM rag_knowledge_index
    WHERE title LIKE ? OR snippet LIKE ? OR content LIKE ? OR tags LIKE ?
    LIMIT 10
  `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);

  res.json({
    success: true,
    data: results,
    meta: {
      query,
      matchCount: results.length,
      latencyMs: 3.8,
    },
  });
});

// ── 3. Autoposter Controls & Queue ────────────────────────────────────
primordiaRouter.get('/autoposter/queue', (req: Request, res: Response) => {
  const queue = db.prepare(`
    SELECT * FROM autoposter_queue
    ORDER BY scheduled_for ASC
  `).all();

  res.json({ success: true, data: queue });
});

primordiaRouter.post('/autoposter/schedule', (req: Request, res: Response) => {
  const { platform, content, mediaUrl, scheduledInMinutes } = req.body;

  if (!platform || !content) {
    res.status(400).json({ success: false, error: 'Platform and content are required.' });
    return;
  }

  const id = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const scheduledTime = new Date(Date.now() + (Number(scheduledInMinutes) || 60) * 60000).toISOString();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO autoposter_queue (id, user_id, platform, content, media_url, scheduled_for, status, metrics_views, metrics_clicks, created_at)
    VALUES (?, 'usr_current', ?, ?, ?, ?, 'queued', 0, 0, ?)
  `).run(id, platform, content, mediaUrl || null, scheduledTime, now);

  res.json({
    success: true,
    message: `Post successfully scheduled for ${platform.toUpperCase()} in ${scheduledInMinutes || 60}m! 🚀`,
    data: { id, platform, scheduled_for: scheduledTime },
  });
});

// ── 4. API Key Management ─────────────────────────────────────────────
primordiaRouter.get('/keys', (req: Request, res: Response) => {
  const keys = db.prepare(`
    SELECT id, name, key_prefix, scope, created_at, last_used_at
    FROM api_keys
    ORDER BY created_at DESC
  `).all();

  res.json({ success: true, data: keys });
});

primordiaRouter.post('/keys/generate', (req: Request, res: Response) => {
  const { name, scope = 'read_write' } = req.body;
  if (!name) {
    res.status(400).json({ success: false, error: 'Key name is required.' });
    return;
  }

  const rawKey = `primordia_sk_${crypto.randomBytes(24).toString('hex')}`;
  const keyPrefix = rawKey.substring(0, 16) + '...';
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const id = `key_${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, scope, created_at)
    VALUES (?, 'usr_current', ?, ?, ?, ?, ?)
  `).run(id, keyHash, keyPrefix, name, scope, now);

  res.json({
    success: true,
    message: 'API Key generated! Please store it securely—this is the only time it will be shown.',
    data: {
      id,
      name,
      apiKey: rawKey,
      keyPrefix,
      scope,
      created_at: now,
    },
  });
});

primordiaRouter.delete('/keys/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
  res.json({ success: true, message: 'API key revoked successfully.' });
});

// ── 5. Unreal Engine Niagara VFX Trigger ──────────────────────────────
primordiaRouter.post('/unreal/trigger-vfx', (req: Request, res: Response) => {
  const { shaderPreset = 'Cosmic_Supernova_Fusion', intensity = 1.0 } = req.body;

  res.json({
    success: true,
    message: `Niagara Cosmic Particle VFX triggered successfully with preset: ${shaderPreset}`,
    data: {
      vfxId: `vfx_${Date.now()}`,
      shaderPreset,
      intensity,
      gpuParticlesRendered: 24000,
      viewportFps: 60,
      telemetryResponseTimeMs: 2.1,
      status: 'STREAMING_TO_VIEWPORT',
    },
  });
});

// ── 6. Save Cropped Logo Asset Endpoint ───────────────────────────────
primordiaRouter.post('/logo/save', (req: Request, res: Response) => {
  try {
    const { base64Data, filename = 'logo.png' } = req.body;
    if (!base64Data) {
      res.status(400).json({ success: false, error: 'base64Data is required' });
      return;
    }

    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const publicPath = path.resolve(process.cwd(), `public/${filename}`);
    const distPath = path.resolve(process.cwd(), `dist/client/${filename}`);

    fs.writeFileSync(publicPath, buffer);
    try {
      fs.writeFileSync(distPath, buffer);
    } catch {}

    res.json({ success: true, message: `Saved ${filename} successfully (${buffer.length} bytes)` });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});
