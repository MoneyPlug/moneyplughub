// ═══════════════════════════════════════════════════════════════════
//  WEALTH PULSE & REACTIVE COSMIC ENGINE — apps/moneyplughub
// ═══════════════════════════════════════════════════════════════════

/**
 * 1. Wealth Pulse Formula:
 * Wealth Pulse = (ARR Velocity * Streak Multiplier) + (XP * Vault Stability)
 */
export function computeWealthPulse({
  arrVelocity,
  streakMultiplier,
  xp,
  vaultStability,
}: {
  arrVelocity: number;
  streakMultiplier: number;
  xp: number;
  vaultStability: number;
}): number {
  const pulse = (arrVelocity * streakMultiplier) + (xp * vaultStability);
  return Math.round(pulse * 100) / 100;
}

/**
 * 2. Vault Shaders Ladder
 */
export interface VaultTierInfo {
  tier: number;
  name: string;
  shader: 'obsidian_slate' | 'emerald_grid' | 'amethyst_nebula' | 'prismatic_core' | 'supernova_singularity';
  minXP: number;
}

export const vaultTiers: VaultTierInfo[] = [
  { tier: 1, name: 'Novice', shader: 'obsidian_slate', minXP: 0 },
  { tier: 2, name: 'Active Plug', shader: 'emerald_grid', minXP: 1000 },
  { tier: 3, name: 'Wealth Builder', shader: 'amethyst_nebula', minXP: 3000 },
  { tier: 4, name: 'Diamond Stacker', shader: 'prismatic_core', minXP: 7000 },
  { tier: 5, name: 'Cosmic Sovereign', shader: 'supernova_singularity', minXP: 15000 },
];

export function getVaultTierFromXP(xp: number): VaultTierInfo {
  let current = vaultTiers[0];
  for (const tier of vaultTiers) {
    if (xp >= tier.minXP) current = tier;
  }
  return current;
}

/**
 * 3. Sigil Glow Intensification Levels
 */
export type SigilGlowLevel = 'subtle' | 'normal' | 'supernova';

export function getSigilGlowLevel(pulse: number): SigilGlowLevel {
  if (pulse < 500) return 'subtle';
  if (pulse < 1500) return 'normal';
  return 'supernova';
}

/**
 * 4. Tier Ascension Ladder
 */
export interface AscensionTierInfo {
  level: number;
  name: string;
  minXP: number;
}

export const ascensionTiers: AscensionTierInfo[] = [
  { level: 1, name: 'Novice Plug', minXP: 0 },
  { level: 2, name: 'Active Plug', minXP: 1000 },
  { level: 3, name: 'Wealth Builder', minXP: 3000 },
  { level: 4, name: 'Grand Money Plug', minXP: 7000 },
  { level: 5, name: 'Cosmic Sovereign', minXP: 15000 },
];

export function getAscensionTier(xp: number): AscensionTierInfo {
  let current = ascensionTiers[0];
  for (const tier of ascensionTiers) {
    if (xp >= tier.minXP) current = tier;
  }
  return current;
}

/**
 * 5. Constellation Energy Formula:
 * Constellation Energy = activeStars * log10(ARR + 1)
 */
export function computeConstellationEnergy({
  activeStars,
  arr,
}: {
  activeStars: number;
  arr: number;
}): number {
  const energy = activeStars * Math.log10(Math.max(0, arr) + 1);
  return Math.round(energy * 100) / 100;
}
