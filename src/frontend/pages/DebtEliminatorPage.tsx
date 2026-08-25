import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Debt } from '../../types';
import { CreditCard, Sparkles, Plus, TrendingDown, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export const DebtEliminatorPage: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [toast, setToast] = useState<string | null>(null);

  const fetchDebts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/finance/debts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setDebts(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [token]);

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedDebt || !payAmount) return;

    try {
      const cents = Math.round(parseFloat(payAmount) * 100);
      const res = await fetch(`/api/finance/debts/${selectedDebt.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount_cents: cents }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(data.message);
        setSelectedDebt(null);
        setPayAmount('');
        await fetchDebts();
        await refreshUser();
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalDebt = debts.reduce((acc, d) => acc + d.total_balance_cents, 0);
  const totalMinPay = debts.reduce((acc, d) => acc + d.minimum_payment_cents, 0);
  const formatUsd = (cents: number = 0) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'avalanche') {
      return b.interest_rate - a.interest_rate; // Highest APR first
    }
    return a.total_balance_cents - b.total_balance_cents; // Smallest balance first
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-plug-card border border-rose-500/30 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Debt Eliminator & Payoff Accelerator
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono font-bold">
              Interest Slayer
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Systematically crush high-interest balances. Earn <strong>+150 XP</strong> for every principal payment made.
          </p>
        </div>

        {/* Strategy Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setStrategy('avalanche')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
              strategy === 'avalanche' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Avalanche (Save Most Interest)
          </button>
          <button
            onClick={() => setStrategy('snowball')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
              strategy === 'snowball' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Snowball (Fastest Wins)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-plug-card border border-plug-border rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding Debt</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{formatUsd(totalDebt)}</div>
          <span className="text-[11px] text-slate-500 font-mono">Across {debts.length} linked accounts</span>
        </div>

        <div className="bg-plug-card border border-plug-border rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Minimums</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">{formatUsd(totalMinPay)}</div>
          <span className="text-[11px] text-slate-500 font-mono">Required monthly cash outflow</span>
        </div>

        <div className="bg-plug-card border border-emerald-500/20 rounded-2xl p-5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">XP Payoff Incentive</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">+150 XP / Pay</div>
          <span className="text-[11px] text-emerald-500/80 font-mono">Level up as you eliminate principal</span>
        </div>
      </div>

      {/* Debts Priority Table */}
      <div className="bg-plug-card border border-plug-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-plug-border pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-400" />
            Target Debt Priority Queue
          </h3>
          <span className="text-xs text-slate-400 font-mono">Ranked by {strategy.toUpperCase()}</span>
        </div>

        <div className="space-y-3">
          {sortedDebts.map((d, index) => (
            <div
              key={d.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                index === 0 ? 'bg-rose-500/10 border-rose-500/40 shadow-lg' : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  index === 0 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  #{index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{d.name}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white uppercase font-mono">
                        Primary Target
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    APR: <strong className="text-white">{d.interest_rate}%</strong> • Min Pay: {formatUsd(d.minimum_payment_cents)}/mo • Due: {d.due_date}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end md:self-auto">
                <div className="text-right">
                  <div className="text-lg font-black text-rose-400 font-mono">
                    {formatUsd(d.total_balance_cents)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Balance Remaining</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedDebt(d);
                    setPayAmount((d.minimum_payment_cents / 100).toFixed(2));
                  }}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Pay & +150 XP
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pay Debt Modal */}
      <Modal isOpen={!!selectedDebt} onClose={() => setSelectedDebt(null)} title={`Pay Down: ${selectedDebt?.name}`}>
        <form onSubmit={handlePayDebt} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Current Balance:</span>
            <span className="text-rose-400 font-bold font-mono text-sm">
              {formatUsd(selectedDebt?.total_balance_cents)}
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Payment Amount ($ USD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-plug-accent"
            />
          </div>

          <div className="p-3 rounded-xl bg-plug-accent/10 border border-plug-accent/20 text-plug-accent text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>You will immediately earn <strong>+150 XP</strong> towards your level rank!</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold rounded-xl transition-all shadow-md"
          >
            Execute Payment & Claim XP
          </button>
        </form>
      </Modal>
    </div>
  );
};
