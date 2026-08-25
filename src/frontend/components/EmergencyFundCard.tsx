import React from 'react';
import { Target, Shield, Sparkles, ArrowUpRight } from 'lucide-react';

interface EmergencyFundCardProps {
  targetCents: number;
  currentCents: number;
  onViewDetails?: () => void;
  onQuickDeposit?: () => void;
}

export const EmergencyFundCard: React.FC<EmergencyFundCardProps> = ({
  targetCents,
  currentCents,
  onViewDetails,
  onQuickDeposit,
}) => {
  const formatUsd = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const progressPercent = targetCents > 0 
    ? Math.min(100, Math.round((currentCents / targetCents) * 100)) 
    : 0;

  return (
    <div className="bg-plug-card border border-plug-border rounded-2xl p-5 hover:border-amber-500/40 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              🎯 Emergency Fund
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Financial Goals Vault</span>
          </div>
        </div>

        {onViewDetails && (
          <button 
            onClick={onViewDetails}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
          {formatUsd(currentCents)}
        </div>

        {/* Progress */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Target: {formatUsd(targetCents)}</span>
            <span className="text-amber-400 font-bold">{progressPercent}% Funded</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
