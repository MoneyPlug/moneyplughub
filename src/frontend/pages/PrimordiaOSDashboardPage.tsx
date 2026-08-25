import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClerkAuth } from '../context/ClerkAuthWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Cpu, Network, Zap, Shield, Search, Send, 
  Sparkles, Key, Lock, Globe, Server, Eye, Video, 
  Layers, Terminal, RefreshCw, CheckCircle, AlertTriangle, 
  Play, Radio, Volume2, Database, BarChart3, TrendingUp, Clock, User
} from 'lucide-react';
import { forgeAudio } from '../utils/forgeAudio';
import { ApiKeyManagerModal } from '../components/ApiKeyManagerModal';
import { WhyUpgradeNowCard } from '../components/WhyUpgradeNowCard';

interface TelemetryData {
  system: string;
  status: string;
  uptimeSeconds: number;
  pulseWave: {
    viralVelocity: number;
    status: string;
    tokenThroughputPerSec: number;
    frequencyHz: number;
    latencyMs: number;
    errorBudgetPct: number;
    activeStreams: number;
  };
  agents: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    loadPct: number;
    lastSync: string;
    color: string;
  }>;
  unrealBridge: {
    connected: boolean;
    engineVersion: string;
    renderer: string;
    viewportFps: number;
    gpuLoadPct: number;
    particleBufferCount: number;
    activeCosmicShader: string;
    telemetrySyncMs: number;
  };
}

interface PrimordiaOSDashboardPageProps {
  onNavigate?: (tab: string) => void;
}

