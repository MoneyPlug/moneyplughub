export interface ChamberUnlock {
  tabId: string;
  name: string;
  iconName: string;
  minLevel: number;
  minXP: number;
  tierLevel: number;
  tierName: string;
  tagline: string;
  description: string;
  features: string[];
  accentColor: string;
}

export const CHAMBER_UNLOCKS: Record<string, ChamberUnlock> = {
  'overview': {
    tabId: 'overview',
    name: 'Command Center',
    iconName: 'LayoutDashboard',
    minLevel: 1,
    minXP: 0,
    tierLevel: 1,
    tierName: 'Novice Plug',
    tagline: 'Chamber I • Central Command Matrix',
    description: 'Real-time telemetry, referral statistics, active streaks, and core financial ledger.',
    features: ['Real-Time Revenue Analytics', 'Referral Code Telemetry', 'Financial Scratchpad', 'Active Daily Streaks'],
    accentColor: '#00ff88',
  },
  'referral-hub': {
    tabId: 'referral-hub',
    name: 'Referral Web',
    iconName: 'Users',
    minLevel: 1,
    minXP: 0,
    tierLevel: 1,
    tierName: 'Novice Plug',
    tagline: 'Chamber II • Viral Distribution Flywheel',
    description: 'Generate tracking URLs, track real-time click attribution cookies, and earn 20-40% recurring commissions.',
    features: ['30-Day Sticky Attribution Cookies', 'Direct Commission Ledgers', 'K-Factor Multipliers', 'Real-Time Click Streams'],
    accentColor: '#10b981',
  },
  'moneyos': {
    tabId: 'moneyos',
    name: 'MoneyOS AI Core',
    iconName: 'Bot',
    minLevel: 1,
    minXP: 0,
    tierLevel: 1,
    tierName: 'Novice Plug',
    tagline: 'Chamber III • Autonomous Financial Co-Pilot',
    description: 'Instant autonomous financial chat, debt calculations, and budget allocations.',
    features: ['Text Financial Commands', 'Autonomous Ledger Entries', 'Yield Projections'],
    accentColor: '#00ff88',
  },
  'sigil-forge': {
    tabId: 'sigil-forge',
    name: 'Sigil Forge & Store',
    iconName: 'Compass',
    minLevel: 1,
    minXP: 0,
    tierLevel: 1,
    tierName: 'Novice Plug',
    tagline: 'Chamber IV • Cryptographic Artifacts',
    description: 'Forge custom SHA-256 vector emblems, equip 32 master artifacts, and mint Creator Passports.',
    features: ['3D Orbital Vector Emblems', '32 Master Artifact Slots', 'Direct XP Boosters', 'Cryptographic Passports'],
    accentColor: '#a855f7',
  },
  'budget': {
    tabId: 'budget',
    name: 'Budget Velocity Shields',
    iconName: 'PieChart',
    minLevel: 3,
    minXP: 1000,
    tierLevel: 2,
    tierName: 'Active Plug',
    tagline: 'Chamber V • Expense Defense Matrix',
    description: 'Category expense containment shields, burn-rate telemetry, and cash buffer sentinels.',
    features: ['Real-Time Burn Rate Velocity', 'Overspending Defense Shields', 'Category Allocation Controls', 'Micro-Expense Tagging'],
    accentColor: '#38bdf8',
  },
  'quests': {
    tabId: 'quests',
    name: 'Quests & Gamification Hub',
    iconName: 'Trophy',
    minLevel: 3,
    minXP: 1000,
    tierLevel: 2,
    tierName: 'Active Plug',
    tagline: 'Chamber VI • Reward Matrix',
    description: 'Daily wealth challenges, XP multiplier streaks, and global creator leaderboard competitions.',
    features: ['Daily Wealth Quests (+150 XP)', 'Streak Multiplier Engine (1.25x - 3.0x)', 'Global Creator Leaderboard', 'Special Achievement Badges'],
    accentColor: '#fbbf24',
  },
  'net-worth': {
    tabId: 'net-worth',
    name: 'Living Wealth Vault & Net Worth',
    iconName: 'Wallet',
    minLevel: 3,
    minXP: 1000,
    tierLevel: 2,
    tierName: 'Active Plug',
    tagline: 'Chamber VII • Asset Compounding Vault',
    description: 'Deep compounding asset analytics, net worth trajectory projections, and reactive visual shader morphs.',
    features: ['Asset vs Liability Ratio Analyzer', 'Dynamic Living Vault Shaders', 'Per-Second Compounding Ticker', 'Financial Freedom Runway'],
    accentColor: '#f59e0b',
  },
  'debts': {
    tabId: 'debts',
    name: 'Debt Avalanche Eliminator',
    iconName: 'CreditCard',
    minLevel: 6,
    minXP: 3000,
    tierLevel: 3,
    tierName: 'Wealth Builder',
    tagline: 'Chamber VIII • Liability Zero-Sum Matrix',
    description: 'Algorithmic debt elimination running mathematical Avalanche and Snowball payoff simulations.',
    features: ['Avalanche High-Interest Targeting', 'Snowball Momentum', 'Payoff Date Forecasting', '1-Click Surplus Debt Injections'],
    accentColor: '#ef4444',
  },
  'generate': {
    tabId: 'generate',
    name: '5-Pulse Active Creator AI Studio',
    iconName: 'Sparkles',
    minLevel: 6,
    minXP: 3000,
    tierLevel: 3,
    tierName: 'Wealth Builder',
    tagline: 'Chamber IX • Viral Content Synthesizer',
    description: 'Generate high-converting TikTok, YouTube Shorts, Reels, and 𝕏 viral hooks and video scripts tuned for maximum referral conversions.',
    features: ['5-Pulse Algorithmic Content Matrix', 'Multi-Platform Script Synthesis', 'Conversion-Optimized CTA Generator', 'Viral Velocity Predictive Scoring'],
    accentColor: '#ec4899',
  },
  'v5': {
    tabId: 'v5',
    name: 'Plug-In OS v5.0 Swarm Orchestrator',
    iconName: 'Cpu',
    minLevel: 10,
    minXP: 7000,
    tierLevel: 4,
    tierName: 'Grand Money Plug',
    tagline: 'Chamber X • Autonomous Multi-Agent Swarm',
    description: '12 Autonomous Swarm Agents managing cash balance, earning optimizations, referral scraping, and market intelligence 24/7.',
    features: ['12-Agent Autonomous Swarm', 'Real-Time Inter-Agent Bus Protocol', 'Self-Healing Financial Logic', 'Automated Commission Routing'],
    accentColor: '#8b5cf6',
  },
  'crypto': {
    tabId: 'crypto',
    name: 'Crypto & Digital Asset Bridge',
    iconName: 'Layers',
    minLevel: 10,
    minXP: 7000,
    tierLevel: 4,
    tierName: 'Grand Money Plug',
    tagline: 'Chamber XI • Decentralized Asset Ledger',
    description: 'Cross-chain Bitcoin, Ethereum, and Solana portfolio bridge with real-time volatility dampening and synthetic staking yield.',
    features: ['Multi-Chain Portfolio Aggregator', 'Synthetic Staking Yield Simulator', 'Real-Time Volatility Dampener', 'Cryptographic Proof of Reserve'],
    accentColor: '#06b6d4',
  },
  'cashback': {
    tabId: 'cashback',
    name: 'Cashback Pack & Yield Accelerator',
    iconName: 'Gift',
    minLevel: 10,
    minXP: 7000,
    tierLevel: 4,
    tierName: 'Grand Money Plug',
    tagline: 'Chamber XII • Synthetic Yield Node',
    description: '$25 instant cashback reward loops and compounding velocity engines for high-volume creators.',
    features: ['Instant $25 Commission Kickbacks', 'Compounding Merchant Nodes', 'Automated Payout Conduits', 'VIP Merchant Cashback Rebates'],
    accentColor: '#14b8a6',
  }
};

