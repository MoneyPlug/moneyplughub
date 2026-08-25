import React from 'react';
import { CommissionStatus } from '../../types';
import { Clock, CheckCircle2, DollarSign } from 'lucide-react';

interface StatusBadgeProps {
  status: CommissionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Pending
        </span>
      );
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 ${sizeClasses}`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Approved
        </span>
      );
    case 'paid':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <DollarSign className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Paid
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
