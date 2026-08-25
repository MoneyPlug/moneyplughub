import React from 'react';
import { useLivingRealm } from '../context/LivingRealmContext';
import { TrendingUp, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface LiveCompoundingTickerProps {
  onNavigate?: (tab: string) => void;
}

export const LiveCompoundingTicker: React.FC<LiveCompoundingTickerProps> = ({ onNavigate }) => {
  const { liveEarnedCents, perSecondYieldCents, annualRunRateUsd, referralVelocity } = useLivingRealm();

  return (
    <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-y border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300 shadow-inner relative z-30">
      {/* Left: Real-time Accumulation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-plug-accent">
          <span className="w-2 h-2 rounded-full bg-plug-accent animate-ping" />
          <span className="font-black uppercase tracking-wider text-[10px]">LIVE CASHFLOW STREAM:</span>
        </div>
        <div className="text-white font-black text-sm bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
          <span className="text-plug-accent">+${(liveEarnedCents / 100).toFixed(4)}</span>
          <span className="text-[10px] text-slate-500 font-normal">USD</span>
        </div>
      </div>

      {/* Center: Velocity Rate & Annual ARR */}
      <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Velocity:</span>
          <strong className="text-emerald-400 font-bold">+{perSecondYieldCents.toFixed(4)}¢/sec</strong>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          <span>Projected ARR:</span>
          <strong className="text-white font-bold">${annualRunRateUsd.toLocaleString()} / yr</strong>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Multiplier:</span>
          <strong className="text-amber-300 font-bold">{referralVelocity}x Supercritical</strong>
        </div>
      </div>

      {/* Right: Direct CTA */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('referral-hub')}
          className="text-[10px] uppercase font-bold text-plug-accent hover:text-white bg-plug-accent/10 hover:bg-plug-accent/20 px-2.5 py-1 rounded-lg border border-plug-accent/30 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Boost Velocity</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
};

export default LiveCompoundingTicker;
