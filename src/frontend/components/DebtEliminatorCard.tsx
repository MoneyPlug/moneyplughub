import React from 'react';
import { CreditCard, Sparkles, ArrowUpRight } from 'lucide-react';

interface DebtEliminatorCardProps {
  totalDebtCents: number;
  onViewDetails?: () => void;
  onQuickPay?: () => void;
}

export const DebtEliminatorCard: React.FC<DebtEliminatorCardProps> = ({
  totalDebtCents,
  onViewDetails,
  onQuickPay,
}) => {
  const formatUsd = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-plug-card border border-plug-border rounded-2xl p-5 hover:border-rose-500/40 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              💳 Total Debt
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Debt Eliminator</span>
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
        <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
          {formatUsd(totalDebtCents)}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            Strategy: Avalanche (High APR First)
          </span>
          {onQuickPay && (
            <button
              onClick={onQuickPay}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[10px] transition-colors flex items-center gap-1 border border-rose-500/30"
            >
              <Sparkles className="w-3 h-3 text-plug-accent" />
              Pay & +150 XP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
