import React from 'react';
import { 
  Sparkles, Zap, Shield, ArrowRight, CheckCircle2, 
  Mic, Infinity, Bot, Award, Flame, LockOpen, Star, Clock
} from 'lucide-react';
import { forgeAudio } from '../utils/forgeAudio';

interface WhyUpgradeNowCardProps {
  onNavigate?: (tab: string) => void;
  className?: string;
}

export const WhyUpgradeNowCard: React.FC<WhyUpgradeNowCardProps> = ({ onNavigate, className = '' }) => {
  const handleUpgradeClick = () => {
    forgeAudio.playAscensionChord();
    if (onNavigate) {
      onNavigate('pricing');
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-plug-accent/40 shadow-2xl p-6 sm:p-8 space-y-6 ${className}`}>
      {/* Background Holographic Ambient Radiance */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-plug-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Tag & Urgency Live Pulse */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-plug-accent/20 to-purple-500/20 text-plug-accent text-xs font-mono font-black border border-plug-accent/40 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-plug-accent animate-pulse" />
            VIP Creator Elevation
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[11px] font-mono font-bold border border-amber-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400 fill-current" />
            14-Day Free Trial
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Founding 50: <strong className="text-emerald-400">38 Claimed</strong> (12 Left)</span>
        </div>
      </div>

      {/* Main Headline & Value Proposition */}
      <div className="relative z-10 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <span>Why Upgrade to Creator OS Pro Now?</span>
        </h2>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Transform your financial workflow from manual tracking into a <strong>self-driving wealth machine</strong>. Unlock 241ms ElevenLabs voice banking, uncapped affiliate yields, and autonomous AI Swarm distribution.
        </p>
      </div>

      {/* 4 Core ROI Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Pillar 1: ElevenLabs Voice */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 transition-all space-y-2 group">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30 group-hover:scale-105 transition-transform">
            <Mic className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="text-sm font-black text-white">241ms Voice AI Brain</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Execute hands-free debt payoffs, transfers, and budget shifts with ultra-low latency voice synthesis.
          </p>
          <div className="text-[10px] font-mono text-purple-400 font-bold">vs Text-Only on Free</div>
        </div>

        {/* Pillar 2: Uncapped Smart Links */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-plug-accent/50 transition-all space-y-2 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold border border-emerald-500/30 group-hover:scale-105 transition-transform">
            <Infinity className="w-4 h-4 text-plug-accent" />
          </div>
          <h4 className="text-sm font-black text-white">Unlimited Smart Links</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Uncapped referral links with 20%–40% direct recurring commissions and automated self-hosted payouts.
          </p>
          <div className="text-[10px] font-mono text-plug-accent font-bold">vs 5-Link Limit on Free</div>
        </div>

        {/* Pillar 3: AI Swarm & Autoposter */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-2 group">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold border border-cyan-500/30 group-hover:scale-105 transition-transform">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-sm font-black text-white">12-Agent AI Swarm</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Autonomous viral autoposter for TikTok, 𝕏, and Shorts + real-time RAG knowledge index and Niagara VFX.
          </p>
          <div className="text-[10px] font-mono text-cyan-400 font-bold">Autonomous 24/7 Distribution</div>
        </div>

        {/* Pillar 4: Living Vault Ascension */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 transition-all space-y-2 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold border border-amber-500/30 group-hover:scale-105 transition-transform">
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-sm font-black text-white">6-Tier Living Vault</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Imperial 24K Gold Bullion ($20k), Diamond Treasury ($100k), and Cosmic Singularity ($1M+) shader realms.
          </p>
          <div className="text-[10px] font-mono text-amber-400 font-bold">+2,500 VIP Starter XP</div>
        </div>
      </div>

      {/* Action Footer Bar with Promo Code & Direct CTAs */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 font-mono">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">VIP Beta Promo:</span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold tracking-wider">
            FOUNDING50
          </span>
          <span className="text-[11px] text-emerald-400 font-bold">100% OFF 1st Month</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigate && onNavigate('pricing')}
            className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Compare All Plans
          </button>

          <button
            onClick={handleUpgradeClick}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-plug-accent via-indigo-500 to-purple-600 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-plug-accent/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <LockOpen className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span>Claim 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhyUpgradeNowCard;
