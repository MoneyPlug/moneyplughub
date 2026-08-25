import React from 'react';
import { Crown, Sparkles, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export interface AscensionCeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: number;
  tierName: string;
  vaultShader?: string;
  wealthPulse?: number;
}

export const AscensionCeremonyModal: React.FC<AscensionCeremonyModalProps> = ({
  isOpen,
  onClose,
  tier,
  tierName,
  vaultShader = 'prismatic_core',
  wealthPulse = 0,
}) => {
  if (!isOpen) return null;

  const shaderBadges: Record<string, { label: string; bg: string; color: string; border: string }> = {
    obsidian_slate: { label: 'Obsidian Slate', bg: 'bg-slate-800/80', color: 'text-slate-200', border: 'border-slate-700' },
    emerald_grid: { label: 'Emerald Laser Grid', bg: 'bg-emerald-950/80', color: 'text-emerald-300', border: 'border-emerald-500/50' },
    amethyst_nebula: { label: 'Amethyst Plasma Nebula', bg: 'bg-purple-950/80', color: 'text-purple-300', border: 'border-purple-500/50' },
    prismatic_core: { label: 'Prismatic Core Radiance', bg: 'bg-cyan-950/80', color: 'text-cyan-300', border: 'border-cyan-500/50' },
    supernova_singularity: { label: 'Supernova Singularity Apex', bg: 'bg-amber-950/80', color: 'text-amber-300', border: 'border-amber-500/50' },
  };

  const currentBadge = shaderBadges[vaultShader] || shaderBadges.prismatic_core;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-purple-500/50 bg-gradient-to-b from-purple-950/80 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-purple-500/20 text-center">
        {/* Radiant Cosmic Corona Background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/30 via-plug-accent/20 to-cyan-500/30 blur-3xl pointer-events-none animate-pulse" />

        {/* Tier Ascension Crown Emblem */}
        <div className="relative mx-auto w-24 h-24 mb-6 rounded-3xl bg-gradient-to-tr from-purple-600 via-plug-accent to-amber-400 p-0.5 shadow-xl shadow-purple-500/30 flex items-center justify-center animate-bounce">
          <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
            <Crown className="w-12 h-12 text-plug-accent fill-plug-accent/20 animate-pulse" />
          </div>
        </div>

        {/* Ceremony Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold uppercase tracking-widest border border-purple-500/40 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Ascension Ceremony Complete
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Tier {tier}: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-plug-accent to-amber-300">{tierName}</span>
        </h2>

        <p className="text-sm text-slate-300 font-mono max-w-sm mx-auto mb-6 leading-relaxed">
          Your Sovereign Vault has ascended to an elevated orbital harmonic. All referral multipliers and visual shaders have been transmuted.
        </p>

        {/* Ascension Specs Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8 text-left font-mono">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Vault Shader
            </div>
            <div className={`text-xs font-bold ${currentBadge.color}`}>
              {currentBadge.label}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Wealth Pulse
            </div>
            <div className="text-xs font-bold text-amber-300">
              ⚡ {wealthPulse.toLocaleString()} RPM
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-plug-accent hover:from-purple-500 hover:to-emerald-400 text-slate-950 font-mono font-black text-sm tracking-wide transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Claim Sovereign Harmonic</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AscensionCeremonyModal;
