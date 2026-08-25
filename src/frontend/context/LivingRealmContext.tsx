import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

interface LivingRealmContextType {
  // Live Streaming Cashflow
  liveEarnedCents: number;
  perSecondYieldCents: number;
  referralVelocity: number;
  annualRunRateUsd: number;
  
  // Modals & UI States
  isBriefingOpen: boolean;
  setIsBriefingOpen: (open: boolean) => void;
  isPassportOpen: boolean;
  setIsPassportOpen: (open: boolean) => void;
  passportTargetCode: string;
  openPassport: (code?: string) => void;
  
  // Ascension Event
  ascensionModalData: {
    previousTier: string;
    newTier: string;
    level: number;
    unlockedPerks: string[];
  } | null;
  closeAscensionModal: () => void;
  triggerAscension: (prevTier: string, newTier: string, level: number) => void;

  // Sound Engine
  playSound: (type: 'chime' | 'ascension' | 'laser' | 'click' | 'supernova') => void;
}

const LivingRealmContext = createContext<LivingRealmContextType | undefined>(undefined);

export const LivingRealmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Live stream calculation
  const [liveEarnedCents, setLiveEarnedCents] = useState<number>(0);
  const [referralVelocity, setReferralVelocity] = useState<number>(1.25);
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [isPassportOpen, setIsPassportOpen] = useState<boolean>(false);
  const [passportTargetCode, setPassportTargetCode] = useState<string>('');
  const [ascensionModalData, setAscensionModalData] = useState<{
    previousTier: string;
    newTier: string;
    level: number;
    unlockedPerks: string[];
  } | null>(null);

  const prevLevelRef = useRef<number>(user?.level || 1);
  const prevTierRef = useRef<string>(user?.tier_title || 'Novice Plug');

  // Estimate per-second yield based on referrals + vault
  const activeReferrals = Math.max(1, (user?.level || 1) * 3);
  const monthlyCommission = activeReferrals * 10;
  const annualRunRateUsd = monthlyCommission * 12;
  // Per-second cents = (monthlyCommission * 100) / (30 * 24 * 3600)
  const perSecondYieldCents = (monthlyCommission * 100) / (30 * 86400);

  // Smooth 100ms ticker loop
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveEarnedCents(prev => prev + (perSecondYieldCents * 0.1));
    }, 100);
    return () => clearInterval(interval);
  }, [perSecondYieldCents]);

  // Web Audio Synth
  const playSound = useCallback((type: 'chime' | 'ascension' | 'laser' | 'click' | 'supernova') => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'ascension') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } else if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'supernova') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {}
  }, []);

  const openPassport = useCallback((code?: string) => {
    setPassportTargetCode(code || user?.referral_code || 'CREATOR-PLUG');
    setIsPassportOpen(true);
    playSound('chime');
  }, [user, playSound]);

  const triggerAscension = useCallback((prevTier: string, newTier: string, level: number) => {
    const perks = [
      'Cosmic Sigil Harmonic Ring Unlocked',
      'ElevenLabs Streaming Voice Multiplier Activated',
      'Living Vault Physical Geometry Morph Tier 3',
      'Referral Commission Streak Multiplier +15%',
    ];
    setAscensionModalData({
      previousTier: prevTier,
      newTier,
      level,
      unlockedPerks: perks,
    });
    playSound('ascension');
  }, [playSound]);

  const closeAscensionModal = () => {
    setAscensionModalData(null);
  };

  // Monitor user level/tier changes in real-time
  useEffect(() => {
    if (user?.level && user.level > prevLevelRef.current) {
      triggerAscension(prevTierRef.current, user.tier_title || 'Ascended Creator', user.level);
      prevLevelRef.current = user.level;
      prevTierRef.current = user.tier_title || 'Novice Plug';
    }
  }, [user?.level, user?.tier_title, triggerAscension]);

  return (
    <LivingRealmContext.Provider
      value={{
        liveEarnedCents,
        perSecondYieldCents,
        referralVelocity,
        annualRunRateUsd,
        isBriefingOpen,
        setIsBriefingOpen,
        isPassportOpen,
        setIsPassportOpen,
        passportTargetCode,
        openPassport,
        ascensionModalData,
        closeAscensionModal,
        triggerAscension,
        playSound,
      }}
    >
      {children}
    </LivingRealmContext.Provider>
  );
};

export const useLivingRealm = () => {
  const context = useContext(LivingRealmContext);
  if (!context) {
    throw new Error('useLivingRealm must be used within a LivingRealmProvider');
  }
  return context;
};
