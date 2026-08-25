import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db, runInTransaction, recordAuditLog } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';
import {
  computeWealthPulse,
  getVaultTierFromXP,
  getSigilGlowLevel,
  getAscensionTier,
  computeConstellationEnergy,
} from '../engine/wealthPulse';

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  SIGIL ENGINE & FORGE MARKETPLACE — Creator Money OS
//  Procedural Deterministic Vectors + Extensive Visual Customizer
// ═══════════════════════════════════════════════════════════════════

// ── Database Schema Migration ─────────────────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sigil_market_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('aura', 'glyph', 'ring', 'crest')),
      rarity TEXT NOT NULL CHECK(rarity IN ('common', 'rare', 'epic', 'legendary', 'cosmic')),
      cost_xp INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      preview_accent TEXT NOT NULL,
      config_data TEXT NOT NULL DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sigil_inventory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      is_equipped INTEGER NOT NULL DEFAULT 0,
      purchased_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES sigil_market_items(id),
      UNIQUE(user_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS user_sigil_config (
      user_id TEXT PRIMARY KEY,
      aura TEXT,
      glyph TEXT,
      ring TEXT,
      crest TEXT,
      motto TEXT,
      monogram TEXT,
      handle TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try {
    db.exec(`ALTER TABLE sigil_market_items ADD COLUMN min_level INTEGER NOT NULL DEFAULT 1;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE user_sigil_config ADD COLUMN motto TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE user_sigil_config ADD COLUMN monogram TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE user_sigil_config ADD COLUMN handle TEXT;`);
  } catch (e) {}

  // Seed / Synchronize Master 48-Item Visual Catalog with Gamified Level Unlocks
  const now = new Date().toISOString();
  const masterCatalog = [
    // ── AURAS & COSMIC SHADERS (12 Items) ──
    { id: 'aura_cyber_emerald', name: 'Cyber Matrix Aura', category: 'aura', rarity: 'rare', cost_xp: 250, min_level: 1, description: 'Neon Emerald & Cybernetic Laser Pulse shader (Starter Default).', preview_accent: '#00ff88', config_data: '{"theme":"cyber_emerald"}' },
    { id: 'aura_synthwave_sunset', name: 'Retro Synthwave Grid', category: 'aura', rarity: 'rare', cost_xp: 300, min_level: 2, description: 'Neon Magenta & Sunset Orange 80s synthwave horizon.', preview_accent: '#ec4899', config_data: '{"theme":"synthwave_sunset"}' },
    { id: 'aura_electric_plasma', name: 'High-Voltage Plasma', category: 'aura', rarity: 'rare', cost_xp: 350, min_level: 2, description: 'Ultraviolet laser discharge with ionized blue lightning arcs.', preview_accent: '#818cf8', config_data: '{"theme":"electric_plasma"}' },
    { id: 'aura_cosmic_nebula', name: 'Cosmic Nebula Aura', category: 'aura', rarity: 'epic', cost_xp: 400, min_level: 3, description: 'Deep Supernova Violet & Cyan atmospheric plasma.', preview_accent: '#a855f7', config_data: '{"theme":"cosmic_nebula"}' },
    { id: 'aura_quantum_ice', name: 'Glacial Quantum Frost', category: 'aura', rarity: 'epic', cost_xp: 600, min_level: 4, description: 'Sub-zero Arctic Cyan & Diamond Frost refraction.', preview_accent: '#22d3ee', config_data: '{"theme":"quantum_ice"}' },
    { id: 'aura_solar_flare', name: 'Solar Flare Aura', category: 'aura', rarity: 'epic', cost_xp: 750, min_level: 5, description: 'Radiant 24K Gold & Amber thermonuclear rays.', preview_accent: '#eab308', config_data: '{"theme":"solar_flare"}' },
    { id: 'aura_jade_dragon', name: 'Imperial Jade Sovereign', category: 'aura', rarity: 'epic', cost_xp: 900, min_level: 6, description: 'Deep Dynastic Jade with incandescent emerald flame refraction.', preview_accent: '#10b981', config_data: '{"theme":"jade_dragon"}' },
    { id: 'aura_osmium_diamond', name: 'Osmium Diamond Aura', category: 'aura', rarity: 'legendary', cost_xp: 1500, min_level: 7, description: 'Prismatic crystal refraction with iridescent dispersion.', preview_accent: '#38bdf8', config_data: '{"theme":"osmium_diamond"}' },
    { id: 'aura_stealth_carbon', name: 'Stealth Carbon Matrix', category: 'aura', rarity: 'legendary', cost_xp: 1800, min_level: 8, description: 'Matte carbon-fiber weave with titanium laser telemetry accents.', preview_accent: '#94a3b8', config_data: '{"theme":"stealth_carbon"}' },
    { id: 'aura_void_singularity', name: 'Void Singularity Aura', category: 'aura', rarity: 'cosmic', cost_xp: 2500, min_level: 9, description: 'Event Horizon Dark Matter with glowing crimson accretion disk.', preview_accent: '#f43f5e', config_data: '{"theme":"void_singularity"}' },
    { id: 'aura_primordial_gold', name: 'Primordia Pure Alchemy', category: 'aura', rarity: 'cosmic', cost_xp: 3500, min_level: 10, description: 'Liquid 24K Molten Gold with Aureate hyper-radiance.', preview_accent: '#ffd700', config_data: '{"theme":"primordial_gold"}' },
    { id: 'aura_bifrost_spectrum', name: 'Prismatic Bifrost Core', category: 'aura', rarity: 'cosmic', cost_xp: 4000, min_level: 10, description: 'Chromatic hyper-spectrum dispersion warping spacetime geometry.', preview_accent: '#f472b6', config_data: '{"theme":"bifrost_spectrum"}' },

    // ── SACRED CORE GLYPHS (12 Items) ──
    { id: 'glyph_quantum_hex', name: 'Quantum Hex Lattice', category: 'glyph', rarity: 'rare', cost_xp: 450, min_level: 1, description: 'Subatomic hexagonal matrix pulsing with data streams (Starter Default).', preview_accent: '#10b981', config_data: '{"type":"quantum_hex"}' },
    { id: 'glyph_metatron', name: "Metatron's Sacred Cube", category: 'glyph', rarity: 'rare', cost_xp: 350, min_level: 2, description: 'Ancient Sacred Geometry core mapping multi-dimensional harmony.', preview_accent: '#3b82f6', config_data: '{"type":"metatron"}' },
    { id: 'glyph_octagram', name: 'Celestial Octagram', category: 'glyph', rarity: 'epic', cost_xp: 650, min_level: 3, description: '8-Pointed Star of Supreme Alignment and Abundance.', preview_accent: '#f59e0b', config_data: '{"type":"octagram"}' },
    { id: 'glyph_flower_of_life', name: 'Flower of Life Core', category: 'glyph', rarity: 'epic', cost_xp: 850, min_level: 4, description: 'Ancient overlapping circles generating universal resonance.', preview_accent: '#06b6d4', config_data: '{"type":"flower_of_life"}' },
    { id: 'glyph_apex_crown', name: 'Apex Sovereign Seal', category: 'glyph', rarity: 'epic', cost_xp: 950, min_level: 5, description: 'Imperial 7-Point diamond-studded crest of digital sovereignty.', preview_accent: '#ffd700', config_data: '{"type":"apex_crown"}' },
    { id: 'glyph_tesseract', name: '4D Hypercube Tesseract', category: 'glyph', rarity: 'legendary', cost_xp: 1200, min_level: 6, description: 'Transcendent fourth-dimensional mathematical hypercube.', preview_accent: '#8b5cf6', config_data: '{"type":"tesseract"}' },
    { id: 'glyph_merkaba_vehicle', name: 'Merkaba Star Vehicle', category: 'glyph', rarity: 'legendary', cost_xp: 1600, min_level: 7, description: 'Dual interlocking tetrahedrons of light and ascension.', preview_accent: '#fbbf24', config_data: '{"type":"merkaba_vehicle"}' },
    { id: 'glyph_dragon_crest', name: 'Cyber Imperial Dragon', category: 'glyph', rarity: 'legendary', cost_xp: 1750, min_level: 8, description: 'Mecha Dragon crest symbolizing supreme market dominance.', preview_accent: '#ef4444', config_data: '{"type":"dragon_crest"}' },
    { id: 'glyph_phoenix_core', name: 'Phoenix Fire Heart', category: 'glyph', rarity: 'legendary', cost_xp: 1900, min_level: 9, description: 'Immortal firebird core generating continuous capital rebirth.', preview_accent: '#f97316', config_data: '{"type":"phoenix_core"}' },
    { id: 'glyph_primordia_eye', name: 'Eye of Primordia', category: 'glyph', rarity: 'cosmic', cost_xp: 2000, min_level: 9, description: 'Omniscient core glyph seeing all cashflow vectors in real-time.', preview_accent: '#ec4899', config_data: '{"type":"primordia_eye"}' },
    { id: 'glyph_infinity_ouroboros', name: 'Ouroboros Infinity Knot', category: 'glyph', rarity: 'cosmic', cost_xp: 2800, min_level: 10, description: 'Infinite dragon loop generating eternal compounding wealth.', preview_accent: '#14b8a6', config_data: '{"type":"infinity_ouroboros"}' },
    { id: 'glyph_cyber_lotus', name: 'Geometric Cyber Lotus', category: 'glyph', rarity: 'cosmic', cost_xp: 3200, min_level: 10, description: 'Sacred 8-petal vector lotus of inner peace and endless compounding.', preview_accent: '#a855f7', config_data: '{"type":"cyber_lotus"}' },

    // ── RADIAL RING FX (12 Items) ──
    { id: 'ring_circuit_traces', name: 'Cyber PCB Trace Ring', category: 'ring', rarity: 'rare', cost_xp: 500, min_level: 1, description: 'Gold microchip motherboard circuit traces and bus nodes (Starter Default).', preview_accent: '#10b981', config_data: '{"type":"circuit_traces"}' },
    { id: 'ring_celestial_corona', name: '8-Fold Corona Ring', category: 'ring', rarity: 'rare', cost_xp: 300, min_level: 2, description: 'Pulsing radial solar corona surrounding outer perimeter.', preview_accent: '#06b6d4', config_data: '{"type":"celestial_corona"}' },
    { id: 'ring_rune_encryption', name: 'Elder Runic Cipher Ring', category: 'ring', rarity: 'rare', cost_xp: 400, min_level: 3, description: 'Ancient Nordic runic encryption boundary guarding the sigil.', preview_accent: '#94a3b8', config_data: '{"type":"rune_encryption"}' },
    { id: 'ring_laser_scanlines', name: 'Dual Laser Radar Sweeper', category: 'ring', rarity: 'rare', cost_xp: 450, min_level: 4, description: 'Twin high-precision radar laser sweep lines scanning 360 degrees.', preview_accent: '#34d399', config_data: '{"type":"laser_scanlines"}' },
    { id: 'ring_particle_flux', name: 'Particle Flux Stream', category: 'ring', rarity: 'epic', cost_xp: 600, min_level: 5, description: 'Dotted particle orbit ring simulating relativistic motion.', preview_accent: '#a855f7', config_data: '{"type":"particle_flux"}' },
    { id: 'ring_dual_event_horizon', name: 'Dual Event Horizon Orbitals', category: 'ring', rarity: 'epic', cost_xp: 750, min_level: 6, description: 'Twin intersecting tilted gravitational event horizon rings.', preview_accent: '#38bdf8', config_data: '{"type":"dual_event_horizon"}' },
    { id: 'ring_hex_shield_grid', name: 'Honeycomb Aegis Barrier', category: 'ring', rarity: 'epic', cost_xp: 850, min_level: 7, description: 'Fortified hexagonal nano-shield grid perimeter.', preview_accent: '#38bdf8', config_data: '{"type":"hex_shield_grid"}' },
    { id: 'ring_astral_zodiac', name: 'Astral Constellation Wheel', category: 'ring', rarity: 'legendary', cost_xp: 1300, min_level: 8, description: '12-node celestial star alignment ring with connecting lines.', preview_accent: '#f59e0b', config_data: '{"type":"astral_zodiac"}' },
    { id: 'ring_harmonic_pulse', name: 'Harmonic Resonator Ring', category: 'ring', rarity: 'legendary', cost_xp: 1400, min_level: 9, description: 'Triple frequency sinusoidal oscillation wave.', preview_accent: '#f97316', config_data: '{"type":"harmonic_pulse"}' },
    { id: 'ring_diamond_bezel', name: '16-Facet Diamond Cut Bezel', category: 'ring', rarity: 'legendary', cost_xp: 1600, min_level: 9, description: 'Ultra-luxurious multi-faceted gemstone vector bevel ring.', preview_accent: '#e0e7ff', config_data: '{"type":"diamond_bezel"}' },
    { id: 'ring_singularity_vortex', name: 'Singularity Graviton Vortex', category: 'ring', rarity: 'cosmic', cost_xp: 2200, min_level: 10, description: 'Deep space warping spiral galaxy arms twisting inward.', preview_accent: '#e11d48', config_data: '{"type":"singularity_vortex"}' },
    { id: 'ring_ouroboros_orbit', name: 'Celestial Dragon Orbit Ring', category: 'ring', rarity: 'cosmic', cost_xp: 3000, min_level: 10, description: 'Mythic serpent encircling the perimeter with glowing scales.', preview_accent: '#ffd700', config_data: '{"type":"ouroboros_orbit"}' },

    // ── CRESTS & SEALS (12 Items) ──
    { id: 'crest_cyber_spikes', name: 'Mecha Hyper-Spikes', category: 'crest', rarity: 'rare', cost_xp: 550, min_level: 1, description: 'Tri-blade aggressive aerodynamic mecha crown spikes (Starter Default).', preview_accent: '#34d399', config_data: '{"type":"cyber_spikes"}' },
    { id: 'crest_lightning', name: 'Zeus Dual Lightning Crest', category: 'crest', rarity: 'rare', cost_xp: 350, min_level: 2, description: 'Twin electrostatic bolts crowning the upper sigil arc.', preview_accent: '#38bdf8', config_data: '{"type":"lightning"}' },
    { id: 'crest_valkyrie_horns', name: 'Valkyrie Sonic Horns', category: 'crest', rarity: 'rare', cost_xp: 450, min_level: 3, description: 'Neo-Nordic high-frequency resonance antennae.', preview_accent: '#c084fc', config_data: '{"type":"valkyrie_horns"}' },
    { id: 'crest_crown', name: 'Crown of the Money Plug', category: 'crest', rarity: 'epic', cost_xp: 650, min_level: 4, description: '5-Point Imperial Crown of Digital Sovereignty.', preview_accent: '#eab308', config_data: '{"type":"crown"}' },
    { id: 'crest_ouroboros_shield', name: 'Aegis Diamond Shield', category: 'crest', rarity: 'epic', cost_xp: 800, min_level: 5, description: 'Heavy fortified diamond barricade crest guarding against loss.', preview_accent: '#06b6d4', config_data: '{"type":"ouroboros_shield"}' },
    { id: 'crest_halo_ascendance', name: 'Ascendant Tri-Halo', category: 'crest', rarity: 'epic', cost_xp: 1250, min_level: 6, description: 'Floating angelic luminous triple-ring halo of enlightenment.', preview_accent: '#fef08a', config_data: '{"type":"halo_ascendance"}' },
    { id: 'crest_angel_wings', name: 'Seraphim Cyber Wings', category: 'crest', rarity: 'legendary', cost_xp: 1100, min_level: 7, description: 'Dual biometric angel wings arching across the sigil.', preview_accent: '#c084fc', config_data: '{"type":"angel_wings"}' },
    { id: 'crest_phoenix_rebirth', name: 'Phoenix Rising Flame Wings', category: 'crest', rarity: 'legendary', cost_xp: 1500, min_level: 8, description: 'Immortal golden firebird crest ascending from the ashes.', preview_accent: '#f97316', config_data: '{"type":"phoenix_rebirth"}' },
    { id: 'crest_dragon_horns', name: 'Mecha Dragon Horns', category: 'crest', rarity: 'legendary', cost_xp: 1650, min_level: 8, description: 'Twin curved cybernetic dragon horns radiating dominance.', preview_accent: '#ef4444', config_data: '{"type":"dragon_horns"}' },
    { id: 'crest_vault_seal', name: 'Imperial Diamond Vault Seal', category: 'crest', rarity: 'cosmic', cost_xp: 1800, min_level: 9, description: 'Ancient runic encryption ring sealing the living vault.', preview_accent: '#14b8a6', config_data: '{"type":"vault_seal"}' },
    { id: 'crest_quantum_antenna', name: 'Quantum Telemetry Array', category: 'crest', rarity: 'cosmic', cost_xp: 3400, min_level: 9, description: 'Subatomic orbital communications antenna bridging realms.', preview_accent: '#38bdf8', config_data: '{"type":"quantum_antenna"}' },
    { id: 'crest_omni_sovereign', name: 'Sovereign Crown of Osmium', category: 'crest', rarity: 'cosmic', cost_xp: 5000, min_level: 10, description: 'The supreme master crest of PrimordiaOS. Infinite status.', preview_accent: '#ffd700', config_data: '{"type":"omni_sovereign"}' },
  ];

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO sigil_market_items (id, name, category, rarity, cost_xp, min_level, description, preview_accent, config_data, is_active, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  masterCatalog.forEach((item, index) => {
    insertStmt.run(item.id, item.name, item.category, item.rarity, item.cost_xp, item.min_level, item.description, item.preview_accent, item.config_data, index, now);
  });
} catch (e: any) {
  console.error('Sigil Market Migration error:', e.message);
}

export interface SigilCustomConfig {
  aura?: string | null;
  glyph?: string | null;
  ring?: string | null;
  crest?: string | null;
  glow_level?: 'subtle' | 'normal' | 'supernova' | null;
  handle?: string | null;
  motto?: string | null;
  monogram?: string | null;
  orbit_speed?: number | string | null;
  chromatic?: boolean | null;
  particle_density?: number | null;
}

/**
 * Hash a string into a fixed array of numbers (0-255) for deterministic generation.
 */
function hashToBytes(input: string): number[] {
  const hash = crypto.createHash('sha256').update(input).digest();
  return Array.from(hash);
}

function hf(bytes: number[], i: number): number {
  return bytes[i % bytes.length] / 255;
}

function hi(bytes: number[], i: number, min: number, max: number): number {
  return Math.floor(hf(bytes, i) * (max - min + 1)) + min;
}

function hslColor(bytes: number[], offset: number, satMin = 50, satMax = 90, lightMin = 45, lightMax = 70): string {
  const h = Math.floor(hf(bytes, offset) * 360);
  const s = hi(bytes, offset + 1, satMin, satMax);
  const l = hi(bytes, offset + 2, lightMin, lightMax);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Generate a unique, ultra-high-fidelity SVG sigil with rich vector shaders,
 * holographic geometry, radial rings, imperial crests, and dynamic text paths.
 */
export function generateSigil(referralCode: string, size: number = 256, customConfig?: SigilCustomConfig): string {
  const bytes = hashToBytes(referralCode.toUpperCase());

  // ── 1. Color Palette & Cosmic Theme Shaders ──
  let primary = hslColor(bytes, 0, 60, 95, 50, 70);
  let secondary = hslColor(bytes, 3, 50, 85, 40, 65);
  let accent = hslColor(bytes, 6, 70, 100, 55, 80);
  let bgDark = `hsl(${hi(bytes, 9, 200, 280)}, ${hi(bytes, 10, 15, 30)}%, ${hi(bytes, 11, 5, 12)}%)`;
  let glowColor = primary;

  const auraTheme = customConfig?.aura || 'aura_cyber_emerald';

  if (auraTheme === 'aura_cyber_emerald') {
    primary = '#00ff88'; secondary = '#00bb66'; accent = '#38ef7d'; bgDark = '#021209'; glowColor = '#00ff88';
  } else if (auraTheme === 'aura_synthwave_sunset') {
    primary = '#ec4899'; secondary = '#f97316'; accent = '#fbbf24'; bgDark = '#14031f'; glowColor = '#ec4899';
  } else if (auraTheme === 'aura_cosmic_nebula') {
    primary = '#c084fc'; secondary = '#38bdf8'; accent = '#f472b6'; bgDark = '#0b0217'; glowColor = '#c084fc';
  } else if (auraTheme === 'aura_quantum_ice') {
    primary = '#22d3ee'; secondary = '#38bdf8'; accent = '#e0f2fe'; bgDark = '#021320'; glowColor = '#22d3ee';
  } else if (auraTheme === 'aura_solar_flare') {
    primary = '#fbbf24'; secondary = '#f59e0b'; accent = '#f97316'; bgDark = '#170900'; glowColor = '#fbbf24';
  } else if (auraTheme === 'aura_osmium_diamond') {
    primary = '#38bdf8'; secondary = '#818cf8'; accent = '#e0e7ff'; bgDark = '#040b17'; glowColor = '#38bdf8';
  } else if (auraTheme === 'aura_void_singularity') {
    primary = '#f43f5e'; secondary = '#881337'; accent = '#fb7185'; bgDark = '#040008'; glowColor = '#f43f5e';
  } else if (auraTheme === 'aura_primordial_gold') {
    primary = '#ffd700'; secondary = '#eab308'; accent = '#fffbeb'; bgDark = '#140c00'; glowColor = '#ffd700';
  } else if (auraTheme === 'aura_electric_plasma') {
    primary = '#818cf8'; secondary = '#6366f1'; accent = '#c7d2fe'; bgDark = '#050518'; glowColor = '#818cf8';
  } else if (auraTheme === 'aura_jade_dragon') {
    primary = '#10b981'; secondary = '#047857'; accent = '#a7f3d0'; bgDark = '#01130d'; glowColor = '#10b981';
  } else if (auraTheme === 'aura_stealth_carbon') {
    primary = '#94a3b8'; secondary = '#64748b'; accent = '#cbd5e1'; bgDark = '#090d14'; glowColor = '#94a3b8';
  } else if (auraTheme === 'aura_bifrost_spectrum') {
    primary = '#f472b6'; secondary = '#38bdf8'; accent = '#fbbf24'; bgDark = '#0c041a'; glowColor = '#f472b6';
  }

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.40;

  // ── Symmetry Order ──
  const symmetry = hi(bytes, 12, 4, 8);
  const angleStep = (Math.PI * 2) / symmetry;

  let elements = '';

  // ── Background Particle Matrix & Cosmic Grid ──
  for (let p = 0; p < 18; p++) {
    const px = cx + (hf(bytes, p * 3) - 0.5) * (size * 0.85);
    const py = cy + (hf(bytes, p * 3 + 1) - 0.5) * (size * 0.85);
    const pr = 0.8 + hf(bytes, p * 3 + 2) * 1.5;
    const po = 0.3 + hf(bytes, p * 3) * 0.5;
    elements += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(1)}" fill="${accent}" opacity="${po.toFixed(2)}"/>`;
  }

  // ── 2. Concentric Orbitals & Sacred Boundary ──
  const outerR = maxR * (0.85 + hf(bytes, 13) * 0.15);
  const innerR = maxR * (0.36 + hf(bytes, 15) * 0.18);
  const ringWidth = hi(bytes, 14, 1.5, 3);

  elements += `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${primary}" stroke-width="${ringWidth}" opacity="0.75"/>`;
  elements += `<circle cx="${cx}" cy="${cy}" r="${outerR - 6}" fill="none" stroke="${secondary}" stroke-width="1" stroke-dasharray="3 5" opacity="0.6"/>`;
  elements += `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${secondary}" stroke-width="${ringWidth}" opacity="0.65"/>`;
  elements += `<circle cx="${cx}" cy="${cy}" r="${innerR + 8}" fill="none" stroke="${accent}" stroke-width="0.8" stroke-dasharray="2 4" opacity="0.5"/>`;

  // ── 3. Custom Ring FX (12 Distinct Orbital Modes) ──
  const activeRing = customConfig?.ring || 'ring_celestial_corona';
  if (activeRing === 'ring_celestial_corona') {
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI * 2) / 32;
      const r1 = outerR + 2;
      const r2 = outerR + 7 + (i % 2 === 0 ? 7 : 3);
      elements += `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(cy + Math.sin(a) * r1).toFixed(1)}" x2="${(cx + Math.cos(a) * r2).toFixed(1)}" y2="${(cy + Math.sin(a) * r2).toFixed(1)}" stroke="${accent}" stroke-width="1.5" opacity="0.85"/>`;
    }
  } else if (activeRing === 'ring_rune_encryption') {
    for (let i = 0; i < 20; i++) {
      const a = (i * Math.PI * 2) / 20;
      const rx = cx + Math.cos(a) * (outerR + 6);
      const ry = cy + Math.sin(a) * (outerR + 6);
      elements += `<circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="2" fill="${accent}" opacity="0.9"/>`;
      elements += `<line x1="${(rx - 2).toFixed(1)}" y1="${(ry - 2).toFixed(1)}" x2="${(rx + 2).toFixed(1)}" y2="${(ry + 2).toFixed(1)}" stroke="${primary}" stroke-width="1"/>`;
    }
  } else if (activeRing === 'ring_circuit_traces') {
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16;
      const r1 = outerR + 1;
      const r2 = outerR + 7;
      const x1 = cx + Math.cos(a) * r1;
      const y1 = cy + Math.sin(a) * r1;
      const x2 = cx + Math.cos(a + 0.1) * r2;
      const y2 = cy + Math.sin(a + 0.1) * r2;
      elements += `<polyline points="${x1.toFixed(1)},${y1.toFixed(1)} ${(x1 + 3).toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.85"/>`;
      elements += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="1.8" fill="${primary}"/>`;
    }
  } else if (activeRing === 'ring_particle_flux') {
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI * 2) / 24;
      const r = outerR + 6;
      elements += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${i % 2 === 0 ? 2.5 : 1.5}" fill="${accent}" opacity="0.9"/>`;
    }
  } else if (activeRing === 'ring_dual_event_horizon') {
    elements += `<ellipse cx="${cx}" cy="${cy}" rx="${outerR + 9}" ry="${outerR * 0.5}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.85" transform="rotate(35 ${cx} ${cy})"/>`;
    elements += `<ellipse cx="${cx}" cy="${cy}" rx="${outerR + 9}" ry="${outerR * 0.5}" fill="none" stroke="${primary}" stroke-width="1.5" opacity="0.85" transform="rotate(-35 ${cx} ${cy})"/>`;
  } else if (activeRing === 'ring_astral_zodiac') {
    for (let i = 0; i < 12; i++) {
      const a1 = (i * Math.PI * 2) / 12;
      const a2 = ((i + 1) * Math.PI * 2) / 12;
      const r = outerR + 7;
      elements += `<circle cx="${(cx + Math.cos(a1) * r).toFixed(1)}" cy="${(cy + Math.sin(a1) * r).toFixed(1)}" r="2.2" fill="#ffffff" opacity="0.95"/>`;
      elements += `<line x1="${(cx + Math.cos(a1) * r).toFixed(1)}" y1="${(cy + Math.sin(a1) * r).toFixed(1)}" x2="${(cx + Math.cos(a2) * r).toFixed(1)}" y2="${(cy + Math.sin(a2) * r).toFixed(1)}" stroke="${accent}" stroke-width="1" opacity="0.7"/>`;
    }
  } else if (activeRing === 'ring_harmonic_pulse') {
    elements += `<circle cx="${cx}" cy="${cy}" r="${outerR + 5}" fill="none" stroke="${accent}" stroke-width="1.2" stroke-dasharray="4 6" opacity="0.8"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${outerR + 11}" fill="none" stroke="${primary}" stroke-width="1.2" stroke-dasharray="8 4" opacity="0.65"/>`;
  } else if (activeRing === 'ring_singularity_vortex') {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      elements += `<path d="M ${cx} ${cy} Q ${(cx + Math.cos(a) * outerR * 0.7).toFixed(1)} ${(cy + Math.sin(a + 0.8) * outerR * 0.7).toFixed(1)} ${(cx + Math.cos(a + 1.2) * (outerR + 12)).toFixed(1)} ${(cy + Math.sin(a + 1.2) * (outerR + 12)).toFixed(1)}" fill="none" stroke="${accent}" stroke-width="1.8" opacity="0.85"/>`;
    }
  } else if (activeRing === 'ring_laser_scanlines') {
    elements += `<line x1="${cx - outerR - 12}" y1="${cy}" x2="${cx + outerR + 12}" y2="${cy}" stroke="${accent}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.85"/>`;
    elements += `<line x1="${cx}" y1="${cy - outerR - 12}" x2="${cx}" y2="${cy + outerR + 12}" stroke="${accent}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.85"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${outerR + 8}" fill="none" stroke="${primary}" stroke-width="1.5" stroke-dasharray="12 8" opacity="0.75"/>`;
  } else if (activeRing === 'ring_hex_shield_grid') {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const hx = cx + Math.cos(a) * (outerR + 8);
      const hy = cy + Math.sin(a) * (outerR + 8);
      elements += `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="4.5" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.9"/>`;
      elements += `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="1.5" fill="${primary}"/>`;
    }
  } else if (activeRing === 'ring_diamond_bezel') {
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16;
      const bx = cx + Math.cos(a) * (outerR + 7);
      const by = cy + Math.sin(a) * (outerR + 7);
      elements += `<polygon points="${bx.toFixed(1)},${(by - 3).toFixed(1)} ${(bx + 3).toFixed(1)},${by.toFixed(1)} ${bx.toFixed(1)},${(by + 3).toFixed(1)} ${(bx - 3).toFixed(1)},${by.toFixed(1)}" fill="${i % 2 === 0 ? accent : primary}" opacity="0.9"/>`;
    }
  } else if (activeRing === 'ring_ouroboros_orbit') {
    elements += `<circle cx="${cx}" cy="${cy}" r="${outerR + 7}" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="8 6" opacity="0.85"/>`;
    elements += `<polygon points="${cx},${(cy - outerR - 10).toFixed(1)} ${(cx + 6).toFixed(1)},${(cy - outerR - 3).toFixed(1)} ${(cx - 6).toFixed(1)},${(cy - outerR - 3).toFixed(1)}" fill="${primary}"/>`;
  }

  // ── 4. Center Glyph (12 Master Sacred Geometry Cores) ──
  const glyphR = maxR * 0.24;
  const activeGlyph = customConfig?.glyph || 'glyph_metatron';

  if (activeGlyph === 'glyph_metatron') {
    elements += `<polygon points="${cx},${cy - glyphR} ${cx + glyphR * 0.86},${cy - glyphR * 0.5} ${cx + glyphR * 0.86},${cy + glyphR * 0.5} ${cx},${cy + glyphR} ${cx - glyphR * 0.86},${cy + glyphR * 0.5} ${cx - glyphR * 0.86},${cy - glyphR * 0.5}" fill="none" stroke="${accent}" stroke-width="1.8" opacity="0.95"/>`;
    elements += `<polygon points="${cx},${cy + glyphR} ${cx - glyphR * 0.86},${cy - glyphR * 0.5} ${cx + glyphR * 0.86},${cy - glyphR * 0.5}" fill="none" stroke="${primary}" stroke-width="1.2" opacity="0.85"/>`;
    elements += `<polygon points="${cx},${cy - glyphR} ${cx - glyphR * 0.86},${cy + glyphR * 0.5} ${cx + glyphR * 0.86},${cy + glyphR * 0.5}" fill="none" stroke="${primary}" stroke-width="1.2" opacity="0.85"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.45}" fill="${accent}" opacity="0.95"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.18}" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_quantum_hex') {
    elements += `<polygon points="${cx},${cy - glyphR} ${cx + glyphR * 0.86},${cy - glyphR * 0.5} ${cx + glyphR * 0.86},${cy + glyphR * 0.5} ${cx},${cy + glyphR} ${cx - glyphR * 0.86},${cy + glyphR * 0.5} ${cx - glyphR * 0.86},${cy - glyphR * 0.5}" fill="${accent}" opacity="0.45"/>`;
    elements += `<polygon points="${cx},${cy - glyphR} ${cx + glyphR * 0.86},${cy - glyphR * 0.5} ${cx + glyphR * 0.86},${cy + glyphR * 0.5} ${cx},${cy + glyphR} ${cx - glyphR * 0.86},${cy + glyphR * 0.5} ${cx - glyphR * 0.86},${cy - glyphR * 0.5}" fill="none" stroke="${primary}" stroke-width="2.2"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_octagram') {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16 - Math.PI / 2;
      const r = i % 2 === 0 ? glyphR : glyphR * 0.45;
      pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
    }
    elements += `<polygon points="${pts.join(' ')}" fill="${accent}" opacity="0.95"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.25}" fill="${bgDark}"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.12}" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_flower_of_life') {
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.65}" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.95"/>`;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      elements += `<circle cx="${(cx + Math.cos(a) * glyphR * 0.65).toFixed(1)}" cy="${(cy + Math.sin(a) * glyphR * 0.65).toFixed(1)}" r="${glyphR * 0.65}" fill="none" stroke="${primary}" stroke-width="1.2" opacity="0.8"/>`;
    }
    elements += `<circle cx="${cx}" cy="${cy}" r="3" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_tesseract') {
    const innerT = glyphR * 0.52;
    elements += `<rect x="${cx - glyphR}" y="${cy - glyphR}" width="${glyphR * 2}" height="${glyphR * 2}" fill="none" stroke="${primary}" stroke-width="1.6" opacity="0.85"/>`;
    elements += `<rect x="${cx - innerT}" y="${cy - innerT}" width="${innerT * 2}" height="${innerT * 2}" fill="${accent}" opacity="0.45"/>`;
    elements += `<rect x="${cx - innerT}" y="${cy - innerT}" width="${innerT * 2}" height="${innerT * 2}" fill="none" stroke="${accent}" stroke-width="1.6"/>`;
    elements += `<line x1="${cx - glyphR}" y1="${cy - glyphR}" x2="${cx - innerT}" y2="${cy - innerT}" stroke="${secondary}" stroke-width="1.2"/>`;
    elements += `<line x1="${cx + glyphR}" y1="${cy - glyphR}" x2="${cx + innerT}" y2="${cy - innerT}" stroke="${secondary}" stroke-width="1.2"/>`;
    elements += `<line x1="${cx + glyphR}" y1="${cy + glyphR}" x2="${cx + innerT}" y2="${cy + innerT}" stroke="${secondary}" stroke-width="1.2"/>`;
    elements += `<line x1="${cx - glyphR}" y1="${cy + glyphR}" x2="${cx - innerT}" y2="${cy + innerT}" stroke="${secondary}" stroke-width="1.2"/>`;
  } else if (activeGlyph === 'glyph_merkaba_vehicle') {
    elements += `<polygon points="${cx},${cy - glyphR} ${cx + glyphR * 0.86},${cy + glyphR * 0.5} ${cx - glyphR * 0.86},${cy + glyphR * 0.5}" fill="${primary}" opacity="0.6"/>`;
    elements += `<polygon points="${cx},${cy + glyphR} ${cx + glyphR * 0.86},${cy - glyphR * 0.5} ${cx - glyphR * 0.86},${cy - glyphR * 0.5}" fill="${accent}" opacity="0.6"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.28}" fill="#ffffff" opacity="0.95"/>`;
  } else if (activeGlyph === 'glyph_primordia_eye') {
    elements += `<path d="M ${cx - glyphR * 1.3} ${cy} Q ${cx} ${cy - glyphR * 0.95} ${cx + glyphR * 1.3} ${cy} Q ${cx} ${cy + glyphR * 0.95} ${cx - glyphR * 1.3} ${cy}" fill="none" stroke="${accent}" stroke-width="2.4"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.48}" fill="${primary}" opacity="0.95"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.22}" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_infinity_ouroboros') {
    elements += `<path d="M ${cx - glyphR * 0.6} ${cy} C ${cx - glyphR * 0.6} ${cy - glyphR * 0.6}, ${cx} ${cy - glyphR * 0.6}, ${cx} ${cy} C ${cx} ${cy + glyphR * 0.6}, ${cx + glyphR * 0.6} ${cy + glyphR * 0.6}, ${cx + glyphR * 0.6} ${cy} C ${cx + glyphR * 0.6} ${cy - glyphR * 0.6}, ${cx} ${cy - glyphR * 0.6}, ${cx} ${cy} C ${cx} ${cy + glyphR * 0.6}, ${cx - glyphR * 0.6} ${cy + glyphR * 0.6}, ${cx - glyphR * 0.6} ${cy} Z" fill="none" stroke="${accent}" stroke-width="3" opacity="0.95"/>`;
    elements += `<circle cx="${cx - glyphR * 0.6}" cy="${cy}" r="2.5" fill="#ffffff"/>`;
    elements += `<circle cx="${cx + glyphR * 0.6}" cy="${cy}" r="2.5" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_dragon_crest') {
    elements += `<polygon points="${cx},${cy - glyphR} ${cx + glyphR * 0.8},${cy - glyphR * 0.3} ${cx + glyphR * 0.5},${cy + glyphR * 0.8} ${cx},${cy + glyphR * 0.4} ${cx - glyphR * 0.5},${cy + glyphR * 0.8} ${cx - glyphR * 0.8},${cy - glyphR * 0.3}" fill="${primary}" opacity="0.8"/>`;
    elements += `<polygon points="${cx},${cy - glyphR * 0.6} ${cx + glyphR * 0.4},${cy} ${cx},${cy + glyphR * 0.2} ${cx - glyphR * 0.4},${cy}" fill="${accent}"/>`;
    elements += `<circle cx="${cx}" cy="${cy - glyphR * 0.2}" r="3" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_apex_crown') {
    elements += `<polygon points="${cx - glyphR},${cy + glyphR * 0.5} ${cx - glyphR},${cy - glyphR * 0.3} ${cx - glyphR * 0.5},${cy} ${cx},${cy - glyphR * 0.7} ${cx + glyphR * 0.5},${cy} ${cx + glyphR},${cy - glyphR * 0.3} ${cx + glyphR},${cy + glyphR * 0.5}" fill="${accent}" opacity="0.9"/>`;
    elements += `<circle cx="${cx}" cy="${cy - glyphR * 0.8}" r="3" fill="#ffffff"/>`;
    elements += `<circle cx="${cx - glyphR}" cy="${cy - glyphR * 0.4}" r="2" fill="#ffffff"/>`;
    elements += `<circle cx="${cx + glyphR}" cy="${cy - glyphR * 0.4}" r="2" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_phoenix_core') {
    elements += `<path d="M ${cx} ${cy - glyphR} Q ${cx + glyphR} ${cy - glyphR * 0.2} ${cx + glyphR * 0.6} ${cy + glyphR * 0.6} Q ${cx} ${cy + glyphR * 0.2} ${cx - glyphR * 0.6} ${cy + glyphR * 0.6} Q ${cx - glyphR} ${cy - glyphR * 0.2} ${cx} ${cy - glyphR}" fill="${accent}" opacity="0.85"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.3}" fill="${primary}"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="3" fill="#ffffff"/>`;
  } else if (activeGlyph === 'glyph_cyber_lotus') {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const lx = cx + Math.cos(a) * glyphR * 0.55;
      const ly = cy + Math.sin(a) * glyphR * 0.55;
      elements += `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="${glyphR * 0.45}" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.75"/>`;
    }
    elements += `<circle cx="${cx}" cy="${cy}" r="${glyphR * 0.3}" fill="${primary}" opacity="0.9"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="#ffffff"/>`;
  }

  // ── 5. Radial Symmetry Energy Lattice ──
  const armLayers = hi(bytes, 17, 2, 4);
  for (let layer = 0; layer < armLayers; layer++) {
    const byteOff = 18 + layer * 6;
    const armR1 = innerR + (outerR - innerR) * (0.2 + (layer / armLayers) * 0.6);
    const armR2 = innerR + (outerR - innerR) * (0.3 + (layer / armLayers) * 0.7);
    const armType = hi(bytes, byteOff, 0, 5);
    const armColor = layer % 2 === 0 ? primary : secondary;
    const armWidth = 1 + hf(bytes, byteOff + 1) * 2;

    for (let s = 0; s < symmetry; s++) {
      const baseAngle = s * angleStep + hf(bytes, byteOff + 2) * angleStep * 0.3;

      if (armType === 0) {
        const x1 = cx + Math.cos(baseAngle) * innerR * 1.2;
        const y1 = cy + Math.sin(baseAngle) * innerR * 1.2;
        const x2 = cx + Math.cos(baseAngle) * armR2;
        const y2 = cy + Math.sin(baseAngle) * armR2;
        elements += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${armColor}" stroke-width="${armWidth.toFixed(1)}" stroke-linecap="round" opacity="0.75"/>`;
      } else if (armType === 1) {
        const dotR = 2 + hf(bytes, byteOff + 3) * 4;
        const dx = cx + Math.cos(baseAngle) * armR1;
        const dy = cy + Math.sin(baseAngle) * armR1;
        elements += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${dotR.toFixed(1)}" fill="${armColor}" opacity="0.85"/>`;
      } else if (armType === 2) {
        const triR = 4 + hf(bytes, byteOff + 3) * 8;
        const tcx = cx + Math.cos(baseAngle) * armR1;
        const tcy = cy + Math.sin(baseAngle) * armR1;
        const pts = [];
        for (let t = 0; t < 3; t++) {
          const a = baseAngle + (t * Math.PI * 2) / 3;
          pts.push(`${(tcx + Math.cos(a) * triR).toFixed(1)},${(tcy + Math.sin(a) * triR).toFixed(1)}`);
        }
        elements += `<polygon points="${pts.join(' ')}" fill="${armColor}" opacity="0.75"/>`;
      } else if (armType === 3) {
        const startA = baseAngle - angleStep * 0.2;
        const endA = baseAngle + angleStep * 0.2;
        const x1 = cx + Math.cos(startA) * armR1;
        const y1 = cy + Math.sin(startA) * armR1;
        const x2 = cx + Math.cos(endA) * armR1;
        const y2 = cy + Math.sin(endA) * armR1;
        elements += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${armR1.toFixed(1)} ${armR1.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${armColor}" stroke-width="${armWidth.toFixed(1)}" stroke-linecap="round" opacity="0.65"/>`;
      } else {
        const x1 = cx + Math.cos(baseAngle) * innerR * 1.1;
        const y1 = cy + Math.sin(baseAngle) * innerR * 1.1;
        const spread = angleStep * 0.15;
        const x2a = cx + Math.cos(baseAngle - spread) * armR2;
        const y2a = cy + Math.sin(baseAngle - spread) * armR2;
        elements += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2a.toFixed(1)}" y2="${y2a.toFixed(1)}" stroke="${armColor}" stroke-width="${(armWidth * 0.7).toFixed(1)}" stroke-linecap="round" opacity="0.65"/>`;
      }
    }
  }

  // ── 6. Custom Crest / Apex Seals (12 Distinct Imperial Modes) ──
  const activeCrest = customConfig?.crest || 'crest_lightning';
  if (activeCrest === 'crest_crown') {
    const crownW = maxR * 0.45;
    const crownH = maxR * 0.25;
    const topY = cy - outerR - 4;
    elements += `<polygon points="${cx - crownW/2},${topY} ${cx - crownW/2},${topY - crownH} ${cx - crownW/4},${topY - crownH*0.5} ${cx},${topY - crownH*1.2} ${cx + crownW/4},${topY - crownH*0.5} ${cx + crownW/2},${topY - crownH} ${cx + crownW/2},${topY}" fill="${accent}" opacity="0.95"/>`;
    elements += `<circle cx="${cx}" cy="${topY - crownH*1.3}" r="2.5" fill="#ffffff"/>`;
  } else if (activeCrest === 'crest_lightning') {
    const topY = cy - outerR - 6;
    elements += `<polygon points="${cx - 12},${topY - 14} ${cx - 2},${topY - 4} ${cx - 7},${topY - 4} ${cx + 1},${topY + 6} ${cx - 5},${topY - 1} ${cx - 1},${topY - 1}" fill="${accent}" opacity="0.9"/>`;
    elements += `<polygon points="${cx + 12},${topY - 14} ${cx + 2},${topY - 4} ${cx + 7},${topY - 4} ${cx - 1},${topY + 6} ${cx + 5},${topY - 1} ${cx + 1},${topY - 1}" fill="${accent}" opacity="0.9"/>`;
  } else if (activeCrest === 'crest_valkyrie_horns') {
    const topY = cy - outerR - 2;
    elements += `<path d="M ${cx - 10} ${topY} Q ${cx - 25} ${topY - 15} ${cx - 30} ${topY - 25} Q ${cx - 15} ${topY - 20} ${cx - 5} ${topY - 4}" fill="${accent}" opacity="0.9"/>`;
    elements += `<path d="M ${cx + 10} ${topY} Q ${cx + 25} ${topY - 15} ${cx + 30} ${topY - 25} Q ${cx + 15} ${topY - 20} ${cx + 5} ${topY - 4}" fill="${accent}" opacity="0.9"/>`;
  } else if (activeCrest === 'crest_ouroboros_shield') {
    const topY = cy - outerR - 6;
    elements += `<polygon points="${cx},${topY - 16} ${cx + 14},${topY - 10} ${cx + 10},${topY + 4} ${cx},${topY + 12} ${cx - 10},${topY + 4} ${cx - 14},${topY - 10}" fill="${accent}" opacity="0.9"/>`;
    elements += `<circle cx="${cx}" cy="${topY - 2}" r="3" fill="#ffffff"/>`;
  } else if (activeCrest === 'crest_angel_wings') {
    const wy = cy - outerR * 0.3;
    elements += `<path d="M ${cx - outerR} ${wy} Q ${cx - outerR - 18} ${wy - 22} ${cx - outerR - 28} ${wy - 10} Q ${cx - outerR - 18} ${wy + 8} ${cx - outerR + 5} ${wy + 18}" fill="${accent}" opacity="0.85"/>`;
    elements += `<path d="M ${cx + outerR} ${wy} Q ${cx + outerR + 18} ${wy - 22} ${cx + outerR + 28} ${wy - 10} Q ${cx + outerR + 18} ${wy + 8} ${cx + outerR - 5} ${wy + 18}" fill="${accent}" opacity="0.85"/>`;
  } else if (activeCrest === 'crest_phoenix_rebirth') {
    const wy = cy - outerR * 0.2;
    elements += `<path d="M ${cx - outerR - 4} ${wy} Q ${cx - outerR - 22} ${wy - 28} ${cx - outerR - 16} ${wy - 38} Q ${cx - outerR - 8} ${wy - 18} ${cx - outerR + 6} ${wy + 12}" fill="${primary}" opacity="0.9"/>`;
    elements += `<path d="M ${cx + outerR + 4} ${wy} Q ${cx + outerR + 22} ${wy - 28} ${cx + outerR + 16} ${wy - 38} Q ${cx + outerR + 8} ${wy - 18} ${cx + outerR - 6} ${wy + 12}" fill="${primary}" opacity="0.9"/>`;
    elements += `<polygon points="${cx},${cy - outerR - 20} ${cx + 4},${cy - outerR - 8} ${cx - 4},${cy - outerR - 8}" fill="${accent}"/>`;
  } else if (activeCrest === 'crest_vault_seal') {
    elements += `<circle cx="${cx}" cy="${cy}" r="${outerR + 14}" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="3 6" opacity="0.9"/>`;
    elements += `<circle cx="${cx}" cy="${cy}" r="${outerR + 18}" fill="none" stroke="${primary}" stroke-width="1.2" opacity="0.75"/>`;
  } else if (activeCrest === 'crest_omni_sovereign') {
    const topY = cy - outerR - 8;
    elements += `<polygon points="${cx - 24},${topY} ${cx - 28},${topY - 20} ${cx - 14},${topY - 10} ${cx},${topY - 26} ${cx + 14},${topY - 10} ${cx + 28},${topY - 20} ${cx + 24},${topY}" fill="${primary}" opacity="0.95"/>`;
    elements += `<circle cx="${cx}" cy="${topY - 28}" r="3.5" fill="#ffffff"/>`;
    elements += `<circle cx="${cx - 28}" cy="${topY - 22}" r="2" fill="#ffffff"/>`;
    elements += `<circle cx="${cx + 28}" cy="${topY - 22}" r="2" fill="#ffffff"/>`;
  } else if (activeCrest === 'crest_dragon_horns') {
    const topY = cy - outerR - 2;
    elements += `<path d="M ${cx - 12} ${topY} Q ${cx - 30} ${topY - 18} ${cx - 35} ${topY - 32} Q ${cx - 20} ${topY - 24} ${cx - 6} ${topY - 6}" fill="${primary}" opacity="0.9"/>`;
    elements += `<path d="M ${cx + 12} ${topY} Q ${cx + 30} ${topY - 18} ${cx + 35} ${topY - 32} Q ${cx + 20} ${topY - 24} ${cx + 6} ${topY - 6}" fill="${primary}" opacity="0.9"/>`;
  } else if (activeCrest === 'crest_cyber_spikes') {
    const topY = cy - outerR - 4;
    elements += `<polygon points="${cx - 16},${topY} ${cx - 12},${topY - 16} ${cx - 8},${topY}" fill="${accent}"/>`;
    elements += `<polygon points="${cx - 4},${topY} ${cx},${topY - 22} ${cx + 4},${topY}" fill="${primary}"/>`;
    elements += `<polygon points="${cx + 8},${topY} ${cx + 12},${topY - 16} ${cx + 16},${topY}" fill="${accent}"/>`;
  } else if (activeCrest === 'crest_halo_ascendance') {
    elements += `<ellipse cx="${cx}" cy="${cy - outerR - 14}" rx="${outerR * 0.4}" ry="6" fill="none" stroke="${accent}" stroke-width="1.8" opacity="0.9"/>`;
    elements += `<ellipse cx="${cx}" cy="${cy - outerR - 18}" rx="${outerR * 0.28}" ry="4" fill="none" stroke="${primary}" stroke-width="1.2" opacity="0.75"/>`;
  } else if (activeCrest === 'crest_quantum_antenna') {
    const topY = cy - outerR - 2;
    elements += `<line x1="${cx}" y1="${topY}" x2="${cx}" y2="${topY - 24}" stroke="${accent}" stroke-width="2"/>`;
    elements += `<circle cx="${cx}" cy="${topY - 26}" r="3.5" fill="#ffffff"/>`;
    elements += `<circle cx="${cx}" cy="${topY - 26}" r="7" fill="none" stroke="${primary}" stroke-width="1" stroke-dasharray="2 4" opacity="0.8"/>`;
  }

  // ── 6.5 Deterministic Cryptographic Uniqueness Matrix (Guaranteed 0 Duplicates) ──
  const uniqueSeedStr = `${referralCode.toUpperCase()}_${customConfig?.handle || ''}_${customConfig?.motto || ''}_${customConfig?.monogram || ''}`;
  const uniqueHash = crypto.createHash('sha256').update(uniqueSeedStr).digest('hex');
  const uBytes = hashToBytes(uniqueHash);

  // 1. 14 Unique Micro-Constellation Stardust Nodes
  const nodeCount = 14;
  const constellationNodes: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = ((i * Math.PI * 2) / nodeCount) + ((uBytes[i] / 255) * (Math.PI / 8));
    const rad = innerR * 1.12 + (uBytes[i + nodeCount] / 255) * (outerR * 0.72 - innerR * 1.12);
    const nx = cx + Math.cos(angle) * rad;
    const ny = cy + Math.sin(angle) * rad;
    const nR = 1.2 + (uBytes[i % 8] / 255) * 1.4;
    const nO = 0.6 + (uBytes[(i + 3) % 8] / 255) * 0.35;
    const nFill = i % 2 === 0 ? accent : primary;
    constellationNodes.push({ x: nx, y: ny });
    elements += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${nR.toFixed(1)}" fill="${nFill}" opacity="${nO.toFixed(2)}"/>`;
  }
  // Connect geometric chords between unique nodes
  for (let i = 0; i < constellationNodes.length; i++) {
    const nextIdx = (i + 1 + (uBytes[i] % 3)) % constellationNodes.length;
    elements += `<line x1="${constellationNodes[i].x.toFixed(1)}" y1="${constellationNodes[i].y.toFixed(1)}" x2="${constellationNodes[nextIdx].x.toFixed(1)}" y2="${constellationNodes[nextIdx].y.toFixed(1)}" stroke="${primary}" stroke-width="0.75" stroke-dasharray="2 3" opacity="0.45"/>`;
  }

  // 2. Unique Circumference Laser Harmonic Wave
  const wavePoints = 54;
  const waveFreq = 8 + (uBytes[4] % 14);
  const waveAmp = 2.0 + (uBytes[5] / 255) * 4.0;
  let wavePath = '';
  for (let i = 0; i <= wavePoints; i++) {
    const theta = (i * Math.PI * 2) / wavePoints;
    const rOffset = Math.sin(theta * waveFreq + (uBytes[6] / 255) * Math.PI * 2) * waveAmp;
    const rCurr = (innerR + outerR) * 0.52 + rOffset;
    const wx = cx + Math.cos(theta) * rCurr;
    const wy = cy + Math.sin(theta) * rCurr;
    wavePath += (i === 0 ? `M ${wx.toFixed(1)} ${wy.toFixed(1)}` : ` L ${wx.toFixed(1)} ${wy.toFixed(1)}`);
  }
  elements += `<path d="${wavePath} Z" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.65"/>`;

  // 3. Unique Hexadecimal Hash Watermark on Outer Rim
  const shortHex = uniqueHash.substring(0, 8).toUpperCase();
  elements += `<text x="${cx}" y="${(cy + outerR + 13).toFixed(1)}" text-anchor="middle" fill="${accent}" font-family="monospace" font-size="6.5" font-weight="bold" letter-spacing="1.5" opacity="0.75">[HEX: ${shortHex}]</text>`;

  // 4. Custom Laser-Etched Monogram / Core Seal (if provided)
  if (customConfig?.monogram && customConfig.monogram.trim()) {
    const mono = customConfig.monogram.trim().substring(0, 4).toUpperCase();
    elements += `
      <circle cx="${cx}" cy="${cy}" r="16" fill="${bgDark}" stroke="${primary}" stroke-width="1.2" opacity="0.9"/>
      <text x="${cx}" y="${cy + 4.5}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" stroke="${accent}" stroke-width="0.4" font-family="sans-serif" font-weight="900" font-size="12" letter-spacing="1" opacity="0.95">${mono}</text>
    `;
  }

  // ── 7. Outer Text Inscription Path (Custom Handle / Motto / Code) ──
  const inscribedText = customConfig?.handle || customConfig?.motto || referralCode.toUpperCase();
  const textRadius = outerR + 15;
  const pathId = `sigilTextPath_${uniqueHash.substring(0, 8)}`;

  elements += `
    <path id="${pathId}" d="M ${cx - textRadius},${cy} a ${textRadius},${textRadius} 0 1,1 ${textRadius * 2},0 a ${textRadius},${textRadius} 0 1,1 -${textRadius * 2},0" fill="none"/>
    <text fill="${accent}" font-family="monospace" font-size="7" font-weight="bold" letter-spacing="3" opacity="0.7">
      <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">
        • ${inscribedText} • CREATOR OS •
      </textPath>
    </text>
  `;

  // ── 8. Glow Shaders & Lighting Definitions ──
  const glow = `
    <defs>
      <filter id="sigilGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <radialGradient id="sigilBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${bgDark}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#020408" stop-opacity="1"/>
      </radialGradient>
      <linearGradient id="sigilBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="${primary}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${secondary}" stop-opacity="0.8"/>
      </linearGradient>
    </defs>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${glow}
  <rect width="${size}" height="${size}" fill="url(#sigilBg)" rx="24"/>
  <rect width="${size - 4}" height="${size - 4}" x="2" y="2" fill="none" stroke="url(#sigilBorderGrad)" stroke-width="1.5" rx="22" opacity="0.6"/>
  <g filter="url(#sigilGlow)">
    ${elements}
  </g>
</svg>`;
}

