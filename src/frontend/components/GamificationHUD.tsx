import React from 'react';
import { Flame, Trophy, Sparkles, Zap, Award } from 'lucide-react';

interface GamificationHUDProps {
  xp: number;
  level: number;
  tierTitle: string;
  streakDays: number;
}

export const GamificationHUD: React.FC<GamificationHUDProps> = ({
  xp,
  level,
  tierTitle,
  streakDays,
}) => {
  // Compute progress to next level
  const getLevelTargetXp = (lvl: number) => {
    if (lvl === 1) return 250;
    if (lvl === 2) return 600;
    if (lvl === 3) return 1200;
    if (lvl === 4) return 2500;
    if (lvl === 5) return 5000;
    return 10000;
  };

  const getLevelBaseXp = (lvl: number) => {
    if (lvl === 1) return 0;
    if (lvl === 2) return 250;
    if (lvl === 3) return 600;
    if (lvl === 4) return 1200;
    if (lvl === 5) return 2500;
    return 5000;
  };

  const base = getLevelBaseXp(level);
  const target = getLevelTargetXp(level);
  const currentInLevel = Math.max(0, xp - base);
  const totalInLevel = target - base;
  const progressPercent = Math.min(100, Math.round((currentInLevel / totalInLevel) * 100));

  return (
    <div className="bg-gradient-to-r from-slate-900 via-plug-card to-slate-900 border border-plug-border rounded-2xl p-4 shadow-xl mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Level & Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-plug-accent flex items-center justify-center text-plug-dark font-black text-xl shadow-lg shadow-plug-accent/20">
              {level}
            </div>
            <div className="absolute -bottom-1 -right-1 p-0.5 bg-plug-dark rounded-full">
              <Award className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-plug-accent uppercase tracking-wider">
                Level {level}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-white">{tierTitle}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {xp} Total XP <span className="text-slate-500">({target - xp} XP to Level {level + 1})</span>
            </div>
          </div>
        </div>

        {/* Center: XP Progress Bar */}
        <div className="w-full md:w-80 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>XP Progress</span>
            <span className="text-plug-accent font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-plug-accent rounded-full transition-all duration-500 shadow-sm shadow-plug-accent/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Daily Streak Flame */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400 animate-pulse" />
            <div>
              <div className="text-xs font-black leading-none">{streakDays} Day Streak</div>
              <span className="text-[9px] text-amber-500/80 font-mono">1.25x XP Multiplier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
