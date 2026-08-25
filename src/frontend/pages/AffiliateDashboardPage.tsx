import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Link as LinkIcon, Copy, Check, DollarSign, Users, Repeat, 
  TrendingUp, Video, CheckCircle, Plus, Sparkles, HelpCircle, 
  Zap, Calendar, ShieldCheck, ArrowUpRight, Edit2, CheckSquare 
} from 'lucide-react';

export const AffiliateDashboardPage: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // New Payout Modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [logWeek, setLogWeek] = useState('Week of ' + new Date().toLocaleDateString());
  const [logClicks, setLogClicks] = useState('0');
  const [logActivations, setLogActivations] = useState('0');
  const [logEarnings, setLogEarnings] = useState('0.00');
  const [logStatus, setLogStatus] = useState('Pending');
  const [logDate, setLogDate] = useState('-');

  const fetchDashboard = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/affiliate/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setLinkInput(json.data.affiliateLink);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/affiliate/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ link: linkInput }),
      });
      if (res.ok) {
        setToast('✅ Stan Affiliate Link saved successfully!');
        setIsEditingLink(false);
        await fetchDashboard();
        setTimeout(() => setToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTargetProgress = async (platform: 'tiktok' | 'ig' | 'yt', delta: number) => {
    if (!token) return;
    try {
      const res = await fetch('/api/affiliate/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform, delta }),
      });
      if (res.ok) {
        await fetchDashboard();
        await refreshUser();
        setToast(`🎯 Output progress logged! (+25 XP)`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPayoutLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const earningsCents = Math.round(parseFloat(logEarnings || '0') * 100);
      const res = await fetch('/api/affiliate/payout-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          week_label: logWeek,
          clicks: parseInt(logClicks || '0', 10),
          activations: parseInt(logActivations || '0', 10),
          earnings_cents: earningsCents,
          status: logStatus,
          payout_date: logDate,
        }),
      });
      if (res.ok) {
        setToast('🧾 Payout log entry recorded.');
        setShowLogModal(false);
        await fetchDashboard();
        setTimeout(() => setToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatUsd = (cents: number = 0) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const postPrompts = [
    {
      title: "“If you’re broke, start here”",
      desc: "Show the dashboard + 1 money rule",
      script: "If you're tired of being broke, start here. Stop guessing your numbers. Plug-In OS automates your net worth, calculates your debt payoff date, and gives you cash bonuses. Comment 'OS' and I'll send you the exact blueprint."
    },
    {
      title: "“My $0 → $100/week referral system”",
      desc: "Explain link + simple steps",
      script: "Here is how I make an extra $100/week using simple referral loops. Step 1: Open Plug-In OS. Step 2: Grab the verified cashback apps. Step 3: Share your smart link. Link is in my bio to get started today."
    },
    {
      title: "“3 apps paying me this week”",
      desc: "Tease + CTA in comments",
      script: "3 apps that literally pay me cash every single week for stuff I already buy: gas, groceries, and shopping rebates. I have the entire stack mapped inside my Plug-In OS. Comment 'STACK' and I'll DM it over."
    },
    {
      title: "“Budget hack that changed everything”",
      desc: "Show 1 win + plug the OS",
      script: "This one budget control rule inside Plug-In OS saved me $450 in 30 days without feeling restricted. It tracks remaining balance in real time. Link in bio to duplicate this system."
    },
    {
      title: "“This is how I automate my money moves”",
      desc: "15 sec walkthrough + CTA",
      script: "This is how I automate all my finances in under 15 seconds a day. Balances sync, referral earnings track, and daily insights generate automatically. Grab the Plug-In OS at the link in my bio."
    }
  ];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-plug-accent"></div>
      </div>
    );
  }

  const stats = data?.stats || { totalEarningsCents: 0, activations: 0, clicks: 0, conversionRate: '0%' };
  const targets = data?.weeklyTargets || {
    tiktok: { target: 5, completed: 0 },
    igReels: { target: 3, completed: 0 },
    youtubeShorts: { target: 2, completed: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0 fill-current" />
          <span>{toast}</span>
        </div>
      )}

      {/* 🟩 TOP HEADER */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-2">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold uppercase tracking-wider">
            🟩 Top Header
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
            Affiliate Engine Active
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Plug‑In OS Affiliate Dashboard
        </h1>
        <p className="text-base sm:text-lg text-slate-300 font-semibold">
          Automate your earnings. Share your link. Get paid.
        </p>
      </div>

      {/* 🟦 SECTION 1 — Your Affiliate Link */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase">
            🟦 Section 1
          </span>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            🔗 Your Affiliate Link
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300">
          Copy your link below and share it anywhere — TikTok, IG, YouTube, Reddit, DMs, comments, stories, or your bio.
        </p>

        {/* Notion Callout Box */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">🔗</span>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                  Stan Store Affiliate Destination Link:
                </span>
                <div className="text-sm sm:text-base font-mono font-bold text-plug-accent break-all">
                  {data?.affiliateLink || `https://stan.store/moneyplughub/p/plugin-os?aff=${user?.referral_code}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(data?.affiliateLink, 'aff_link')}
                className="px-4 py-2.5 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                {copiedKey === 'aff_link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedKey === 'aff_link' ? 'Copied Link!' : 'Copy Affiliate Link'}
              </button>

              <button
                onClick={() => setIsEditingLink(!isEditingLink)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Edit Link"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isEditingLink && (
            <form onSubmit={handleSaveLink} className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste your custom Stan affiliate link here..."
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-plug-accent"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Save Link
              </button>
            </form>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-plug-accent shrink-0" />
          <span>
            <strong>Note:</strong> Every time someone activates their Plug‑In OS using your link, you earn a commission automatically.
          </span>
        </div>
      </div>

      {/* 🟩 SECTION 2 — Stats / Earnings */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase">
              🟩 Section 2
            </span>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              📊 Your Stats
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Live Commission & Telemetry Tracking</span>
        </div>

        {/* 4 Notion-Style Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Earnings */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">Total Earnings</span>
            </div>
            <div className="text-3xl font-black text-plug-accent font-mono">
              {formatUsd(stats.totalEarningsCents)}
            </div>
          </div>

          {/* 2. Activations */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">Activations</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {stats.activations}
            </div>
          </div>

          {/* 3. Clicks */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔁</span>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">Clicks</span>
            </div>
            <div className="text-3xl font-black text-sky-400 font-mono">
              {stats.clicks}
            </div>
          </div>

          {/* 4. Conversion Rate */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">Conversion Rate</span>
            </div>
            <div className="text-3xl font-black text-purple-400 font-mono">
              {stats.conversionRate}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 font-mono">
          <strong>Update cadence:</strong> Daily (quick check) + Weekly (deep review).
        </div>
      </div>

      {/* 🟪 SECTION 3 — Content Ideas */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-xl space-y-8">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-mono font-bold uppercase">
            🟪 Section 3
          </span>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            🎥 Content Ideas & Output Targets
          </h2>
        </div>

        {/* Post Prompts (Copy + Paste) */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" />
            Post Prompts (Copy + Paste)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {postPrompts.map((prompt, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm">{prompt.title}</span>
                    <button
                      onClick={() => copyToClipboard(prompt.script, `prompt_${idx}`)}
                      className="text-[11px] font-mono text-purple-400 hover:text-white flex items-center gap-1 font-bold"
                    >
                      {copiedKey === `prompt_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === `prompt_${idx}` ? 'Copied Script!' : 'Copy Script'}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-400">{prompt.desc}</p>
                  <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 italic">
                    "{prompt.script}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Output Targets Tracker */}
        <div className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              Weekly Output Targets
            </h3>
            <span className="text-xs font-mono text-slate-500">Track Consistency (+25 XP per logged post)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* TikTok */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm">TikTok</span>
                <span className="text-xs font-mono text-slate-400">Target: {targets.tiktok.target} posts</span>
              </div>
              <div className="text-2xl font-black font-mono text-plug-accent">
                {targets.tiktok.completed} / {targets.tiktok.target}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTargetProgress('tiktok', 1)}
                  className="flex-1 py-1.5 bg-plug-accent/10 hover:bg-plug-accent/20 text-plug-accent font-mono font-bold text-xs rounded-lg transition-colors"
                >
                  + Log Post
                </button>
                <button
                  onClick={() => handleTargetProgress('tiktok', -1)}
                  className="px-2.5 py-1.5 bg-slate-900 text-slate-500 hover:text-white font-mono text-xs rounded-lg transition-colors"
                >
                  -
                </button>
              </div>
            </div>

            {/* IG Reels */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm">IG Reels</span>
                <span className="text-xs font-mono text-slate-400">Target: {targets.igReels.target} posts</span>
              </div>
              <div className="text-2xl font-black font-mono text-pink-400">
                {targets.igReels.completed} / {targets.igReels.target}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTargetProgress('ig', 1)}
                  className="flex-1 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-mono font-bold text-xs rounded-lg transition-colors"
                >
                  + Log Post
                </button>
                <button
                  onClick={() => handleTargetProgress('ig', -1)}
                  className="px-2.5 py-1.5 bg-slate-900 text-slate-500 hover:text-white font-mono text-xs rounded-lg transition-colors"
                >
                  -
                </button>
              </div>
            </div>

            {/* YouTube Shorts */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm">YouTube Shorts</span>
                <span className="text-xs font-mono text-slate-400">Target: {targets.youtubeShorts.target} posts</span>
              </div>
              <div className="text-2xl font-black font-mono text-rose-400">
                {targets.youtubeShorts.completed} / {targets.youtubeShorts.target}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTargetProgress('yt', 1)}
                  className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono font-bold text-xs rounded-lg transition-colors"
                >
                  + Log Post
                </button>
                <button
                  onClick={() => handleTargetProgress('yt', -1)}
                  className="px-2.5 py-1.5 bg-slate-900 text-slate-500 hover:text-white font-mono text-xs rounded-lg transition-colors"
                >
                  -
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🟨 SECTION 4 — Payout Tracker */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono font-bold uppercase">
              🟨 Section 4
            </span>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              💵 Payout Status Tracker
            </h2>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            + Log Weekly Check
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Week</th>
                <th className="py-3 px-4">Clicks</th>
                <th className="py-3 px-4">Activations</th>
                <th className="py-3 px-4">Earnings</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payout Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {data?.payoutLogs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{log.week_label}</td>
                  <td className="py-3 px-4">{log.clicks}</td>
                  <td className="py-3 px-4">{log.activations}</td>
                  <td className="py-3 px-4 font-bold text-plug-accent">{formatUsd(log.earnings_cents)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.status === 'Processing' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">{log.payout_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-400 flex items-center gap-2">
          <span className="text-xl">🧾</span>
          <span>
            <strong>Log rule:</strong> Update this table every Friday after you check Stan.
          </span>
        </div>
      </div>

      {/* 🟥 SECTION 5 — FAQ / Tips */}
      <div className="bg-plug-card border border-plug-border p-8 rounded-3xl shadow-xl space-y-8">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono font-bold uppercase">
            🟥 Section 5
          </span>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            ❓ FAQ & Tips That Boost Earnings
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick FAQ */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-rose-400" />
              Quick FAQ
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white">Where do I put my link?</span>
                <p className="text-slate-400">Bio, pinned comment, story link, link-in-bio, DMs.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white">What do I say in the CTA?</span>
                <p className="text-slate-400">“Comment ‘OS’ and I’ll send it” or “Link in bio”.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white">How do I increase conversions?</span>
                <p className="text-slate-400">Show proof: dashboard, results, simple steps.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white">What’s the simplest pitch?</span>
                <p className="text-slate-400">“I use this OS to automate my money moves.”</p>
              </div>
            </div>
          </div>

          {/* Tips That Boost Earnings */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Tips That Boost Earnings
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="text-base">📌</span>
                <p className="text-slate-300"><strong>Pin your best-performing video for 7 days</strong> to maintain steady inbound traffic.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="text-base">📢</span>
                <p className="text-slate-300"><strong>Use one CTA phrase consistently</strong> across all short-form videos to eliminate cognitive friction.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="text-base">💬</span>
                <p className="text-slate-300"><strong>Reply to comments with short “how-to” videos</strong> to double engagement and funnel clicks.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="text-base">📊</span>
                <p className="text-slate-300"><strong>Track your top 3 traffic sources</strong> in Section 2 to optimize creator distribution.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Weekly Check Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-plug-card border border-plug-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Log Friday Weekly Check</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddPayoutLog} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Week Label</label>
                <input
                  type="text"
                  required
                  value={logWeek}
                  onChange={(e) => setLogWeek(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Clicks</label>
                  <input
                    type="number"
                    value={logClicks}
                    onChange={(e) => setLogClicks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Activations</label>
                  <input
                    type="number"
                    value={logActivations}
                    onChange={(e) => setLogActivations(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Earnings ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={logEarnings}
                    onChange={(e) => setLogEarnings(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={logStatus}
                    onChange={(e) => setLogStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payout Date</label>
                <input
                  type="text"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  placeholder="e.g. 2026-08-25 or -"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold rounded-xl transition-all shadow-md mt-3"
              >
                Record Log Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