// ═══════════════════════════════════════════════════════════════════
//  SIGIL FORGE MARKETPLACE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

function extractUserIdOrGuest(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      if (decoded && (decoded.id || decoded.userId)) return decoded.id || decoded.userId;
    } catch {}
  }
  const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get() as any;
  return firstUser?.id || 'usr_admin_001';
}

/**
 * GET /api/sigil/market/catalog
 * Returns all market items with user's purchase & equipped status.
 */
router.get('/market/catalog', (req: Request, res: Response) => {
  const userId = extractUserIdOrGuest(req);

  const items = db.prepare(`
    SELECT 
      m.*,
      CASE WHEN inv.id IS NOT NULL THEN 1 ELSE 0 END as is_purchased,
      CASE 
        WHEN cfg.aura = m.id OR cfg.glyph = m.id OR cfg.ring = m.id OR cfg.crest = m.id 
        THEN 1 ELSE 0 
      END as is_equipped
    FROM sigil_market_items m
    LEFT JOIN user_sigil_inventory inv ON inv.item_id = m.id AND inv.user_id = ?
    LEFT JOIN user_sigil_config cfg ON cfg.user_id = ?
    WHERE m.is_active = 1
    ORDER BY m.sort_order ASC
  `).all(userId, userId) as any[];

  const user = db.prepare('SELECT id, xp, level, referral_code, role FROM users WHERE id = ?').get(userId) as any;
  const sigilConfig = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(userId) as any || {};

  // Check subscription status for paywall gating
  let isPaidPlan = user?.role === 'admin';
  let activePlanName = isPaidPlan ? 'Administrator' : 'Free Lite';
  try {
    const sub = db.prepare(`
      SELECT s.*, p.slug as plan_slug, p.name as plan_name
      FROM subscriptions s
      JOIN billing_plans p ON p.id = s.plan_id
      WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
      ORDER BY s.created_at DESC LIMIT 1
    `).get(userId) as any;

    if (sub?.plan_slug && sub.plan_slug !== 'free_lite') {
      isPaidPlan = true;
      activePlanName = sub.plan_name || 'Creator Plan';
    }
  } catch {}

  res.json({
    success: true,
    data: {
      items,
      user_xp: user?.xp || 2500,
      user_level: user?.level || 1,
      referral_code: user?.referral_code || 'FOUNDER-PLUG',
      is_paid_plan: isPaidPlan,
      plan_name: activePlanName,
      active_config: {
        aura: sigilConfig.aura || 'aura_cyber_emerald',
        glyph: sigilConfig.glyph || 'glyph_metatron',
        ring: sigilConfig.ring || 'ring_celestial_corona',
        crest: sigilConfig.crest || 'crest_lightning',
      }
    }
  });
});

