import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { CommissionEntry, AdminStats, AuditLog, User } from '../../types';
import { 
  Shield, CheckCircle, DollarSign, Users, RefreshCw, AlertTriangle, 
  Search, Check, ArrowRight, FileText, CheckCheck, Lock, Activity
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (tab: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [commissions, setCommissions] = useState<CommissionEntry[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'commissions' | 'users' | 'audit'>('commissions');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAdminData = async () => {
    if (!token || user?.role !== 'admin') return;
    setIsLoading(true);

    try {
      // 1. Fetch Overview Stats
      const statsRes = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      }

      // 2. Fetch Commissions
      const commRes = await fetch('/api/admin/commissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (commRes.ok) {
        const commData = await commRes.json();
        if (commData.success) setCommissions(commData.data);
      }

      // 3. Fetch Users
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) setUsersList(usersData.data);
      }

      // 4. Fetch Audit Logs
      const auditRes = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        if (auditData.success) setAuditLogs(auditData.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleUpdateStatus = async (commissionId: string, newStatus: 'approved' | 'paid') => {
    if (!token) return;
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/commissions/${commissionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          text: `Commission #${commissionId.substring(0, 10)} transitioned to '${newStatus}'!`,
          type: 'success',
        });
        await fetchAdminData();
      } else {
        setActionMessage({ text: data.error || 'Update failed', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Action failed', type: 'error' });
    }
  };

  const handleBulkUpdate = async (newStatus: 'approved' | 'paid') => {
    if (!token || selectedIds.length === 0) return;
    setActionMessage(null);

    try {
      const res = await fetch('/api/admin/commissions/bulk-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          text: `Batch updated ${selectedIds.length} entries to '${newStatus}'!`,
          type: 'success',
        });
        setSelectedIds([]);
        await fetchAdminData();
      } else {
        setActionMessage({ text: data.error || 'Bulk update failed', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Bulk update failed', type: 'error' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedIds.length === filteredCommissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCommissions.map((c) => c.id));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Auditor Authorization Required</h2>
          <p className="text-xs text-slate-400 mt-2">
            The Commission Auditing Portal is restricted to platform operators with Auditor credentials.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="mt-6 w-full py-2.5 bg-plug-accent text-plug-dark font-bold text-xs rounded-xl hover:bg-plug-accentHover transition-colors"
          >
            Sign in as Auditor
          </button>
        </div>
      </div>
    );
  }

  const filteredCommissions = commissions.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (c.referrer_name && c.referrer_name.toLowerCase().includes(searchLower)) ||
      (c.referrer_email && c.referrer_email.toLowerCase().includes(searchLower)) ||
      (c.referred_name && c.referred_name.toLowerCase().includes(searchLower)) ||
      (c.referred_email && c.referred_email.toLowerCase().includes(searchLower)) ||
      c.id.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const formatUsd = (cents: number = 0) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-plug-card border border-indigo-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Commission Auditing Portal</h1>
              <p className="text-xs text-slate-400 font-mono">
                Operator: {user.email} • Durable SQLite WAL Active
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-plug-accent' : ''}`} />
            Sync Ledger
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Aggregate Financial Audit KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-plug-card border border-plug-border rounded-2xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Network Users
            </span>
            <div className="text-2xl font-black text-white mt-1">{stats.total_users}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              {stats.total_referrals} joined via referral links
            </div>
          </div>

          <div className="bg-plug-card border border-amber-500/20 rounded-2xl p-5">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Pending Liabilities
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatUsd(stats.total_pending_cents)}
            </div>
            <div className="text-[11px] text-amber-500 font-mono mt-1">
              {stats.pending_commissions_count} commissions awaiting review
            </div>
          </div>

          <div className="bg-plug-card border border-sky-500/20 rounded-2xl p-5">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Approved (Unpaid)
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatUsd(stats.total_approved_cents)}
            </div>
            <div className="text-[11px] text-sky-500 font-mono mt-1">
              {stats.approved_commissions_count} cleared for payout
            </div>
          </div>

          <div className="bg-plug-card border border-emerald-500/20 rounded-2xl p-5">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Paid Out
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatUsd(stats.total_paid_cents)}
            </div>
            <div className="text-[11px] text-emerald-500 font-mono mt-1">
              Lifetime volume: {formatUsd(stats.total_volume_cents)}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-plug-border pb-2">
        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'commissions'
              ? 'bg-plug-accent text-plug-dark shadow-md shadow-plug-accent/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Commission Ledger ({commissions.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-plug-accent text-plug-dark shadow-md shadow-plug-accent/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User Accounts Directory ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-plug-accent text-plug-dark shadow-md shadow-plug-accent/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Audit Logs Timeline ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: COMMISSIONS AUDIT */}
      {activeTab === 'commissions' && (
        <div className="bg-plug-card border border-plug-border rounded-2xl overflow-hidden shadow-xl space-y-4">
          {/* Header controls & Bulk action bar */}
          <div className="p-5 border-b border-plug-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
                {['all', 'pending', 'approved', 'paid'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, email, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-plug-accent transition-colors w-64"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 px-2">
                  {selectedIds.length} Selected:
                </span>
                <button
                  onClick={() => handleBulkUpdate('approved')}
                  className="px-3 py-1 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-bold rounded-lg transition-colors"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkUpdate('paid')}
                  className="px-3 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold rounded-lg transition-colors"
                >
                  Mark Paid
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-plug-border/50">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredCommissions.length > 0 &&
                        selectedIds.length === filteredCommissions.length
                      }
                      onChange={selectAllFiltered}
                      className="rounded bg-slate-900 border-slate-700 text-plug-accent focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-4">Commission ID</th>
                  <th className="py-3 px-4">Referrer (Earner)</th>
                  <th className="py-3 px-4">Referred Member</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Auditor Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plug-border/40 text-slate-300">
                {filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No matching commission records found.
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded bg-slate-900 border-slate-700 text-plug-accent focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {c.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{c.referrer_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.referrer_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{c.referred_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.referred_email}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        ${(c.amount_cents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold text-[11px] transition-colors border border-sky-500/30"
                            >
                              Approve Payout
                            </button>
                          )}
                          {c.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'paid')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] transition-colors border border-emerald-500/30"
                            >
                              Mark as Paid
                            </button>
                          )}
                          {c.status === 'paid' && (
                            <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCheck className="w-3.5 h-3.5" /> Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-plug-card border border-plug-border rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-plug-border/80">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-plug-accent" />
              Registered User Directory
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-plug-border/50">
                <tr>
                  <th className="py-3 px-4">Display Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4">Referred By</th>
                  <th className="py-3 px-4">Referral Count</th>
                  <th className="py-3 px-4">Total Earned</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plug-border/40 text-slate-300">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white">{u.display_name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-plug-accent font-bold">
                      {u.referral_code}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {u.referrer_name || u.referrer_email || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {u.referral_count}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      ${((u.total_earned_cents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOG TIMELINE */}
      {activeTab === 'audit' && (
        <div className="bg-plug-card border border-plug-border rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-plug-border/80 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-plug-accent" />
                Immutable System Audit Logs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every authorization event, status transition, and referral link trigger is recorded.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Showing last 100 logs</span>
          </div>

          <div className="divide-y divide-plug-border/40">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-plug-accent px-2 py-0.5 rounded bg-plug-accent/10">
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-mono">
                      Target: {log.target_entity} {log.target_id ? `(${log.target_id.substring(0, 12)}...)` : ''}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(log.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span>Actor: {log.actor_email || log.actor_user_id || 'System Daemon'}</span>
                  {log.details && (
                    <span className="text-slate-500 truncate max-w-lg">
                      {log.details}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
