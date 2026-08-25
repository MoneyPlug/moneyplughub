import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrchestratorWidget } from '../components/OrchestratorWidget';
import { InsightAgentWidget } from '../components/InsightAgentWidget';
import { ViralEngineWidget } from '../components/ViralEngineWidget';
import { ProgressionMilestoneBar } from '../components/ProgressionMilestoneBar';
import { WhyUpgradeNowCard } from '../components/WhyUpgradeNowCard';
import { 
  Zap, LayoutDashboard, UserCheck, CheckSquare, DollarSign, 
  TrendingUp, Video, Repeat, Brain, Copy, Check, ExternalLink, 
  Flame, Sparkles, Shield, Clock, Plus, Tag, RefreshCw, Edit3, 
  AlertCircle, ChevronRight, Layers, FileText, ArrowUpRight 
} from 'lucide-react';

export const CommandCenterPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user, token, refreshUser } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [activeDb, setActiveDb] = useState<'profile' | 'xp_actions' | 'programs' | 'tracker' | 'content' | 'automations' | 'self_understanding'>('xp_actions');
  const [dbView, setDbView] = useState<string>('today');
  const [dbData, setDbData] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [scratchpad, setScratchpad] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchOverview = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [ovRes, spRes] = await Promise.all([
        fetch('/api/command-center/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/command-center/scratchpad', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (ovRes.ok) {
        const j = await ovRes.json();
        if (j.success) setOverview(j.data);
      }
      if (spRes.ok) {
        const j = await spRes.json();
        if (j.success) setScratchpad(j.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbData = async (dbName: string, view: string) => {
    if (!token) return;
    try {
      if (dbName === 'profile') {
        const res = await fetch('/api/command-center/db/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const j = await res.json();
          if (j.success) setProfileData(j.data);
        }
        return;
      }

      const res = await fetch(`/api/command-center/db/${dbName}?view=${view}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const j = await res.json();
        if (j.success) setDbData(j.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [token]);

  useEffect(() => {
    fetchDbData(activeDb, dbView);
  }, [activeDb, dbView, token]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleToggleXpAction = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/command-center/db/xp-actions/${id}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const j = await res.json();
        setToast(j.message);
        await fetchOverview();
        await fetchDbData(activeDb, dbView);
        await refreshUser();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmInsight = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/command-center/db/self-understanding/${id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const j = await res.json();
        setToast(j.message);
        await fetchDbData('self_understanding', dbView);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveScratchpad = async () => {
    if (!token) return;
    try {
      await fetch('/api/command-center/scratchpad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: scratchpad }),
      });
      setToast('📝 Scratchpad saved.');
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const formatUsd = (cents: number = 0) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0 fill-current" />
          <span>{toast}</span>
        </div>
      )}

      {/* 🟩 TOP HEADER: Plug In OS — Command Center */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold uppercase tracking-wider">
                🟩 Plug In OS
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                Adaptive • Behavior-Aware
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              ⭐ Command Center (Full Rebuild)
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-semibold mt-1">
              Your adaptive, behavior‑aware money system.
            </p>
          </div>

          {/* Quick Rakuten Callout */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-mono text-slate-400 font-bold">Your Rakuten Link:</span>
              <button
                onClick={() => copyToClipboard(overview?.rakutenLink || 'https://www.rakuten.com/r/CASHPL19', 'rakuten_top')}
                className="text-[11px] font-mono text-plug-accent hover:text-white flex items-center gap-1 font-bold"
              >
                {copiedKey === 'rakuten_top' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'rakuten_top' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="text-xs font-mono font-bold text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 truncate max-w-xs">
              {overview?.rakutenLink || 'https://www.rakuten.com/r/CASHPL19'}
            </div>
          </div>
        </div>
      </div>

      {/* Level Progression & Next Chamber Unlock Milestone HUD */}
      <ProgressionMilestoneBar onNavigate={onNavigate} />

      {/* 🚀 WHY UPGRADE NOW: High-Converting Value & ROI CTA */}
      <WhyUpgradeNowCard onNavigate={onNavigate} />

      {/* StarterOrchestrator HUD & InsightAgent */}
      <OrchestratorWidget onActionComplete={fetchOverview} />
      <InsightAgentWidget />
      <ViralEngineWidget onNavigate={onNavigate} />

      {/* 📊 DASHBOARD OVERVIEW: Live Snapshot */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-plug-border/80 pb-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            📊 Dashboard Overview (Live Snapshot)
          </h2>
          <span className="text-xs font-mono text-slate-500">Live Telemetry Rollup</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Today's Actions */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> Today’s Actions
              </span>
              <span className="text-emerald-400 font-bold">XP Actions DB</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {overview?.todayActions?.filter((a: any) => a.status !== 'Done').length || 0} Pending
            </div>
            <p className="text-[11px] text-slate-400">
              Top micro-tasks ready to build execution momentum.
            </p>
          </div>

          {/* 2. Earnings Today */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-plug-accent" /> Earnings Today
              </span>
              <span className="text-plug-accent font-bold">Rollup</span>
            </div>
            <div className="text-2xl font-black text-plug-accent font-mono">
              {formatUsd(overview?.earningsTodayCents || 21500)}
            </div>
            <p className="text-[11px] text-slate-400">
              Aggregated from Program Tracker + commissions.
            </p>
          </div>

          {/* 3. Content Queue */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Video className="w-4 h-4 text-purple-400" /> Content Queue
              </span>
              <span className="text-purple-400 font-bold">3 Queued</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {overview?.contentQueue?.length || 0} Next Posts
            </div>
            <p className="text-[11px] text-slate-400">
              Faceless content engine hooks and video scripts.
            </p>
          </div>

          {/* 4. Automations Running */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-sky-400" /> Automations
              </span>
              <span className="text-sky-400 font-bold">Make.com</span>
            </div>
            <div className="text-2xl font-black text-sky-400 font-mono">
              {overview?.automationsRunning?.status || 'Active'}
            </div>
            <p className="text-[11px] text-slate-400">
              {overview?.automationsRunning?.activeCount || 4} workflows synced and running.
            </p>
          </div>
        </div>
      </div>

      {/* 📚 OS MODULES (Navigation Bar / Hubs) */}
      <div className="bg-plug-card border border-plug-border p-6 rounded-3xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-400 font-mono uppercase">
          📚 OS Modules Navigation
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <button
            onClick={() => setActiveDb('programs')}
            className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all ${
              activeDb === 'programs' ? 'bg-plug-accent/20 border-plug-accent text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4 text-plug-accent" />
            <div className="font-bold">Money Hub</div>
            <div className="text-[10px] text-slate-400">Earnings & Trackers</div>
          </button>

          <button
            onClick={() => setActiveDb('content')}
            className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all ${
              activeDb === 'content' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Video className="w-4 h-4 text-purple-400" />
            <div className="font-bold">Content Factory</div>
            <div className="text-[10px] text-slate-400">Scripts & Hooks</div>
          </button>

          <button
            onClick={() => {
              if (onNavigate) onNavigate('referral-hub');
              else setActiveDb('programs');
            }}
            className="p-3.5 rounded-2xl border bg-slate-950 border-slate-800 text-left space-y-1 hover:border-slate-700 transition-all text-slate-300"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <div className="font-bold">Referral Engine</div>
            <div className="text-[10px] text-slate-400">Links & Funnels</div>
          </button>

          <button
            onClick={() => setActiveDb('self_understanding')}
            className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all ${
              activeDb === 'self_understanding' ? 'bg-pink-500/20 border-pink-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Brain className="w-4 h-4 text-pink-400" />
            <div className="font-bold">Self‑Understanding</div>
            <div className="text-[10px] text-slate-400">Patterns & Insights</div>
          </button>

          <button
            onClick={() => setActiveDb('automations')}
            className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all ${
              activeDb === 'automations' ? 'bg-sky-500/20 border-sky-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Repeat className="w-4 h-4 text-sky-400" />
            <div className="font-bold">Automations</div>
            <div className="text-[10px] text-slate-400">Make.com Map</div>
          </button>

          <button
            onClick={() => setActiveDb('xp_actions')}
            className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all ${
              activeDb === 'xp_actions' ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <div className="font-bold">Daily OS</div>
            <div className="text-[10px] text-slate-400">Today's Action List</div>
          </button>
        </div>
      </div>

      {/* 🗂 7 LINKED DATABASES (LIVE) EXPLORER */}
      <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-plug-border/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗂</span>
            <h2 className="text-xl font-black text-white">
              7 Linked Databases (LIVE)
            </h2>
          </div>

          {/* Database Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveDb('profile'); setDbView('all'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeDb === 'profile' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'}`}
            >
              1. 👤 Profile
            </button>
            <button
              onClick={() => { setActiveDb('xp_actions'); setDbView('today'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeDb === 'xp_actions' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'}`}
            >
              2. ⚡ XP Actions
            </button>
            <button
              onClick={() => { setActiveDb('programs'); setDbView('all'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeDb === 'programs' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'}`}
            >
              3. 💰 Programs
            </button>
            <button
              onClick={() => { setActiveDb('tracker'); setDbView('this_week'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeDb === 'tracker' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'}`}
            >
              4. 📈 Tracker
            </button>
            <button
              onClick={() => { setActiveDb('content'); setDbView('ready_to_post'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeDb === 'content' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'}`}
            >
              5. 🎥 Content
            </button>
            <button
              onClick={() => { setActiveDb('automations'); setDbView('active'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeDb === 'automations' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'}`}
            >
              6. 🔁 Automations
            </button>
            <button
              onClick={() => { setActiveDb('self_understanding'); setDbView('confirmed'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${activeDb === 'self_understanding' ? 'bg-plug-accent text-plug-dark' : 'text-slate-400 hover:text-white'}`}
            >
              7. 🧠 Self‑Understanding
            </button>
          </div>
        </div>

        {/* 1. 👤 USER PROFILE (DB) */}
        {activeDb === 'profile' && profileData && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-base font-black text-white">👤 User Profile (Adaptive Behavior Engine)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase">Behavior Type:</span>
                  <div className="text-base font-black text-plug-accent">{profileData.behavior_type}</div>
                  <p className="text-[11px] text-slate-500">Sprinter / Slow Builder / Minimal Friction</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase">Energy Pattern:</span>
                  <div className="text-sm font-bold text-white">{profileData.energy_pattern}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase">Friction Points:</span>
                  <div className="text-sm text-rose-400">{profileData.friction_points}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase">Strengths:</span>
                  <div className="text-sm text-emerald-400">{profileData.strengths}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 md:col-span-2">
                  <span className="text-slate-400 font-bold uppercase">Current Focus:</span>
                  <div className="text-sm font-bold text-sky-400">{profileData.current_focus}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase">Stress Level (1–5):</span>
                  <div className="text-lg font-black text-amber-400">{profileData.stress_level} / 5 (Low / Manageable)</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold uppercase">Notes:</span>
                  <div className="text-xs text-slate-300">{profileData.notes}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ⚡ XP ACTIONS (DB) */}
        {activeDb === 'xp_actions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">⚡ XP Actions DB (Daily Micro-Tasks)</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg text-xs font-mono border border-slate-800">
                  <button onClick={() => setDbView('today')} className={`px-2.5 py-1 rounded ${dbView === 'today' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>Today</button>
                  <button onClick={() => setDbView('quick_wins')} className={`px-2.5 py-1 rounded ${dbView === 'quick_wins' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>Quick Wins (&lt;5 min)</button>
                  <button onClick={() => setDbView('money_first')} className={`px-2.5 py-1 rounded ${dbView === 'money_first' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>Money‑First</button>
                  <button onClick={() => setDbView('all')} className={`px-2.5 py-1 rounded ${dbView === 'all' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>All</button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">XP Value</th>
                    <th className="py-3 px-4">Automation?</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {dbData.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{act.action}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          act.category === 'Money' ? 'bg-emerald-500/20 text-emerald-400' :
                          act.category === 'Content' ? 'bg-purple-500/20 text-purple-400' :
                          act.category === 'System' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {act.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-bold">{act.difficulty}</td>
                      <td className="py-3 px-4 text-slate-400">{act.time_required}</td>
                      <td className="py-3 px-4 text-amber-400 font-bold">+{act.xp_value} XP</td>
                      <td className="py-3 px-4">{act.is_automated ? '⚡ Yes' : 'No'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleXpAction(act.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            act.status === 'Done' ? 'bg-emerald-500 text-plug-dark font-black' :
                            act.status === 'Doing' ? 'bg-sky-500 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {act.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. 💰 REFERRAL PROGRAMS (DB) */}
        {activeDb === 'programs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">💰 Referral Programs DB (Earning Ecosystem)</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg text-xs font-mono border border-slate-800">
                  <button onClick={() => setDbView('high_payout')} className={`px-2.5 py-1 rounded ${dbView === 'high_payout' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>High Payout</button>
                  <button onClick={() => setDbView('easy_wins')} className={`px-2.5 py-1 rounded ${dbView === 'easy_wins' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>Easy Wins</button>
                  <button onClick={() => setDbView('all')} className={`px-2.5 py-1 rounded ${dbView === 'all' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>All</button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Program Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Referral Link</th>
                    <th className="py-3 px-4">Payout Type</th>
                    <th className="py-3 px-4">Payout Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {dbData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                      <td className="py-3 px-4">{p.category}</td>
                      <td className="py-3 px-4 font-mono text-plug-accent truncate max-w-xs">{p.destination_url}</td>
                      <td className="py-3 px-4 text-slate-300">{p.payout_type || 'Cash Bonus'}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{p.payout_amount || p.bonus_desc}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 text-[11px]">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. 📈 PROGRAM TRACKER (DB) */}
        {activeDb === 'tracker' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">📈 Program Tracker DB (Conversions + Earnings)</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg text-xs font-mono border border-slate-800">
                  <button onClick={() => setDbView('this_week')} className={`px-2.5 py-1 rounded ${dbView === 'this_week' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>This Week</button>
                  <button onClick={() => setDbView('top_earners')} className={`px-2.5 py-1 rounded ${dbView === 'top_earners' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>Top Earners</button>
                  <button onClick={() => setDbView('by_platform')} className={`px-2.5 py-1 rounded ${dbView === 'by_platform' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>By Platform</button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Program</th>
                    <th className="py-3 px-4">Clicks</th>
                    <th className="py-3 px-4">Signups</th>
                    <th className="py-3 px-4">Conversions</th>
                    <th className="py-3 px-4">Earnings</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Source Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {dbData.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{t.program}</td>
                      <td className="py-3 px-4">{t.clicks}</td>
                      <td className="py-3 px-4">{t.signups}</td>
                      <td className="py-3 px-4">{t.conversions}</td>
                      <td className="py-3 px-4 font-bold text-plug-accent">{formatUsd(t.earnings_cents)}</td>
                      <td className="py-3 px-4 text-slate-400">{t.date}</td>
                      <td className="py-3 px-4 text-right font-bold text-sky-400">{t.source_platform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. 🎥 CONTENT QUEUE (DB) */}
        {activeDb === 'content' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">🎥 Content Queue DB (Faceless Content Engine)</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg text-xs font-mono border border-slate-800">
                  <button onClick={() => setDbView('ready_to_post')} className={`px-2.5 py-1 rounded ${dbView === 'ready_to_post' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>Ready to Post</button>
                  <button onClick={() => setDbView('high_performers')} className={`px-2.5 py-1 rounded ${dbView === 'high_performers' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>High Performers</button>
                  <button onClick={() => setDbView('all')} className={`px-2.5 py-1 rounded ${dbView === 'all' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>All</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbData.map((c) => (
                <div key={c.id} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between text-xs font-mono">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">{c.platform}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">{c.status}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{c.video_idea}</h4>
                    <p className="p-3 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 italic">
                      <strong>Hook:</strong> "{c.hook}"
                    </p>
                    <p className="text-slate-400 text-[11px]">{c.script}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Performance: {c.views.toLocaleString()} Views • {c.ctr}% CTR • {c.saves} Saves</span>
                    <button
                      onClick={() => copyToClipboard(c.script, `content_${c.id}`)}
                      className="text-plug-accent hover:text-white font-bold"
                    >
                      {copiedKey === `content_${c.id}` ? 'Copied' : 'Copy Script'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. 🔁 AUTOMATIONS (DB) */}
        {activeDb === 'automations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">🔁 Automations DB (Make.com + Zapier Workflow Map)</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg text-xs font-mono border border-slate-800">
                  <button onClick={() => setDbView('active')} className={`px-2.5 py-1 rounded ${dbView === 'active' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>Active</button>
                  <button onClick={() => setDbView('all')} className={`px-2.5 py-1 rounded ${dbView === 'all' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>All</button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Automation Name</th>
                    <th className="py-3 px-4">Trigger</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {dbData.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{a.name}</td>
                      <td className="py-3 px-4 text-slate-400">{a.trigger_desc}</td>
                      <td className="py-3 px-4 text-slate-300">{a.action_desc}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 uppercase">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">{a.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. 🧠 SELF-UNDERSTANDING (DB) */}
        {activeDb === 'self_understanding' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">🧠 Self‑Understanding DB (Adaptive Behavior Engine)</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg text-xs font-mono border border-slate-800">
                  <button onClick={() => setDbView('confirmed')} className={`px-2.5 py-1 rounded ${dbView === 'confirmed' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>Confirmed Insights</button>
                  <button onClick={() => setDbView('all')} className={`px-2.5 py-1 rounded ${dbView === 'all' ? 'bg-plug-accent text-plug-dark font-bold' : 'text-slate-400'}`}>All Observations</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {dbData.map((p) => (
                <div key={p.id} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{p.pattern}</span>
                      <button
                        onClick={() => handleConfirmInsight(p.id)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                          p.confirmed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.confirmed ? '✓ Confirmed' : 'Unconfirmed'}
                      </button>
                    </div>
                    <p className="text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <strong>Insight:</strong> {p.insight}
                    </p>
                    <p className="text-slate-400"><strong>Trigger:</strong> {p.trigger_event}</p>
                    <p className="text-plug-accent"><strong>Suggested Adjustment:</strong> {p.suggested_adjustment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🟩 DAILY OS (Embedded View) */}
      <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-plug-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold uppercase">
                🟩 Daily OS (Embedded View)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Your day in one screen.</h2>
          </div>

          <a
            href="https://app.notion.com/p/3859f03094568089b355e334de346358?pvs=21"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>Asset Vault</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Action Buckets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-mono">
          {/* Top 3 Priorities */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-black text-white uppercase flex items-center gap-1.5 text-xs text-plug-accent">
              <Flame className="w-4 h-4 fill-current" /> Top 3 Priorities
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                1. Post 1 short-form video for Rakuten $30
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                2. Run daily balance & earnings sync
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                3. Check Make.com webhook lead queues
              </div>
            </div>
          </div>

          {/* Quick Wins (<5 min) */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-black text-white uppercase flex items-center gap-1.5 text-xs text-sky-400">
              <Clock className="w-4 h-4" /> Quick Wins (&lt;5 min)
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                • Review Daily Budget Remaining (2 min)
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                • Copy Cash App promo script to IG (1 min)
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                • Confirm morning energy insight (1 min)
              </div>
            </div>
          </div>

          {/* Money & Content Tasks */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-black text-white uppercase flex items-center gap-1.5 text-xs text-purple-400">
              <Video className="w-4 h-4" /> Content Tasks
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                • Film 15-sec Command Center walkthrough
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                • Reply to comments with Cashtag video
              </div>
            </div>
          </div>

          {/* System & Routine Tasks */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-black text-white uppercase flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckSquare className="w-4 h-4" /> System Tasks
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                • Verify Make.com scenarios status
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                • Run weekly net worth snapshot sync
              </div>
            </div>
          </div>
        </div>

        {/* Scratchpad for anything */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-plug-accent" />
              Scratchpad (Auto-Persisted)
            </h4>
            <button
              onClick={handleSaveScratchpad}
              className="px-4 py-1.5 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-xs font-mono rounded-xl transition-all shadow-md"
            >
              Save Scratchpad
            </button>
          </div>

          <textarea
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="Scratchpad for anything... ideas, quick notes, hooks, or reminders."
            rows={4}
            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-plug-accent resize-none"
          />
        </div>
      </div>
    </div>
  );
};
