import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getNextChamberMilestone } from '../utils/progression';
import { Award, Zap, Sparkles, Flame, ArrowRight, Lock, Unlock } from 'lucide-react';

interface ProgressionMilestoneBarProps {
  onNavigate?: (tab: string) => void;
}

export const ProgressionMilestoneBar: React.FC<ProgressionMilestoneBarProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const tierTitle = user?.tier_title || 'Novice Plug';
  const streakDays = user?.streak_days || 1;

  // Level thresholds (1,000 XP per level ladder)
  const baseLevelXp = (level - 1) * 1000;
  const nextLevelXp = level * 1000;
  const currentInLevel = Math.max(0, xp - baseLevelXp);
  const totalInLevel = Math.max(1, nextLevelXp - baseLevelXp);
  const progressPercent = Math.min(100, Math.round((currentInLevel / totalInLevel) * 100));

  const nextChamber = getNextChamberMilestone(level);

  return (
    <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border border-purple-500/30 shadow-xl shadow-purple-500/5 overflow-hidden font-mono mb-6">
      {/* Radiant Background Aura */}
      <div className="absolute -top-16 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Level Emblem & Tier Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-plug-accent to-amber-400 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold leading-none">Lv.</span>
                <span className="text-xl font-black text-white leading-none mt-0.5">{level}</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 border border-slate-700 rounded-full">
              <Award className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-plug-accent to-emerald-300 uppercase tracking-wider">
                {tierTitle}
              </span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-slate-300">Tier {Math.min(5, Math.floor(level / 3) + 1)}</span>
            </div>
            <div className="text-xs text-slate-400 font-bold mt-0.5">
              +{xp.toLocaleString()} XP <span className="text-slate-500 font-normal">({(nextLevelXp - xp).toLocaleString()} XP to Lv. {level + 1})</span>
            </div>
          </div>
        </div>

        {/* Center: XP Progress Bar & Next Chamber Teaser */}
        <div className="w-full lg:max-w-md space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-plug-accent" />
              <span>Level Progress</span>
            </span>
            <span className="text-plug-accent font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-plug-accent to-emerald-400 rounded-full transition-all duration-700 shadow-sm shadow-plug-accent/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Next Chamber Unlock Hint */}
          {nextChamber && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1 text-amber-300/90 font-bold">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Next Unlock at Lv. {nextChamber.minLevel}:</span>
                <span className="text-white">{nextChamber.name}</span>
              </span>
              <span className="text-slate-500 hidden sm:inline">
                ({(nextChamber.minXP - xp).toLocaleString()} XP left)
              </span>
            </div>
          )}
        </div>

        {/* Right: Streak & XP Booster Action */}
        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <div>
              <div className="text-xs font-black leading-none">{streakDays}d Streak</div>
              <span className="text-[9px] text-amber-400/80 font-bold">
                {(1 + streakDays * 0.1).toFixed(2)}x Boost
              </span>
            </div>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('sigil-forge')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-plug-accent hover:from-purple-500 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Boost XP</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressionMilestoneBar;
