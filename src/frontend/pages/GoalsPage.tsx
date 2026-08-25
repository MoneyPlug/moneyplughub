import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { FinancialGoal } from '../../types';
import { Target, Shield, Bitcoin, Sparkles, Plus, CheckCircle2 } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/finance/goals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setGoals(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedGoal || !depositAmount) return;

    try {
      const cents = Math.round(parseFloat(depositAmount) * 100);
      const res = await fetch(`/api/finance/goals/${selectedGoal.id}/deposit`, {
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
        setSelectedGoal(null);
        setDepositAmount('');
        await fetchGoals();
        await refreshUser();
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatUsd = (cents: number = 0) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-plug-card border border-plug-border p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Financial Goals & Emergency Vaults
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">
              Runway Builder
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build bulletproof financial reserves. Earn <strong>+100 XP</strong> on every deposit into your goal vaults.
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g) => {
          const percent = g.target_cents > 0 
            ? Math.min(100, Math.round((g.current_cents / g.target_cents) * 100)) 
            : 0;

          return (
            <div key={g.id} className="bg-plug-card border border-plug-border rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {g.category === 'crypto' ? <Bitcoin className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{g.title}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">Target Date: {g.target_date}</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-amber-400 font-mono">{percent}% Funded</span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-white">{formatUsd(g.current_cents)}</span>
                    <span className="text-xs text-slate-400 font-mono">of {formatUsd(g.target_cents)}</span>
                  </div>

                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-plug-accent rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Reward: +100 XP / contribution</span>
                <button
                  onClick={() => {
                    setSelectedGoal(g);
                    setDepositAmount('50.00');
                  }}
                  className="px-4 py-2 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Contribute & +100 XP
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contribute Modal */}
      <Modal isOpen={!!selectedGoal} onClose={() => setSelectedGoal(null)} title={`Contribute to: ${selectedGoal?.title}`}>
        <form onSubmit={handleDeposit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Deposit Amount ($ USD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-plug-accent"
            />
          </div>

          <div className="p-3 rounded-xl bg-plug-accent/10 border border-plug-accent/20 text-plug-accent text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>You will receive <strong>+100 XP</strong> towards your level rank!</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold rounded-xl transition-all shadow-md"
          >
            Confirm Contribution & Claim 100 XP
          </button>
        </form>
      </Modal>
    </div>
  );
};