/**
 * POST /api/sigil/market/purchase
 * Purchase a customization item using reward XP.
 */
router.post('/market/purchase', (req: Request, res: Response) => {
  const userId = extractUserIdOrGuest(req);
  const { item_id } = req.body;

  if (!item_id) {
    res.status(400).json({ success: false, error: 'item_id is required' });
    return;
  }

  const item = db.prepare('SELECT * FROM sigil_market_items WHERE id = ? AND is_active = 1').get(item_id) as any;
  if (!item) {
    res.status(404).json({ success: false, error: 'Item not found in catalog' });
    return;
  }

  const user = db.prepare('SELECT id, xp, display_name FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  if (user.xp < item.cost_xp) {
    res.status(400).json({ 
      success: false, 
      error: `Insufficient XP. You need ${item.cost_xp} XP, but you have ${user.xp} XP. Complete referral quests to earn more!` 
    });
    return;
  }

  const existingInv = db.prepare('SELECT id FROM user_sigil_inventory WHERE user_id = ? AND item_id = ?').get(userId, item_id);
  if (existingInv) {
    res.status(400).json({ success: false, error: 'You already own this item!' });
    return;
  }

  const now = new Date().toISOString();
  const invId = `inv_${crypto.randomBytes(6).toString('hex')}`;

  runInTransaction(() => {
    // 1. Deduct XP
    db.prepare('UPDATE users SET xp = xp - ?, updated_at = ? WHERE id = ?').run(item.cost_xp, now, userId);

    // 2. Add to Inventory
    db.prepare(`
      INSERT INTO user_sigil_inventory (id, user_id, item_id, is_equipped, purchased_at)
      VALUES (?, ?, ?, 1, ?)
    `).run(invId, userId, item_id, now);

    // 3. Auto-equip in user_sigil_config
    const existingCfg = db.prepare('SELECT user_id FROM user_sigil_config WHERE user_id = ?').get(userId);
    if (!existingCfg) {
      db.prepare(`
        INSERT INTO user_sigil_config (user_id, ${item.category}, updated_at)
        VALUES (?, ?, ?)
      `).run(userId, item_id, now);
    } else {
      db.prepare(`
        UPDATE user_sigil_config SET ${item.category} = ?, updated_at = ? WHERE user_id = ?
      `).run(item_id, now, userId);
    }

    recordAuditLog(userId, 'SIGIL_ITEM_PURCHASED', 'sigil_market_items', item_id, { cost_xp: item.cost_xp, name: item.name });
  });

  const updatedUser = db.prepare('SELECT xp FROM users WHERE id = ?').get(userId) as any;

  res.json({
    success: true,
    message: `🎉 Successfully forged [${item.name}]! Equipped to your Sigil.`,
    data: {
      item,
      remaining_xp: updatedUser.xp,
    }
  });
});

