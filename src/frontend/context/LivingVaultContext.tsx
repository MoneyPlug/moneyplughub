import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type WealthVaultTier = 
  | 'starter-seed'          // < $1k net worth (Neo-Emerald Seed Matrix)
  | 'builder-river'         // $1k - $5k net worth (Cyan Cashflow River & Waves)
  | 'crypto-matrix'         // $5k - $20k net worth (Amethyst Quantum Node & 3D $100 Stacks)
  | 'bullion-chamber'       // $20k - $100k net worth (24K Gold Bullion Bars & Molten Auroras)
  | 'sovereign-vault'       // $100k - $500k net worth (Diamond Refraction & Imperial Treasury)
  | 'celestial-singularity'; // $500k+ net worth (Cosmic Gravitational Accretion Vortex)

export interface VaultTierConfig {
  id: WealthVaultTier;
  label: string;
  shortName: string;
  minNetWorth: number;
  minEarnings: number;
  accentColor: string;
  secondaryColor: string;
  ambientGlow: string;
  particleDensity: number;
  bullionCount: number;
  diamondCount: number;
  hasSingularity: boolean;
  visualUnlocks: string[];
}

export const VAULT_TIER_CONFIGS: Record<WealthVaultTier, VaultTierConfig> = {
  'starter-seed': {
    id: 'starter-seed',
    label: '🌱 Neo-Emerald Seed Matrix',
    shortName: 'Seed Matrix',
    minNetWorth: 0,
    minEarnings: 0,
    accentColor: '#10b981',
    secondaryColor: '#059669',
    ambientGlow: 'rgba(16, 185, 129, 0.15)',
    particleDensity: 25,
    bullionCount: 0,
    diamondCount: 0,
    hasSingularity: false,
    visualUnlocks: ['Matrix Seed Pulses', '$5/$10 Floating Bills', 'Micro-Currency Dots'],
  },
  'builder-river': {
    id: 'builder-river',
    label: '🌊 Cyan Cashflow River',
    shortName: 'Cash River',
    minNetWorth: 1000,
    minEarnings: 100,
    accentColor: '#06b6d4',
    secondaryColor: '#0284c7',
    ambientGlow: 'rgba(6, 182, 212, 0.20)',
    particleDensity: 45,
    bullionCount: 2,
    diamondCount: 0,
    hasSingularity: false,
    visualUnlocks: ['Horizontal Cash Waves', '$20/$50 Float Dynamics', 'Turbulent River Flow'],
  },
  'crypto-matrix': {
    id: 'crypto-matrix',
    label: '⚡ Amethyst Quantum Ledger',
    shortName: 'Quantum Ledger',
    minNetWorth: 5000,
    minEarnings: 500,
    accentColor: '#a855f7',
    secondaryColor: '#7c3aed',
    ambientGlow: 'rgba(168, 85, 247, 0.22)',
    particleDensity: 65,
    bullionCount: 6,
    diamondCount: 3,
    hasSingularity: false,
    visualUnlocks: ['3D Crypto Nodes (₿, Ξ, Ω)', '$100 Blue Watermark Bills', 'Subatomic Constellation Grid'],
  },
  'bullion-chamber': {
    id: 'bullion-chamber',
    label: '🏦 24K Imperial Bullion Chamber',
    shortName: 'Gold Bullion Vault',
    minNetWorth: 20000,
    minEarnings: 2500,
    accentColor: '#eab308',
    secondaryColor: '#d97706',
    ambientGlow: 'rgba(234, 179, 8, 0.28)',
    particleDensity: 90,
    bullionCount: 16,
    diamondCount: 8,
    hasSingularity: false,
    visualUnlocks: ['3D Beveled 24K Gold Bars', 'Molten Auroral Plasma', 'Rotating Gold Coin Physics', 'Relativistic Reflection Glare'],
  },
  'sovereign-vault': {
    id: 'sovereign-vault',
    label: '👑 Sovereign Diamond Treasury',
    shortName: 'Diamond Treasury',
    minNetWorth: 100000,
    minEarnings: 10000,
    accentColor: '#38bdf8',
    secondaryColor: '#ffd700',
    ambientGlow: 'rgba(56, 189, 248, 0.35)',
    particleDensity: 130,
    bullionCount: 28,
    diamondCount: 18,
    hasSingularity: false,
    visualUnlocks: ['3D Prismatic Diamonds', 'Imperial Crown Coins', 'Multi-Layer Harmonic Auroras', 'Supernova Click Shockwaves'],
  },
  'celestial-singularity': {
    id: 'celestial-singularity',
    label: '🪐 Celestial Osmium Singularity',
    shortName: 'Cosmic Apex Singularity',
    minNetWorth: 500000,
    minEarnings: 50000,
    accentColor: '#f43f5e',
    secondaryColor: '#ffd700',
    ambientGlow: 'rgba(244, 63, 94, 0.40)',
    particleDensity: 180,
    bullionCount: 45,
    diamondCount: 30,
    hasSingularity: true,
    visualUnlocks: ['Gravitational Accretion Disk', 'Spacetime Warping Vortex', 'Hyper-Speed Wealth Storm', 'Supreme Apex Osmium Light'],
  },
};

