import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, Sparkles, Calendar, Zap, 
  Users, Layers, Award, ArrowUpRight, CheckCircle2, Sliders, RefreshCw, 
  Building, PieChart, ShieldCheck, Scale, Infinity as InfinityIcon, Landmark 
} from 'lucide-react';

export const ReferralEarningsSlider: React.FC = () => {
  // Slider states
  const [monthlyInvites, setMonthlyInvites] = useState<number>(15);
  const [activePrograms, setActivePrograms] = useState<number>(4);
  const [avgPayoutPerOffer, setAvgPayoutPerOffer] = useState<number>(25);
  const [monthsDuration, setMonthsDuration] = useState<number>(6);
  const [viralBoostEnabled, setViralBoostEnabled] = useState<boolean>(true);

  // Viral cascade multiplier (15% secondary boost from friends who share)
  const viralMultiplier = viralBoostEnabled ? 1.15 : 1.0;

  // Monthly base run-rate
  const monthlyEarnings = Math.round(monthlyInvites * activePrograms * avgPayoutPerOffer * viralMultiplier);
  const totalProjectedEarnings = Math.round(monthlyEarnings * monthsDuration);
  const dailyEarnings = Math.round((monthlyEarnings / 30) * 100) / 100;
  const annualRunRate = Math.round(monthlyEarnings * 12);

  // Investment Yield Capital Equivalents (Opportunity Cost Comparison)
  const dividendPortfolioRequired = Math.round(annualRunRate / 0.04); // 4% Rule / Dividend Yield
  const hysaCapitalRequired = Math.round(annualRunRate / 0.05);       // 5% High Yield Treasury
  const realEstateValueRequired = Math.round(annualRunRate / 0.06);   // 6% Net Real Estate Cap Rate

  // Timeline progression points
  const milestones = [
    { label: 'Month 1', months: 1, amount: monthlyEarnings },
    { label: 'Month 3', months: 3, amount: monthlyEarnings * 3 },
    { label: 'Month 6', months: 6, amount: monthlyEarnings * 6 },
    { label: '1 Year (M12)', months: 12, amount: monthlyEarnings * 12 },
    { label: '2 Years (M24)', months: 24, amount: monthlyEarnings * 24 },
  ];

  const maxMilestoneAmount = milestones[milestones.length - 1].amount || 1;

  // Quick Preset Handlers
  const applyPreset = (invites: number, progs: number, payout: number, months: number) => {
    setMonthlyInvites(invites);
    setActivePrograms(progs);
    setAvgPayoutPerOffer(payout);
    setMonthsDuration(months);
  };

  return (
    <div className="bg-plug-card border border-plug-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-plug-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-plug-border/80 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Earnings & Yield Simulator
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
              Investment Equivalent Model
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Referral Revenue & Capital Yield Simulator
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            Simulate monthly cashflow growth and discover how referral commission velocity replicates traditional investment returns without capital risk.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase font-bold mr-1">Presets:</span>
          <button
            onClick={() => applyPreset(5, 2, 20, 3)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-all"
          >
            ☕ Casual (5/mo)
          </button>
          <button
            onClick={() => applyPreset(25, 5, 25, 6)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-all"
          >
            📱 Creator (25/mo)
          </button>
          <button
            onClick={() => applyPreset(75, 8, 30, 12)}
            className="px-3 py-1.5 rounded-xl bg-plug-accent/10 hover:bg-plug-accent/20 border border-plug-accent/40 text-plug-accent text-xs font-mono font-bold transition-all"
          >
            🚀 Super Plug (75/mo)
          </button>
        </div>
      </div>

      {/* Main Interactive Grid: Sliders vs Live Output Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Sliders & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Slider 1: Monthly Invites */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-plug-accent" />
                Monthly Qualified Referrals / Sign-ups:
              </label>
              <span className="text-lg font-black text-plug-accent font-mono">
                {monthlyInvites} <span className="text-xs text-slate-400 font-normal">people/mo</span>
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={150}
              step={1}
              value={monthlyInvites}
              onChange={(e) => setMonthlyInvites(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-plug-accent"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1 (Personal friends)</span>
              <span>25 (Active social bio)</span>
              <span>75 (Content creator)</span>
              <span>150+ (Viral funnels)</span>
            </div>
          </div>

          {/* Slider 2: Active Programs Promoted */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Active Programs in Your Stack:
              </label>
              <span className="text-lg font-black text-sky-400 font-mono">
                {activePrograms} <span className="text-xs text-slate-400 font-normal">of 25 offers</span>
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={activePrograms}
              onChange={(e) => setActivePrograms(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1 (Single link)</span>
              <span>4 (Starter bundle)</span>
              <span>8 (Finance stack)</span>
              <span>15 (Full catalog)</span>
            </div>
          </div>

          {/* Slider 3: Average Payout per Referral */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Estimated Average Payout per Offer:
              </label>
              <span className="text-lg font-black text-emerald-400 font-mono">
                ${avgPayoutPerOffer}.00 <span className="text-xs text-slate-400 font-normal">avg commission</span>
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={avgPayoutPerOffer}
              onChange={(e) => setAvgPayoutPerOffer(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>$5 (Micro tasks)</span>
              <span>$15 (Cash App/Upside)</span>
              <span>$30 (Rakuten bonus)</span>
              <span>$50+ (Brokerages/SaaS)</span>
            </div>
          </div>

          {/* Time Horizon Selector & Viral Multiplier Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Timeframe selector */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <label className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Time Horizon:
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                {[
                  { label: '1M', val: 1 },
                  { label: '3M', val: 3 },
                  { label: '6M', val: 6 },
                  { label: '12M', val: 12 },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setMonthsDuration(t.val)}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      monthsDuration === t.val
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Viral cascade multiplier toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Viral Cascade (+15%):
                </label>
                <button
                  onClick={() => setViralBoostEnabled(!viralBoostEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    viralBoostEnabled ? 'bg-plug-accent' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                      viralBoostEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] font-mono text-slate-500 leading-tight">
                Simulates secondary commission flows as invited users share programs with their own networks.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Projection Metric Cards & Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Main Total Callout Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-plug-card border-2 border-plug-accent shadow-2xl shadow-plug-accent/10 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase font-bold flex items-center gap-1">
                <Award className="w-4 h-4 text-plug-accent" /> Total Projected Return ({monthsDuration} {monthsDuration === 1 ? 'Month' : 'Months'})
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-plug-accent/20 text-plug-accent font-bold">
                +{Math.round((viralMultiplier - 1) * 100)}% Cascade
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
                ${totalProjectedEarnings.toLocaleString()}
                <span className="text-xs sm:text-sm font-mono text-slate-400 font-normal">USD</span>
              </div>
              <p className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                ~${monthlyEarnings.toLocaleString()}/mo ongoing run-rate
              </p>
            </div>

            {/* Run-Rate Micro Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">Daily Velocity</span>
                <span className="text-base font-bold text-sky-400">${dailyEarnings.toFixed(2)}/day</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">12-Month Annual</span>
                <span className="text-base font-bold text-plug-accent">${annualRunRate.toLocaleString()}/yr</span>
              </div>
            </div>
          </div>

          {/* Offer Category Payout Highlights */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Sample Breakdown by Category Stack:
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-plug-accent" /> Shopping Cashback (Rakuten, Upside, Fetch)
                </span>
                <span className="font-bold text-white">${Math.round(totalProjectedEarnings * 0.35).toLocaleString()} (35%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> Finance & Stock (Cash App, Webull, Robinhood)
                </span>
                <span className="font-bold text-white">${Math.round(totalProjectedEarnings * 0.40).toLocaleString()} (40%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" /> Crypto & SaaS (Coinbase, Plug-In OS)
                </span>
                <span className="font-bold text-white">${Math.round(totalProjectedEarnings * 0.25).toLocaleString()} (25%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🏛️ SECTION: HOW REFERRAL SYSTEMS MIMIC INVESTING RETURNS (YIELD EQUIVALENTS) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-plug-accent" />
              <h3 className="text-lg sm:text-xl font-black text-white">
                How Referral Systems Mimic Traditional Investing Returns
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Referral architecture replaces upfront monetary capital with automated digital distribution, yielding cashflow equivalent to massive financial portfolios.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1">
            <InfinityIcon className="w-3.5 h-3.5" /> Infinite RoIC (Zero Capital Risk)
          </span>
        </div>

        {/* Capital Portfolio Equivalent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Card 1: Dividend Stock Portfolio */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                <PieChart className="w-4 h-4 text-emerald-400" /> Dividend Stock Equivalent
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">4% Annual Yield</span>
            </div>
            <div className="text-2xl font-black text-white">
              ${dividendPortfolioRequired.toLocaleString()}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Capital required in a traditional S&P / Dividend portfolio to produce your <strong className="text-white">${annualRunRate.toLocaleString()}/yr</strong> (${monthlyEarnings.toLocaleString()}/mo) in passive income.
            </p>
          </div>

          {/* Card 2: Real Estate Rental Property */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                <Building className="w-4 h-4 text-sky-400" /> Real Estate Cap Rate Equivalent
              </span>
              <span className="text-[10px] text-sky-400 font-bold">6% Net Cap Rate</span>
            </div>
            <div className="text-2xl font-black text-white">
              ${realEstateValueRequired.toLocaleString()}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Total debt-free property value needed to match your current referral cashflow, without property taxes, mortgages, or maintenance overhead.
            </p>
          </div>

          {/* Card 3: High-Yield Treasury / Savings */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                <Landmark className="w-4 h-4 text-purple-400" /> High-Yield Cash Equivalent
              </span>
              <span className="text-[10px] text-purple-400 font-bold">5% APY Treasury</span>
            </div>
            <div className="text-2xl font-black text-white">
              ${hysaCapitalRequired.toLocaleString()}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Principal balance needed in a 5% fixed-income treasury or high-yield certificate to match your monthly referral run-rate.
            </p>
          </div>
        </div>

        {/* 4 Theoretical Pillars: Yield Mechanics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <span className="text-plug-accent font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1. Synthetic Dividend Yield
            </span>
            <p className="text-slate-400 text-[11px] leading-snug">
              Every active referral link acts as a productive digital asset generating high-velocity yield on attention and content rather than deployed monetary capital.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <span className="text-sky-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 2. Perpetual Residual Flow
            </span>
            <p className="text-slate-400 text-[11px] leading-snug">
              Lifetime volume rebates (like crypto exchange trading fees or recurring SaaS activations) produce continuous annuity streams with zero ongoing labor.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <span className="text-purple-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 3. Compounding Cascade
            </span>
            <p className="text-slate-400 text-[11px] leading-snug">
              As referred members share programs with friends, viral cascading creates exponential compounding similar to reinvesting stock dividends at compound interest.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 4. Asymmetric Risk Profile
            </span>
            <p className="text-slate-400 text-[11px] leading-snug">
              Traditional markets entail down-market risk to principal. Referral infrastructure has zero capital downside while retaining unlimited upside scale.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Milestone Growth Progression Bar */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-plug-accent" />
            Cumulative Earnings Progression Over Time
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Based on {monthlyInvites} monthly invites across {activePrograms} programs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {milestones.map((m) => {
            const isCurrentSelected = monthsDuration === m.months;
            const pct = Math.min(100, Math.round((m.amount / maxMilestoneAmount) * 100));

            return (
              <div
                key={m.label}
                onClick={() => setMonthsDuration(m.months)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-center space-y-1.5 ${
                  isCurrentSelected
                    ? 'bg-plug-accent/10 border-plug-accent shadow-lg shadow-plug-accent/10 scale-105'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-mono text-slate-400 font-bold">{m.label}</div>
                <div className={`text-base font-black font-mono ${isCurrentSelected ? 'text-plug-accent' : 'text-white'}`}>
                  ${m.amount.toLocaleString()}
                </div>
                {/* Progress Mini Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCurrentSelected ? 'bg-plug-accent' : 'bg-slate-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
