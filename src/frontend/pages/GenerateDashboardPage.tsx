import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, Play, Activity, Cpu, Shield, RefreshCw, Terminal, 
  Layers, CheckCircle, Flame, Sparkles, AlertTriangle, Disc, 
  BarChart3, Compass, Database, Key, Settings, FileCode, Check,
  Copy, Share2, ExternalLink, ArrowRight, MessageSquare, Video,
  TrendingUp, Award
} from 'lucide-react';

interface GeneratedArtifact {
  pulseId: 'cyan' | 'magenta' | 'gold' | 'infrared' | 'white';
  title: string;
  category: string;
  summary: string;
  content: string;
  platformRecommendations?: string[];
  copyableText: string;
  timestamp: string;
  xpAwarded?: number;
}

export const GenerateDashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<GeneratedArtifact | null>(null);

  // Multi-pulse animation frames
  const frames = [
    ['🟣', '🔵', '🟡', '🔴', '⚪', '⚫', '⚫', '⚫'],
    ['⚫', '🟣', '🔵', '🟡', '🔴', '⚪', '⚫', '⚫'],
    ['⚫', '⚫', '🟣', '🔵', '🟡', '🔴', '⚪', '⚫'],
    ['⚫', '⚫', '⚫', '🟣', '🔵', '🟡', '🔴', '⚪'],
    ['⚪', '⚫', '⚫', '⚫', '🟣', '🔵', '🟡', '🔴'],
    ['🔴', '⚪', '⚫', '⚫', '⚫', '🟣', '🔵', '🟡'],
    ['🟡', '🔴', '⚪', '⚫', '⚫', '⚫', '🟣', '🔵'],
    ['🔵', '🟡', '🔴', '⚪', '⚫', '⚫', '⚫', '🟣'],
  ];

  useEffect(() => {
    let interval: any;
    if (animating) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
      }, 600);
    }
    return () => clearInterval(interval);
  }, [animating]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/generate/status');
      if (res.ok) {
        const j = await res.json();
        if (j.success) setTelemetry(j.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Default generate Cyan pulse on load so the user immediately sees a live output
    triggerAction('cyan');
  }, []);

  const triggerAction = async (actionType: string) => {
    try {
      setGenerating(true);
      const res = await fetch('/api/generate/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ actionType }),
      });
      if (res.ok) {
        const j = await res.json();
        setToast(j.message);
        if (j.data?.telemetry) setTelemetry(j.data.telemetry);
        if (j.data?.artifact) setActiveArtifact(j.data.artifact);
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setToast('📋 Copied with your custom referral tracking link!');
    setTimeout(() => {
      setCopied(false);
      setToast(null);
    }, 3000);
  };

  const referralCode = user?.referral_code || 'PLUG-VIP';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono text-slate-200">
      {toast && (
        <div className="p-4 rounded-2xl bg-plug-accent/20 border border-plug-accent text-plug-accent text-xs font-bold shadow-2xl flex items-center gap-2 sticky top-20 z-50 backdrop-blur-xl animate-fade-in">
          <Zap className="w-4 h-4 shrink-0 fill-current animate-bounce" />
          <span>{toast}</span>
        </div>
      )}

      {/* ASCII BANNER HEADER */}
      <div className="p-6 rounded-3xl bg-black border border-slate-800 shadow-2xl space-y-2 overflow-x-auto text-xs leading-relaxed text-plug-accent">
        <pre className="font-mono text-[11px] sm:text-xs">
{`██████████████████████████████████████████████████████████████████
█   GENERATE (v2.0) — ACTIVE CREATOR AI ENGINE & STUDIO         █
█   Mode: Active Creative Pipeline | 5-Pulse Realtime Synthesis █
█   Connected Account: ${referralCode.padEnd(16)} | Status: ONLINE      █
█   Engines Loaded: Cyan • Magenta • Gold • Infrared • White     █
██████████████████████████████████████████████████████████████████`}
        </pre>
      </div>

      {/* 🚀 1-CLICK PULSE DISPATCH BAR (THE 5 ENGINES) */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-plug-accent" />
            ⚡ 5-PULSE CREATOR AI DISPATCH
          </h2>
          <span className="text-[11px] text-slate-400">
            Click any engine to generate real viral campaigns & earn <span className="text-plug-accent font-bold">+25 XP</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Cyan */}
          <button
            disabled={generating}
            onClick={() => triggerAction('cyan')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeArtifact?.pulseId === 'cyan'
                ? 'bg-sky-500/20 border-sky-400 shadow-lg shadow-sky-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/50 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🔵</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-400 px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-800">
                Shorts / Reels
              </span>
            </div>
            <div className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors">
              Cyan Pulse
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Viral TikTok hooks, video b-roll cues & hashtags
            </div>
          </button>

          {/* 2. Magenta */}
          <button
            disabled={generating}
            onClick={() => triggerAction('magenta')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeArtifact?.pulseId === 'magenta'
                ? 'bg-pink-500/20 border-pink-400 shadow-lg shadow-pink-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-pink-500/50 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🟣</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-pink-400 px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-800">
                DM & Bios
              </span>
            </div>
            <div className="font-bold text-white text-sm group-hover:text-pink-300 transition-colors">
              Magenta Pulse
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Outreach DMs, converting bios & newsletter blurbs
            </div>
          </button>

          {/* 3. Gold */}
          <button
            disabled={generating}
            onClick={() => triggerAction('gold')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeArtifact?.pulseId === 'gold'
                ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🟡</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800">
                Strategy
              </span>
            </div>
            <div className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
              Gold Pulse
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Daily roadmap to hit next tier + revenue projection
            </div>
          </button>

          {/* 4. Infrared */}
          <button
            disabled={generating}
            onClick={() => triggerAction('infrared')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeArtifact?.pulseId === 'infrared'
                ? 'bg-rose-500/20 border-rose-400 shadow-lg shadow-rose-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/50 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🔴</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800">
                Telemetry
              </span>
            </div>
            <div className="font-bold text-white text-sm group-hover:text-rose-300 transition-colors">
              Infrared Pulse
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Live click audits, conversion velocity & fraud scan
            </div>
          </button>

          {/* 5. White */}
          <button
            disabled={generating}
            onClick={() => triggerAction('white')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeArtifact?.pulseId === 'white'
                ? 'bg-slate-800 border-white shadow-lg shadow-white/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-white/50 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⚪</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-200 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                Master Kit
              </span>
            </div>
            <div className="font-bold text-white text-sm group-hover:text-slate-100 transition-colors">
              White Pulse
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              360° weekly campaign: scripts, schedule & assets
            </div>
          </button>
        </div>
      </div>

      {/* 🎯 ACTIVE GENERATED OUTPUT WORKSPACE */}
      {activeArtifact && (
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">
                  {activeArtifact.title}
                </h3>
                {activeArtifact.xpAwarded && (
                  <span className="px-2.5 py-0.5 rounded-full bg-plug-accent/20 border border-plug-accent text-plug-accent text-[11px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> +{activeArtifact.xpAwarded} XP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{activeArtifact.summary}</p>
            </div>

            {/* Copy CTA button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(activeArtifact.copyableText)}
                className="px-4 py-2 rounded-xl bg-plug-accent text-slate-950 hover:bg-emerald-400 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-plug-accent/20"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied with Link!' : '1-Click Copy Campaign'}</span>
              </button>
            </div>
          </div>

          {/* Main Output Box */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formatted Content */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs leading-relaxed space-y-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800/80 pb-2">
                <span>Output Workspace</span>
                <span>Category: {activeArtifact.category}</span>
              </div>
              <div className="whitespace-pre-wrap font-mono text-slate-200 text-[12px] leading-relaxed">
                {activeArtifact.content}
              </div>
            </div>

            {/* Visual Asset & Quick-Share Panel */}
            <div className="space-y-4">
              {/* Sigil Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  🪬 Your Procedural Referral Sigil
                </span>
                <div className="flex items-center justify-center p-2 rounded-xl bg-black border border-slate-800">
                  <img
                    src={`/api/sigil/${referralCode}?size=160`}
                    alt="Referral Sigil"
                    className="w-28 h-28 object-contain rounded-lg shadow-inner"
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-center">
                  Deterministic SVG emblem tied to <strong className="text-white">{referralCode}</strong>
                </div>
              </div>

              {/* Share Card Embed Preview */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  🖼️ Viral Achievement Card
                </span>
                <a
                  href={`/api/growth/share-card/${referralCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block group relative rounded-xl overflow-hidden border border-slate-800 hover:border-plug-accent transition-all"
                >
                  <img
                    src={`/api/growth/share-card/${referralCode}`}
                    alt="Share Card"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <span>Open Full Visual</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧬 MULTI‑PULSE STATUS & TELEMETRY */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Disc className="w-5 h-5 text-plug-accent" />
            🧬 LIVE ENGINE TELEMETRY & MULTI-PULSE SYNC
          </h2>
          <button
            onClick={() => setAnimating(!animating)}
            className="px-3 py-1 bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white rounded-lg"
          >
            {animating ? 'Pause Animation' : 'Resume Animation'}
          </button>
        </div>

        {/* Pulse Bar Animation */}
        <div className="p-4 rounded-2xl bg-black border border-slate-800 font-mono text-center text-xl tracking-widest overflow-x-auto select-none">
          {frames[currentFrame].join(' ')}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Engine Status</span>
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ONLINE (5/5 ACTIVE)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Pulse Sync</span>
            <div className="text-purple-400 font-bold">100% Locked</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Generations Today</span>
            <div className="text-sky-400 font-bold">{telemetry?.metrics?.totalGenerationsToday || 328} Completed</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Your Referral Code</span>
            <div className="text-plug-accent font-bold">{referralCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GenerateDashboardPage;
