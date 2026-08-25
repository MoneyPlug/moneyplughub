import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGamificationXp } from '../context/GamificationXpContext';
import { QuestTask } from '../../types';
import { Sparkles, Check, CheckCircle2, Award, Zap, Gift, Trophy, DollarSign } from 'lucide-react';
import { DailyMysteryLootCrateModal } from '../components/DailyMysteryLootCrateModal';

export const QuestsPage: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const { awardXp } = useGamificationXp();
  const [tasks, setTasks] = useState<QuestTask[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [isLootModalOpen, setIsLootModalOpen] = useState<boolean>(false);

  const fetchQuests = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/gamification/quests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setTasks(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [token]);

  const handleClaim = async (taskId: string, e?: React.MouseEvent) => {
    if (!token) return;
    setIsClaiming(taskId);

    const taskObj = tasks.find((t) => t.id === taskId);

    try {
      const res = await fetch(`/api/gamification/quests/${taskId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(data.message);
        const xpEarned = data.data?.xp_earned || taskObj?.reward_xp || 50;
        const taskTitle = taskObj?.title || 'Quest Completed';
        awardXp(
          xpEarned,
          `Quest: ${taskTitle} ✨`,
          undefined,
          e ? { x: e.clientX, y: e.clientY } : undefined
        );
        await fetchQuests();
        await refreshUser();
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast(data.error || 'Claim failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClaiming(null);
    }
  };

  const formatUsd = (cents: number = 0) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-plug-card border border-plug-border p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Quest Arena & XP Earning Tasks
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold">
              Real Cash + XP
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete daily money habits and financial milestones to unlock instant cash rewards and level up your status.
          </p>
        </div>

        {/* Daily Loot Crate Trigger Button */}
        <button
          onClick={() => setIsLootModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-plug-accent to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-plug-accent/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
        >
          <Gift className="w-4 h-4 animate-bounce" />
          <span>Daily Mystery Crate</span>
        </button>
      </div>

      {/* Daily Loot Crate Interactive Showcase Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-purple-950/60 border border-plug-accent/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-plug-accent to-purple-500 p-0.5 shadow-xl shadow-plug-accent/30 flex items-center justify-center shrink-0 animate-pulse">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Gift className="w-8 h-8 text-plug-accent" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-500/30">
                ⚡ Daily Quantum Gacha
              </span>
              <span className="text-xs text-slate-400 font-mono">24h Cooldown</span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              Daily Mystery Loot Crate
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Roll the weighted drop table for +150 to +2,500 XP, instant cash credits ($0.50 - $10.00), Golden Hour multipliers, and Mythic 24K Gold Sigil Auras!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsLootModalOpen(true)}
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-plug-accent hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-mono font-black text-sm uppercase tracking-wide shadow-xl shadow-plug-accent/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Open Mystery Crate</span>
        </button>
      </div>

      {/* Modal */}
      <DailyMysteryLootCrateModal
        isOpen={isLootModalOpen}
        onClose={() => setIsLootModalOpen(false)}
        onClaimSuccess={() => {
          fetchQuests();
          if (refreshUser) refreshUser();
        }}
      />

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map((task) => {
          const isClaimed = task.user_status === 'claimed';

          return (
            <div
              key={task.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isClaimed
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                  : 'bg-plug-card border-plug-border hover:border-plug-accent/40 shadow-xl'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                    {task.category} Quest
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs font-mono">
                      +{formatUsd(task.reward_cents)} USD
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-plug-accent/10 text-plug-accent font-bold text-xs font-mono">
                      +{task.reward_xp} XP
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{task.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{task.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Type: <span className="capitalize text-slate-400">{task.task_type}</span>
                </span>

                {isClaimed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5" /> Claimed
                  </span>
                ) : (
                  <button
                    onClick={(e) => handleClaim(task.id, e)}
                    disabled={isClaiming === task.id}
                    className="px-5 py-2.5 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-xs rounded-xl transition-all shadow-md shadow-plug-accent/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isClaiming === task.id ? 'Claiming...' : 'Claim Reward & XP'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
