import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, Cpu, Network, Activity, Zap, CheckCircle, Sparkles, 
  Layers, Database, Shield, Server, ArrowRight, Star, Send, 
  Clock, DollarSign, RefreshCw, BarChart2, Flame, Globe, Lock 
} from 'lucide-react';

export const PlugInOSv5DashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'orchestrator' | 'modules' | 'models' | 'pulse' | 'pricing' | 'roadmap'>('orchestrator');
  
  // Data states
  const [modules, setModules] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [pulse, setPulse] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Router state
  const [userPrompt, setUserPrompt] = useState('Draft a viral TikTok script promoting our automated cashback stacking system with a 3-second hook.');
  const [preference, setPreference] = useState<'speed' | 'reasoning' | 'context' | 'research'>('reasoning');
  const [category, setCategory] = useState('Marketing');
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [routingInProgress, setRoutingInProgress] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modRes, modelRes, pulseRes, tierRes, histRes] = await Promise.all([
        fetch('/api/v5/modules'),
        fetch('/api/v5/models'),
        fetch('/api/v5/pulse'),
        fetch('/api/v5/tiers'),
        token ? fetch('/api/v5/tasks/history', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
      ]);

      if (modRes.ok) {
        const j = await modRes.json();
        if (j.success) setModules(j.data);
      }
      if (modelRes.ok) {
        const j = await modelRes.json();
        if (j.success) setModels(j.data);
      }
      if (pulseRes.ok) {
        const j = await pulseRes.json();
        if (j.success) setPulse(j.data);
      }
      if (tierRes.ok) {
        const j = await tierRes.json();
        if (j.success) setTiers(j.data);
      }
      if (histRes && histRes.ok) {
        const j = await histRes.json();
        if (j.success) setTaskHistory(j.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleRouteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setToast('⚠️ Please sign in to dispatch live AI Orchestrator requests.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      setRoutingInProgress(true);
      const res = await fetch('/api/v5/tasks/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: userPrompt,
          category,
          preference,
        }),
      });

      if (res.ok) {
        const j = await res.json();
        if (j.success) {
          setRoutingResult(j.data);
          setToast(`⚡ Task routed to ${j.data.assignedModel.name} in ${j.data.metrics.latencyMs}ms!`);
          await fetchData();
          setTimeout(() => setToast(null), 3500);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRoutingInProgress(false);
    }
  };

  const handleFeedback = async (rating: number) => {
    if (!routingResult || !token) return;
    try {
      const res = await fetch(`/api/v5/tasks/${routingResult.taskId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating }),
      });
      if (res.ok) {
        const j = await res.json();
        setToast(`⭐ ${j.message}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans">
      {toast && (
        <div className="p-4 rounded-2xl bg-plug-accent/20 border border-plug-accent text-plug-accent text-xs font-bold shadow-2xl flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0 fill-current" />
          <span>{toast}</span>
        </div>
      )}

      {/* Hero Banner with Notion Aside */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold uppercase tracking-wider">
                💠 Plug In OS v5.0
              </span>
              <span className="px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">
                Commercial SaaS Engine
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              The AI Orchestrator for Creators and Teams
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-3xl">
              A modular SaaS platform that connects multiple model families, automates complex workflows, routes tasks dynamically, and learns from user feedback.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shrink-0 max-w-sm">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
              💠 Architecture Snapshot:
            </span>
            <div className="text-xs font-mono text-slate-300 space-y-1">
              <div>• <strong>12 AI Modules</strong> (Vision, Signal, Pulse, etc.)</div>
              <div>• <strong>6 Connected Model Families</strong></div>
              <div>• <strong>Adaptive Multi-Model Router</strong></div>
              <div>• <strong>Pulse Engine Telemetry (99.98%)</strong></div>
            </div>
          </div>
        </div>

        {/* Notion-Style Aside Callout */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
          <span className="text-2xl shrink-0">💠</span>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
            <strong>Plug In OS v5.0</strong> evolves into a sellable AI Orchestrator — a modular SaaS system that connects multiple models, automates workflows, and learns from feedback.
          </p>
        </div>
      </div>

      {/* Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono">
        <button
          onClick={() => setActiveTab('orchestrator')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'orchestrator' ? 'bg-plug-accent text-plug-dark shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          🧩 Live AI Orchestrator
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'modules' ? 'bg-plug-accent text-plug-dark shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          🤖 12 AI Modules
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'models' ? 'bg-plug-accent text-plug-dark shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          🧠 6 AI Model Families
        </button>

        <button
          onClick={() => setActiveTab('pulse')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pulse' ? 'bg-plug-accent text-plug-dark shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          ⚙️ Pulse Engine
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pricing' ? 'bg-plug-accent text-plug-dark shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          💎 Pricing & Tiers
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'roadmap' ? 'bg-plug-accent text-plug-dark shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          📈 10-Week Roadmap
        </button>
      </div>

      {/* TAB 1: LIVE AI ORCHESTRATOR */}
      {activeTab === 'orchestrator' && (
        <div className="space-y-8">
          <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-plug-border/80 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-plug-accent" />
                  Intelligent Multi-Model Task Router
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Routes tasks dynamically to OpenAI, Claude 3.5, Gemini 1.5, Perplexity, or Llama 3 based on latency, cost, and complexity.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                Multi-Model Mesh Online
              </span>
            </div>

            <form onSubmit={handleRouteTask} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">
                  User Prompt / Creative Directive:
                </label>
                <textarea
                  rows={3}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Enter any workflow task, script idea, or analysis directive..."
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-plug-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1 text-[10px]">Optimization Mode:</label>
                  <select
                    value={preference}
                    onChange={(e: any) => setPreference(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-plug-accent"
                  >
                    <option value="reasoning">🧠 Deep Reasoning (Claude 3.5)</option>
                    <option value="speed">⚡ Ultra Low Latency (Llama 3)</option>
                    <option value="context">📚 Massive Context (Gemini 1.5)</option>
                    <option value="research">🔍 Live Web Search (Perplexity)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 uppercase font-bold mb-1 text-[10px]">Task Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-plug-accent"
                  >
                    <option value="Marketing">Marketing / Content</option>
                    <option value="Finance">Finance & Cash Back</option>
                    <option value="Coding">Coding & Systems</option>
                    <option value="Analytics">Telemetry Analysis</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    disabled={routingInProgress}
                    className="w-full py-3 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-black text-xs font-mono rounded-xl transition-all shadow-lg shadow-plug-accent/20 flex items-center justify-center gap-2"
                  >
                    {routingInProgress ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {routingInProgress ? 'Orchestrating Route...' : 'Dispatch Task Across AI Mesh'}
                  </button>
                </div>
              </div>
            </form>

            {/* Routing Result Output */}
            {routingResult && (
              <div className="p-6 rounded-2xl bg-slate-950 border border-plug-accent/40 space-y-4 text-xs font-mono animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-plug-accent animate-pulse" />
                    <span className="font-bold text-white text-sm">
                      Executed by: {routingResult.assignedModel.name} ({routingResult.assignedModel.provider})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>⏱️ Latency: <strong>{routingResult.metrics.latencyMs}ms</strong></span>
                    <span>🪙 Tokens: <strong>{routingResult.metrics.tokensUsed}</strong></span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed">
                  {routingResult.response}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
                  <span>Adaptive Routing: <em>{routingResult.metrics.routingReason}</em></span>
                  
                  {/* Feedback Stars */}
                  <div className="flex items-center gap-1.5">
                    <span>Feedback:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleFeedback(star)}
                        className="text-amber-400 hover:scale-125 transition-transform"
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Task Orchestration History */}
          {taskHistory.length > 0 && (
            <div className="bg-plug-card border border-plug-border rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-plug-accent" />
                Recent Orchestrated Tasks (Adaptive Learning Log)
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Prompt</th>
                      <th className="py-3 px-4">Assigned Model</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Tokens</th>
                      <th className="py-3 px-4 text-right">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {taskHistory.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-900/50">
                        <td className="py-3 px-4 font-medium text-white truncate max-w-xs">{t.prompt}</td>
                        <td className="py-3 px-4 text-plug-accent">{t.model_name || t.assigned_model_id}</td>
                        <td className="py-3 px-4">{t.latency_ms}ms</td>
                        <td className="py-3 px-4">{t.tokens_used}</td>
                        <td className="py-3 px-4 text-right text-amber-400 font-bold">{t.feedback_rating}★</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 12 AI MODULES */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              🤖 12 AI Modules (Core Subsystems)
            </h2>
            <span className="text-xs font-mono text-slate-400">Modular SaaS Subsystems</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m) => (
              <div key={m.id} className="p-6 rounded-3xl bg-plug-card border border-plug-border space-y-3 flex flex-col justify-between shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                      {m.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      m.tier === 'Enterprise' ? 'bg-purple-500/20 text-purple-300' :
                      m.tier === 'Pro' ? 'bg-plug-accent/20 text-plug-accent' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {m.tier} Tier
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base">{m.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {m.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Subsystem Active
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 6 AI MODEL FAMILIES */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              🧠 Connected AI Model Families (Registry)
            </h2>
            <span className="text-xs font-mono text-slate-400">User-Key & Direct API Access</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((mod) => (
              <div key={mod.id} className="p-6 rounded-3xl bg-plug-card border border-plug-border space-y-4 shadow-xl text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                    {mod.provider}
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {mod.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{mod.name}</h3>
                  <p className="text-plug-accent mt-1"><strong>Core Strength:</strong> {mod.strength}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Context</span>
                    <span className="font-bold text-white">{mod.context_window}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Avg Latency</span>
                    <span className="font-bold text-sky-400">{mod.avg_latency_ms}ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Cost / 1k</span>
                    <span className="font-bold text-amber-400">{mod.cost_per_1k_tokens_cents}¢</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PULSE ENGINE */}
      {activeTab === 'pulse' && pulse && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              ⚙️ Pulse Engine (Monitoring & Performance)
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Health Status: {pulse.healthStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Uptime (30d)</span>
              <div className="text-2xl font-black text-emerald-400">{pulse.uptimePct}%</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Avg Mesh Latency</span>
              <div className="text-2xl font-black text-sky-400">{pulse.avgLatencyMs}ms</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Success Rate</span>
              <div className="text-2xl font-black text-plug-accent">{pulse.successRatePct}%</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Throughput</span>
              <div className="text-2xl font-black text-purple-400">{pulse.throughputRpm} RPM</div>
            </div>
          </div>

          {/* Node Health Grid */}
          <div className="bg-plug-card border border-plug-border rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              Global Infrastructure Nodes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
              {pulse.nodes?.map((n: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{n.name}</div>
                    <div className="text-slate-500 text-[10px]">Latency: {n.latency}</div>
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-500/10">
                    {n.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRICING & TIERS */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-white">Commercial SaaS Positioning</h2>
            <p className="text-slate-400 text-xs font-mono">
              The AI Orchestrator for Creators and Teams. Built with Stripe Billing + Clerk Authentication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div
                key={t.id}
                className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
                  t.highlighted
                    ? 'bg-plug-card border-plug-accent shadow-2xl shadow-plug-accent/10 relative scale-105'
                    : 'bg-plug-card/80 border-plug-border shadow-xl'
                }`}
              >
                {t.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-plug-accent text-plug-dark font-mono font-black text-xs uppercase tracking-wider shadow-lg">
                    {t.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-black text-white">{t.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">{t.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">${t.priceMonthlyUsd}</span>
                    <span className="text-xs text-slate-400 font-mono">/ month</span>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300 font-mono">
                    {t.features.map((f: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-plug-accent shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className={`w-full py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider transition-all shadow-md ${
                    t.highlighted
                      ? 'bg-plug-accent hover:bg-plug-accentHover text-plug-dark'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  Activate {t.name} Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: 10-WEEK LAUNCH ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-plug-border/80 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                📈 10-Week Commercial Launch Roadmap
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                From Notion schema export to public release and Stripe billing.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-plug-accent bg-plug-accent/10 px-3 py-1 rounded-full">
              Production Execution Mode
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-plug-accent font-bold">Week 1–2: Backend API + DB Setup</span>
              <p className="text-slate-300">Convert Notion schema to SQLite / PostgreSQL tables; build `/tasks`, `/models`, `/pulse` endpoints.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-sky-400 font-bold">Week 3–4: Frontend UI + Auth Integration</span>
              <p className="text-slate-300">Build futuristic dashboard with Tailwind CSS + Framer Motion; connect Clerk authentication.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-purple-400 font-bold">Week 5–6: Model API Connections + Pulse Engine Metrics</span>
              <p className="text-slate-300">Integrate user-key access for OpenAI, Claude, Gemini, and Perplexity; link live Pulse latency monitors.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-amber-400 font-bold">Week 7–8: Beta Testing + Stripe Billing</span>
              <p className="text-slate-300">Implement Starter ($29), Pro ($79), and Enterprise ($299) subscription tiers with webhook sync.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-bold">Week 9–10: Public Release + Marketing Site</span>
              <p className="text-slate-300">Launch marketing landing pages, affiliate commission funnels, and creator onboarding loop.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
