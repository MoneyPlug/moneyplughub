import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CanonicalEarnings, EarningsEvent } from '../../types';
import { 
  Calculator, RefreshCw, Calendar, TrendingUp, 
  Sparkles, Terminal, Activity, DollarSign, CheckCircle2 
} from 'lucide-react';

export const EarningsAgentWidget: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [earnings, setEarnings] = useState<CanonicalEarnings[]>([]);
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showEventLog, setShowEventLog] = useState(false);

  const fetchEarningsData = async () => {
    if (!token) return;
    try {
      const [earnRes, evtRes] = await Promise.all([
        fetch('/api/agents/earnings/snapshots', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agents/earnings/events', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (earnRes.ok) {
        const d = await earnRes.json();
        if (d.success) setEarnings(d.data);
      }
      if (evtRes.ok) {
        const d = await evtRes.json();
        if (d.success) setEvents(d.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, [token]);

  const handleCompute = async () => {
    if (!token || isComputing) return;
    setIsComputing(true);

    try {
      const res = await fetch('/api/agents/earnings/compute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`⚡ EarningsAgent calculated windows! (+${data.reward_xp} XP)`);
        await fetchEarningsData();
        await refreshUser();
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast(`⚠️ ${data.message || 'Computation failed'}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsComputing(false);
    }
  };

  const formatUsd = (val: number = 0) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-plug-card border border-plug-border rounded-3xl p-6 shadow-xl space-y-6">
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Contract Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-plug-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">EarningsAgent Engine</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                contract: world.earnings
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Monotonic calculation of daily, weekly, and monthly earnings windows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowEventLog(!showEventLog)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            Events ({events.length})
          </button>

          <button
            onClick={handleCompute}
            disabled={isComputing}
            className="px-4 py-2 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-xs rounded-xl transition-all shadow-md shadow-plug-accent/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isComputing ? 'animate-spin' : ''}`} />
            {isComputing ? 'Computing...' : 'Calculate Earnings (+50 XP)'}
          </button>
        </div>
      </div>

      {/* Canonical Earnings Windows (context.world.earnings) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {earnings.map((e) => (
          <div
            key={e.window}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-plug-accent font-mono">
                {e.window} Window
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Net = Gross
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-white font-mono">
                {formatUsd(e.gross)} <span className="text-xs text-slate-500">{e.currency}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Net: <strong className="text-emerald-400">{formatUsd(e.net)}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px] font-mono text-slate-500">
              <div className="truncate">Range: {e.start.substring(0, 10)} ➔ {e.end.substring(0, 10)}</div>
              <div className="truncate text-slate-400">computedAt: {e.computedAt}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Event Stream Drawer */}
      {showEventLog && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              EarningsAgent Event Stream
            </span>
            <span className="text-[10px] font-mono text-slate-500">Monotonicity Enforced</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
            {events.map((evt) => (
              <div key={evt.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    evt.event_type === 'earnings.compute_completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    evt.event_type === 'earnings.compute_started' ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {evt.event_type}
                  </span>
                  <span className="text-slate-400 text-[10px] truncate max-w-xs">{evt.payload}</span>
                </div>
                <span className="text-[9px] text-slate-500">{new Date(evt.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
