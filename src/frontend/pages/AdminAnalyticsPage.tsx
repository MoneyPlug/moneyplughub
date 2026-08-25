import React, { useState, useEffect } from 'react';
import { 
  Database, Users, DollarSign, Activity, TrendingUp, ShieldCheck, 
  Layers, HardDrive, Cpu, RefreshCw, BarChart3, Search, Filter, 
  ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2, Clock, 
  Sparkles, Target, CreditCard, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MetricsData {
  users: {
    totalUsers: number;
    totalXp: number;
    avgLevel: number;
    avgStreak: number;
    totalReferralInvites: number;
    archetypes: Array<{ archetype: string; archetype_title: string; count: number }>;
  };
  financials: {
    totalAccounts: number;
    totalAssetsCents: number;
    totalLiabilitiesCents: number;
    netWorthCents: number;
    totalTransactions: number;
    totalVolumeCents: number;
    totalIncomeCents: number;
    totalExpenseCents: number;
    totalTransferCents: number;
    totalDebts: number;
    totalDebtBalanceCents: number;
    avgInterestRate: string;
    totalGoals: number;
    totalTargetCents: number;
    totalSavedCents: number;
  };
  growth: {
    totalClicks: number;
    totalCommissions: number;
    totalCommissionCents: number;
    paidCents: number;
    approvedCents: number;
    pendingCents: number;
    programs: Array<{
      id: string;
      name: string;
      category: string;
      payout_amount: string;
      total_clicks: number;
      total_earnings_cents: number;
      status: string;
    }>;
  };
  database: {
    tables: Array<{ tableName: string; rowCount: number }>;
    totalTables: number;
    totalRecords: number;
    journalMode: string;
    status: string;
  };
  recentActivity: Array<{
    event_type: string;
    id: string;
    subtype: string;
    amount_cents: number;
    description: string;
    created_at: string;
    user_id: string;
  }>;
}

interface AdminAnalyticsPageProps {
  onNavigate?: (tab: string) => void;
}

export const AdminAnalyticsPage: React.FC<AdminAnalyticsPageProps> = ({ onNavigate }) => {
  const { token, user } = useAuth();
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [activeView, setActiveView] = useState<'overview' | 'tables' | 'financials' | 'growth' | 'activity'>('overview');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/metrics-summary', { headers });
      if (!res.ok) throw new Error('Failed to load database metrics summary');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to fetch metrics');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching system metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  const formatUsd = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(cents / 100);
  };

  const getTableCategory = (name: string): { label: string; color: string } => {
    if (['users', 'user_adaptive_profiles', 'user_profile_os'].includes(name)) {
      return { label: 'Identity & Telemetry', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
    if (['accounts', 'transactions', 'debts', 'budgets', 'financial_goals', 'recurring_bills'].includes(name)) {
      return { label: 'Financial ACID Ledger', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
    if (['commission_ledger', 'crypto_referral_programs', 'referral_clicks'].includes(name)) {
      return { label: 'Referral & Growth', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
    }
    if (['crypto_wallets', 'crypto_ledger'].includes(name)) {
      return { label: 'Crypto & Yield', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    return { label: 'System & Audit', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-10 h-10 text-plug-accent animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white font-mono">Consolidating Database Metrics & Telemetry...</h2>
        <p className="text-slate-400 text-sm mt-2">Querying SQLite WAL tables and user transaction streams.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 max-w-lg mx-auto">
          <Database className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Metrics Access Restricted or Failed</h2>
          <p className="text-slate-300 text-sm mb-6">{error || 'Unable to connect to admin analytics.'}</p>
          <button
            onClick={fetchMetrics}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all"
          >
            Retry Query
          </button>
        </div>
      </div>
    );
  }

  const filteredTables = data.database.tables.filter(t => 
    t.tableName.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                System Metrics & Database Analytics
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  SQLite WAL Mode (Healthy)
                </span>
                <span>•</span>
                <span>{data.database.totalTables} Active Tables</span>
                <span>•</span>
                <span>{data.database.totalRecords.toLocaleString()} Total Records</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('overview')}
              className="px-4 py-2 rounded-xl bg-plug-accent/20 hover:bg-plug-accent/30 border border-plug-accent/40 text-plug-accent font-mono text-xs font-bold flex items-center gap-2 transition-all"
            >
              <span>Command Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Top Level KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Registered Creators</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {data.users.totalUsers.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
            <span className="text-cyan-400 font-bold">Avg Lv. {data.users.avgLevel}</span>
            <span>•</span>
            <span>{data.users.totalXp.toLocaleString()} Total XP</span>
          </div>
        </div>

        {/* Total Assets Managed */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Net Worth Managed</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {formatUsd(data.financials.netWorthCents)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
            <span className="text-emerald-300">{formatUsd(data.financials.totalAssetsCents)} Assets</span>
            <span>-</span>
            <span className="text-rose-400">{formatUsd(data.financials.totalLiabilitiesCents)} Debts</span>
          </div>
        </div>

        {/* Transaction Volume */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Transaction Ledger</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {data.financials.totalTransactions.toLocaleString()}
          </div>
          <div className="text-xs text-purple-300 font-mono mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{formatUsd(data.financials.totalVolumeCents)} Volume Transacted</span>
          </div>
        </div>

        {/* Total Database Records */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Stored Records</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {data.database.totalRecords.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
            <span>{data.database.totalTables} Relational Tables</span>
            <span>•</span>
            <span className="text-emerald-400">ACID WAL</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeView === 'overview'
              ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 Comprehensive Overview
        </button>
        <button
          onClick={() => setActiveView('tables')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeView === 'tables'
              ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🗄️ Database Tables ({data.database.totalTables})
        </button>
        <button
          onClick={() => setActiveView('financials')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeView === 'financials'
              ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏦 Financial Ledger
        </button>
        <button
          onClick={() => setActiveView('growth')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeView === 'growth'
              ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🚀 Growth & Referrals
        </button>
      </div>

      {/* VIEW: OVERVIEW */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Archetype Distribution */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Neural Archetype Distribution</span>
            </h3>
            <p className="text-xs text-slate-400">
              Calibrated creator operating archetypes dynamically evolved by the Neural Calibration Matrix.
            </p>
            <div className="space-y-3 pt-2">
              {data.users.archetypes && data.users.archetypes.length > 0 ? (
                data.users.archetypes.map((arch, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{arch.archetype_title || arch.archetype}</div>
                      <div className="text-[10px] text-slate-500 font-mono capitalize">{arch.archetype.replace(/_/g, ' ')}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                      {arch.count} users
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-800/30 text-center text-xs text-slate-500 font-mono">
                  No calibrated user profiles logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Financial Volume Split */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>Cash Flow & Volume Split</span>
            </h3>
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  <span>Total Inflow (Income)</span>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {formatUsd(data.financials.totalIncomeCents)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  <span>Total Outflow (Expenses)</span>
                </div>
                <span className="font-mono text-sm font-bold text-rose-400">
                  {formatUsd(data.financials.totalExpenseCents)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  <span>Vault Transfers</span>
                </div>
                <span className="font-mono text-sm font-bold text-purple-400">
                  {formatUsd(data.financials.totalTransferCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Growth & Commission Velocity */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Affiliate & Referral Velocity</span>
            </h3>
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Tracking Clicks</span>
                <span className="font-mono text-sm font-bold text-white">{data.growth.totalClicks.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Commission Generated</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{formatUsd(data.growth.totalCommissionCents)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Paid Out Commissions</span>
                <span className="font-mono text-sm font-bold text-cyan-400">{formatUsd(data.growth.paidCents)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Pending Clearances</span>
                <span className="font-mono text-sm font-bold text-amber-400">{formatUsd(data.growth.pendingCents)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TABLES (Database Table Inspector) */}
      {(activeView === 'tables' || activeView === 'overview') && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Database className="w-5 h-5 text-plug-accent" />
                <span>SQLite Database Table Inspector</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time inventory of all SQLite tables, schema categories, and row counts.
              </p>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search table name..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 text-xs text-white rounded-xl focus:outline-none focus:border-plug-accent w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTables.map((t, idx) => {
              const cat = getTableCategory(t.tableName);
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ACID
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-mono font-bold text-white truncate" title={t.tableName}>
                      {t.tableName}
                    </div>
                    <div className="text-2xl font-black text-plug-accent font-mono mt-1">
                      {t.rowCount.toLocaleString()} <span className="text-xs text-slate-400 font-normal">rows</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: LIVE ACTIVITY FEED */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Real-Time Database Activity Stream</span>
        </h3>
        <div className="divide-y divide-slate-800/80">
          {data.recentActivity && data.recentActivity.length > 0 ? (
            data.recentActivity.map((event, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    event.event_type === 'transaction' 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {event.event_type}
                  </span>
                  <span className="text-white font-semibold truncate max-w-[280px] sm:max-w-md">
                    {event.description || `${event.subtype} record logged`}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {event.amount_cents > 0 && (
                    <span className="font-bold text-emerald-400">
                      {formatUsd(event.amount_cents)}
                    </span>
                  )}
                  <span className="text-slate-500 text-[10px]">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-xs text-slate-500 font-mono">
              No recent activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
