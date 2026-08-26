import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, DollarSign, Users, ArrowRight, CheckCircle2, 
  TrendingUp, Sparkles, ChevronRight, Lock, Clock, Mic, Bot, 
  PieChart, Target, CreditCard, Landmark, BarChart3, Globe, 
  Play, Star, Award, Gift, Sparkle
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  // Referral & Investing Comparison Calculator State
  const [referralsPerMonth, setReferralsPerMonth] = useState<number>(35);
  const [avgCommissionUsd, setAvgCommissionUsd] = useState<number>(15);
  const [reinvestPercent, setReinvestPercent] = useState<number>(50);
  const [marketYieldRate, setMarketYieldRate] = useState<number>(8);
  const [timeHorizonYears, setTimeHorizonYears] = useState<number>(3);

  // 2026 AI-Enhanced Personalized Landing Page State
  const [invitedByCreator, setInvitedByCreator] = useState<any>(null);
  const [refCode, setRefCode] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('ref') || '';
    if (!code) {
      const match = document.cookie.match(/(?:^|;\s*)ref=([^;]+)/);
      if (match) code = decodeURIComponent(match[1]);
    }

    if (code) {
      setRefCode(code);
      fetch(`/api/referrals/creator-card/${encodeURIComponent(code)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.success && data?.data) {
            setInvitedByCreator(data.data);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Computed Financial Metrics
  const monthlyReferralIncome = referralsPerMonth * avgCommissionUsd;
  const annualReferralIncome = monthlyReferralIncome * 12;
  const requiredStockPortfolio = Math.round(annualReferralIncome / (marketYieldRate / 100));
  const monthlyReinvested = monthlyReferralIncome * (reinvestPercent / 100);
  
  // Compound Growth Model
  const monthlyRate = (marketYieldRate / 100) / 12;
  const totalMonths = timeHorizonYears * 12;
  const futureNetWorth = monthlyReinvested > 0
    ? Math.round(monthlyReinvested * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate))
    : 0;
  const totalContributed = Math.round(monthlyReinvested * totalMonths);
  const interestEarned = Math.max(0, futureNetWorth - totalContributed);

  // Preset Handlers
  const applyPreset = (refs: number, comm: number, reinvest: number) => {
    setReferralsPerMonth(refs);
    setAvgCommissionUsd(comm);
    setReinvestPercent(reinvest);
  };

  return (
    <div className="space-y-24 py-8">
      {/* ═══ 2026 PERSONALIZED REFERRAL HERO BANNER (+19% to +35% Lift) ═══ */}
      {invitedByCreator && (
        <section className="max-w-4xl mx-auto px-4 -mb-12">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-emerald-950/80 border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.25)] backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-fadeIn">
            <div className="flex items-center gap-4 text-left">
              <div className="w-16 h-16 rounded-2xl bg-black/80 border border-cyan-400/50 p-1 shrink-0 overflow-hidden shadow-lg shadow-cyan-500/20">
                <img
                  src={`/api/sigil/${encodeURIComponent(refCode)}?size=128&raw=true`}
                  alt="Referrer Sigil Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1 font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
                    VIP CREATOR INVITATION
                  </span>
                  <span className="text-[10px] text-slate-400">Lv. {invitedByCreator.level}</span>
                </div>
                <h2 className="text-lg font-black text-white">
                  Invited by <span className="text-cyan-400">{invitedByCreator.display_name}</span>
                </h2>
                <p className="text-xs text-emerald-300 flex items-center gap-1 font-bold">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Exclusive: +350 Starter XP & 10% Cash Yield Boost Activated</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer hover:scale-105 shrink-0"
            >
              <span>Claim VIP Pass</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ═══ HERO: Creator Money OS ═══ */}
      <section className="relative text-center max-w-5xl mx-auto px-4 pt-12 pb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-plug-accent/10 border border-plug-accent/30 text-plug-accent text-xs font-semibold uppercase tracking-wider mb-6 glow-accent">
          <Sparkles className="w-3.5 h-3.5" />
          Creator Money OS — Your Financial Operating System
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none">
          Content → Clicks → Referrals → <br />
          <span className="text-gradient">Payouts → Net Worth</span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The all-in-one financial operating system that turns your audience into{' '}
          <span className="font-bold text-plug-accent">recurring revenue</span>.
          Track earnings, eliminate debt, grow your net worth — with an AI voice assistant that does it all for you.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('register')}
            className="w-full sm:w-auto px-8 py-4 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-base rounded-xl transition-all shadow-xl shadow-plug-accent/25 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            Start Free — No Credit Card
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('pricing')}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            View Plans & Pricing
          </button>
        </div>

        {/* Trust Metrics */}
        <div className="mt-12 pt-8 border-t border-plug-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-400">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white">$10.00</span>
            <span>Per Referral</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-plug-accent">25+</span>
            <span>Partner Programs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-sky-400">AI Voice</span>
            <span>Powered by ElevenLabs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-indigo-400">Real-Time</span>
            <span>Financial Dashboard</span>
          </div>
        </div>
      </section>

      {/* ═══ THE CREATOR MONEY FLOW ═══ */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            The Creator Money Flow
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Five steps from content to compound wealth. Each step is tracked, automated, and optimized by MoneyOS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '01', icon: <Play className="w-5 h-5" />, title: 'Create Content', desc: 'Post on any platform — YouTube, TikTok, X, Instagram, blogs.', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { step: '02', icon: <Globe className="w-5 h-5" />, title: 'Share Links', desc: 'Drop your unique referral links in descriptions, bios, and DMs.', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
            { step: '03', icon: <Users className="w-5 h-5" />, title: 'Earn Referrals', desc: 'Every signup locks to your profile. $10 commission per referral.', color: 'text-plug-accent', bg: 'bg-plug-accent/10', border: 'border-plug-accent/20' },
            { step: '04', icon: <DollarSign className="w-5 h-5" />, title: 'Collect Payouts', desc: 'Commissions tracked in your ACID ledger. Transparent, auditable.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { step: '05', icon: <TrendingUp className="w-5 h-5" />, title: 'Grow Net Worth', desc: 'Budget, invest, and watch your Living Vault evolve in real-time.', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          ].map((item) => (
            <div key={item.step} className={`bg-plug-card border ${item.border} rounded-2xl p-5 relative group hover:border-plug-accent/40 transition-all text-center`}>
              <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center ${item.color} mx-auto mb-3`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold ${item.color} uppercase tracking-widest`}>Step {item.step}</span>
              <h3 className="text-sm font-bold text-white mt-1">{item.title}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MONEYOS AI SHOWCASE ═══ */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900/80 via-indigo-950/30 to-slate-900/80 border border-indigo-500/20 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-4">
                <Mic className="w-4 h-4" />
                AI Voice Assistant
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Meet MoneyOS — Your Financial Co-Pilot
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                A real-time voice AI that doesn't just answer questions — it <strong className="text-white">executes commands</strong>. 
                Talk naturally, interrupt anytime, and let MoneyOS handle your finances.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { icon: <Mic className="w-4 h-4" />, text: '"Send $200 from savings to checking" — executed instantly' },
                  { icon: <Bot className="w-4 h-4" />, text: '"Take me to my net worth" — navigates you there' },
                  { icon: <CreditCard className="w-4 h-4" />, text: '"Pay $150 on my credit card" — debt payment recorded' },
                  { icon: <Target className="w-4 h-4" />, text: '"Set food budget to $500" — budget enforced' },
                  { icon: <Sparkles className="w-4 h-4" />, text: '"Tell me a joke" — it responds to anything' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="text-plug-accent shrink-0">{item.icon}</div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('moneyos')}
                className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                Try MoneyOS Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Voice State Visualization */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 border-b border-slate-800 pb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono">MoneyOS v5.0 — Live Conversation</span>
              </div>
              
              {/* Simulated Chat */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-[10px]">🎙️</span>
                  </div>
                  <div className="bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 max-w-[80%]">
                    "How much am I worth?"
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-indigo-200 max-w-[85%]">
                    Your total net worth is <strong>$9,750.00</strong>. That includes $6,500 in checking, $3,500 in savings, and $1,650 in crypto. Your savings rate is 35%. 📈
                  </div>
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-[10px]">🎙️</span>
                  </div>
                  <div className="bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 max-w-[80%]">
                    "Take me to my budget"
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-200 max-w-[85%]">
                    Navigating you to <strong>Budget Control</strong> now! 🚀
                  </div>
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Voice Bars */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                <div className="flex gap-0.5 items-end h-5">
                  {[3, 5, 4, 6, 3, 5, 4, 6, 3, 5, 4, 3].map((h, i) => (
                    <div key={i} className="w-1 bg-indigo-400 rounded-full animate-pulse" style={{ height: `${h * 3}px`, animationDelay: `${i * 80}ms` }} />
                  ))}
                </div>
                <span className="text-[10px] text-indigo-400 font-mono ml-2">Premium AI Voice — ElevenLabs eleven_v3</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT'S UNDER THE HOOD ═══ */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Everything You Need to Build Wealth
          </h2>
          <p className="text-sm text-slate-400 mt-2">Powered invisibly by the Plug In OS v5 AI engine.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <DollarSign className="w-5 h-5" />, title: '25+ Referral Programs', desc: 'Cash App, Webull, Robinhood, Rakuten, Fetch, and more. Pre-verified links.', color: 'text-emerald-400' },
            { icon: <PieChart className="w-5 h-5" />, title: 'Smart Budget Control', desc: '50/30/20 rule enforcement with category limits and monthly spend tracking.', color: 'text-sky-400' },
            { icon: <CreditCard className="w-5 h-5" />, title: 'Debt Eliminator', desc: 'Avalanche & snowball strategies. See your debt-free date and interest saved.', color: 'text-rose-400' },
            { icon: <Target className="w-5 h-5" />, title: 'Savings Goals', desc: 'Set milestones. Track progress with velocity meters and target dates.', color: 'text-amber-400' },
            { icon: <BarChart3 className="w-5 h-5" />, title: 'Net Worth Tracker', desc: 'Real-time portfolio across bank, HYSA, crypto, and real estate assets.', color: 'text-indigo-400' },
            { icon: <Landmark className="w-5 h-5" />, title: 'Living Vault™', desc: 'A breathing visual canvas that evolves with your revenue. 4 tiers, 5 palettes.', color: 'text-purple-400' },
            { icon: <Bot className="w-5 h-5" />, title: '12 AI Modules', desc: 'VisionCore, PulseWave, SignalCore, Osmium — orchestrated swarm intelligence.', color: 'text-cyan-400' },
            { icon: <Award className="w-5 h-5" />, title: 'Quests & XP', desc: 'Gamified financial milestones. Earn points, climb leaderboards, unlock badges.', color: 'text-yellow-400' },
            { icon: <Lock className="w-5 h-5" />, title: 'Bank-Grade Security', desc: 'bcrypt hashing, JWT auth, ACID transactions, SQLite WAL journaling.', color: 'text-slate-300' },
          ].map((item, i) => (
            <div key={i} className="bg-plug-card border border-plug-border rounded-2xl p-5 group hover:border-plug-accent/40 transition-all">
              <div className={`${item.color} mb-3`}>{item.icon}</div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ DUAL COMPARISON SIMULATOR: REFERRALS VS. TRADITIONAL INVESTING ═══ */}
      <section id="calculator" className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-10">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-plug-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-plug-accent/15 border border-plug-accent/30 text-plug-accent text-xs font-mono font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              Creator Yield Multiplier Simulator
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Referral Cashflow vs. <span className="text-gradient">Stock Market Investing</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              See how much capital you would need in traditional stocks, real estate, or high-yield bonds to match the cashflow of your MoneyPlugHub referral links.
            </p>

            {/* Scenario Quick Presets */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
              <span className="text-slate-500 text-[11px] mr-1">Quick Presets:</span>
              <button
                onClick={() => applyPreset(15, 15, 50)}
                className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  referralsPerMonth === 15 ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🥉 Side Hustle (15 Refs)
              </button>
              <button
                onClick={() => applyPreset(45, 20, 50)}
                className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  referralsPerMonth === 45 ? 'bg-plug-accent/20 border-plug-accent text-plug-accent font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🥈 Active Creator (45 Refs)
              </button>
              <button
                onClick={() => applyPreset(120, 25, 60)}
                className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  referralsPerMonth === 120 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🥇 Viral Powerhouse (120 Refs)
              </button>
            </div>
          </div>

          {/* Interactive Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Slider 1: Monthly Referrals */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-plug-accent" /> Monthly Referrals Generated:
                </span>
                <span className="text-plug-accent font-mono font-black text-sm bg-plug-accent/10 px-2.5 py-0.5 rounded-md border border-plug-accent/20">
                  {referralsPerMonth} signups/mo
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={referralsPerMonth}
                onChange={(e) => setReferralsPerMonth(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-plug-accent"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>1 / mo (Starter)</span>
                <span>100 / mo (Pro)</span>
                <span>200 / mo (Scale)</span>
              </div>
            </div>

            {/* Slider 2: Average Commission */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Avg. Commission Per Referral:
                </span>
                <span className="text-emerald-400 font-mono font-black text-sm bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  ${avgCommissionUsd}.00 USD
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={avgCommissionUsd}
                onChange={(e) => setAvgCommissionUsd(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>$10 (Single app)</span>
                <span>$25 (Plug-In OS)</span>
                <span>$50 (Crypto/Brokerage)</span>
              </div>
            </div>

            {/* Slider 3: Reinvestment Rate */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-sky-400" /> Reinvested Into Wealth Vault:
                </span>
                <span className="text-sky-400 font-mono font-black text-sm bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20">
                  {reinvestPercent}% (${Math.round(monthlyReinvested)}/mo)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={reinvestPercent}
                onChange={(e) => setReinvestPercent(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0% (100% Cash Pocket)</span>
                <span>50% (Balanced)</span>
                <span>100% (Maximum Wealth Flywheel)</span>
              </div>
            </div>

            {/* Slider 4: Traditional Market Return Benchmark */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-purple-400" /> Market Return Benchmark:
                </span>
                <span className="text-purple-400 font-mono font-black text-sm bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/20">
                  {marketYieldRate}% Annual Yield
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="1"
                value={marketYieldRate}
                onChange={(e) => setMarketYieldRate(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>4% (Safe Withdrawal)</span>
                <span>8% (S&P 500 Average)</span>
                <span>12% (Aggressive Portfolio)</span>
              </div>
            </div>
          </div>

          {/* Time Horizon Selector Pills */}
          <div className="flex items-center justify-center gap-2 font-mono text-xs relative z-10">
            <span className="text-slate-500 text-[11px] mr-2">Compounding Horizon:</span>
            {[1, 3, 5, 10].map(y => (
              <button
                key={y}
                onClick={() => setTimeHorizonYears(y)}
                className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  timeHorizonYears === y
                    ? 'bg-gradient-to-r from-plug-accent to-emerald-400 text-slate-950 font-black border-transparent shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {y} {y === 1 ? 'Year' : 'Years'}
              </button>
            ))}
          </div>

          {/* Live Side-by-Side Comparison Outcome Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Card 1: Creator Referral Engine */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-plug-accent/40 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-plug-accent/20 text-plug-accent border border-plug-accent/30">
                    ⚡ Creator Referral Engine
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">$0 Capital Risk</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-mono">Monthly Cashflow</span>
                  <div className="text-3xl font-black text-plug-accent font-mono tracking-tight">
                    ${monthlyReferralIncome.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-normal">/ mo</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                    ${annualReferralIncome.toLocaleString()} / year recurring ARR
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Upfront Capital:</span>
                    <strong className="text-emerald-400">$0.00 Out-of-Pocket</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time to Cashflow:</span>
                    <strong className="text-white">1–7 Days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Profit Margin:</span>
                    <strong className="text-plug-accent">100% Pure Revenue</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('register')}
                className="w-full py-2.5 bg-plug-accent hover:bg-plug-accentHover text-slate-950 font-black font-mono text-xs rounded-xl transition-all shadow-md shadow-plug-accent/20 cursor-pointer"
              >
                Launch Your Referral Hub →
              </button>
            </div>

            {/* Card 2: Traditional Stock Portfolio Equivalent */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    📈 Traditional Stock Market
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">Requires High Capital</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-mono">Required Portfolio Size</span>
                  <div className="text-3xl font-black text-white font-mono tracking-tight">
                    ${requiredStockPortfolio.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                    Needed to generate ${monthlyReferralIncome.toLocaleString()}/mo at {marketYieldRate}% yield
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Upfront Capital:</span>
                    <strong className="text-rose-400">${requiredStockPortfolio.toLocaleString()} Cash</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time to Save:</span>
                    <strong className="text-amber-300">5 to 12+ Years</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Market Risk:</span>
                    <strong className="text-slate-400">Drawdowns & Volatility</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono text-center">
                Generating <strong className="text-white">${monthlyReferralIncome}/mo</strong> in referrals gives you the power of a <strong className="text-plug-accent">${requiredStockPortfolio.toLocaleString()}</strong> investment fund on Day 1.
              </div>
            </div>

            {/* Card 3: The Compounded Net Worth Machine */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    🚀 {timeHorizonYears}-Year Compounded Vault
                  </span>
                  <span className="text-[10px] font-mono text-plug-accent font-bold">Referral + Invest</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-mono">Projected Net Worth</span>
                  <div className="text-3xl font-black text-indigo-300 font-mono tracking-tight">
                    ${futureNetWorth.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono block mt-0.5">
                    +${interestEarned.toLocaleString()} in pure compound yield
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Reinvested:</span>
                    <strong className="text-sky-400">${Math.round(monthlyReinvested)}/mo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cash in Pocket:</span>
                    <strong className="text-emerald-400">${Math.round(monthlyReferralIncome - monthlyReinvested)}/mo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Living Vault Growth:</span>
                    <strong className="text-purple-300">Tier 3 (Supercritical)</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('pricing')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Upgrade to Creator Money OS →
              </button>
            </div>
          </div>

          {/* Golden Bottom Takeaway Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-plug-accent/10 to-indigo-500/10 border border-plug-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-300 relative z-10">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="leading-relaxed">
                <strong className="text-white">The Creator Leverage Formula:</strong> Generating <strong className="text-plug-accent">${monthlyReferralIncome.toLocaleString()}/mo</strong> from referral links produces the exact same monthly cashflow as holding <strong className="text-amber-300">${requiredStockPortfolio.toLocaleString()}</strong> in traditional index funds — without risking a single dollar of capital.
              </p>
            </div>
            <button
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 rounded-xl bg-plug-accent hover:bg-plug-accentHover text-slate-950 font-black shrink-0 transition-all shadow-md shadow-plug-accent/20 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF / TRUST ═══ */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 text-xs font-semibold mb-4">
                <ShieldCheck className="w-4 h-4" />
                Audited & Transparent
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Real Money. Real Ledger. Zero Gimmicks.
              </h2>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Creator Money OS runs on ACID-compliant SQLite with complete audit trails. Every referral, every commission, every transaction is permanently recorded and verifiable.
              </p>

              <div className="mt-6 space-y-3 text-xs text-slate-300">
                {[
                  'Permanent WAL journal — zero lost referrals or transactions.',
                  'Admin audit portal for approving and tracking payout batches.',
                  'Cryptographic password hashing (bcrypt) and signed JWT auth.',
                  'Real-time net worth calculations across all linked accounts.',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-plug-accent shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-plug-card border border-plug-border rounded-2xl p-6 space-y-4 font-mono text-xs shadow-xl">
              <div className="text-slate-400 border-b border-plug-border pb-2 flex items-center justify-between">
                <span>// CREATOR PAYOUT RECORD</span>
                <span className="text-emerald-400">STATUS: PAID ✓</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div><span className="text-slate-500">tx_id:</span> comm_892348a</div>
                <div><span className="text-slate-500">creator:</span> @shane_official</div>
                <div><span className="text-slate-500">source:</span> YouTube Bio Link</div>
                <div><span className="text-slate-500">referrals:</span> 47 signups</div>
                <div><span className="text-slate-500">commission:</span> <span className="text-plug-accent font-bold">$470.00 USD</span></div>
                <div><span className="text-slate-500">persistence:</span> durable_disk_sync</div>
                <div><span className="text-slate-500">paid_at:</span> 2026-08-15T09:30:00Z</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING CTA ═══ */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-br from-plug-accent/5 via-slate-900 to-indigo-950/20 border border-plug-accent/20 rounded-3xl p-8 sm:p-10 text-center">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">Choose Your Plan</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Start free. Upgrade when you're ready to scale.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Free Lite', price: '$0', desc: 'Get started' },
              { name: 'Creator', price: '$29/mo', desc: 'Most popular', highlight: true },
              { name: 'Pro', price: '$149/mo', desc: 'Scale up' },
              { name: 'Enterprise', price: '$499+', desc: 'Custom' },
            ].map((tier, i) => (
              <button
                key={i}
                onClick={() => onNavigate('pricing')}
                className={`p-4 rounded-xl border transition-all text-left ${tier.highlight 
                  ? 'bg-plug-accent/10 border-plug-accent/50 hover:border-plug-accent shadow-lg shadow-plug-accent/10' 
                  : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{tier.desc}</div>
                <div className={`text-lg font-black mt-0.5 ${tier.highlight ? 'text-plug-accent' : 'text-white'}`}>{tier.price}</div>
                <div className="text-xs text-slate-300 font-medium">{tier.name}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => onNavigate('pricing')}
            className="mt-6 px-6 py-3 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-bold text-sm rounded-xl transition-all inline-flex items-center gap-2"
          >
            Compare All Plans
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-tr from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-plug-accent/30 rounded-3xl p-10 sm:p-16 glow-accent">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Your Content Deserves a Financial OS
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mt-3">
            Join Creator Money OS today. Turn your audience into revenue, your revenue into savings, and your savings into generational wealth.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-4 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-base rounded-xl transition-all shadow-xl shadow-plug-accent/25 hover:scale-105 flex items-center justify-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Sign In to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
