import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, Zap, Share2, Copy, Check, TrendingUp, Users, Shield, 
  Sparkles, ExternalLink, Award, ArrowUpRight, Radio, RefreshCw, Eye, X, Download
} from 'lucide-react';

export const ViralEngineWidget: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [squadData, setSquadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hyperdriveLoading, setHyperdriveLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newSquadName, setNewSquadName] = useState('');
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [copiedCardUrl, setCopiedCardUrl] = useState(false);

  const referralCode = user?.referral_code || 'FOUNDER-PLUG';
  const shareCardUrl = `${window.location.origin}/api/growth/share-card/${referralCode}`;
  const shareCardSvgUrl = `${window.location.origin}/api/growth/share-card/${referralCode}?format=svg&t=${Date.now()}`;

  const fetchTelemetry = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [telRes, squadRes] = await Promise.all([
        fetch('/api/viral/telemetry', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/viral/squad', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (telRes.ok) {
        const j = await telRes.json();
        if (j.success) setTelemetry(j.data);
      }
      if (squadRes.ok) {
        const j = await squadRes.json();
        if (j.success) setSquadData(j.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [token]);

  const handleTriggerHyperdrive = async () => {
    if (!token) return;
    try {
      setHyperdriveLoading(true);
      const res = await fetch('/api/viral/trigger-hyperdrive', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const j = await res.json();
        setToast(j.message);
        fetchTelemetry();
        setTimeout(() => setToast(null), 4500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHyperdriveLoading(false);
    }
  };

  const handleCopyPrompt = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setToast('📋 Viral share prompt copied to clipboard with your custom tracking link!');
    setTimeout(() => {
      setCopiedIndex(null);
      setToast(null);
    }, 3000);
  };

  const handleCreateSquad = async () => {
    if (!token || !newSquadName.trim()) return;
    try {
      const res = await fetch('/api/viral/create-squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ squad_name: newSquadName.trim() }),
      });
      if (res.ok) {
        const j = await res.json();
        setToast(j.message);
        setShowSquadModal(false);
        setNewSquadName('');
        fetchTelemetry();
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const userMetrics = telemetry?.userMetrics;
  const isHyperdrive = userMetrics?.activeSurge?.active;

  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden font-mono text-slate-200">
      {/* Toast Notification */}
      {toast && (
        <div className="p-3.5 rounded-2xl bg-plug-accent/20 border border-plug-accent text-plug-accent text-xs font-bold shadow-2xl flex items-center gap-2 sticky top-4 z-50 backdrop-blur-xl animate-fade-in">
          <Zap className="w-4 h-4 shrink-0 fill-current animate-bounce" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              🧬 VIRAL ALGORITHM ENGINE (ViralEngine OS)
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE TELEMETRY
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Realtime K-Factor modeling, viral velocity surveillance & automated hyperdrive surge multipliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Achievement Card Button */}
          <button
            onClick={() => setShowCardModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-500/10"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Achievement Card</span>
          </button>

          {/* Hyperdrive Trigger Button */}
          <button
            onClick={handleTriggerHyperdrive}
            disabled={hyperdriveLoading || isHyperdrive}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              isHyperdrive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20 animate-pulse'
                : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-lg shadow-rose-500/25'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>
              {isHyperdrive
                ? `⚡ Hyper-Drive Active (${userMetrics?.activeSurge?.expiresInMins}m left • 2.5× XP)`
                : '🚀 Trigger Hyper-Drive (2.5× Surge)'}
            </span>
          </button>
        </div>
      </div>

      {/* 📊 CORE VIRAL GAUGES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* 1. K-Factor Meter */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
            <span>K-Factor (Viral Coefficient)</span>
            <span className={userMetrics?.isViral ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {userMetrics?.isViral ? 'SUPERCRITICAL' : 'SUBCRITICAL'}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white flex items-baseline gap-2">
            <span>{userMetrics?.kFactor || '1.18'}</span>
            <span className="text-[11px] font-normal text-slate-400">K = i × c</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 via-plug-accent to-pink-500 rounded-full"
              style={{ width: `${Math.min(100, (Number(userMetrics?.kFactor || 1.18) / 2.0) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400">
            {userMetrics?.kFactor >= 1.0 
              ? '🔥 K ≥ 1.0: Exponential organic virality achieved.' 
              : '⚡ Each invite converts at high intent.'}
          </div>
        </div>

        {/* 2. Viral Velocity Score */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
            <span>PulseWave Viral Velocity</span>
            <span className="text-rose-400 font-bold">{userMetrics?.velocityLabel || 'Accelerating'}</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 flex items-baseline gap-2">
            <span>{(Number(userMetrics?.viralVelocity || 0.45) * 100).toFixed(0)}%</span>
            <span className="text-[11px] font-normal text-slate-400">Velocity Index</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full"
              style={{ width: `${Math.min(100, (Number(userMetrics?.viralVelocity || 0.45)) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400">
            Calculated from 1h click velocity and referral conversion density.
          </div>
        </div>

        {/* 3. Status Multiplier */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
            <span>Status XP Multiplier</span>
            <span className="text-plug-accent font-bold">ACTIVE</span>
          </div>
          <div className="text-2xl font-extrabold text-plug-accent flex items-baseline gap-2">
            <span>{isHyperdrive ? '2.5×' : '1.5× – 2.0×'}</span>
            <span className="text-[11px] font-normal text-slate-400">Boost Tier</span>
          </div>
          <div className="text-[10px] text-slate-300">
            First referral of the day = <strong>2.0× XP</strong>. Squad cluster = <strong>+25%</strong>.
          </div>
        </div>

        {/* 4. Conversion Efficiency */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
            <span>Conversion Efficiency</span>
            <span className="text-sky-400 font-bold">HEALTHY</span>
          </div>
          <div className="text-2xl font-extrabold text-sky-400 flex items-baseline gap-2">
            <span>{userMetrics?.conversionRatePct || '22.7%'}</span>
            <span className="text-[11px] font-normal text-slate-400">Click → Signup</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Global network benchmark: 3.8% (You are outperforming by 5.9×).
          </div>
        </div>
      </div>

      {/* 🎯 EVENT-DRIVEN DOPAMINE SHARE PROMPTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-plug-accent" />
            🎯 Event-Driven Dopamine Share Triggers (1-Click Dispatches)
          </h3>
          <span className="text-[10px] text-slate-400">Pre-formatted with your Custom Sigil & Tracking Code</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {userMetrics?.dopaminePrompts?.map((prompt: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {prompt.badge}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{prompt.triggerEvent}</span>
                </div>
                <div className="font-bold text-white text-xs">{prompt.headline}</div>
                <p className="text-[11px] text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                  "{prompt.prefilledCopy.substring(0, 110)}..."
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleCopyPrompt(prompt.prefilledCopy, idx)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-plug-accent/15 hover:bg-plug-accent/25 border border-plug-accent/30 text-plug-accent text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === idx ? 'Copied Link!' : 'Copy with Link'}</span>
                </button>
                <button
                  onClick={() => setShowCardModal(true)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Preview Full Viral Achievement Card"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛡️ VIRAL CO-OP SQUADS (CLUSTER MULTIPLIER) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              🛡️ Viral Co-Op Squads (Permanent 1.25× Cluster Multiplier)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Team up with creator peers. When squad members earn referrals, the entire squad gets bonus XP.
            </p>
          </div>

          {!squadData?.hasSquad && (
            <button
              onClick={() => setShowSquadModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Form a Viral Squad</span>
            </button>
          )}
        </div>

        {squadData?.hasSquad ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-slate-500 uppercase text-[9px] font-bold block">Squad Name</span>
              <span className="text-white font-bold text-sm">{squadData.squad.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-slate-500 uppercase text-[9px] font-bold block">Cluster Multiplier</span>
              <span className="text-purple-400 font-bold text-sm">{squadData.squad.cluster_multiplier} Permanent</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-slate-500 uppercase text-[9px] font-bold block">Squad Code</span>
              <span className="text-plug-accent font-bold text-sm font-mono">{squadData.squad.code}</span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 bg-black/30 p-3 rounded-xl border border-slate-800/80">
            💡 You are currently running as a solo recruiter. Form or join a squad to unlock the <strong>1.25× Squad Multiplier</strong>.
          </div>
        )}
      </div>

      {/* Modal: Create Squad */}
      {showSquadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white">🛡️ Form a New Viral Squad</h3>
            <p className="text-xs text-slate-400">
              Give your creator syndicate a name. You will receive a unique squad invite code to recruit peers.
            </p>
            <input
              type="text"
              placeholder="e.g. Apex Wealth Collective"
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSquadModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSquad}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
              >
                Create Squad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Holographic Achievement Card Viewer */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-[1000] animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-purple-500/40 p-6 sm:p-8 rounded-3xl max-w-4xl w-full space-y-6 shadow-2xl shadow-purple-500/20 relative">
            <button
              onClick={() => setShowCardModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Holographic Viral Achievement Card
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Equipped Sigil & Status Flex
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Rendered live with your custom Sigil Forge artifacts, level metrics, and deterministic SHA-256 seal.
              </p>
            </div>

            {/* Rendered Live Card Image */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black flex items-center justify-center aspect-[1200/630] max-h-[55vh]">
              <img
                src={shareCardSvgUrl}
                alt="Viral Achievement Card"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 font-mono text-xs">
              <div className="text-slate-400 truncate max-w-xs sm:max-w-md text-[11px]">
                {shareCardUrl}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareCardUrl);
                    setCopiedCardUrl(true);
                    setTimeout(() => setCopiedCardUrl(false), 2500);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-plug-accent hover:bg-plug-accentHover text-slate-950 font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  {copiedCardUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCardUrl ? 'Link Copied!' : 'Copy Card Link'}</span>
                </button>

                <a
                  href={shareCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Fullscreen</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViralEngineWidget;
