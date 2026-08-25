import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrchestratorState, OrchestratorEvent, OrchestratorTask } from '../../types';
import { 
  Cpu, Play, ShieldAlert, CheckCircle2, AlertTriangle, 
  Terminal, Activity, RefreshCw, Zap, ShieldCheck, ArrowRight, Flame 
} from 'lucide-react';

export const OrchestratorWidget: React.FC<{ onActionComplete?: () => void }> = ({ onActionComplete }) => {
  const { token, refreshUser } = useAuth();
  const [state, setState] = useState<OrchestratorState | null>(null);
  const [events, setEvents] = useState<OrchestratorEvent[]>([]);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showEventLog, setShowEventLog] = useState(false);

  const fetchOrchestratorData = async () => {
    if (!token) return;
    try {
      const [stRes, evtRes] = await Promise.all([
        fetch('/api/orchestrator/state', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/orchestrator/events', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (stRes.ok) {
        const d = await stRes.json();
        if (d.success) setState(d.data);
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
    fetchOrchestratorData();
    const interval = setInterval(fetchOrchestratorData, 4000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRunCommand = async (task: OrchestratorTask) => {
    if (!token || isRunning) return;
    setIsRunning(task);

    try {
      const res = await fetch('/api/orchestrator/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ task }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`⚡ Task ${task} executed by Orchestrator! (+${data.reward_xp || 50} XP)`);
        await fetchOrchestratorData();
        await refreshUser();
        if (onActionComplete) onActionComplete();
        setTimeout(() => setToast(null), 3500);
      } else {
        setToast(`⚠️ ${data.error || 'Execution blocked by Orchestrator'}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(null);
    }
  };

  const handleDailyLoop = async () => {
    if (!token || isRunning) return;
    setIsRunning('daily_loop');

    try {
      const res = await fetch('/api/orchestrator/daily-loop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`🚀 Daily Loop Completed across entire 5-Agent Mesh! (+${data.reward_xp} XP)`);
        await fetchOrchestratorData();
        await refreshUser();
        if (onActionComplete) onActionComplete();
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast(`⚠️ ${data.error || 'Daily loop failed'}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(null);
    }
  };

  const handleRecover = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/orchestrator/recover', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setToast('✅ Orchestrator recovered to Operational status.');
        await fetchOrchestratorData();
        setTimeout(() => setToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'operational':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Operational</span>;
      case 'degraded':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Degraded Mode</span>;
      case 'cooldown':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono font-bold flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Cooldown Active</span>;
      case 'busy':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-mono font-bold flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> At Capacity (2/2)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-plug-card border border-plug-border rounded-3xl p-6 shadow-xl space-y-6">
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0 fill-current" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-plug-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-black shadow-md shadow-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">StarterOrchestrator v1.0</h3>
              {getStatusBadge(state?.status)}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Central dispatcher, overload prevention & daily loop sequencer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {state?.status === 'degraded' && (
            <button
              onClick={handleRecover}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-mono font-bold transition-colors"
            >
              Recover System
            </button>
          )}

          <button
            onClick={() => setShowEventLog(!showEventLog)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            Telemetry ({events.length})
          </button>

          <button
            onClick={handleDailyLoop}
            disabled={!!isRunning || state?.status === 'degraded'}
            className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-plug-dark font-black text-xs rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Flame className={`w-3.5 h-3.5 fill-current ${isRunning === 'daily_loop' ? 'animate-bounce' : ''}`} />
            {isRunning === 'daily_loop' ? 'Loop Running...' : 'Execute Daily Loop (+150 XP)'}
          </button>
        </div>
      </div>

      {/* Overload Prevention Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Concurrency</span>
          <div className="text-sm font-bold text-white mt-0.5">
            {state?.activeRuns || 0} / {state?.maxConcurrent || 2} <span className="text-[10px] text-slate-400 font-normal">Active Runs</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Spacing Cooldown</span>
          <div className="text-sm font-bold text-plug-accent mt-0.5">
            {state?.cooldownSeconds || 5}s <span className="text-[10px] text-slate-400 font-normal">Min Interval</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Consecutive Failures</span>
          <div className="text-sm font-bold text-slate-200 mt-0.5">
            {state?.consecutiveFailures || 0} / 3 <span className="text-[10px] text-slate-400 font-normal">Threshold</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Fail-safe Guard</span>
          <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Armed
          </div>
        </div>
      </div>

      {/* Quick Task Dispatcher Bar */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase font-bold pl-1">
          Route User Commands To Allowed Modules:
        </span>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleRunCommand('balance_pull')}
            disabled={!!isRunning}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            BalanceAgent.run()
          </button>

          <button
            onClick={() => handleRunCommand('earnings_calc')}
            disabled={!!isRunning}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Play className="w-3 h-3 text-sky-400" />
            EarningsAgent.run()
          </button>

          <button
            onClick={() => handleRunCommand('referral_suggest')}
            disabled={!!isRunning}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Play className="w-3 h-3 text-pink-400" />
            ReferralAgent.run()
          </button>

          <button
            onClick={() => handleRunCommand('insight_generate')}
            disabled={!!isRunning}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Play className="w-3 h-3 text-purple-400" />
            InsightAgent.run()
          </button>

          <button
            onClick={() => handleRunCommand('automation_tick')}
            disabled={!!isRunning}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Play className="w-3 h-3 text-amber-400" />
            AutomationAgent.tick()
          </button>
        </div>
      </div>

      {/* Event Stream Drawer */}
      {showEventLog && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Orchestrator Routing Event Stream
            </span>
            <span className="text-[10px] font-mono text-slate-500">Every Routed Task Emits An Event</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
            {events.map((evt) => (
              <div key={evt.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    evt.event_type === 'orchestrator.task_routed' ? 'bg-cyan-500/20 text-cyan-400' :
                    evt.event_type === 'orchestrator.command_received' ? 'bg-sky-500/20 text-sky-400' :
                    evt.event_type === 'orchestrator.recovered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
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
