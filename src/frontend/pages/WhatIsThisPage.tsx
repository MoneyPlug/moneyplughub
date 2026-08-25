import React from 'react';
import { 
  DollarSign, Mic, Share2, Sparkles, TrendingUp, 
  ShieldCheck, ArrowRight, Wallet, CheckCircle, Zap
} from 'lucide-react';

interface WhatIsThisPageProps {
  onNavigate?: (tab: string) => void;
}

export const WhatIsThisPage: React.FC<WhatIsThisPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16 space-y-16 font-sans text-slate-200 animate-fadeIn">
      {/* ── Hero ── */}
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Smart Money + AI Voice Co-Pilot
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          What is <span className="text-plug-accent">MoneyPlugHub</span>?
        </h1>
        
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          MoneyPlugHub is a simple, all-in-one financial app that lets you <strong>talk to your money</strong>, track your net worth, and <strong>earn extra income</strong> by sharing your link.
        </p>
      </div>

      {/* ── 3 Main Pillars ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1 */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-emerald-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">1. Track Everything in One Place</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            See your total cash, credit card debt, and net worth update automatically on one clean, simple dashboard. No more messy spreadsheets.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-cyan-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">2. Talk Hands-Free to Your Money</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Just speak or text your AI co-pilot. Say <em>"Move $100 to savings"</em>, <em>"Pay $50 on my credit card"</em>, or <em>"Show my debts"</em> and it happens instantly.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-amber-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">3. Share Your Link & Earn Cash</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Get your own custom invite link. When friends or followers join, you get <strong>$10 cash</strong> plus <strong>20% to 40% monthly recurring commissions</strong>.
          </p>
        </div>
      </div>

      {/* ── Real-Life Example ── */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-white text-center">
          How You Actually Use It
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>Voice Example 1: Moving Money</span>
            </div>
            <p className="text-slate-300 italic">"Send $150 from checking to savings."</p>
            <p className="text-slate-400 text-xs">
              MoneyOS moves the funds, updates your balances in real time, and logs the receipt.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Voice Example 2: Checking Finances</span>
            </div>
            <p className="text-slate-300 italic">"What's my net worth and how much debt do I have left?"</p>
            <p className="text-slate-400 text-xs">
              MoneyOS reads out your exact numbers and tells you which card to pay off next.
            </p>
          </div>
        </div>
      </div>

      {/* ── Key Benefits Checklist ── */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-white text-center mb-6">Why Creators & Everyday Users Love It</h3>
        <div className="space-y-3">
          {[
            '100% Free to get started — no credit card required',
            'Works on your phone, laptop, or tablet in any browser',
            'Hands-free voice assistant powered by natural AI speech',
            'Earn $10 instant cash for every creator or friend you refer',
            'Secure local database keeps your financial information private'
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-slate-200">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Call to Action ── */}
      <div className="text-center pt-6">
        <button
          onClick={() => onNavigate?.('overview')}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-plug-accent hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm transition-all shadow-xl hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Open My Command Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
