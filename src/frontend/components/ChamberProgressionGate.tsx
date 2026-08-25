import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLivingRealm } from '../context/LivingRealmContext';
import { getChamberProgression, ChamberUnlock } from '../utils/progression';
import { 
  Lock, Zap, Sparkles, ArrowRight, Shield, Trophy, 
  Users, CheckCircle2, Copy, Check, Crown 
} from 'lucide-react';

interface ChamberProgressionGateProps {
  tabId: string;
  onNavigate: (tab: string) => void;
}

export const ChamberProgressionGate: React.FC<ChamberProgressionGateProps> = ({
  tabId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const { playSound } = useLivingRealm();
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const userLevel = user?.level || 1;
  const userXp = user?.xp || 0;
  const userRole = user?.role || 'user';

  const progression = getChamberProgression(tabId, userLevel, userXp, userRole);
  const referralCode = user?.referral_code || 'FOUNDER-PLUG';
  const refLink = `${window.location.origin}/api/referrals/track/${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopiedLink(true);
    playSound('laser');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 font-sans text-white animate-in fade-in duration-300">
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl shadow-purple-500/10 text-center">
        {/* Radiant Cosmic Corona */}
        <div 
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-25 animate-pulse"
          style={{ backgroundColor: progression.accentColor }}
        />

        {/* Lock Emblem & Chamber Tag */}
        <div className="relative mx-auto w-20 h-20 mb-5 rounded-2xl bg-gradient-to-tr from-purple-600 via-plug-accent to-amber-400 p-0.5 shadow-xl shadow-purple-500/20 flex items-center justify-center">
          <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
            <Lock className="w-9 h-9 text-amber-400 animate-bounce" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{progression.tagline}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
          {progression.name}
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto font-mono leading-relaxed mb-8">
          {progression.description}
        </p>

        {/* Progression Requirement Card */}
        <div className="max-w-xl mx-auto p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner mb-8 font-mono text-left space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Unlock Requirement</span>
              <span className="text-sm font-bold text-amber-300">
                Level {progression.minLevel} • {progression.tierName} ({progression.minXP.toLocaleString()} XP)
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Your Current Status</span>
              <span className="text-sm font-bold text-plug-accent">
                Level {userLevel} ({userXp.toLocaleString()} XP)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">Progression to Chamber Unlock</span>
              <span className="text-plug-accent">{progression.progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-plug-accent to-emerald-400 rounded-full transition-all duration-700 shadow-sm shadow-plug-accent/50"
                style={{ width: `${Math.max(5, progression.progressPercent)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 text-right">
              {progression.xpRemaining > 0 ? (
                <span>⚡ {progression.xpRemaining.toLocaleString()} XP needed to ascend</span>
              ) : (
                <span className="text-emerald-400 font-bold">✓ Ready for Ascension</span>
              )}
            </div>
          </div>
        </div>

        {/* Feature Preview Grid */}
        <div className="max-w-2xl mx-auto mb-10 text-left">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 text-center sm:text-left">
            Powerhouse Capabilities Unlocked at Level {progression.minLevel}:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {progression.features.map((feat, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5 text-xs font-mono text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-plug-accent shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fast-Track Ascension Action Buttons */}
        <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          {/* Action 1: Sigil Store XP Booster */}
          <button
            onClick={() => {
              playSound('click');
              onNavigate('sigil-forge');
            }}
            className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-plug-accent hover:from-purple-500 hover:to-emerald-400 text-slate-950 font-black shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Claim XP in Sigil Store</span>
          </button>

          {/* Action 2: Share Referral (+350 XP) */}
          <button
            onClick={handleCopyLink}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Users className="w-4 h-4 text-plug-accent" />}
            <span>{copiedLink ? 'Link Copied (+350 XP)' : 'Share Link (+350 XP)'}</span>
          </button>

          {/* Action 3: Quests */}
          <button
            onClick={() => {
              playSound('click');
              onNavigate('quests');
            }}
            className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Complete Daily Quests</span>
          </button>

          {/* Action 4: Command Center */}
          <button
            onClick={() => {
              playSound('click');
              onNavigate('overview');
            }}
            className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Back to Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChamberProgressionGate;