/**
 * Check if a tab is unlocked for a user with given level/xp/role
 */
export function isChamberUnlocked(tabId: string, userLevel: number = 1, userRole: string = 'user'): boolean {
  if (userRole === 'admin') return true;
  const canonical = tabId === 'command-center' ? 'overview' 
    : tabId === 'plugin-os-v5' ? 'v5' 
    : tabId === 'chat' ? 'moneyos' 
    : tabId === 'forge' || tabId === 'sigil-marketplace' ? 'sigil-forge'
    : tabId === 'leaderboard' ? 'quests'
    : tabId === 'crypto-programs' ? 'crypto'
    : tabId;

  const info = CHAMBER_UNLOCKS[canonical];
  if (!info) return true; // public / un-gated pages
  return userLevel >= info.minLevel;
}

/**
 * Get unlock requirements and progression data for a tab
 */
export function getChamberProgression(tabId: string, userLevel: number = 1, userXp: number = 0, userRole: string = 'user') {
  const canonical = tabId === 'command-center' ? 'overview' 
    : tabId === 'plugin-os-v5' ? 'v5' 
    : tabId === 'chat' ? 'moneyos' 
    : tabId === 'forge' || tabId === 'sigil-marketplace' ? 'sigil-forge'
    : tabId === 'leaderboard' ? 'quests'
    : tabId === 'crypto-programs' ? 'crypto'
    : tabId;

  const info = CHAMBER_UNLOCKS[canonical] || CHAMBER_UNLOCKS['overview'];
  const unlocked = userRole === 'admin' || userLevel >= info.minLevel;
  const xpRemaining = Math.max(0, info.minXP - userXp);
  const levelsRemaining = Math.max(0, info.minLevel - userLevel);
  const progressPercent = info.minXP > 0 ? Math.min(100, Math.round((userXp / info.minXP) * 100)) : 100;

  return {
    ...info,
    unlocked,
    xpRemaining,
    levelsRemaining,
    progressPercent,
  };
}

/**
 * Get next upcoming chamber unlock milestone
 */
export function getNextChamberMilestone(userLevel: number = 1) {
  const upcoming = Object.values(CHAMBER_UNLOCKS)
    .filter(c => c.minLevel > userLevel)
    .sort((a, b) => a.minLevel - b.minLevel);

  return upcoming[0] || null;
}
