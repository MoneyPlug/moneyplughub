import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RecurringBill } from '../../types';
import { Bell, Calendar, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';

export const RecurringPage: React.FC = () => {
  const { token } = useAuth();
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecurring = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/finance/recurring', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setBills(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, [token]);

  const totalMonthlyRecurring = bills.reduce((acc, b) => acc + b.amount_cents, 0);
  const formatUsd = (cents: number = 0) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-plug-card border border-plug-border p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Recurring Bills & Subscriptions
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-mono font-bold">
              Subscription Tracker
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated calendar reminders for all active monthly subscriptions, housing leases, and utilities.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Monthly Outflow</span>
          <div className="text-2xl font-black text-white font-mono">{formatUsd(totalMonthlyRecurring)}/mo</div>
        </div>
      </div>

      {/* Bills Directory */}
      <div className="bg-plug-card border border-plug-border rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-plug-border pb-3">
          <Bell className="w-5 h-5 text-indigo-400" />
          Active Recurring Subscriptions ({bills.length})
        </h3>

        <div className="space-y-3">
          {bills.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{b.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Category: {b.category} • Frequency: <span className="capitalize">{b.frequency}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-white font-mono">{formatUsd(b.amount_cents)}</div>
                <div className="text-[10px] text-indigo-400 font-mono">Next Due: {b.next_due_date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
