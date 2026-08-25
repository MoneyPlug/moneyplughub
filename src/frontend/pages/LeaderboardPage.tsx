import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LeaderboardEntry } from '../../types';
import { Trophy, Flame, Award, Medal, Crown, Sparkles } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/gamification/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setEntries(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [token]);

  const formatUsd = (cents: number = 0) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const topThree = entries.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-plug-accent/10 border border-plug-accent/30 text-plug-accent text-xs font-semibold uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-plug-accent" />
          Global High-Rollers Arena
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Leaderboard & Tier Rankings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Ranked by XP level progression, net worth discipline, and referral network volume.
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Rank 2 */}
          {topThree[1] && (
            <div className="bg-plug-card border border-slate-700/60 rounded-3xl p-6 text-center space-y-3 relative overflow-hidden order-2 md:order-1">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-600 text-slate-300 mx-auto flex items-center justify-center font-black text-xl">
                🥈
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{topThree[1].display_name}</h3>
                <span className="text-xs text-slate-400 font-mono">Level {topThree[1].level} • {topThree[1].tier_title}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-300">
                <span className="text-plug-accent font-bold text-base">{topThree[1].xp} XP</span> • NW: {formatUsd(topThree[1].net_worth_cents)}
              </div>
            </div>
          )}

          {/* Rank 1 (Champion) */}
          {topThree[0] && (
            <div className="bg-gradient-to-b from-emerald-950/40 via-plug-card to-slate-900 border-2 border-plug-accent rounded-3xl p-8 text-center space-y-4 relative overflow-hidden glow-accent order-1 md:order-2 -mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-plug-dark mx-auto flex items-center justify-center font-black text-3xl shadow-xl shadow-amber-400/20">
                👑
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-bold font-mono uppercase">
                  #1 Grand Champion
                </span>
                <h2 className="font-black text-white text-2xl mt-2">{topThree[0].display_name}</h2>
                <span className="text-xs text-slate-400 font-mono">Level {topThree[0].level} • {topThree[0].tier_title}</span>
              </div>
              <div className="pt-3 border-t border-plug-border text-sm font-mono text-white">
                <span className="text-plug-accent font-black text-lg">{topThree[0].xp} Total XP</span>
                <div className="text-xs text-slate-400 mt-1">Net Worth: {formatUsd(topThree[0].net_worth_cents)}</div>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <div className="bg-plug-card border border-slate-700/60 rounded-3xl p-6 text-center space-y-3 relative overflow-hidden order-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-900/30 border border-amber-700/40 text-amber-500 mx-auto flex items-center justify-center font-black text-xl">
                🥉
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{topThree[2].display_name}</h3>
                <span className="text-xs text-slate-400 font-mono">Level {topThree[2].level} • {topThree[2].tier_title}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-300">
                <span className="text-plug-accent font-bold text-base">{topThree[2].xp} XP</span> • NW: {formatUsd(topThree[2].net_worth_cents)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-plug-card border border-plug-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-plug-border/80 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-plug-accent" />
            Full Ranks Directory
          </h3>
          <span className="text-xs font-mono text-slate-500">Live Synchronized</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-plug-border/50">
              <tr>
                <th className="py-3.5 px-4 w-16">Rank</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Level & Tier</th>
                <th className="py-3.5 px-4">Total XP</th>
                <th className="py-3.5 px-4">Streak</th>
                <th className="py-3.5 px-4">Net Worth</th>
                <th className="py-3.5 px-4">Referrals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plug-border/40 text-slate-300">
              {entries.map((item) => (
                <tr
                  key={item.user_id}
                  className={`transition-colors ${
                    item.is_current_user ? 'bg-plug-accent/10 font-semibold' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-sm">
                    {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      {item.display_name}
                      {item.is_current_user && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-plug-accent text-plug-dark font-black uppercase">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                    Level {item.level} ({item.tier_title})
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-plug-accent">
                    {item.xp} XP
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-amber-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    {item.streak_days}d
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                    {formatUsd(item.net_worth_cents)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {item.referral_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
