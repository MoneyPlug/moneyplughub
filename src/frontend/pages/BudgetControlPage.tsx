import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { BudgetCategory } from '../../types';
import { PieChart, Plus, Sparkles, CheckCircle2, TrendingDown, AlertTriangle } from 'lucide-react';

export const BudgetControlPage: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchBudgets = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/finance/budget', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setBudgets(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [token]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCatName || !newCatLimit) return;

    try {
      const limitCents = Math.round(parseFloat(newCatLimit) * 100);
      const res = await fetch('/api/finance/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: newCatName,
          monthly_limit_cents: limitCents,
        }),
      });
      if (res.ok) {
        setToast('✅ Budget category updated!');
        setShowAddCategoryModal(false);
        setNewCatName('');
        setNewCatLimit('');
        await fetchBudgets();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalLimit = budgets.reduce((acc, b) => acc + b.monthly_limit_cents, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent_cents || 0), 0);
  const totalRemaining = Math.max(0, totalLimit - totalSpent);
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
              Budget Control & Category Limits
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-mono font-bold">
              50/30/20 Disciplined
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking across all spending envelopes. Stay under budget to maintain your Daily Streak XP multiplier.
          </p>
        </div>

        <button
          onClick={() => setShowAddCategoryModal(true)}
          className="px-4 py-2.5 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-bold text-xs rounded-xl transition-all shadow-md shadow-plug-accent/20 flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Budget Category
        </button>
      </div>

      {/* Overall Budget Control Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-plug-card border border-plug-border rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Limit</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">{formatUsd(totalLimit)}</div>
          <span className="text-[11px] text-slate-500 font-mono">Current Month Envelope</span>
        </div>

        <div className="bg-plug-card border border-amber-500/20 rounded-2xl p-5">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Total Spent So Far</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">{formatUsd(totalSpent)}</div>
          <span className="text-[11px] text-amber-500/80 font-mono">
            {totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0}% of allocation consumed
          </span>
        </div>

        <div className="bg-plug-card border border-emerald-500/20 rounded-2xl p-5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Budget Remaining</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{formatUsd(totalRemaining)}</div>
          <span className="text-[11px] text-emerald-500/80 font-mono">Safe to spend this cycle</span>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="bg-plug-card border border-plug-border rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-plug-accent" />
          Category Envelopes
        </h3>

        <div className="space-y-4">
          {budgets.map((b) => {
            const spent = b.spent_cents || 0;
            const limit = b.monthly_limit_cents;
            const remaining = Math.max(0, limit - spent);
            const percent = Math.min(100, Math.round((spent / limit) * 100));

            return (
              <div key={b.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white text-sm">{b.category}</span>
                    <span className="text-slate-400 font-mono ml-2">
                      ({formatUsd(spent)} spent of {formatUsd(limit)})
                    </span>
                  </div>
                  <span className={`font-bold font-mono ${remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatUsd(remaining)} remaining
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percent > 95 ? 'bg-rose-500' : percent > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddCategoryModal} onClose={() => setShowAddCategoryModal(false)} title="Set Budget Category">
        <form onSubmit={handleAddBudget} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Category Name</label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Dining Out, Crypto Stash"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-plug-accent"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Monthly Limit ($ USD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={newCatLimit}
              onChange={(e) => setNewCatLimit(e.target.value)}
              placeholder="350.00"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-plug-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold rounded-xl transition-all shadow-md"
          >
            Save Category Envelope
          </button>
        </form>
      </Modal>
    </div>
  );
};
