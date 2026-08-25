import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CanonicalBalance, ConnectedProvider, BalanceEvent } from '../../types';
import { 
  Bot, RefreshCw, CheckCircle2, AlertCircle, 
  Sparkles, Terminal, Activity, ShieldCheck, Layers 
} from 'lucide-react';

export const BalanceAgentWidget: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [connections, setConnections] = useState<ConnectedProvider[]>([]);
  const [events, setEvents] = useState<BalanceEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showEventLog, setShowEventLog] = useState(false);

  const fetchAgentData = async () => {
    if (!token) return;
    try {
      const [snapRes, connRes, evtRes] = await Promise.all([
        fetch('/api/agents/balance/snapshots', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agents/balance/connections', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agents/balance/events', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (snapRes.ok) {
        const d = await snapRes.json();
        if (d.success) setSnapshots(d.data);
      }
      if (connRes.ok) {
        const d = await connRes.json();
        if (d.success) setConnections(d.data);
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
    fetchAgentData();
  }, [token]);

  const handleTriggerSync = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true);

    try {
      const res = await fetch('/api/agents/balance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`⚡ BalanceAgent completed sync! (+${data.reward_xp} XP)`);
        await fetchAgentData();
        await refreshUser();
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast(`⚠️ ${data.message || 'Sync failed'}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const latestAsOf = snapshots[0]?.asOf ? new Date(snapshots[0].asOf).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) : 'Pending First Pull';

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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">BalanceAgent Engine</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400">
                contract: world.balances
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Pulling from {connections.length} connected providers • Last asOf: <span className="text-white">{latestAsOf}</span>
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
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-xs rounded-xl transition-all shadow-md shadow-plug-accent/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Pulling...' : 'Sync Balances (+50 XP)'}
          </button>
        </div>
      </div>

      {/* Connected Providers Pills (context.settings.connections) */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
          Connected Providers (context.settings.connections)
        </span>
        <div className="flex flex-wrap gap-2">
          {connections.map((c) => (
            <div
              key={c.id}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">{c.provider_name}</span>
              <span className="text-[10px] font-mono text-slate-500">({c.provider_type})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canonical Balance Snapshots Table (context.world.balances) */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
          Canonical Balance Snapshots (context.world.balances)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {snapshots.map((s) => (
            <div key={s.accountId} className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs truncate max-w-[120px]">{s.account_name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {s.provider}
                </span>
              </div>
              <div className={`text-base font-black font-mono ${s.is_liability ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatUsd(s.balance)} {s.currency}
              </div>
              <div className="text-[9px] font-mono text-slate-500 truncate">
                asOf: {s.asOf}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Stream Drawer */}
      {showEventLog && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              Agent Event Stream
            </span>
            <span className="text-[10px] font-mono text-slate-500">Invariants Enforced</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
            {events.map((evt) => (
              <div key={evt.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    evt.event_type === 'balance.pull_completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    evt.event_type === 'balance.pull_started' ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'
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
