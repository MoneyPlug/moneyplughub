import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DesignPalette = 
  | 'emerald-cashflow' // Deep Emerald & Mint (Cash Flow Focus)
  | 'gold-vault'       // Liquid Gold & Bullion (Vaults & High-Yield Wealth)
  | 'cyber-crypto'     // Neon Cyan & Electric Lime (Blockchain & AI Matrix)
  | 'cosmic-revenue'   // Royal Purple, Gold & Green (SaaS & Performance Royalties)
  | 'titanium-reserve';// Platinum, Cold Titanium & Deep Slate (Institutional Trust)

export type CardBorderAesthetic = 'glass-cyber' | 'gold-trim' | 'emerald-glow' | 'titanium-bevel';

export interface GenerativeDesignState {
  seed: number;
  palette: DesignPalette;
  cardAesthetic: CardBorderAesthetic;
  glowIntensity: 'subtle' | 'vibrant' | 'hyper';
  primaryAccent: string;
  secondaryAccent: string;
  glowColor: string;
  wealthMotto: string;
  particleDensity: number; // 0.8 to 1.4
  billSymbolRatio: number; // balance between bills, gold, and crypto
  shiftDesign: () => void;
}

const WEALTH_MOTTO_POOL = [
  '“Cash flow is the lifeblood of freedom. Automate the inflow.”',
  '“Zero capital at risk. Infinite return on distribution.”',
  '“Every smart link is a synthetic dividend asset yielding 24/7.”',
  '“Stack cashflow, lock the vault, let compounding run.”',
  '“Convert network attention into immutable ledger revenue.”',
  '“Replace monetary risk with autonomous AI infrastructure.”',
  '“Hold the keys. Own the vault. Accelerate velocity.”',
  '“Yield that never sleeps. Cash flow that never stops.”',
  '“Turn everyday recurring actions into residual royalties.”',
  '“Financial velocity: High savings rate + automated referral yield.”',
];

const PALETTES_CONFIG: Record<DesignPalette, { primary: string; secondary: string; glow: string }> = {
  'emerald-cashflow': {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  'gold-vault': {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.28)',
  },
  'cyber-crypto': {
    primary: '#06b6d4',
    secondary: '#10b981',
    glow: 'rgba(6, 182, 212, 0.25)',
  },
  'cosmic-revenue': {
    primary: '#a855f7',
    secondary: '#10b981',
    glow: 'rgba(168, 85, 247, 0.25)',
  },
  'titanium-reserve': {
    primary: '#38bdf8',
    secondary: '#f59e0b',
    glow: 'rgba(56, 189, 248, 0.22)',
  },
};

const PALETTE_KEYS: DesignPalette[] = [
  'emerald-cashflow',
  'gold-vault',
  'cyber-crypto',
  'cosmic-revenue',
  'titanium-reserve',
];

const CARD_AESTHETICS: CardBorderAesthetic[] = [
  'glass-cyber',
  'gold-trim',
  'emerald-glow',
  'titanium-bevel',
];

const GenerativeDesignContext = createContext<GenerativeDesignState | undefined>(undefined);

export const GenerativeDesignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1000000));
  const [paletteIndex, setPaletteIndex] = useState<number>(() => Math.floor(Math.random() * PALETTE_KEYS.length));
  const [aestheticIndex, setAestheticIndex] = useState<number>(() => Math.floor(Math.random() * CARD_AESTHETICS.length));
  const [mottoIndex, setMottoIndex] = useState<number>(() => Math.floor(Math.random() * WEALTH_MOTTO_POOL.length));

  const shiftDesign = () => {
    setSeed(Date.now());
    setPaletteIndex((prev) => (prev + 1) % PALETTE_KEYS.length);
    setAestheticIndex((prev) => (prev + 1) % CARD_AESTHETICS.length);
    setMottoIndex((prev) => (prev + 1) % WEALTH_MOTTO_POOL.length);
  };

  // Keyboard shortcut: Press 'Shift + D' to randomly morph design
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'D' || e.key === 'd') && e.shiftKey) {
        shiftDesign();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentPalette = PALETTE_KEYS[paletteIndex];
  const config = PALETTES_CONFIG[currentPalette];
  const cardAesthetic = CARD_AESTHETICS[aestheticIndex];
  const wealthMotto = WEALTH_MOTTO_POOL[mottoIndex];

  const value: GenerativeDesignState = {
    seed,
    palette: currentPalette,
    cardAesthetic,
    glowIntensity: 'vibrant',
    primaryAccent: config.primary,
    secondaryAccent: config.secondary,
    glowColor: config.glow,
    wealthMotto,
    particleDensity: 1.0,
    billSymbolRatio: 0.5,
    shiftDesign,
  };

  return (
    <GenerativeDesignContext.Provider value={value}>
      {children}
    </GenerativeDesignContext.Provider>
  );
};

export const useGenerativeDesign = () => {
  const context = useContext(GenerativeDesignContext);
  if (!context) {
    throw new Error('useGenerativeDesign must be used within a GenerativeDesignProvider');
  }
  return context;
};
