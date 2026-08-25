import React from 'react';
import { useLivingRealm } from '../context/LivingRealmContext';
import { Crown, Sparkles, Award, CheckCircle2, Zap, ArrowRight, X } from 'lucide-react';

export const TierAscensionModal: React.FC = () => {
  const { ascensionModalData, closeAscensionModal, playSound } = useLivingRealm();

  if (!ascensionModalData) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 font-sans animate-fadeIn overflow-y-auto w-full h-[100dvh]">
      <div className="max-w-lg w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/50 rounded-3xl p-8 space-y-6 shadow-2xl text-center relative overflow-hidden text-slate-200">
        {/* Supernova Particle Flares */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-plug-accent/20 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Crown Icon */}
        <div className="relative z-10 mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 animate-bounce">
          <Crown className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider border border-amber-500/40">
            <Sparkles className="w-3.5 h-3.5" />
            Mythic Level Ascension
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ascended to <span className="text-gradient-gold">{ascensionModalData.newTier}</span>!
          </h2>
          <p className="text-xs text-slate-300 font-mono">
            You reached <strong className="text-white">Level {ascensionModalData.level}</strong>. Your Living Vault & Sigil Geometry have evolved.
          </p>
        </div>

        {/* Tier Upgrade Badge Comparison */}
        <div className="relative z-10 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-around font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Previous:</span>
            <span className="text-slate-400 font-bold">{ascensionModalData.previousTier}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-bold block">New Rank:</span>
            <span className="text-amber-300 font-black">{ascensionModalData.newTier}</span>
          </div>
        </div>

        {/* Perks Unlocked */}
        <div className="relative z-10 space-y-2 text-left font-mono text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
            Perks & Capabilities Unlocked:
          </span>
          <div className="space-y-1.5">
            {ascensionModalData.unlockedPerks.map((perk, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            playSound('chime');
            closeAscensionModal();
          }}
          className="relative z-10 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider shadow-xl shadow-amber-500/30 transition-all hover:scale-[1.02] cursor-pointer"
        >
          Claim Ascension Rewards & Continue →
        </button>
      </div>
    </div>
  );
};

export default TierAscensionModal;