export const PrimordiaOSDashboardPage: React.FC<PrimordiaOSDashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { openApiKeyModal, isApiKeyModalOpen, closeApiKeyModal } = useClerkAuth();

  // Dashboard Data State
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  // RAG Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Autoposter State
  const [autoposterQueue, setAutoposterQueue] = useState<any[]>([]);
  const [postPlatform, setPostPlatform] = useState('tiktok');
  const [postContent, setPostContent] = useState('');
  const [scheduleMinutes, setScheduleMinutes] = useState(60);
  const [isScheduling, setIsScheduling] = useState(false);

  // Unreal VFX Trigger State
  const [vfxStatus, setVfxStatus] = useState<string | null>(null);
  const [vfxShader, setVfxShader] = useState('Cosmic_Supernova_Fusion');

  // UI Toast
  const [toast, setToast] = useState<string | null>(null);

  // Waveform Canvas Ref
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/primordia/telemetry');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setTelemetry(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoposterQueue = async () => {
    try {
      const res = await fetch('/api/primordia/autoposter/queue');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setAutoposterQueue(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRagSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      setIsSearching(true);
      const res = await fetch('/api/primordia/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSearchResults(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      setIsScheduling(true);
      const res = await fetch('/api/primordia/autoposter/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: postPlatform,
          content: postContent.trim(),
          scheduledInMinutes: scheduleMinutes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setPostContent('');
        forgeAudio.playCosmicRoll();
        setToast(json.message);
        fetchAutoposterQueue();
        setTimeout(() => setToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleTriggerUnrealVfx = async () => {
    try {
      setVfxStatus('Fusing Niagara GPU Particles...');
      forgeAudio.playShockwave();
      const res = await fetch('/api/primordia/unreal/trigger-vfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shaderPreset: vfxShader }),
      });
      const json = await res.json();
      if (json.success) {
        forgeAudio.playAscensionChord();
        setVfxStatus(`✨ ${json.message} (${json.data.gpuParticlesRendered.toLocaleString()} Particles @ ${json.data.viewportFps} FPS)`);
        setTimeout(() => setVfxStatus(null), 4500);
      }
    } catch (e) {
      console.error(e);
      setVfxStatus(null);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchAutoposterQueue();
    handleRagSearch('');
  }, []);

  // ── PulseWave Waveform Canvas Animation ─────────────────────────────
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const renderWave = () => {
      phase += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      // Draw Multi-harmonic Sine Waves
      for (let wave = 0; wave < 3; wave++) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        const freq = (wave + 1) * 0.025;
        const amp = (wave === 0 ? 18 : wave === 1 ? 12 : 6);
        const color = wave === 0 ? '#10b981' : wave === 1 ? '#38bdf8' : '#c084fc';

        for (let x = 0; x < w; x += 4) {
          const y = centerY + Math.sin(x * freq + phase * (wave + 1)) * amp * Math.cos(phase * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = wave === 0 ? 2 : 1;
        ctx.globalAlpha = wave === 0 ? 0.9 : 0.4;
        ctx.shadowColor = color;
        ctx.shadowBlur = wave === 0 ? 8 : 0;
        ctx.stroke();
      }

      animId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Top Master Command Banner ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        {/* Prismatic glow backdrop */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[130px] pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PRIMORDIAOS v5.0 AUTONOMOUS CONTROL
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono">
              Niagara Fusion Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            🪐 PrimordiaOS Master Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Real-time multi-agent orchestration, PulseWave viral telemetry, RAG vector retrieval, autoposter controls, and Unreal Engine 5.4 rendering bridge.
          </p>
        </div>

        {/* Action Controls & Key Management */}
        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={openApiKeyModal}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-lg"
          >
            <Key className="w-4 h-4 text-cyan-400" />
            API Keys
          </button>

          <button
            onClick={fetchTelemetry}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-lg"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* ── 2. PulseWave Telemetry & Unreal Engine Bridge Row ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PulseWave Live Meter (7 Cols) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                PulseWave Telemetry Meter
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold animate-pulse">
              ● {telemetry?.pulseWave?.status || 'Supercritical (Active)'}
            </span>
          </div>

          {/* Waveform Canvas */}
          <div className="relative h-20 w-full bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center">
            <canvas
              ref={waveCanvasRef}
              width={500}
              height={80}
              className="w-full h-full"
            />
            <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-400">
              528Hz Harmonic Resonance
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase block">Viral Velocity</span>
              <span className="text-base font-black text-emerald-400">
                {telemetry ? `${(telemetry.pulseWave.viralVelocity * 100).toFixed(0)}%` : '88%'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase block">Throughput</span>
              <span className="text-base font-black text-cyan-400">
                {telemetry ? `${telemetry.pulseWave.tokenThroughputPerSec}/s` : '1,420/s'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase block">Core Latency</span>
              <span className="text-base font-black text-purple-400">
                {telemetry ? `${telemetry.pulseWave.latencyMs}ms` : '18.4ms'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase block">Active Streams</span>
              <span className="text-base font-black text-amber-400">
                {telemetry ? telemetry.pulseWave.activeStreams : 14} Nodes
              </span>
            </div>
          </div>
        </motion.div>

        {/* Unreal Engine + Niagara Bridge Monitor (5 Cols) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Unreal Engine 5.4 Bridge
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                60 FPS Viewport
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300 mt-3">
              <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Renderer:</span>
                <span className="text-white font-bold">{telemetry?.unrealBridge?.renderer || 'Niagara GPU Fusion'}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Particle Buffer:</span>
                <span className="text-amber-400 font-bold">{telemetry?.unrealBridge?.particleBufferCount?.toLocaleString() || '12,450'}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Cosmic Shader:</span>
                <span className="text-cyan-400 truncate max-w-[150px]">{telemetry?.unrealBridge?.activeCosmicShader || 'Molten_Gold_Singularity'}</span>
              </div>
            </div>
          </div>

          {/* Trigger VFX Button */}
          <div className="space-y-2">
            {vfxStatus && (
              <div className="text-[11px] font-mono text-emerald-400 animate-pulse">
                {vfxStatus}
              </div>
            )}
            <button
              onClick={handleTriggerUnrealVfx}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              TRIGGER NIAGARA REAL-TIME COSMIC VFX
            </button>
          </div>
        </motion.div>

      </div>

      {/* ── 3. 6-Agent Swarm Status Cards Grid ──────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            6-Agent Autonomous Swarm Fleet
          </h2>
          <span className="text-xs font-mono text-slate-500">All Agents Operating in Silent Processor Mode</span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {telemetry?.agents?.map((ag) => (
            <motion.div
              key={ag.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, rotate: -0.5 }}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-xl backdrop-blur-md relative overflow-hidden space-y-3 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ag.color, boxShadow: `0 0 10px ${ag.color}` }}
                  />
                  <h4 className="font-bold text-white text-sm tracking-tight">{ag.name}</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                  {ag.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono leading-relaxed">{ag.role}</p>

              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Engine Load</span>
                  <span className="text-white font-bold">{ag.loadPct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${ag.loadPct}%`, backgroundColor: ag.color }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>Latency: {ag.lastSync}</span>
                  <span>Primordial Bus: Encrypted</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── 4. RAG Knowledge Search & Autoposter Controls Row ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* RAG Knowledge Search Bar & Results (6 Cols) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                RAG Memory & Vector Search
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">ACID SQLite Vector State</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search blueprints, viral funnels, Niagara shaders, swarm directives..."
              value={searchQuery}
              onChange={(e) => handleRagSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none"
            />
            {isSearching && (
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin absolute right-3.5 top-3" />
            )}
          </div>

          {/* Preset Pill Tags */}
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
            {['Niagara', 'K-Factor', 'Living Vault', 'Directives', 'Runway', 'Commissions'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleRagSearch(tag)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Search Results List */}
          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 space-y-1.5 text-xs transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate">{item.title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400 uppercase">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">{item.snippet}</p>
                <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1">
                  <span>Source: {item.source}</span>
                  <span>Tags: {item.tags}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Autoposter Controls & Multi-Platform Queue (6 Cols) */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Viral Autoposter Control
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">Queue Active</span>
            </div>

            {/* Schedule Post Form */}
            <form onSubmit={handleSchedulePost} className="space-y-3 mt-3">
              <div className="grid grid-cols-3 gap-2">
                {(['tiktok', 'x', 'youtube_shorts'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPostPlatform(p)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold capitalize transition-all ${
                      postPlatform === p
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p === 'x' ? '𝕏 / Twitter' : p.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Compose viral short-form copy with automated hook..."
                rows={2}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none resize-none"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Delay:</span>
                  <select
                    value={scheduleMinutes}
                    onChange={(e) => setScheduleMinutes(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={180}>3 Hours</option>
                    <option value={720}>12 Hours</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isScheduling || !postContent.trim()}
                  className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Schedule Post
                </button>
              </div>
            </form>
          </div>

          {/* Active Scheduled Queue */}
          <div className="space-y-2 pt-2 border-t border-slate-900">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
              Active Autoposter Queue ({autoposterQueue.length})
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {autoposterQueue.map((q) => (
                <div
                  key={q.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                >
                  <div className="truncate max-w-[280px]">
                    <span className="text-purple-400 font-bold uppercase mr-1.5">[{q.platform}]</span>
                    <span className="text-slate-300">{q.content}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(q.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      {/* 🚀 WHY UPGRADE NOW: Master Value Proposition & Elevation Banner */}
      <div className="mt-8">
        <WhyUpgradeNowCard onNavigate={onNavigate} />
      </div>

      {/* API Key Modal */}
      <ApiKeyManagerModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} />
    </div>
  );
};
