import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGamificationXp } from '../context/GamificationXpContext';
import { forgeAudio } from '../utils/forgeAudio';
import {
  Gift, Sparkles, Zap, Flame, Crown, Trophy, Check,
  Clock, X, ArrowRight, ShieldCheck, Lock, Unlock,
  Compass, Share2, Volume2, VolumeX, Award,
  DollarSign, Star, Loader2, Dices, Copy, CheckCheck
} from 'lucide-react';

export interface LootRewardDrop {
  claimId: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  badgeAccent: string;
  baseXp: number;
  xpEarned: number;
  cashCredit: number;
  cashCreditCents: number;
  cashCreditFormatted: string;
  rewardType: string;
  rewardDescription: string;
  perks: string[];
  sigilUnlocked: string | null;
  sigilName: string | null;
  multiplierAwarded: number | null;
  multiplierDurationHours: number | null;
  streakDays: number;
  nextBonusMultiplier: number;
  totalXp: number;
  newLevel: number;
  newTier: string;
  claimedAt: string;
  isGuest: boolean;
}

export interface DailyLootStatus {
  eligible: boolean;
  secondsRemaining: number;
  streakDays: number;
  nextBonusMultiplier: number;
  lastClaimedAt: string | null;
  isAuthenticated?: boolean;
}

export interface DailyMysteryLootCrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess?: (drop: LootRewardDrop) => void;
}

