import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReferralLink } from '../components/ReferralLink';
import { ReferralStats } from '../components/ReferralStats';
import { CommissionTable } from '../components/CommissionTable';
import { StatusBadge } from '../components/StatusBadge';
import { CommissionEntry } from '../../types';
import { Sparkles, Users, RefreshCw, CreditCard, ShieldCheck, Wallet, ArrowUpRight } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<{
    referral_code: string;
    commission_rate_usd: number;
    referral_count: number;
    pending_amount_cents: number;
    approved_amount_cents: number;
    paid_amount_cents: number;
    total_earned_cents: number;
  }>({
    referral_code: user?.referral_code || '',
    commission_rate_usd: 10.0,
    referral_count: 0,
    pending_amount_cents: 0,
    approved_amount_cents: 0,
    paid_amount_cents: 0,
    total_earned_cents: 0,
  });

  const [ledger, setLedger] = useState<CommissionEntry[]>([]);
  const [network, setNetwork] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'ledger' | 'network'>('ledger');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    if (!token) return;
    setIsRefreshing(true);

    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/referrals/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      }

      // 2. Fetch Ledger
      const ledgerRes = await fetch('/api/referrals/ledger', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ledgerRes.ok) {
        const ledgerData = await ledgerRes.json();
        if (ledgerData.success && ledgerData.data) {
          setLedger(ledgerData.data);
        }
      }

      // 3. Fetch Network
      const networkRes = await fetch('/api/referrals/network', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (networkRes.ok) {
        const networkData = await networkRes.json();
        if (networkData.success && networkData.data) {
          setNetwork(networkData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-plug-card border border-plug-border p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Welcome back, <span className="text-plug-accent">{user?.display_name}</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold">
              Affiliate Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Account: {user?.email} • ID: {user?.id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-plug-accent' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Referral Link Action Box */}
      <ReferralLink
        referralCode={stats.referral_code || user?.referral_code || ''}
        commissionRateUsd={stats.commission_rate_usd}
      />

      {/* 4-Stat Metric Cards */}
      <ReferralStats
        referralCount={stats.referral_count}
        pendingCents={stats.pending_amount_cents}
        approvedCents={stats.approved_amount_cents}
        paidCents={stats.paid_amount_cents}
        totalEarnedCents={stats.total_earned_cents}
      />

      {/* Payout & Settlement Info Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-plug-accent uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                Commission Settlement Protocol
              </span>
              <span className="text-[11px] font-mono text-slate-400">Weekly Audited Payouts</span>
            </div>
            <h3 className="text-base font-bold text-white mt-2">
              Approved funds are automatically queued for disbursement.
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              When someone registers using your link, their $10.00 commission is held in <strong>Pending</strong> during initial verification. Once approved by the auditor, it moves to <strong>Approved</strong> and is disbursed via your configured payout channel.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="text-slate-400">Current Cleared Balance: <strong className="text-white">${(stats.approved_amount_cents / 100).toFixed(2)}</strong></span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct On-Disk SQLite Audit
            </span>
          </div>
        </div>

        <div className="bg-plug-card border border-plug-border rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Settlement Method
            </span>
            <div className="mt-2 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-slate-200">
                <CreditCard className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Default Payout Rail</div>
                <div className="text-[11px] text-slate-400 font-mono">Direct Bank ACH / PayPal</div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500">
            Payout preferences are linked to your registered email (<span className="text-slate-300">{user?.email}</span>).
          </div>
        </div>
      </div>

      {/* Tabs & View Switcher */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-plug-border pb-2">
          <button
            onClick={() => setActiveView('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'ledger'
                ? 'bg-plug-accent text-plug-dark shadow-md shadow-plug-accent/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Commission Ledger ({ledger.length})
          </button>
          <button
            onClick={() => setActiveView('network')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === 'network'
                ? 'bg-plug-accent text-plug-dark shadow-md shadow-plug-accent/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Referred Members ({network.length})
          </button>
        </div>

        {activeView === 'ledger' ? (
          <CommissionTable entries={ledger} isLoading={isLoading} />
        ) : (
          <div className="bg-plug-card border border-plug-border rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-plug-border/80">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-plug-accent" />
                Referred Members Network
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every user who registered through your personal referral link.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-plug-border/50">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4">Commission Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plug-border/40 text-slate-300">
                  {network.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        No members referred yet. Share your referral link above!
                      </td>
                    </tr>
                  ) : (
                    network.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-white">{member.display_name}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{member.email}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(member.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={member.commission_status || 'pending'} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
