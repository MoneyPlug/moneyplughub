import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGamificationXp } from '../context/GamificationXpContext';
import { forgeAudio } from '../utils/forgeAudio';
import { AntigravityParticleRitual } from './AntigravityParticleRitual';
import { 
  Zap, X, Sparkles, Flame, Shield, ArrowUp, 
  RotateCw, Check, AlertCircle, History, DollarSign,
  TrendingUp, Award, Lock, Orbit, Compass, Clock, CheckCircle2
} from 'lucide-react';

interface AntigravityConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export const AntigravityConversionModal: React.FC<AntigravityConversionModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user, token, refreshUser } = useAuth();
  const { awardXp } = useGamificationXp();

  const [statusData, setStatusData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [selectedXp, setSelectedXp] = useState<number>(1000);
  const [isCustomSlider, setIsCustomSlider] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chamber' | 'history'>('chamber');
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Ritual Animation State
  const [ritualPhase, setRitualPhase] = useState<'idle' | 'inverting' | 'converging' | 'supernova' | 'reveal'>('idle');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch status details from backend
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/xp-economy/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setStatusData(json.data);
          // Set initial XP based on user balance
          if (json.data.userXp >= 1000) setSelectedXp(1000);
          else if (json.data.userXp >= 250) setSelectedXp(250);
          else setSelectedXp(json.data.userXp || 100);
        }
      }
    } catch (e) {
      console.error('Failed to load XP economy status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/xp-economy/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setHistoryList(json.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch XP history:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchHistory();
      setRitualPhase('idle');
      setConversionResult(null);
      setErrorMessage(null);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const currentTier = statusData?.tier || {
    number: 1,
    name: 'Neo-Emerald Seed',
    multiplier: 1.0,
    dailyLimitCents: 200,
    weeklyBonusCents: 100,
    accentColor: '#00ff88',
    atmosphere: 'Micro-quantum emerald particle rise',
  };

  const userXp = statusData?.userXp ?? (user?.xp || 0);
  const dailyConvertedCents = statusData?.daily?.convertedTodayCents || 0;
  const remainingDailyCents = statusData?.daily?.remainingDailyCents ?? currentTier.dailyLimitCents;
  const gravityProgress = statusData?.gravityProgress || 45;
  const streakDays = statusData?.streak?.days || 0;

  // Calculate live preview
  const baseCents = Math.floor(selectedXp * 0.05);
  const calculatedMultiplier = currentTier.multiplier || 1.0;
  const finalCents = Math.round(baseCents * calculatedMultiplier);
  const isOverDailyLimit = finalCents > remainingDailyCents && user?.role !== 'admin';
  const isInsufficientXp = selectedXp > userXp;

  // ── Handle Conversion Ritual Execution ─────────────────────────────────
  const handleExecuteConversion = async () => {
    if (isConverting || isInsufficientXp || isOverDailyLimit) return;
    setIsConverting(true);
    setErrorMessage(null);
    setConversionResult(null);

    // Phase 1: Upward Gravity Inversion (0.8s)
    setRitualPhase('inverting');
    forgeAudio.playLaserPulse();

    try {
      // Phase 2: Quantum Vortex Convergence after 600ms
      setTimeout(() => {
        setRitualPhase('converging');
        forgeAudio.playCosmicRoll();
      }, 600);

      const res = await fetch('/api/xp-economy/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ xpAmount: selectedXp }),
      });

      const data = await res.json();

      if (data.success) {
        // Phase 3: Supernova Molten Gold Shockwave
        setTimeout(() => {
          setRitualPhase('supernova');
          forgeAudio.playAscensionChord();

          // Phase 4: Final Payout Reveal
          setTimeout(() => {
            setRitualPhase('reveal');
            setConversionResult(data.data);
            setIsConverting(false);
            refreshUser();
            fetchStatus();
            fetchHistory();
          }, 700);
        }, 1400);
      } else {
        setRitualPhase('idle');
        setIsConverting(false);
        setErrorMessage(data.error || 'Conversion failed.');
        forgeAudio.playTick(400);
      }
    } catch (e: any) {
      setRitualPhase('idle');
      setIsConverting(false);
      setErrorMessage(e.message || 'Network error.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      {/* Modal Card Container */}
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden transition-all my-8"
        style={{
          boxShadow: `0 0 60px -15px ${currentTier.accentColor}40`,
        }}
      >
        {/* Particle Canvas Physics Layer */}
        <AntigravityParticleRitual
          phase={ritualPhase}
          tierAccent={currentTier.accentColor}
          particleCount={Math.min(80, Math.max(30, Math.round(selectedXp / 50)))}
        />

        {/* Ambient Atmospheric Background Glow */}
        <div 
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-30 transition-colors duration-700"
          style={{ background: currentTier.accentColor }}
        />

        {/* Header HUD */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-lg"
              style={{ background: `${currentTier.accentColor}25`, color: currentTier.accentColor }}
            >
              <Zap className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                  Antigravity Ritual Chamber
                </span>
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black border"
                  style={{
                    backgroundColor: `${currentTier.accentColor}20`,
                    color: currentTier.accentColor,
                    borderColor: `${currentTier.accentColor}40`,
                  }}
                >
                  Tier {currentTier.number}: {currentTier.multiplier}× Multiplier
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>XP → Cash Transmutation</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveTab('chamber')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'chamber' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chamber
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'history' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Logs</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 relative z-20 space-y-6">
          
          {activeTab === 'chamber' ? (
            <>
              {/* Gravity Inversion Meter & Wealth Atmosphere Header */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Orbit className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>Atmosphere: <strong className="text-white">{currentTier.name}</strong></span>
                  </span>
                  <span className="text-slate-400">
                    Gravity Inversion: <strong className="text-plug-accent">{gravityProgress}%</strong>
                  </span>
                </div>

                {/* Progress Gauge */}
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full rounded-full transition-all duration-700 relative"
                    style={{
                      width: `${gravityProgress}%`,
                      background: `linear-gradient(90deg, #00ff88, ${currentTier.accentColor})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Available Balance: <strong className="text-emerald-400">{userXp.toLocaleString()} XP</strong></span>
                  {statusData?.nextTier ? (
                    <span>Next: <strong>Tier {statusData.nextTier.number} ({statusData.nextTier.multiplier}×)</strong></span>
                  ) : (
                    <span className="text-amber-400 font-bold">✨ Apex Singularity Achieved</span>
                  )}
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Conversion Result Reveal Banner */}
              {ritualPhase === 'reveal' && conversionResult && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-yellow-950/60 to-amber-950/80 border border-amber-500/50 shadow-2xl text-center space-y-2 animate-bounce">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30 uppercase tracking-widest inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    Transmutation Verified
                  </span>
                  <div className="text-4xl font-black text-amber-300 font-mono tracking-tight drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                    +{conversionResult.finalCashUsd} USD
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    Credited directly to your Living Wealth Vault balance. XP remaining: <strong className="text-white">{conversionResult.updatedBalances.remainingXp.toLocaleString()} XP</strong>.
                  </p>
                </div>
              )}

              {/* XP Preset Quick-Select Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Select Transmutation Quantum (XP)
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[250, 500, 1000, 2500, 5000, 10000].map((preset) => {
                    const isSelected = selectedXp === preset && !isCustomSlider;
                    const presetBaseCents = Math.floor(preset * 0.05);
                    const presetFinalUsd = `$${((presetBaseCents * currentTier.multiplier) / 100).toFixed(2)}`;
                    const isAffordable = userXp >= preset;

                    return (
                      <button
                        key={preset}
                        onClick={() => {
                          setSelectedXp(preset);
                          setIsCustomSlider(false);
                          forgeAudio.playTick(900);
                        }}
                        disabled={!isAffordable}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'bg-slate-800 border-plug-accent shadow-lg shadow-plug-accent/20 ring-1 ring-plug-accent'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="text-xs font-black text-white font-mono">{preset.toLocaleString()} XP</div>
                        <div className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">{presetFinalUsd}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom XP Range Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Custom Slider:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{selectedXp.toLocaleString()} XP</span>
                    <button
                      onClick={() => {
                        setSelectedXp(Math.max(100, userXp));
                        setIsCustomSlider(true);
                      }}
                      className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold hover:bg-purple-900 transition-all cursor-pointer"
                    >
                      MAX XP
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="100"
                  max={Math.max(1000, userXp)}
                  step="50"
                  value={selectedXp}
                  onChange={(e) => {
                    setSelectedXp(Number(e.target.value));
                    setIsCustomSlider(true);
                  }}
                  className="w-full accent-emerald-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
                />
              </div>

              {/* Dynamic Live Conversion Calculation Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-slate-400 font-bold flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>Transmutation Breakdown</span>
                  <span className="text-slate-500">Atomic ACID Matrix</span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span>• Base XP Equivalent ({selectedXp.toLocaleString()} XP @ $0.50/1k):</span>
                    <span className="text-white font-bold">${(baseCents / 100).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>• {currentTier.name} Multiplier:</span>
                    <span className="text-plug-accent font-bold">{currentTier.multiplier}×</span>
                  </div>

                  {streakDays >= 7 && (
                    <div className="flex justify-between text-amber-400">
                      <span>• 7-Day Prestige Streak Bonus:</span>
                      <span className="font-bold">+${(currentTier.weeklyBonusCents / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                    <span className="text-white font-black uppercase">Final Cash Credit:</span>
                    <span className="text-xl font-black text-emerald-400">${(finalCents / 100).toFixed(2)} USD</span>
                  </div>
                </div>
              </div>

              {/* 24-Hour Daily Limit Gauge & Streak Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {/* Daily Limit Status */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Daily Limit:</span>
                    <span className="text-white font-bold">${(currentTier.dailyLimitCents / 100).toFixed(2)}/day</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (dailyConvertedCents / currentTier.dailyLimitCents) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Remaining today:</span>
                    <span className={remainingDailyCents > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      ${(remainingDailyCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 7-Day Streak Status */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Prestige Streak:</span>
                    <span className="text-amber-400 font-bold">{streakDays} / 7 Days</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <div
                        key={day}
                        className={`flex-1 h-1.5 rounded-full ${
                          streakDays >= day ? 'bg-amber-400' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {streakDays >= 7 ? '✨ +$' + (currentTier.weeklyBonusCents / 100).toFixed(2) + ' Weekly Bonus Active!' : `${7 - streakDays} days to weekly bonus`}
                  </div>
                </div>
              </div>

              {/* Master Execution Button */}
              <div className="pt-2">
                <button
                  onClick={handleExecuteConversion}
                  disabled={isConverting || isInsufficientXp || isOverDailyLimit}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
                >
                  <Zap className="w-5 h-5 text-slate-950 fill-current group-hover:scale-110 transition-transform" />
                  <span>
                    {isConverting
                      ? 'COLLAPSING QUANTUM SINGULARITY...'
                      : isInsufficientXp
                      ? 'INSUFFICIENT XP BALANCE'
                      : isOverDailyLimit
                      ? 'DAILY LIMIT REACHED'
                      : `INITIATE ANTIGRAVITY CONVERSION ($${(finalCents / 100).toFixed(2)})`}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* Transaction Logs Tab */
            <div className="space-y-3 font-mono text-xs max-h-[420px] overflow-y-auto pr-1">
              <div className="text-slate-400 font-bold uppercase tracking-wider mb-2">
                Recent Antigravity Transmutations ({historyList.length})
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 text-center text-slate-500">
                  No conversion transactions logged yet. Initiate your first transmutation above!
                </div>
              ) : (
                historyList.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white font-bold flex items-center gap-2">
                        <span>Transmuted {tx.xp_amount.toLocaleString()} XP</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                          Tier {tx.tier_level} ({tx.multiplier}×)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-400 font-black text-sm">
                        +${(tx.final_cash_cents / 100).toFixed(2)} USD
                      </div>
                      {tx.weekly_bonus_cents > 0 && (
                        <div className="text-[10px] text-amber-400 font-bold">
                          Includes +${(tx.weekly_bonus_cents / 100).toFixed(2)} Streak Bonus
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AntigravityConversionModal;
