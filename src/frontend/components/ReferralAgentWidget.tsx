import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CanonicalDailySuggestion, ContentEngineItem, ReferralAgentEvent } from '../../types';
import { 
  Sparkles, RefreshCw, Video, Copy, Check, 
  ExternalLink, Layers, Bot, Terminal, CheckCircle2, ArrowRight, Share2 
} from 'lucide-react';

export const ReferralAgentWidget: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [suggestions, setSuggestions] = useState<CanonicalDailySuggestion[]>([]);
  const [scripts, setScripts] = useState<ContentEngineItem[]>([]);
  const [events, setEvents] = useState<ReferralAgentEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showEventLog, setShowEventLog] = useState(false);

  const fetchAgentData = async () => {
    if (!token) return;
    try {
      const [sugRes, scriptRes, evtRes] = await Promise.all([
        fetch('/api/agents/referral/suggestions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agents/referral/content-engine', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agents/referral/events', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (sugRes.ok) {
        const d = await sugRes.json();
        if (d.success) setSuggestions(d.data);
      }
      if (scriptRes.ok) {
        const d = await scriptRes.json();
        if (d.success) setScripts(d.data);
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

  const handleGenerateSuggestion = async () => {
    if (!token || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/agents/referral/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`⚡ ReferralAgent generated script for ${data.data.suggestion.program}! (+${data.reward_xp} XP)`);
        await fetchAgentData();
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

  const handleMarkPosted = async (scriptId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/agents/referral/content-engine/${scriptId}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`🚀 Content marked as Posted! (+${data.reward_xp} XP)`);
        await fetchAgentData();
        await refreshUser();
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyScriptText = (item: ContentEngineItem) => {
    const fullText = `${item.hook}\n\n${item.script}\n\nCTA: ${item.cta}\nLink: ${item.ctaLink}`;
    navigator.clipboard.writeText(fullText);
    setCopiedScriptId(item.id);
    setTimeout(() => setCopiedScriptId(null), 2500);
  };

  const latestSuggestion = suggestions[0];

  return (
    <div className="bg-plug-card border border-plug-border rounded-3xl p-6 shadow-xl space-y-6">
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Contract & Notion Bridge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-plug-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white font-black shadow-md shadow-rose-500/20">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">ReferralAgent ➔ Content Engine</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-pink-500/20 text-pink-400">
                event-bridge active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <span>Connected Content Engine:</span>
              <a
                href="https://app.notion.com/p/Content-Engine-3759f03094568070b543f31d0b679eaa?pvs=21"
                target="_blank"
                rel="noopener noreferrer"
                className="text-plug-accent hover:underline flex items-center gap-0.5"
              >
                Notion Database <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowEventLog(!showEventLog)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Pipeline Bridge ({events.length})
          </button>

          <button
            onClick={handleGenerateSuggestion}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : "Create Today's Content Idea (+50 XP)"}
          </button>
        </div>
      </div>

      {/* Event Bridge Pipeline Visualizer */}
      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="text-pink-400 font-bold">Event Bridge Flow:</span>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300">referral.suggestion_created</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="px-2 py-0.5 rounded bg-slate-900 text-sky-300">content.idea_created</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-300">content.script_ready</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400">referral.content_posted</span>
        </div>
      </div>

      {/* Latest Daily Suggestion Card */}
      {latestSuggestion && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-plug-accent uppercase font-mono tracking-wider">
              Canonical Daily Suggestion ({latestSuggestion.program})
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {new Date(latestSuggestion.timestamp).toLocaleDateString()}
            </span>
          </div>
          <div className="text-xs text-white font-medium">{latestSuggestion.suggestedAction}</div>
          <div className="text-[11px] text-slate-400 font-mono italic">
            Angle: {latestSuggestion.reason}
          </div>
        </div>
      )}

      {/* Content Engine Scripts Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Video className="w-4 h-4 text-pink-400" />
            Content Engine Scripts Database ({scripts.length})
          </h4>
          <span className="text-[11px] font-mono text-slate-500">Auto-Generated Scripts</span>
        </div>

        <div className="space-y-3">
          {scripts.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-pink-500/10 text-pink-400 font-bold font-mono text-xs">
                    {item.program}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{item.platform}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  item.status === 'Posted' ? 'bg-emerald-500/20 text-emerald-400' :
                  item.status === 'Script Ready' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.status}
                </span>
              </div>

              {/* Script Details */}
              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-bold text-emerald-400 font-mono">
                  {item.hook}
                </div>
                <p className="text-slate-300 leading-relaxed font-mono text-[11px] pl-1">
                  {item.script}
                </p>
                <div className="text-[11px] text-sky-400 font-mono font-semibold pl-1">
                  CTA: {item.cta}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  Target Link: <code className="text-slate-400">{item.ctaLink}</code>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyScriptText(item)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copiedScriptId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedScriptId === item.id ? 'Copied Full Script!' : 'Copy Script'}
                  </button>

                  {item.status !== 'Posted' && (
                    <button
                      onClick={() => handleMarkPosted(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-500/30"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Mark as Posted (+100 XP)
                    </button>
                  )}
                </div>
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
              <Terminal className="w-3.5 h-3.5 text-pink-400" />
              Bridge Event Stream
            </span>
            <span className="text-[10px] font-mono text-slate-500">Referral ➔ Content Engine</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
            {events.map((evt) => (
              <div key={evt.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    evt.event_type === 'referral.content_posted' ? 'bg-emerald-500/20 text-emerald-400' :
                    evt.event_type === 'content.script_ready' ? 'bg-amber-500/20 text-amber-400' :
                    evt.event_type === 'content.idea_created' ? 'bg-sky-500/20 text-sky-400' : 'bg-pink-500/20 text-pink-400'
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
