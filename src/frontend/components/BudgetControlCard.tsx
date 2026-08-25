import React from 'react';
import { PieChart, ArrowUpRight } from 'lucide-react';

interface BudgetControlCardProps {
  budgetLimitCents: number;
  budgetSpentCents: number;
  budgetRemainingCents: number;
  onViewDetails?: () => void;
}

export const BudgetControlCard: React.FC<BudgetControlCardProps> = ({
  budgetLimitCents,
  budgetSpentCents,
  budgetRemainingCents,
  onViewDetails,
}) => {
  const formatUsd = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const percentSpent = budgetLimitCents > 0 
    ? Math.min(100, Math.round((budgetSpentCents / budgetLimitCents) * 100)) 
    : 0;

  return (
    <div className="bg-plug-card border border-plug-border rounded-2xl p-5 hover:border-sky-500/40 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              📊 Budget Remaining
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Monthly Budget Control</span>
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
        <div className="text-2xl sm:text-3xl font-black text-sky-400 tracking-tight">
          {formatUsd(budgetRemainingCents)}
        </div>

        {/* Progress Bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Spent: {formatUsd(budgetSpentCents)}</span>
            <span>Limit: {formatUsd(budgetLimitCents)}</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentSpent > 90 ? 'bg-rose-500' : percentSpent > 75 ? 'bg-amber-400' : 'bg-sky-400'
              }`}
              style={{ width: `${percentSpent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