export const DailyMysteryLootCrateModal: React.FC<DailyMysteryLootCrateModalProps> = ({
  isOpen,
  onClose,
  onClaimSuccess,
}) => {
  const { user, token, refreshUser } = useAuth();
  const { awardXp } = useGamificationXp();

  // Modal Visual States: 'idle' | 'opening' | 'revealed'
  const [modalState, setModalState] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [status, setStatus] = useState<DailyLootStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [reward, setReward] = useState<LootRewardDrop | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOdds, setShowOdds] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(forgeAudio.getMuted());

  // Real-time Countdown Timer
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  // 3D Parallax Tilt state
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Fetch Daily Loot Status
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      setErrorMessage(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/loot/daily/status', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStatus(json.data);
          setCountdownSeconds(json.data.secondsRemaining || 0);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch loot crate status:', err);
      setErrorMessage('Could not load crate status. Please try again.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setModalState('idle');
      setReward(null);
      fetchStatus();
    }
  }, [isOpen, token]);

  // 2. Countdown timer interval
  useEffect(() => {
    if (!isOpen || countdownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          fetchStatus(); // Re-check status once cooldown reaches zero
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownSeconds]);

  // Format seconds to HH:MM:SS
  const formatCountdown = (secs: number): string => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 3. Open Loot Crate Action
  const handleOpenCrate = async () => {
    if (isOpening || (status && !status.eligible && countdownSeconds > 0)) return;

    try {
      setIsOpening(true);
      setErrorMessage(null);
      setModalState('opening');

      // Play continuous high-tech roll sound
      forgeAudio.playCosmicRoll();

      // Call Backend Open Crate Endpoint
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/loot/daily/open', {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || 'Failed to open loot crate.');
        setModalState('idle');
        setIsOpening(false);
        return;
      }

      const drop: LootRewardDrop = json.data;

      // Dramatic opening sequence delay (1.8s of shaking & vibration build-up)
      setTimeout(async () => {
        setReward(drop);
        setModalState('revealed');
        setIsOpening(false);

        // Trigger floating XP particles
        awardXp(drop.xpEarned, `Mystery Crate: ${drop.rarity} Drop! 🎁`, 1);

        // Play Shockwave bass drop
        forgeAudio.playShockwave();

        // Refresh user context if logged in
        if (token && refreshUser) {
          try {
            await refreshUser();
          } catch {}
        }

        if (onClaimSuccess) {
          onClaimSuccess(drop);
        }
      }, 1800);
    } catch (err: any) {
      console.error('Error opening loot crate:', err);
      setErrorMessage('Network error while opening crate. Please retry.');
      setModalState('idle');
      setIsOpening(false);
    }
  };

  // 4. Parallax Tilt Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setTilt({ x: y, y: x });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // 5. Share reward copy
  const handleShareReward = (e?: React.MouseEvent) => {
    if (!reward) return;
    const shareText = `💎 I just unlocked a ${reward.rarity.toUpperCase()} Daily Mystery Loot Crate on Creator Money OS! +${reward.xpEarned} XP & ${reward.cashCreditFormatted} Cash! Claim yours daily: https://moneyplughub.com`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    awardXp(15, 'Loot Crate Flex Shared! 📢', undefined, e ? { x: e.clientX, y: e.clientY } : undefined);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  if (!isOpen) return null;

  // Rarity Theme Specs
  const rarityColors = {
    Common: {
      bg: 'from-emerald-950/90 via-slate-900 to-slate-950',
      border: 'border-emerald-500/50',
      shadow: 'shadow-emerald-500/20',
      text: 'text-emerald-400',
      glow: '#38ef7d',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      name: 'Common Tier Crate',
    },
    Rare: {
      bg: 'from-sky-950/90 via-slate-900 to-slate-950',
      border: 'border-sky-500/50',
      shadow: 'shadow-sky-500/25',
      text: 'text-sky-400',
      glow: '#38bdf8',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      name: 'Rare Pulse Crate',
    },
    Epic: {
      bg: 'from-purple-950/90 via-slate-900 to-slate-950',
      border: 'border-purple-500/60',
      shadow: 'shadow-purple-500/30',
      text: 'text-purple-400',
      glow: '#c084fc',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      name: 'Epic Stacker Crate',
    },
    Legendary: {
      bg: 'from-amber-950/95 via-slate-900 to-slate-950',
      border: 'border-amber-400/80',
      shadow: 'shadow-amber-500/40',
      text: 'text-amber-400',
      glow: '#ffd700',
      badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 border-amber-300 font-black',
      name: 'Mythic Sovereign Apex Crate',
    },
  };

  const currentRarityTheme = reward ? rarityColors[reward.rarity] : rarityColors.Common;
  const isEligible = status ? status.eligible && countdownSeconds <= 0 : false;
  const streakDays = status ? status.streakDays : (user?.streak_days || 1);
  const streakMultiplier = status ? status.nextBonusMultiplier : 1.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto">
      {/* Modal Card Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full max-w-lg overflow-hidden rounded-3xl border bg-gradient-to-b ${
          modalState === 'revealed' ? currentRarityTheme.bg : 'from-slate-900/95 via-plug-dark to-slate-950'
        } ${modalState === 'revealed' ? currentRarityTheme.border : 'border-slate-800'} p-6 sm:p-8 shadow-2xl transition-all duration-300`}
        style={{
          transform: modalState !== 'opening' ? `perspective(1000px) rotateX(${tilt.x * 0.5}deg) rotateY(${tilt.y * 0.5}deg)` : undefined,
          boxShadow: modalState === 'revealed'
            ? `0 25px 60px -15px ${currentRarityTheme.glow}44, 0 0 35px ${currentRarityTheme.glow}22`
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Ambient Corona Radiance Glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30"
          style={{
            background: modalState === 'revealed' ? currentRarityTheme.glow : '#10b981',
          }}
        />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              {streakDays} Day Streak ({streakMultiplier}× Multiplier)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Mute Toggle */}
            <button
              onClick={() => {
                const muted = forgeAudio.toggleMute();
                setIsAudioMuted(muted);
              }}
              className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5 text-plug-accent" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── STATE 1: IDLE / COOLDOWN ── */}
        {modalState === 'idle' && (
          <div className="text-center relative z-10">
            {/* 3D Holographic Crate Visual Representation */}
            <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 my-4 flex items-center justify-center group cursor-pointer" onClick={isEligible ? handleOpenCrate : undefined}>
              {/* Outer Pulsing Aura Rings */}
              <div className={`absolute inset-0 rounded-3xl ${isEligible ? 'bg-gradient-to-tr from-emerald-500/20 via-plug-accent/20 to-cyan-500/20 animate-pulse' : 'bg-slate-800/30'} blur-xl`} />

              {/* Floating Holographic Chest Vector Box */}
              <div className={`relative w-full h-full rounded-3xl p-1 bg-gradient-to-b ${isEligible ? 'from-emerald-400 via-plug-accent to-indigo-600' : 'from-slate-700 to-slate-900'} shadow-2xl flex items-center justify-center transition-transform duration-300 ${isEligible ? 'group-hover:scale-105 animate-bounce' : 'opacity-85'}`}>
                <div className="w-full h-full rounded-[22px] bg-slate-950/90 border border-slate-800/80 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                  
                  {/* Glowing Laser Scanline across chest */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0)_50%,rgba(0,255,136,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

                  {/* Central Lock / Rune Emblem */}
                  <div className="relative z-10 flex flex-col items-center">
                    {isEligible ? (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-plug-accent p-0.5 shadow-lg shadow-plug-accent/40 flex items-center justify-center">
                        <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                          <Gift className="w-8 h-8 text-plug-accent animate-pulse" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 p-0.5 shadow-md flex items-center justify-center">
                        <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-slate-500" />
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {isEligible ? 'UNLOCKED • READY' : 'COOLDOWN ACTIVE'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Header Titles */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              Daily Mystery <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-plug-accent to-cyan-300">Loot Crate</span>
            </h2>
            <p className="text-xs text-slate-300 font-mono max-w-sm mx-auto mb-5 leading-relaxed">
              Every 24 hours, roll the quantum gacha for instant cash credits, massive XP boosts, and exclusive mythic sigils.
            </p>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Cooldown Timer or Open CTA */}
            {loadingStatus ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-plug-accent" />
                <span>Checking Quantum Cooldown...</span>
              </div>
            ) : isEligible ? (
              <div className="space-y-3">
                <button
                  onClick={handleOpenCrate}
                  disabled={isOpening}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-plug-accent to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-mono font-black text-base tracking-wide uppercase shadow-xl shadow-plug-accent/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-5 h-5 fill-current" />
                  <span>Open Daily Crate Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Guaranteed Drop: Cash Credits + XP + Streak Multiplier</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Live Countdown Display Box */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center font-mono">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    Next Daily Crate Available In
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 tracking-wider">
                    {formatCountdown(countdownSeconds)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Your {streakDays}-day streak is secured. Return tomorrow to maintain your {streakMultiplier}× multiplier.
                  </div>
                </div>

                <button
                  disabled
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                >
                  <Lock className="w-4 h-4" />
                  <span>Crate Recharging ({formatCountdown(countdownSeconds)})</span>
                </button>
              </div>
            )}

            {/* Drop Rates Odds Accordion Toggle */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setShowOdds(!showOdds);
                  forgeAudio.playTick(800);
                }}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5 text-purple-400" />
                <span>{showOdds ? 'Hide Probability Table' : 'View Drop Table & Odds'}</span>
              </button>

              {showOdds && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-left font-mono text-[11px] animate-in fade-in duration-200">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                    <div className="font-bold text-emerald-400 flex items-center justify-between">
                      <span>40% Common</span>
                      <span className="text-[10px] text-slate-400">$0.50</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">+150 to +350 XP</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-sky-500/30">
                    <div className="font-bold text-sky-400 flex items-center justify-between">
                      <span>30% Rare</span>
                      <span className="text-[10px] text-slate-400">$2.00</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">+500 XP + 2× Golden Hour</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30">
                    <div className="font-bold text-purple-400 flex items-center justify-between">
                      <span>20% Epic</span>
                      <span className="text-[10px] text-slate-400">$5.00</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">+1,000 XP + Rare Sigil</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
                    <div className="font-bold text-amber-400 flex items-center justify-between">
                      <span>10% Mythic</span>
                      <span className="text-[10px] text-slate-400">$10.00</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">+2,500 XP + 3× + Gold Aura</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STATE 2: OPENING / SHAKING VIBRATION ── */}
        {modalState === 'opening' && (
          <div className="text-center py-10 relative z-10 animate-pulse">
            {/* Shaking Vibrating Crate with Shockwaves */}
            <div className="relative mx-auto w-40 h-40 my-6 flex items-center justify-center">
              {/* Expanding Shockwave Waves */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-purple-500 to-amber-400 opacity-60 blur-2xl animate-ping" />
              
              <div className="relative w-36 h-36 rounded-3xl bg-gradient-to-tr from-amber-400 via-purple-500 to-emerald-400 p-1 shadow-2xl animate-[spin_3s_linear_infinite] flex items-center justify-center">
                <div className="w-full h-full rounded-[22px] bg-slate-950 flex flex-col items-center justify-center p-4">
                  <Loader2 className="w-12 h-12 text-plug-accent animate-spin" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight uppercase animate-pulse">
              Synthesizing Quantum Drop...
            </h3>
            <p className="text-xs font-mono text-plug-accent mt-1 tracking-widest uppercase">
              Decentralized Random Beacon Active
            </p>
          </div>
        )}

        {/* ── STATE 3: REVEALED REWARD CARD ── */}
        {modalState === 'revealed' && reward && (
          <div className="text-center relative z-10 animate-in zoom-in-95 duration-400">
            {/* Rarity Header Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-extrabold uppercase tracking-widest mb-3 border shadow-lg animate-bounce" style={{ backgroundColor: `${currentRarityTheme.glow}22`, borderColor: currentRarityTheme.glow, color: currentRarityTheme.glow }}>
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{reward.rarity} Reward Unlocked!</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
              {currentRarityTheme.name}
            </h2>

            <p className="text-xs text-slate-300 font-mono max-w-sm mx-auto mb-5">
              {reward.rewardDescription}
            </p>

            {/* Primary Rewards Showcase Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-left font-mono">
              {/* Cash Credit Card */}
              <div className="p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Cash Credit
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {reward.cashCreditFormatted}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Credited to Balance</div>
              </div>

              {/* XP Earned Card */}
              <div className="p-4 rounded-2xl bg-slate-900/95 border border-purple-500/40 shadow-lg shadow-purple-500/10">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  XP Awarded
                </div>
                <div className="text-2xl font-black text-purple-300">
                  +{reward.xpEarned} XP
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Includes Streak Bonus</div>
              </div>
            </div>

            {/* Special Perks / Multipliers List */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left mb-6 space-y-2 font-mono text-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                Unlocked Perks & Modifiers
              </div>
              {reward.perks.map((perk, index) => (
                <div key={index} className="flex items-center gap-2 text-slate-200 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            {/* CTA Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-plug-accent to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-mono font-black text-sm tracking-wide uppercase shadow-lg shadow-plug-accent/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Claim & Equip All Rewards</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleShareReward}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedShare ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Brag to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Share / Flex Crate Drop</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyMysteryLootCrateModal;
