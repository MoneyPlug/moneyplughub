import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrchestratorWidget } from '../components/OrchestratorWidget';
import { InsightAgentWidget } from '../components/InsightAgentWidget';
import { BalanceAgentWidget } from '../components/BalanceAgentWidget';
import { EarningsAgentWidget } from '../components/EarningsAgentWidget';
import { AutomationAgentWidget } from '../components/AutomationAgentWidget';
import { LivingVaultInteractiveWidget } from '../components/LivingVaultInteractiveWidget';
import { 
  Building, PieChart, ShieldAlert, Target, CreditCard, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, TrendingUp, 
  Coins, DollarSign, Wallet, Calendar, AlertCircle
} from 'lucide-react';

export const FinanceOverviewPage: React.FC = () => {
  const { user, token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'accounts' | 'budget' | 'debts' | 'goals'>('all');

  const fetchFinanceOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFinanceOverview();
    }
  }, [token]);

  const formatUsd = (cents: number = 0) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-plug-accent"></div>
      </div>
    );
  }

  const summary = data?.summary || {
    total_assets_cents: 0,
    total_liabilities_cents: 0,
    net_worth_cents: 0,
    budget_limit_cents: 0,
    budget_spent_cents: 0,
    budget_remaining_cents: 0,
    emergency_fund_target_cents: 0,
    emergency_fund_current_cents: 0,
    total_debt_cents: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-plug-card border border-plug-border p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Command Center & Financial Blueprint
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold">
              StarterOrchestrator v1.0 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central orchestration hub coordinating BalanceAgent, EarningsAgent, ReferralAgent, AutomationAgent, and InsightAgent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFinanceOverview}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 0. 6-Tier Living Vault Ascension & Simulation HUD */}
      <LivingVaultInteractiveWidget />

      {/* 1. StarterOrchestrator v1.0 Master HUD */}
      <OrchestratorWidget onActionComplete={fetchFinanceOverview} />

      {/* 4 Core Financial Snapshots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NET WORTH */}
        <div className="bg-plug-card border border-plug-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              🏦 Net Worth
            </span>
            <span className="p-1 rounded bg-plug-accent/10 text-plug-accent text-[10px] font-mono font-bold">
              Snapshots
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {formatUsd(summary.net_worth_cents)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
            <span className="text-emerald-400">Assets: {formatUsd(summary.total_assets_cents)}</span>
            <span>•</span>
            <span className="text-rose-400">Liab: {formatUsd(summary.total_liabilities_cents)}</span>
          </div>
        </div>

        {/* BUDGET REMAINING */}
        <div className="bg-plug-card border border-plug-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              📊 Budget Remaining
            </span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
              Control
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-plug-accent mt-2">
            {formatUsd(summary.budget_remaining_cents)}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-plug-accent h-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, (summary.budget_spent_cents / (summary.budget_limit_cents || 1)) * 100))}%`
              }}
            />
          </div>
        </div>

        {/* TOTAL DEBT */}
        <div className="bg-plug-card border border-plug-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              💳 Total Debt
            </span>
            <span className="p-1 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono font-bold">
              Eliminator
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
            {formatUsd(summary.total_debt_cents)}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-2">
            Active Strategy: <span className="text-white font-bold uppercase">Avalanche Paydown</span>
          </div>
        </div>

        {/* EMERGENCY FUND */}
        <div className="bg-plug-card border border-plug-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              🎯 Emergency Fund
            </span>
            <span className="p-1 rounded bg-sky-500/10 text-sky-400 text-[10px] font-mono font-bold">
              Goals
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-2">
            {formatUsd(summary.emergency_fund_current_cents)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
            <span>Target: {formatUsd(summary.emergency_fund_target_cents)}</span>
            <span className="text-sky-300 font-bold">
              {Math.round((summary.emergency_fund_current_cents / (summary.emergency_fund_target_cents || 1)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Autonomous Multi-Agent Mesh Components */}
      <div className="space-y-6">
        <InsightAgentWidget />
        <BalanceAgentWidget onSyncComplete={fetchFinanceOverview} />
        <EarningsAgentWidget />
        <AutomationAgentWidget />
      </div>

      {/* Linked Notion Views Section */}
      <div className="bg-plug-card border border-plug-border rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-plug-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-plug-accent" />
              Connected Financial Accounts & Ledger Views
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live database representations corresponding to your Notion Financial OS architecture.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'all' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Linked Views
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'accounts' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'
              }`}
            >
              🏦 Accounts
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'budget' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 Budget Control
            </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'debts' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'
              }`}
            >
              💳 Debt
            </button>
          </div>
        </div>

        {/* ACCOUNTS LINKED VIEW */}
        {(activeTab === 'all' || activeTab === 'accounts') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                🏦 Accounts — Linked Views
              </h3>
              <span className="text-xs font-mono text-slate-500">{data?.accounts?.length || 0} Connected Accounts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.accounts?.map((acc: any) => (
                <div key={acc.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate max-w-[140px]">{acc.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {acc.type}
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-plug-accent">
                    {formatUsd(acc.balance_cents)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Institution: {acc.institution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRANSACTIONS LINKED VIEW */}
        {activeTab === 'all' && (
          <div className="space-y-3 pt-4 border-t border-plug-border/60">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                💰 Transactions — Linked Views
              </h3>
              <span className="text-xs font-mono text-slate-500">{data?.transactions?.length || 0} Recent Entries</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {data?.transactions?.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{tx.date}</td>
                      <td className="py-3 px-4 font-bold text-white">{tx.description}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{tx.category}</td>
                      <td className="py-3 px-4 font-mono text-[11px] uppercase">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'income' || tx.type === 'reward' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.type === 'crypto_buy' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${
                        tx.type === 'income' || tx.type === 'reward' ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {tx.type === 'expense' || tx.type === 'debt_payment' ? '-' : '+'}{formatUsd(tx.amount_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
