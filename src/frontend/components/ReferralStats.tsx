import React from 'react';
import { Users, Clock, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';

interface ReferralStatsProps {
  referralCount: number;
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  totalEarnedCents: number;
}

export const ReferralStats: React.FC<ReferralStatsProps> = ({
  referralCount,
  pendingCents,
  approvedCents,
  paidCents,
  totalEarnedCents,
}) => {
  const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const statCards = [
    {
      title: 'Total Referrals',
      value: referralCount.toString(),
      subtext: 'Active network signups',
      icon: Users,
      color: 'text-plug-accent',
      bgColor: 'bg-plug-accent/10',
      borderColor: 'border-plug-accent/20',
    },
    {
      title: 'Pending Commissions',
      value: formatUsd(pendingCents),
      subtext: 'Awaiting auditor review',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Approved Balance',
      value: formatUsd(approvedCents),
      subtext: 'Cleared for disbursement',
      icon: CheckCircle2,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
    },
    {
      title: 'Total Paid Out',
      value: formatUsd(paidCents),
      subtext: 'Directly settled funds',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-plug-card border border-plug-border rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.color} border ${stat.borderColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <TrendingUp className="w-3 h-3 text-plug-accent" />
                {stat.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
