import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CanonicalInsight, InsightEvent } from '../../types';
import { 
  Lightbulb, Sparkles, RefreshCw, Terminal, 
  Activity, CheckCircle2, ArrowRight, Compass 
} from 'lucide-react';

export const InsightAgentWidget: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [insights, setInsights] = useState<CanonicalInsight[]>([]);
  const [events, setEvents] = useState<InsightEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showEventLog, setShowEventLog] = useState(false);

  const fetchInsightData = async () => {
    if (!token) return;
    try {
      const [insRes, evtRes] = await Promise.all([
        fetch('/api/agents/insight/daily', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agents/insight/events', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (insRes.ok) {
        const d = await insRes.json();
        if (d.success) setInsights(d.data);
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
    fetchInsightData();
  }, [token]);

  const handleGenerateInsight = async () => {
    if (!token || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/agents/insight/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`✨ InsightAgent generated daily synthesis! (+${data.reward_xp} XP)`);
        await fetchInsightData();
        await refreshUser();
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast(`⚠️ ${data.message || 'Generation failed'}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const latestInsight = insights[0];

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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black shadow-md shadow-purple-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">InsightAgent Engine</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400">
                contract: world.insights
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Synthesis of balances, earnings windows, referral suggestions, and automation health.
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
            onClick={handleGenerateInsight}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Synthesizing...' : "Generate Today's Insight (+50 XP)"}
          </button>
        </div>
      </div>

      {/* Latest Daily Insight Presentation */}
      {latestInsight ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                Daily Synthesis Summary ({latestInsight.date})
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Staged at {new Date(latestInsight.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-sm font-mono text-slate-200 leading-relaxed pl-1">
              {latestInsight.summary}
            </p>
          </div>

          {/* Deduplicated Suggestions Array */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono pl-1">
              Actionable Directives & Recommendations ({latestInsight.suggestions.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {latestInsight.suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-snug">
                    {sug}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
          <Lightbulb className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">
            No insight generated yet for today. Click the button above to synthesize your financial mesh!
          </p>
        </div>
      )}

      {/* Event Stream Drawer */}
      {showEventLog && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              InsightAgent Event Stream
            </span>
            <span className="text-[10px] font-mono text-slate-500">Telemetry Log</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
            {events.map((evt) => (
              <div key={evt.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    evt.event_type === 'insight.generated' ? 'bg-purple-500/20 text-purple-400' : 'bg-rose-500/20 text-rose-400'
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