/**
 * POST /api/sigil/market/equip
 * Equip or unequip an owned item.
 */
router.post('/market/equip', (req: Request, res: Response) => {
  const userId = extractUserIdOrGuest(req);
  const { item_id, category, unequip } = req.body;

  if (!category || !['aura', 'glyph', 'ring', 'crest'].includes(category)) {
    res.status(400).json({ success: false, error: 'Valid category (aura, glyph, ring, crest) required' });
    return;
  }

  if (!unequip) {
    const owned = db.prepare('SELECT id FROM user_sigil_inventory WHERE user_id = ? AND item_id = ?').get(userId, item_id);
    if (!owned) {
      res.status(403).json({ success: false, error: 'You do not own this customization item.' });
      return;
    }
  }

  const now = new Date().toISOString();
  const valueToSet = unequip ? null : item_id;

  const existingCfg = db.prepare('SELECT user_id FROM user_sigil_config WHERE user_id = ?').get(userId);
  if (!existingCfg) {
    db.prepare(`
      INSERT INTO user_sigil_config (user_id, ${category}, updated_at)
      VALUES (?, ?, ?)
    `).run(userId, valueToSet, now);
  } else {
    db.prepare(`
      UPDATE user_sigil_config SET ${category} = ?, updated_at = ? WHERE user_id = ?
    `).run(valueToSet, now, userId);
  }

  const activeCfg = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(userId) as any;

  res.json({
    success: true,
    message: unequip ? `Unequipped ${category}` : `Equipped ${item_id}`,
    data: {
      active_config: {
        aura: activeCfg?.aura || null,
        glyph: activeCfg?.glyph || null,
        ring: activeCfg?.ring || null,
        crest: activeCfg?.crest || null,
      }
    }
  });
});

