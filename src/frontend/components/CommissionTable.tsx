import React, { useState } from 'react';
import { CommissionEntry, CommissionStatus } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Search, Filter, ArrowUpDown, Calendar, DollarSign, UserCheck } from 'lucide-react';

interface CommissionTableProps {
  entries: CommissionEntry[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const CommissionTable: React.FC<CommissionTableProps> = ({
  entries,
  isLoading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredEntries = entries.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (item.referred_name && item.referred_name.toLowerCase().includes(searchLower)) ||
      (item.referred_email && item.referred_email.toLowerCase().includes(searchLower)) ||
      item.id.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-plug-card border border-plug-border rounded-2xl overflow-hidden shadow-xl">
      {/* Header controls */}
      <div className="p-5 border-b border-plug-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-plug-accent" />
            Commission Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Durable, immutable record of each earned commission transaction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter tabs */}
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

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search referral..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-plug-accent transition-colors w-full sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-plug-border/50">
            <tr>
              <th className="py-3.5 px-4">Transaction ID</th>
              <th className="py-3.5 px-4">Referred Member</th>
              <th className="py-3.5 px-4">Commission Amount</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Date & Time</th>
              <th className="py-3.5 px-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plug-border/40 text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-plug-accent border-t-transparent rounded-full animate-spin" />
                    <span>Loading commission ledger...</span>
                  </div>
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="font-semibold text-slate-300">No commissions recorded yet</div>
                    <p className="text-xs text-slate-500">
                      Share your unique referral link to start earning real commissions on each verified registration.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEntries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {item.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">
                      {item.referred_name || 'Anonymous Member'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {item.referred_email || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-sm">
                      ${(item.amount_cents / 100).toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{item.currency}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                    {item.notes || 'Standard referral bonus'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-plug-border/60 bg-slate-900/30 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>Showing {filteredEntries.length} of {entries.length} recorded entries</span>
        <span className="font-mono text-[11px]">Ledger Sync: Real-Time SQLite WAL</span>
      </div>
    </div>
  );
};
