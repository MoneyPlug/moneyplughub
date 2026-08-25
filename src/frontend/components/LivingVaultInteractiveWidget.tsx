import React from 'react';
import { useLivingVault, VAULT_TIER_CONFIGS, WealthVaultTier } from '../context/LivingVaultContext';
import { 
  Landmark, TrendingUp, Sparkles, Zap, Shield, Crown, 
  Gem, Flame, Orbit, ChevronRight, Check, RefreshCw, Undo, Coins
} from 'lucide-react';
import { forgeAudio } from '../utils/forgeAudio';

export const LivingVaultInteractiveWidget: React.FC = () => {
  const { 
    tier, tierConfig, tierLabel, netWorthUsd, totalEarningsUsd,
    isSimulated, setSimulatedRevenue, resetToLive, triggerShockwave 
  } = useLivingVault();

  const handleSelectTier = (t: WealthVaultTier) => {
    const cfg = VAULT_TIER_CONFIGS[t];
    const targetNetWorth = Math.max(cfg.minNetWorth, 1500);
    setSimulatedRevenue(cfg.minEarnings || Math.round(targetNetWorth * 0.12), targetNetWorth);
    triggerShockwave();
    forgeAudio.playCosmicRoll();
  };

  // Find next tier for progression meter
  const tiersList: WealthVaultTier[] = [
    'starter-seed', 'builder-river', 'crypto-matrix', 
    'bullion-chamber', 'sovereign-vault', 'celestial-singularity'
  ];
  const currentIdx = tiersList.indexOf(tier);
  const nextTierId = currentIdx < tiersList.length - 1 ? tiersList[currentIdx + 1] : null;
  const nextTierCfg = nextTierId ? VAULT_TIER_CONFIGS[nextTierId] : null;

  const currentMin = tierConfig.minNetWorth;
  const nextMin = nextTierCfg ? nextTierCfg.minNetWorth : tierConfig.minNetWorth * 2;
  const progressPct = nextTierCfg 
    ? Math.min(100, Math.max(0, ((netWorthUsd - currentMin) / (nextMin - currentMin)) * 100))
    : 100;

  return (
    <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
      {/* Dynamic Ambient Background Glow */}
      <div 
        className="absolute top-0 right-0 w-[450px] h-[300px] blur-[130px] opacity-25 pointer-events-none transition-colors duration-700"
        style={{ background: tierConfig.accentColor }}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-slate-950 shadow-lg transition-transform hover:scale-105"
            style={{ 
              backgroundColor: tierConfig.accentColor,
              boxShadow: `0 0 25px ${tierConfig.accentColor}66`
            }}
          >
            {tier === 'celestial-singularity' ? (
              <Orbit className="w-6 h-6 animate-spin text-white" />
            ) : tier === 'sovereign-vault' ? (
              <Crown className="w-6 h-6" />
            ) : tier === 'bullion-chamber' ? (
              <Flame className="w-6 h-6" />
            ) : tier === 'crypto-matrix' ? (
              <Zap className="w-6 h-6" />
            ) : tier === 'builder-river' ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <Landmark className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Wealth Ascension Engine
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isSimulated 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isSimulated ? '⚡ Simulation Preview' : '● Live ACID Vault'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5 flex items-center gap-2">
              {tierConfig.label}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerShockwave();
              forgeAudio.playShockwave();
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Shockwave Burst
          </button>

          {isSimulated && (
            <button
              onClick={() => {
                resetToLive();
                forgeAudio.playTick();
              }}
              className="px-3 py-2 rounded-xl bg-plug-accent hover:bg-plug-accentHover text-plug-dark text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <Undo className="w-3.5 h-3.5" />
              Reset Live
            </button>
          )}
        </div>
      </div>

      {/* 6-Tier Progression Ladder Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 relative z-10">
        {tiersList.map((t, idx) => {
          const cfg = VAULT_TIER_CONFIGS[t];
          const isCurrent = tier === t;
          const isUnlocked = netWorthUsd >= cfg.minNetWorth;

          return (
            <button
              key={t}
              onClick={() => handleSelectTier(t)}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                isCurrent 
                  ? 'bg-slate-900 border-white text-white shadow-xl ring-1 ring-white/50' 
                  : isUnlocked
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                  : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800'
              }`}
              style={isCurrent ? { borderColor: cfg.accentColor, boxShadow: `0 0 20px -5px ${cfg.accentColor}55` } : {}}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="text-slate-500 font-bold">Tier 0{idx + 1}</span>
                {isCurrent && (
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: cfg.accentColor }} />
                )}
              </div>
              <div 
                className="text-xs font-black truncate group-hover:text-white transition-colors"
                style={isCurrent ? { color: cfg.accentColor } : {}}
              >
                {cfg.shortName}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                ${cfg.minNetWorth >= 1000 ? `${cfg.minNetWorth / 1000}k+` : '$0'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tier Visual Shaders & Ascension Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Visual Shaders Active (7 Cols) */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Live Vault Visual Architecture
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {tierConfig.particleDensity} Particles Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tierConfig.visualUnlocks.map((u, i) => (
              <div 
                key={i} 
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-xs font-mono text-slate-200"
              >
                <div 
                  className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tierConfig.accentColor}25`, color: tierConfig.accentColor }}
                >
                  <Check className="w-3 h-3" />
                </div>
                <span className="truncate">{u}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
            <span>3D Bullion: <strong className="text-amber-400">{tierConfig.bullionCount} Bars</strong></span>
            <span>Diamonds: <strong className="text-cyan-400">{tierConfig.diamondCount} Gems</strong></span>
            <span>Singularity: <strong className={tierConfig.hasSingularity ? 'text-rose-400' : 'text-slate-500'}>{tierConfig.hasSingularity ? 'ACTIVE' : 'LOCKED'}</strong></span>
          </div>
        </div>

        {/* Ascension Meter to Next Tier (5 Cols) */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-slate-400 font-bold uppercase">Ascension Progress:</span>
              <span className="font-bold text-white">{progressPct.toFixed(0)}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 via-amber-400 to-cyan-400"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Current Net Worth:</span>
              <strong className="text-white">${netWorthUsd.toLocaleString()}</strong>
            </div>
            {nextTierCfg && (
              <div className="flex justify-between">
                <span>Next Milestone ({nextTierCfg.shortName}):</span>
                <strong className="text-amber-300">${nextTierCfg.minNetWorth.toLocaleString()}</strong>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
            💡 As your net worth scales, the Living Vault dynamically morphs into denser bullion, prismatic gems, and cosmic singularity warps in real time.
          </div>
        </div>

      </div>
    </div>
  );
};