/**
 * GET /api/sigil/config
 * Returns the current user's equipped custom sigil configuration.
 */
router.get('/config', (req: Request, res: Response) => {
  const userId = extractUserIdOrGuest(req);
  const cfg = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(userId) as any;
  const user = db.prepare('SELECT display_name, referral_code FROM users WHERE id = ?').get(userId) as any;
  res.json({
    success: true,
    data: {
      aura: cfg?.aura || 'aura_cyber_emerald',
      glyph: cfg?.glyph || 'glyph_quantum_hex',
      ring: cfg?.ring || 'ring_circuit_traces',
      crest: cfg?.crest || 'crest_cyber_spikes',
      motto: cfg?.motto || 'SOVEREIGN CREATOR',
      monogram: cfg?.monogram || '',
      handle: cfg?.handle || user?.display_name || user?.referral_code || '',
    }
  });
});

/**
 * POST /api/sigil/config/save
 * Atomically saves all 4 Sigil customization slots + inscriptions (aura, glyph, ring, crest, motto, monogram, handle).
 */
router.post('/config/save', (req: Request, res: Response) => {
  const userId = extractUserIdOrGuest(req);
  const { aura, glyph, ring, crest, motto, monogram, handle } = req.body || {};
  const now = new Date().toISOString();

  const user = db.prepare('SELECT id, level, role, display_name, referral_code FROM users WHERE id = ?').get(userId) as any;
  const userLevel = user?.level || 1;
  const isAdmin = user?.role === 'admin';

  // Enforce progressive level gating on equip/save
  const selectedIds = [aura, glyph, ring, crest].filter(Boolean);
  if (!isAdmin && selectedIds.length > 0) {
    const placeholders = selectedIds.map(() => '?').join(',');
    const lockedItems = db.prepare(`SELECT id, name, min_level FROM sigil_market_items WHERE id IN (${placeholders}) AND min_level > ?`).all(...selectedIds, userLevel) as any[];
    if (lockedItems.length > 0) {
      res.status(403).json({
        success: false,
        error: `Artifact "${lockedItems[0].name}" is locked. Requires Level ${lockedItems[0].min_level} (Current: Lv. ${userLevel}). Complete Quests & Referral milestones to unlock!`
      });
      return;
    }
  }

  const effectiveHandle = (handle && handle.trim()) || user?.display_name || user?.referral_code || '';
  const effectiveMotto = (motto && motto.trim()) || 'SOVEREIGN CREATOR';
  const effectiveMonogram = (monogram && monogram.trim()) || '';

  const existingCfg = db.prepare('SELECT user_id FROM user_sigil_config WHERE user_id = ?').get(userId);
  if (!existingCfg) {
    db.prepare(`
      INSERT INTO user_sigil_config (user_id, aura, glyph, ring, crest, motto, monogram, handle, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, aura || null, glyph || null, ring || null, crest || null, effectiveMotto, effectiveMonogram, effectiveHandle, now);
  } else {
    db.prepare(`
      UPDATE user_sigil_config 
      SET aura = ?, glyph = ?, ring = ?, crest = ?, motto = ?, monogram = ?, handle = ?, updated_at = ? 
      WHERE user_id = ?
    `).run(aura || null, glyph || null, ring || null, crest || null, effectiveMotto, effectiveMonogram, effectiveHandle, now, userId);
  }

  const updatedCfg = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(userId) as any;

  res.json({
    success: true,
    message: '🎉 Sigil customizations successfully saved to your Creator Passport!',
    data: {
      aura: updatedCfg?.aura || null,
      glyph: updatedCfg?.glyph || null,
      ring: updatedCfg?.ring || null,
      crest: updatedCfg?.crest || null,
      motto: updatedCfg?.motto || null,
      monogram: updatedCfg?.monogram || null,
      handle: updatedCfg?.handle || null,
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  CREATION POINTS TIERS & XP STORE
// ═══════════════════════════════════════════════════════════════════

export interface PointPack {
  id: string;
  name: string;
  points: number;
  bonus_points: number;
  total_points: number;
  price_usd: number;
  price_cents: number;
  badge?: string;
  description: string;
  popular?: boolean;
  color: string;
}

export const POINT_PACKS: PointPack[] = [
  {
    id: 'pack_starter',
    name: 'Starter Forge Pack',
    points: 500,
    bonus_points: 50,
    total_points: 550,
    price_usd: 4.99,
    price_cents: 499,
    description: 'Instant 550 Creation Points to unlock Rare & Epic items immediately.',
    color: '#38bdf8',
  },
  {
    id: 'pack_alchemist',
    name: 'Creator Alchemist Pack',
    points: 1500,
    bonus_points: 300,
    total_points: 1800,
    price_usd: 12.99,
    price_cents: 1299,
    badge: 'MOST POPULAR (+20% BONUS)',
    popular: true,
    description: '1,800 Creation Points. Unlocks Legendary 4D Tesseracts & Seraphim Wings.',
    color: '#00ff88',
  },
  {
    id: 'pack_archon',
    name: 'Imperial Archon Pack',
    points: 3500,
    bonus_points: 1000,
    total_points: 4500,
    price_usd: 24.99,
    price_cents: 2499,
    badge: 'BEST VALUE (+28% BONUS)',
    description: '4,500 Creation Points. Unlocks Cosmic Void Singularity + Eye of Primordia.',
    color: '#a855f7',
  },
  {
    id: 'pack_sovereign',
    name: 'Sovereign Syndicate Vault',
    points: 10000,
    bonus_points: 5000,
    total_points: 15000,
    price_usd: 59.99,
    price_cents: 5999,
    badge: 'MEGA PACK (+50% BONUS)',
    description: '15,000 Creation Points. Complete Forge Mastery + VIP Level boost.',
    color: '#f59e0b',
  },
];

/**
 * GET /api/sigil/points/packs
 * List all available Sigil Creation Point packs.
 */
router.get('/points/packs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      packs: POINT_PACKS,
    }
  });
});

/**
 * POST /api/sigil/points/buy
 * Unified Sigil XP Point Pack purchase with Paywall enforcement
 */
router.post('/points/buy', (req: Request, res: Response) => {
  try {
    const packId = req.body.packId || req.body.pack_id || 'starter';
    const packs: Record<string, { name: string; xp: number; priceUsd: number }> = {
      starter: { name: 'Starter Sigil Cache', xp: 1000, priceUsd: 9.99 },
      alchemist: { name: 'Alchemist Sigil Forge', xp: 3500, priceUsd: 24.99 },
      archon: { name: 'Archon Power Matrix', xp: 10000, priceUsd: 59.99 },
      sovereign: { name: 'Sovereign Celestial Vault', xp: 25000, priceUsd: 129.99 },
      sigil_pack_starter: { name: 'Starter Sigil Cache', xp: 1000, priceUsd: 9.99 },
      sigil_pack_pro: { name: 'Alchemist Sigil Forge', xp: 3500, priceUsd: 24.99 },
      sigil_pack_whale: { name: 'Archon Power Matrix', xp: 10000, priceUsd: 59.99 },
      sigil_pack_founder: { name: 'Sovereign Celestial Vault', xp: 25000, priceUsd: 129.99 },
    };

    const pack = packs[packId] || packs.starter;

    let userId = (req as any).user?.id;
    if (!userId) {
      const authHeader = req.headers['authorization'];
      const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || req.cookies?.token;
      if (token) {
        try {
          const decoded: any = jwt.verify(token, config.jwtSecret);
          userId = decoded?.userId || decoded?.id;
        } catch (e) {}
      }
    }

    if (!userId) {
      const firstUser: any = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
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

    const subTier = (user.subscriptionTier || 'FREE').toUpperCase();
    const isActive = Number(user.subscriptionActive || 0) === 1 || user.role === 'admin';

    if (subTier === 'FREE' && !isActive) {
      res.status(403).json({
        error: 'PAYWALL_REQUIRED',
        message: 'Direct XP & Sigil Points injection requires an active Creator Plan.',
      });
      return;
    }

    const currentXp = Number(user.xp || 0);
    const newXp = currentXp + pack.xp;
    const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);

    // 1. Wealth Pulse Calculation: (ARR Velocity * Streak Multiplier) + (XP * Vault Stability)
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

    // 4. Tier Ascension Ladder & Threshold Comparison
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
    const txId = `tx_xp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    runInTransaction(() => {
      db.prepare(`
        UPDATE users 
        SET xp = ?, 
            level = ?, 
            tier_title = ?, 
            updated_at = ?
        WHERE id = ?
      `).run(newXp, newLevel, ascensionTier.name, now, userId);

      try {
        db.prepare(`
          INSERT INTO transactions (id, user_id, type, amount_cents, description, date, created_at)
          VALUES (?, ?, 'expense', ?, ?, ?, ?)
        `).run(
          txId,
          userId,
          Math.round(pack.priceUsd * 100),
          `Purchased ${pack.name} (+${pack.xp.toLocaleString()} XP)`,
          now.substring(0, 10),
          now
        );
      } catch (e1) {
        try {
          db.prepare(`
            INSERT INTO transactions (id, userId, type, amount, description, createdAt)
            VALUES (?, ?, 'points_purchase', ?, ?, ?)
          `).run(txId, userId, pack.priceUsd, `Purchased ${pack.name} (+${pack.xp.toLocaleString()} XP)`, now);
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
      transactionId: txId,
    });
  } catch (err: any) {
    console.error('Error in points buy:', err);
    res.status(500).json({ error: 'POINTS_ERROR', message: err.message });
  }
});

function renderCinematicPassportHtml(user: any, activeCode: string, customConfig: SigilCustomConfig, svg: string): string {
  const displayName = user?.display_name || 'Creator Plug';
  const tierTitle = user?.tier_title || 'Cosmic Money Plug';
  const level = user?.level || 1;
  const xp = (user?.xp || 500).toLocaleString();
  const refLink = `/api/referrals/track/${activeCode}`;
  const verificationHash = crypto.createHash('sha256')
    .update(`${user?.id || 'guest'}_${activeCode}_PRIMORDIA`)
    .digest('hex');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ ${displayName}'s Cryptographic Creator Passport | MoneyPlugHub</title>
  <meta name="description" content="Verified Sovereign Cryptographic Sigil Passport on Creator Money OS.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #02050e;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
      position: relative;
    }
    #particle-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1;
      pointer-events: none;
    }
    .nebula-1 {
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(147, 51, 234, 0.08) 50%, transparent 70%);
      filter: blur(80px);
      z-index: 1;
      pointer-events: none;
    }
    .nebula-2 {
      position: fixed;
      bottom: 10%;
      left: 20%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
      filter: blur(80px);
      z-index: 1;
      pointer-events: none;
    }
    .passport-container {
      position: relative;
      z-index: 10;
      width: 92%;
      max-width: 580px;
      margin: 2rem auto;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(2, 6, 23, 0.96) 50%, rgba(15, 23, 42, 0.92) 100%);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 28px;
      padding: 2.2rem;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(6, 182, 212, 0.15);
      backdrop-filter: blur(20px);
      transition: transform 0.15s ease-out;
      transform-style: preserve-3d;
    }
    .header-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(51, 65, 85, 0.4);
    }
    .tag-verified {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.35);
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      font-family: monospace;
      letter-spacing: 0.05em;
    }
    .sigil-frame {
      width: 240px;
      height: 240px;
      margin: 0 auto 1.5rem auto;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid rgba(6, 182, 212, 0.3);
      border-radius: 24px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 35px rgba(6, 182, 212, 0.25);
    }
    .sigil-frame svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.4));
    }
    .creator-info {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .creator-name {
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.2rem;
      letter-spacing: -0.02em;
    }
    .creator-code {
      font-size: 0.85rem;
      color: #22d3ee;
      font-family: monospace;
      font-weight: 700;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      font-family: monospace;
    }
    .meta-card {
      background: rgba(2, 6, 23, 0.7);
      border: 1px solid rgba(51, 65, 85, 0.5);
      border-radius: 14px;
      padding: 0.75rem 0.5rem;
      text-align: center;
    }
    .meta-label {
      font-size: 0.65rem;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 0.2rem;
    }
    .meta-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
    }
    .cta-btn {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%);
      color: #020617;
      font-weight: 800;
      text-align: center;
      padding: 0.95rem;
      border-radius: 16px;
      text-decoration: none;
      font-size: 0.95rem;
      letter-spacing: 0.02em;
      box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      cursor: pointer;
      border: none;
    }
    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(6, 182, 212, 0.45);
    }
    .hash-footer {
      margin-top: 1.2rem;
      text-align: center;
      font-family: monospace;
      font-size: 0.65rem;
      color: #64748b;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <canvas id="particle-canvas"></canvas>
  <div class="nebula-1"></div>
  <div class="nebula-2"></div>

  <div class="passport-container" id="card">
    <div class="header-badge">
      <div style="font-family: monospace; font-size: 0.75rem; color: #94a3b8; font-weight: 700;">
        ⚡ MONEYPLUGHUB PASSPORT
      </div>
      <div class="tag-verified">OFFICIALLY VERIFIED ✓</div>
    </div>

    <div class="sigil-frame">
      ${svg}
    </div>

    <div class="creator-info">
      <div class="creator-name">${displayName}</div>
      <div class="creator-code">CODE: [${activeCode}] • ${tierTitle}</div>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Level</div>
        <div class="meta-val">Lv. ${level}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Reward XP</div>
        <div class="meta-val" style="color: #22d3ee;">${xp}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Security</div>
        <div class="meta-val" style="color: #34d399;">SHA-256</div>
      </div>
    </div>

    <a href="${refLink}" class="cta-btn">
      🚀 Claim Your Sigil & Start Free
    </a>

    <div class="hash-footer">
      SEED: ${verificationHash}
    </div>
  </div>

  <script>
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.7 + 0.2
    }));

    function render() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = \`rgba(6, 182, 212, \${p.alpha})\`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(render);
    }
    render();

    const card = document.getElementById('card');
    document.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = \`perspective(1000px) rotateX(\${-(y / (rect.height / 2)) * 8}deg) rotateY(\${(x / (rect.width / 2)) * 8}deg)\`;
    });
    document.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
//  RENDER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/sigil/:code
 * Returns the SVG sigil (or full cinematic HTML if loaded in browser).
 */
router.get('/:code', (req: Request, res: Response) => {
  const code = req.params.code.trim().toUpperCase();
  const size = Math.min(1024, Math.max(64, parseInt(req.query.size as string) || 256));

  const user = db.prepare(
    'SELECT id, display_name, referral_code, tier_title, level, xp FROM users WHERE referral_code = ? COLLATE NOCASE'
  ).get(code) as any;

  const activeCode = user?.referral_code || code;

  // Check if custom config exists for user
  let customConfig: SigilCustomConfig = {};
  if (user?.id) {
    const cfg = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(user.id) as any;
    if (cfg) {
      customConfig = {
        aura: cfg.aura || null,
        glyph: cfg.glyph || null,
        ring: cfg.ring || null,
        crest: cfg.crest || null,
        handle: cfg.handle || user.display_name || user.referral_code,
        motto: cfg.motto || null,
        monogram: cfg.monogram || null,
      };
    }
  }

  // Allow query overrides for Forge previews (e.g. ?aura=aura_solar_flare)
  if (req.query.aura) customConfig.aura = req.query.aura as string;
  if (req.query.glyph) customConfig.glyph = req.query.glyph as string;
  if (req.query.ring) customConfig.ring = req.query.ring as string;
  if (req.query.crest) customConfig.crest = req.query.crest as string;
  if (req.query.handle) customConfig.handle = req.query.handle as string;
  if (req.query.motto) customConfig.motto = req.query.motto as string;
  if (req.query.monogram) customConfig.monogram = req.query.monogram as string;
  if (req.query.glow_level) customConfig.glow_level = req.query.glow_level as any;

  const svg = generateSigil(activeCode, size, customConfig);

  if (req.query.format === 'json') {
    const base64 = Buffer.from(svg).toString('base64');
    res.json({
      success: true,
      data: {
        referral_code: activeCode,
        display_name: user?.display_name || 'Creator Plug',
        svg_base64: base64,
        svg_data_uri: `data:image/svg+xml;base64,${base64}`,
      }
    });
    return;
  }

  // If visited directly in browser address bar (Accept includes text/html and not requesting raw)
  if (req.headers.accept?.includes('text/html') && req.query.raw !== 'true') {
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(renderCinematicPassportHtml(user, activeCode, customConfig, svg));
    return;
  }

  res.set({
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=3600, immutable',
  });
  res.send(svg);
});

/**
 * GET /api/sigil/passport/:code
 * Returns full holographic Creator Passport data with verification hash and artifacts.
 */
router.get('/passport/:code', (req: Request, res: Response) => {
  try {
    const code = req.params.code.trim().toUpperCase();

    const user = db.prepare(
      'SELECT id, display_name, email, referral_code, tier_title, level, xp, role, created_at FROM users WHERE referral_code = ? COLLATE NOCASE'
    ).get(code) as any;

    if (!user) {
      res.status(404).json({ success: false, error: 'Creator not found with referral code' });
      return;
    }

    // Fetch equipped configuration
    const cfg = db.prepare('SELECT * FROM user_sigil_config WHERE user_id = ?').get(user.id) as any || {};
    
    // Fetch item details for equipped items
    const equippedItems: any[] = [];
    ['aura', 'glyph', 'ring', 'crest'].forEach(cat => {
      if (cfg[cat]) {
        const item = db.prepare('SELECT id, name, category, rarity, preview_accent FROM sigil_market_items WHERE id = ?').get(cfg[cat]) as any;
        if (item) equippedItems.push(item);
      }
    });

    // Referral and stats
    const referralCount = (db.prepare('SELECT COUNT(*) as count FROM users WHERE referrer_user_id = ?').get(user.id) as any)?.count || 0;
    const clickCount = (db.prepare('SELECT COUNT(*) as count FROM referral_clicks WHERE referral_code = ?').get(user.referral_code) as any)?.count || 0;

    // Cryptographic Passport Verification Signature
    const verificationHash = crypto.createHash('sha256')
      .update(`${user.id}_${user.referral_code}_${user.created_at}_PRIMORDIA`)
      .digest('hex');

    const svg = generateSigil(user.referral_code, 320, {
      aura: cfg.aura || null,
      glyph: cfg.glyph || null,
      ring: cfg.ring || null,
      crest: cfg.crest || null,
      handle: cfg.handle || user.display_name || user.referral_code,
      motto: cfg.motto || null,
      monogram: cfg.monogram || null,
    });
    const base64 = Buffer.from(svg).toString('base64');

    res.json({
      success: true,
      data: {
        passport_number: `PLUG-${verificationHash.substring(0, 12).toUpperCase()}`,
        verification_hash: verificationHash,
        creator: {
          id: user.id,
          display_name: user.display_name,
          referral_code: user.referral_code,
          tier_title: user.tier_title || 'Novice Plug',
          level: user.level || 1,
          xp: user.xp || 0,
          role: user.role,
          member_since: user.created_at,
        },
        stats: {
          active_referrals: referralCount,
          total_clicks: clickCount,
          annual_arr: referralCount * 120,
          k_factor: clickCount > 0 ? (referralCount / clickCount * 1.5).toFixed(2) : '1.00',
        },
        equipped_artifacts: equippedItems,
        sigil_svg_data_uri: `data:image/svg+xml;base64,${base64}`,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/sigil/points/buy
 * Handles XP point pack purchases with strict Paywall protection for FREE tier
 */
router.post('/points/buy', (req: Request, res: Response) => {
  try {
    const { packId = 'starter' } = req.body || {};
    const packs: Record<string, { name: string; xp: number; priceUsd: number }> = {
      starter: { name: 'Starter Sigil Cache', xp: 1000, priceUsd: 9.99 },
      alchemist: { name: 'Alchemist Sigil Forge', xp: 3500, priceUsd: 24.99 },
      archon: { name: 'Archon Power Matrix', xp: 10000, priceUsd: 59.99 },
      sovereign: { name: 'Sovereign Celestial Vault', xp: 25000, priceUsd: 129.99 },
    };

    const pack = packs[packId] || packs.starter;

    let userId = (req as any).user?.id;
    if (!userId) {
      const firstUser: any = db.prepare('SELECT id, subscriptionTier, subscriptionActive, xp, level, tier_title FROM users ORDER BY created_at ASC LIMIT 1').get();
      userId = firstUser?.id;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }

    const user: any = db.prepare('SELECT id, subscriptionTier, subscriptionActive, xp, level, tier_title FROM users WHERE id = ?').get(userId);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND' });
      return;
    }

    const subTier = (user.subscriptionTier || 'FREE').toUpperCase();
    const isActive = Number(user.subscriptionActive || 0) === 1;

    if (subTier === 'FREE' && !isActive) {
      res.status(403).json({
        error: 'PAYWALL_REQUIRED',
        message: 'Direct XP & Sigil Points injection requires an active Creator Plan.',
      });
      return;
    }

    const currentXp = Number(user.xp || 0);
    const newXp = currentXp + pack.xp;
    const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);

    let newTier = 'Novice Plug';
    if (newLevel >= 15) newTier = 'Cosmic Sovereign';
    else if (newLevel >= 10) newTier = 'Diamond Stacker';
    else if (newLevel >= 6) newTier = 'Wealth Builder';
    else if (newLevel >= 3) newTier = 'Active Plug';

    const now = new Date().toISOString();
    const txId = `tx_xp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    runInTransaction(() => {
      db.prepare(`
        UPDATE users 
        SET xp = ?, 
            level = ?, 
            tier_title = ?, 
            updated_at = ?
        WHERE id = ?
      `).run(newXp, newLevel, newTier, now, userId);

      db.prepare(`
        INSERT INTO transactions (id, userId, type, amount, description, createdAt)
        VALUES (?, ?, 'points_purchase', ?, ?, ?)
      `).run(txId, userId, pack.priceUsd, `Purchased ${pack.name} (+${pack.xp.toLocaleString()} XP)`, now);
    });

    res.status(200).json({
      status: 'SUCCESS',
      packId,
      packName: pack.name,
      xpAdded: pack.xp,
      newXP: newXp,
      newLevel,
      tier: newTier,
      transactionId: txId,
    });
  } catch (err: any) {
    console.error('Error in points buy:', err);
    res.status(500).json({ error: 'POINTS_ERROR', message: err.message });
  }
});

export default router;
