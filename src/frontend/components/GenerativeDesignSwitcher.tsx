import React, { useState } from 'react';
import { useGenerativeDesign } from '../context/GenerativeDesignContext';
import { useLivingVault, VAULT_TIER_CONFIGS, WealthVaultTier } from '../context/LivingVaultContext';
import { 
  Sparkles, RefreshCw, Wand2, Shield, Landmark, 
  Coins, DollarSign, ChevronUp, ChevronDown, Flame, TrendingUp, Undo,
  Zap, Crown, Gem, Orbit, Volume2
} from 'lucide-react';

export const GenerativeDesignSwitcher: React.FC = () => {
  const { palette, cardAesthetic, wealthMotto, shiftDesign, primaryAccent } = useGenerativeDesign();
  const { 
    tier, tierConfig, tierLabel, totalEarningsUsd, netWorthUsd, 
    isSimulated, setSimulatedRevenue, resetToLive, triggerShockwave 
  } = useLivingVault();

  const [isOpen, setIsOpen] = useState(false);
  const [sliderNetWorth, setSliderNetWorth] = useState(netWorthUsd);

  const handleSliderChange = (nw: number) => {
    setSliderNetWorth(nw);
    setSimulatedRevenue(Math.round(nw * 0.12), nw);
  };

  const handleQuickTierSelect = (selectedTier: WealthVaultTier) => {
    const cfg = VAULT_TIER_CONFIGS[selectedTier];
    const targetNetWorth = Math.max(cfg.minNetWorth, 1500);
    setSliderNetWorth(targetNetWorth);
    setSimulatedRevenue(cfg.minEarnings || Math.round(targetNetWorth * 0.12), targetNetWorth);
    triggerShockwave();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Expanded Modal / Living Vault Telemetry Inspector */}
      {isOpen && (
        <div className="mb-3 p-5 rounded-3xl bg-slate-950/95 border-2 border-slate-800 shadow-2xl backdrop-blur-2xl max-w-sm w-96 space-y-4 animate-fadeIn text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-slate-950 shadow-md"
                style={{ backgroundColor: tierConfig.accentColor }}
              >
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <span className="font-black text-white uppercase tracking-wider text-[11px] block">
                  The Living Wealth Vault™
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  6-Tier Dynamic Wealth Ascension
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Active Wealth Tier Badge */}
          <div 
            className="p-3.5 rounded-2xl border space-y-2 relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderColor: `${tierConfig.accentColor}55`,
              boxShadow: `0 0 20px -5px ${tierConfig.accentColor}33`,
            }}
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 uppercase font-bold">Active Visual Vault:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                isSimulated ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isSimulated ? '⚡ Simulation' : '● Live Vault'}
              </span>
            </div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>{tierConfig.label}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-300 pt-1 border-t border-slate-800/80">
              <span>Net Worth: <strong className="text-white">${netWorthUsd.toLocaleString()}</strong></span>
              <span>Platform ARR: <strong className="text-emerald-400">${(totalEarningsUsd * 12).toLocaleString()}/yr</strong></span>
            </div>

            {/* Active Visual Unlocks List */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block mb-1">
                Visual Shader Upgrades Active:
              </span>
              <div className="flex flex-wrap gap-1">
                {tierConfig.visualUnlocks.map((u, i) => (
                  <span 
                    key={i} 
                    className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border text-slate-200"
                    style={{ borderColor: `${tierConfig.accentColor}40` }}
                  >
                    ✓ {u}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick 6-Tier Wealth Jumper */}
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
              1-Click Wealth Tier Jump:
            </span>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
              {(['starter-seed', 'builder-river', 'crypto-matrix', 'bullion-chamber', 'sovereign-vault', 'celestial-singularity'] as WealthVaultTier[]).map((t) => {
                const cfg = VAULT_TIER_CONFIGS[t];
                const isActive = tier === t;
                return (
                  <button
                    key={t}
                    onClick={() => handleQuickTierSelect(t)}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all font-bold truncate ${
                      isActive 
                        ? 'bg-slate-800 border-white text-white shadow-md' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                    style={isActive ? { borderColor: cfg.accentColor, color: cfg.accentColor } : {}}
                  >
                    {cfg.shortName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Wealth Revenue Simulation Slider */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-plug-accent" />
                Simulate Net Worth:
              </span>
              <span className="text-sm font-black text-plug-accent">
                ${sliderNetWorth.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1000000}
              step={5000}
              value={sliderNetWorth}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-plug-accent"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>$0</span>
              <span>$20k (Gold)</span>
              <span>$100k (Diamond)</span>
              <span>$1M+ (Apex)</span>
            </div>
          </div>

          {/* Actions: Shift Design, Trigger Shockwave, Reset */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={shiftDesign}
              className="py-2.5 px-2 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-mono"
            >
              <RefreshCw className="w-3 h-3 text-purple-400" />
              Morph UI
            </button>

            <button
              onClick={triggerShockwave}
              className="py-2.5 px-2 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-mono"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Shockwave
            </button>

            {isSimulated ? (
              <button
                onClick={() => {
                  resetToLive();
                  setSliderNetWorth(netWorthUsd);
                }}
                className="py-2.5 px-2 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer bg-plug-accent hover:bg-plug-accentHover text-plug-dark shadow-md font-mono"
              >
                <Undo className="w-3 h-3" />
                Live Sync
              </button>
            ) : (
              <button
                onClick={() => handleQuickTierSelect('celestial-singularity')}
                className="py-2.5 px-2 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shadow-md font-mono"
              >
                <Flame className="w-3 h-3 fill-current text-amber-300" />
                Apex $1M
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Living Vault Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-full bg-slate-950/95 hover:bg-slate-900 border border-slate-700/80 shadow-2xl backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-2.5 transition-all hover:scale-105 group"
        style={{
          boxShadow: `0 0 25px -5px ${tierConfig.accentColor}`,
        }}
      >
        <span 
          className="w-2.5 h-2.5 rounded-full animate-ping" 
          style={{ backgroundColor: tierConfig.accentColor }}
        />
        <Landmark className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
        <span>Living Vault <strong style={{ color: tierConfig.accentColor }}>${netWorthUsd.toLocaleString()}</strong></span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
      </button>
    </div>
  );
};
