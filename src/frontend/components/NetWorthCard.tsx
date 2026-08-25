import React from 'react';
import { Landmark, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface NetWorthCardProps {
  totalAssetsCents: number;
  totalLiabilitiesCents: number;
  netWorthCents: number;
  onViewDetails?: () => void;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({
  totalAssetsCents,
  totalLiabilitiesCents,
  netWorthCents,
  onViewDetails,
}) => {
  const formatUsd = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-plug-card border border-plug-border rounded-2xl p-5 hover:border-emerald-500/40 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              🏦 Net Worth
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Real-Time Asset Balance</span>
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
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {formatUsd(netWorthCents)}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-slate-500 text-[10px] block">Assets:</span>
            <span className="text-emerald-400 font-semibold">{formatUsd(totalAssetsCents)}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">Debts / Liab:</span>
            <span className="text-rose-400 font-semibold">{formatUsd(totalLiabilitiesCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
