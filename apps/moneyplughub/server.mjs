import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite Setup with WAL mode
const dbPath = path.resolve(__dirname, '../../data/moneyplughub.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema if needed
const schemaPath = path.resolve(__dirname, './db/schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ==========================================
// 1. GET /api/paywall/check
// ==========================================
app.get('/api/paywall/check', (req, res) => {
  try {
    const sessionToken = req.cookies?.creator_auth_token || req.headers?.authorization?.replace('Bearer ', '');
    const userId = req.user?.id || req.userId;

    if (!sessionToken && !userId) {
      res.status(200).json({ status: 'unauthenticated' });
      return;
    }

    let user = null;
    if (userId) {
      user = db.prepare('SELECT id, subscriptionTier, subscriptionActive, xp, level, tier_title FROM users WHERE id = ?').get(userId);
    } else {
      user = db.prepare('SELECT id, subscriptionTier, subscriptionActive, xp, level, tier_title FROM users ORDER BY created_at ASC LIMIT 1').get();
    }

    if (!user) {
      res.status(200).json({ status: 'unauthenticated' });
      return;
    }

    const subTier = (user.subscriptionTier || 'FREE').toUpperCase();
    const isActive = Number(user.subscriptionActive || 0) === 1;

    if (subTier === 'CREATOR' || subTier === 'PRO' || subTier === 'ENTERPRISE' || isActive) {
      res.status(200).json({
        status: 'allowed',
        tier: subTier,
        subscriptionActive: true,
      });
      return;
    }

    res.status(200).json({
      status: 'paywall',
      tier: 'FREE',
      subscriptionActive: false,
    });
  } catch (err) {
    console.error('Error in paywall check:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// ==========================================
// 2. POST /api/billing/subscribe
// ==========================================
app.post('/api/billing/subscribe', (req, res) => {
  try {
    const { planId = 'creator-monthly', promoCode = '' } = req.body || {};
    const cleanPromo = (promoCode || '').trim().toUpperCase();

    let userId = req.user?.id || req.userId;
    if (!userId) {
      const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
      userId = firstUser?.id;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    let basePrice = 29.00;
    if (planId === 'pro-monthly') basePrice = 149.00;
    if (planId === 'enterprise-monthly') basePrice = 499.00;

    let finalPrice = basePrice;
    if (cleanPromo === 'FOUNDING50') {
      finalPrice = 0.00;
    } else if (cleanPromo === 'VIPCREATOR') {
      finalPrice = basePrice * 0.5;
    } else if (cleanPromo === 'EARLYBIRD') {
      finalPrice = basePrice * 0.8;
    }

    const now = new Date().toISOString();
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      db.prepare(`
        UPDATE users 
        SET subscriptionTier = 'CREATOR', 
            subscriptionActive = 1,
            updated_at = ?
        WHERE id = ?
      `).run(now, userId);

      db.prepare(`
        INSERT INTO subscriptions (id, userId, planId, price, promoCode, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(subId, userId, planId, finalPrice, cleanPromo || null, now);

      db.prepare(`
        INSERT INTO transactions (id, userId, type, amount, description, createdAt)
        VALUES (?, ?, 'subscription_activation', ?, ?, ?)
      `).run(txId, userId, finalPrice, `Creator Money OS (${planId}) - Promo: ${cleanPromo || 'NONE'}`, now);

      db.exec('COMMIT;');
    } catch (dbErr) {
      db.exec('ROLLBACK;');
      throw dbErr;
    }

    res.status(200).json({
      status: 'SUCCESS',
      tier: 'CREATOR',
      subscriptionActive: true,
      pricePaid: finalPrice,
      subscriptionId: subId,
    });
  } catch (err) {
    console.error('Error in subscribe:', err);
    res.status(500).json({ error: 'BILLING_ERROR', message: err.message });
  }
});

// ==========================================
// 3. POST /api/sigil/points/buy
// ==========================================
app.post('/api/sigil/points/buy', (req, res) => {
  try {
    const { packId = 'starter' } = req.body || {};
    const packs = {
      starter: { name: 'Starter Sigil Cache', xp: 1000, priceUsd: 9.99 },
      alchemist: { name: 'Alchemist Sigil Forge', xp: 3500, priceUsd: 24.99 },
      archon: { name: 'Archon Power Matrix', xp: 10000, priceUsd: 59.99 },
      sovereign: { name: 'Sovereign Celestial Vault', xp: 25000, priceUsd: 129.99 },
    };

    const pack = packs[packId] || packs.starter;

    let userId = req.user?.id || req.userId;
    if (!userId) {
      const firstUser = db.prepare('SELECT id, subscriptionTier, subscriptionActive, xp, level, tier_title FROM users ORDER BY created_at ASC LIMIT 1').get();
      userId = firstUser?.id;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    const user = db.prepare('SELECT id, subscriptionTier, subscriptionActive, xp, level, streak_days, referral_count, tier_title FROM users WHERE id = ?').get(userId);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND' });
      return;
    }

    const subTier = (user.subscriptionTier || 'FREE').toUpperCase();
    const isActive = Number(user.subscriptionActive || 0) === 1;

    if (subTier === 'FREE' && !isActive) {
      res.status(403).json({
        error: 'PAYWALL_REQUIRED',
        message: 'Direct XP injection requires an active Creator Plan.',
      });
      return;
    }

    const currentXp = Number(user.xp || 0);
    const newXp = currentXp + pack.xp;
    const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);

    // 1. Wealth Pulse
    const refCount = Number(user.referral_count || 0);
    const arrVelocity = Math.max(0.05, refCount * 0.05 + 0.05);
    const streakMultiplier = 1 + (Number(user.streak_days || 1) * 0.1);
    const vaultStability = 1.25;
    const wealthPulse = Math.round(((arrVelocity * streakMultiplier) + (newXp * vaultStability)) * 100) / 100;

    // 2. Vault Shaders
    const vaultTiers = [
      { tier: 1, name: 'Novice', shader: 'obsidian_slate', minXP: 0 },
      { tier: 2, name: 'Active Plug', shader: 'emerald_grid', minXP: 1000 },
      { tier: 3, name: 'Wealth Builder', shader: 'amethyst_nebula', minXP: 3000 },
      { tier: 4, name: 'Diamond Stacker', shader: 'prismatic_core', minXP: 7000 },
      { tier: 5, name: 'Cosmic Sovereign', shader: 'supernova_singularity', minXP: 15000 },
    ];
    let vaultTier = vaultTiers[0];
    for (const vt of vaultTiers) {
      if (newXp >= vt.minXP) vaultTier = vt;
    }

    // 3. Sigil Glow
    let sigilGlow = 'supernova';
    if (wealthPulse < 500) sigilGlow = 'subtle';
    else if (wealthPulse < 1500) sigilGlow = 'normal';

    // 4. Tier Ascension
    const ascensionTiers = [
      { level: 1, name: 'Novice Plug', minXP: 0 },
      { level: 2, name: 'Active Plug', minXP: 1000 },
      { level: 3, name: 'Wealth Builder', minXP: 3000 },
      { level: 4, name: 'Grand Money Plug', minXP: 7000 },
      { level: 5, name: 'Cosmic Sovereign', minXP: 15000 },
    ];
    let currentAscTier = ascensionTiers[0];
    let newAscTier = ascensionTiers[0];
    for (const at of ascensionTiers) {
      if (currentXp >= at.minXP) currentAscTier = at;
      if (newXp >= at.minXP) newAscTier = at;
    }
    const previousTierLevel = currentAscTier.level;
    const ascended = newAscTier.level > previousTierLevel;

    // 5. Constellation Energy
    const annualArr = Math.max(120, (refCount || 1) * 120);
    const activeStars = Math.max(1, refCount || 3);
    const constellationEnergy = Math.round(activeStars * Math.log10(annualArr + 1) * 100) / 100;

    const now = new Date().toISOString();
    const txId = `tx_xp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      db.prepare(`
        UPDATE users 
        SET xp = ?, 
            level = ?, 
            tier_title = ?, 
            updated_at = ?
        WHERE id = ?
      `).run(newXp, newLevel, newAscTier.name, now, userId);

      try {
        db.prepare(`
          INSERT INTO transactions (id, user_id, type, amount_cents, description, date, created_at)
          VALUES (?, ?, 'expense', ?, ?, ?, ?)
        `).run(txId, userId, Math.round(pack.priceUsd * 100), `Purchased ${pack.name} (+${pack.xp.toLocaleString()} XP)`, now.substring(0, 10), now);
      } catch (e) {
        try {
          db.prepare(`
            INSERT INTO transactions (id, userId, type, amount, description, createdAt)
            VALUES (?, ?, 'points_purchase', ?, ?, ?)
          `).run(txId, userId, pack.priceUsd, `Purchased ${pack.name} (+${pack.xp.toLocaleString()} XP)`, now);
        } catch (e2) {}
      }

      db.exec('COMMIT;');
    } catch (dbErr) {
      db.exec('ROLLBACK;');
      throw dbErr;
    }

    res.status(200).json({
      status: 'SUCCESS',
      success: true,
      packId,
      packName: pack.name,
      xpAdded: pack.xp,
      newXP: newXp,
      newLevel,
      tier: newAscTier.level,
      tierName: newAscTier.name,
      ascended,
      vaultShader: vaultTier.shader,
      wealthPulse,
      sigilGlow,
      constellationEnergy,
      transactionId: txId,
    });
  } catch (err) {
    console.error('Error in points buy:', err);
    res.status(500).json({ error: 'POINTS_ERROR', message: err.message });
  }
});

// ==========================================
// 4. GET & POST /api/sigil/config
// ==========================================
app.get('/api/sigil/config', (req, res) => {
  try {
    let userId = req.user?.id || req.userId;
    if (!userId) {
      const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
      userId = firstUser?.id;
    }
    const cfg = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(userId) || {};
    res.json({
      success: true,
      data: {
        aura: cfg.aura || 'aura_cyber_emerald',
        glyph: cfg.glyph || 'glyph_metatron',
        ring: cfg.ring || 'ring_celestial_corona',
        crest: cfg.crest || 'crest_lightning',
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'CONFIG_ERROR', message: err.message });
  }
});

app.post('/api/sigil/config/save', (req, res) => {
  try {
    let userId = req.user?.id || req.userId;
    if (!userId) {
      const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
      userId = firstUser?.id;
    }
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }
    const { aura, glyph, ring, crest } = req.body || {};
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT user_id FROM user_sigil_config WHERE user_id = ?').get(userId);
    if (!existing) {
      db.prepare(`
        INSERT INTO user_sigil_config (user_id, aura, glyph, ring, crest, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, aura || null, glyph || null, ring || null, crest || null, now);
    } else {
      db.prepare(`
        UPDATE user_sigil_config 
        SET aura = ?, glyph = ?, ring = ?, crest = ?, updated_at = ? 
        WHERE user_id = ?
      `).run(aura || null, glyph || null, ring || null, crest || null, now, userId);
    }
    const updated = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(userId) || {};
    res.json({
      success: true,
      message: '🎉 Sigil customizations successfully saved to your Creator Passport!',
      data: {
        aura: updated.aura || null,
        glyph: updated.glyph || null,
        ring: updated.ring || null,
        crest: updated.crest || null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'SAVE_CONFIG_ERROR', message: err.message });
  }
});

// Start Server if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`⚡ MoneyPlugHub Purchase System Online on port ${PORT}`);
  });
}

export default app;