export interface LivingVaultState {
  tier: WealthVaultTier;
  tierConfig: VaultTierConfig;
  tierLabel: string;
  netWorthUsd: number;
  totalEarningsUsd: number;
  cashUsd: number;
  debtUsd: number;
  referralCount: number;
  savingsRatePct: number;
  isSimulated: boolean;
  setSimulatedRevenue: (earnings: number, netWorth: number) => void;
  resetToLive: () => void;
  triggerShockwave: () => void;
  shockwaveCount: number;
}

const LivingVaultContext = createContext<LivingVaultState | undefined>(undefined);

export const LivingVaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  
  // Real live wallet state
  const [liveData, setLiveData] = useState({
    netWorthUsd: 2450,
    totalEarningsUsd: 215,
    cashUsd: 1850,
    debtUsd: 1800,
    referralCount: 12,
    savingsRatePct: 32,
  });

  // Simulated override state for user experimentation
  const [simulatedData, setSimulatedData] = useState<{
    earnings: number;
    netWorth: number;
  } | null>(null);

  const [shockwaveCount, setShockwaveCount] = useState<number>(0);

  // Fetch real financial context from backend
  const fetchLiveFinances = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/moneyos/context', { headers });
      if (res.ok) {
        const j = await res.json();
        if (j.success && j.data) {
          const f = j.data.finances;
          const r = j.data.referralEcosystem;
          setLiveData({
            netWorthUsd: Number(f.netWorthUsd) || 2450,
            totalEarningsUsd: Number(r.totalCommissionsEarnedUsd) || 215,
            cashUsd: Number(f.totalCashUsd) || 1850,
            debtUsd: Number(f.totalDebtUsd) || 1800,
            referralCount: r.referralCount || 12,
            savingsRatePct: f.savingsRatePct || 32,
          });
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchLiveFinances();
  }, [token, user]);

  const activeEarnings = simulatedData ? simulatedData.earnings : liveData.totalEarningsUsd;
  const activeNetWorth = simulatedData ? simulatedData.netWorth : liveData.netWorthUsd;

  // Compute 6-Tier Wealth Ascension
  let tier: WealthVaultTier = 'starter-seed';

  if (activeNetWorth >= 500000 || activeEarnings >= 50000) {
    tier = 'celestial-singularity';
  } else if (activeNetWorth >= 100000 || activeEarnings >= 10000) {
    tier = 'sovereign-vault';
  } else if (activeNetWorth >= 20000 || activeEarnings >= 2500) {
    tier = 'bullion-chamber';
  } else if (activeNetWorth >= 5000 || activeEarnings >= 500) {
    tier = 'crypto-matrix';
  } else if (activeNetWorth >= 1000 || activeEarnings >= 100) {
    tier = 'builder-river';
  } else {
    tier = 'starter-seed';
  }

  const tierConfig = VAULT_TIER_CONFIGS[tier];

  const setSimulatedRevenue = (earnings: number, netWorth: number) => {
    setSimulatedData({ earnings, netWorth });
  };

  const resetToLive = () => {
    setSimulatedData(null);
    fetchLiveFinances();
  };

  const triggerShockwave = () => {
    setShockwaveCount(prev => prev + 1);
  };

  return (
    <LivingVaultContext.Provider
      value={{
        tier,
        tierConfig,
        tierLabel: tierConfig.label,
        netWorthUsd: activeNetWorth,
        totalEarningsUsd: activeEarnings,
        cashUsd: liveData.cashUsd,
        debtUsd: liveData.debtUsd,
        referralCount: liveData.referralCount,
        savingsRatePct: liveData.savingsRatePct,
        isSimulated: !!simulatedData,
        setSimulatedRevenue,
        resetToLive,
        triggerShockwave,
        shockwaveCount,
      }}
    >
      {children}
    </LivingVaultContext.Provider>
  );
};

export const useLivingVault = () => {
  const context = useContext(LivingVaultContext);
  if (!context) {
    throw new Error('useLivingVault must be used within a LivingVaultProvider');
  }
  return context;
};
