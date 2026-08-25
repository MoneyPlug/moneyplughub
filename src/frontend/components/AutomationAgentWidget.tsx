import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CanonicalAutomationToggle, CanonicalRunLog, AutomationEvent } from '../../types';
import { 
  Zap, Play, Power, CheckCircle2, XCircle, 
  Terminal, Activity, Clock, RefreshCw, Sparkles, Layers 
} from 'lucide-react';

export const AutomationAgentWidget: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [toggles, setToggles] = useState<CanonicalAutomationToggle[]>([]);
  const [runs, setRuns] = useState<CanonicalRunLog[]>([]);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [isTicking, setIsTicking] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showEventLog, setShowEventLog] = useState(false);

  const fetchAutomationData = async () => {
    if (!token) return;
    try {
      const [togRes, runRes, evtRes] = await Promise.all([
        fetch('/api/agents/automation/toggles', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agents/automation/runs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agents/automation/events', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (togRes.ok) {
        const d = await togRes.json();
        if (d.success) setToggles(d.data);
      }
      if (runRes.ok) {
        const d = await runRes.json();
        if (d.success) setRuns(d.data);
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
    fetchAutomationData();
  }, [token]);

  const handleToggle = async (automationId: string, currentEnabled: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/agents/automation/toggles/${automationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });

      if (res.ok) {
        await fetchAutomationData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunSingle = async (automationId: string) => {
    if (!token || runningId) return;
    setRunningId(automationId);

    try {
      const res = await fetch(`/api/agents/automation/run/${automationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`⚡ ${automationId} completed successfully!`);
        await fetchAutomationData();
        setTimeout(() => setToast(null), 3500);
      } else {
        setToast(`⚠️ ${data.message || 'Run failed'}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningId(null);
    }
  };

  const handleTickOrchestrator = async () => {
    if (!token || isTicking) return;
    setIsTicking(true);

    try {
      const res = await fetch('/api/agents/automation/tick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedule: 'all' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`🚀 Orchestrator executed ${data.data.length} automations! (+${data.reward_xp} XP)`);
        await fetchAutomationData();
        await refreshUser();
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTicking(false);
    }
  };

  return (
    <div className="bg-plug-card border border-plug-border rounded-3xl p-6 shadow-xl space-y-6">
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-plug-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-plug-dark font-black shadow-md shadow-amber-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">AutomationAgent Orchestrator</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400">
                orchestrator: on_schedule_tick
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Autonomous execution of daily balance checks, earnings summaries, and referral pushes.
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
            onClick={handleTickOrchestrator}
            disabled={isTicking}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-plug-dark font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isTicking ? 'animate-pulse' : ''}`} />
            {isTicking ? 'Orchestrating...' : 'Tick Orchestrator (+100 XP)'}
          </button>
        </div>
      </div>

      {/* Starter Automations v1 Toggles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {toggles.map((tog) => (
          <div
            key={tog.automationId}
            className={`p-4 rounded-2xl border transition-all ${
              tog.enabled 
                ? 'bg-slate-900/80 border-slate-700/80 shadow-md' 
                : 'bg-slate-950/40 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">{tog.name}</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {tog.schedule}
              </span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
              <button
                onClick={() => handleToggle(tog.automationId, tog.enabled)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                  tog.enabled 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                <Power className="w-3 h-3" />
                {tog.enabled ? 'Enabled' : 'Disabled'}
              </button>

              <button
                onClick={() => handleRunSingle(tog.automationId)}
                disabled={!tog.enabled || runningId === tog.automationId}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                title="Run Now"
              >
                <Play className={`w-3.5 h-3.5 ${runningId === tog.automationId ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Canonical Run Logs Table (context.world.automationRuns) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            Canonical Run Logs (context.world.automationRuns)
          </h4>
          <span className="text-[11px] font-mono text-slate-500">Every Run Logged</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3.5">Run ID</th>
                <th className="py-2.5 px-3.5">Automation ID</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Started At</th>
                <th className="py-2.5 px-3.5">Ended At</th>
                <th className="py-2.5 px-3.5">Error / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300 text-[11px]">
              {runs.slice(0, 5).map((r) => (
                <tr key={r.runId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3.5 font-bold text-slate-400">{r.runId}</td>
                  <td className="py-2 px-3.5 text-white">{r.automationId}</td>
                  <td className="py-2 px-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-slate-500">{new Date(r.startedAt).toLocaleTimeString()}</td>
                  <td className="py-2 px-3.5 text-slate-500">{new Date(r.endedAt).toLocaleTimeString()}</td>
                  <td className="py-2 px-3.5 text-slate-400 truncate max-w-xs">{r.error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Stream Drawer */}
      {showEventLog && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              AutomationAgent Event Stream
            </span>
            <span className="text-[10px] font-mono text-slate-500">Real-time Telemetry</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
            {events.map((evt) => (
              <div key={evt.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    evt.event_type === 'automation.run_completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    evt.event_type === 'automation.run_started' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
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
