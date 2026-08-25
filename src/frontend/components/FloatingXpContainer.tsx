import React from 'react';
import { useGamificationXp, FloatingXpParticle } from '../context/GamificationXpContext';
import { Sparkles, Flame, Zap, Trophy, Award } from 'lucide-react';

export const FloatingXpContainer: React.FC = () => {
  const { activeParticles, comboCount, comboMultiplier } = useGamificationXp();

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <style>{`
        @keyframes xpFloatUpAnim {
          0% {
            opacity: 0;
            transform: translate(-50%, 25px) scale(0.6);
            filter: blur(6px);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -8px) scale(1.12);
            filter: blur(0px);
          }
          30% {
            transform: translate(-50%, -20px) scale(1.0);
          }
          75% {
            opacity: 0.95;
            transform: translate(-50%, -85px) scale(0.98);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -140px) scale(0.82);
            filter: blur(3px);
          }
        }

        @keyframes comboBannerPop {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translateY(4px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes ambientSparkle {
          0%, 100% {
            transform: scale(0.8) rotate(0deg);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.25) rotate(180deg);
            opacity: 1;
          }
        }
      `}</style>

      {/* Top Floating Active Combo Banner when combo streak is active */}
      {comboCount >= 2 && (
        <div
          className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300"
          style={{ animation: 'comboBannerPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
        >
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.45)] backdrop-blur-md">
            <div className="relative flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              <Sparkles className="w-3 h-3 text-yellow-200 absolute -top-1.5 -right-1.5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                  {comboCount}x Combo Chain
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                  +{comboMultiplier.toFixed(2)}x XP
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono leading-none">
                Keep taking actions to boost XP rewards!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Render Individual Active Floating XP Particles */}
      {activeParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute transform -translate-x-1/2 pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: 'xpFloatUpAnim 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Ambient Background Glow Orb */}
            <div
              className={`absolute -inset-3 rounded-full blur-xl opacity-60 pointer-events-none ${
                particle.comboCount > 2
                  ? 'bg-amber-500/40'
                  : particle.amount >= 100
                  ? 'bg-purple-500/50'
                  : 'bg-emerald-500/40'
              }`}
            />

            {/* Main Floating Card */}
            <div
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-xl border shadow-2xl ${
                particle.comboCount > 2
                  ? 'bg-slate-950/95 border-amber-400/70 text-amber-300 shadow-amber-500/30'
                  : particle.amount >= 100
                  ? 'bg-slate-950/95 border-purple-400/80 text-purple-200 shadow-purple-500/30'
                  : 'bg-slate-950/95 border-emerald-400/70 text-emerald-300 shadow-emerald-500/30'
              }`}
            >
              {/* Leading Icon */}
              <div className="shrink-0 flex items-center justify-center">
                {particle.comboCount > 2 ? (
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />
                ) : particle.amount >= 100 ? (
                  <Trophy className="w-5 h-5 text-purple-400 animate-pulse" />
                ) : (
                  <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                )}
              </div>

              {/* XP Amount & Reason */}
              <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,255,136,0.6)]">
                    +{particle.amount} XP
                  </span>

                  {particle.multiplier > 1.0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                      🔥 {particle.multiplier.toFixed(1)}x
                    </span>
                  )}
                </div>

                {particle.reason && (
                  <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap font-sans max-w-[220px] truncate">
                    {particle.reason}
                  </span>
                )}
              </div>

              {/* Sparkle Accent */}
              <Sparkles
                className="w-3.5 h-3.5 text-yellow-300 shrink-0"
                style={{ animation: 'ambientSparkle 2s ease-in-out infinite' }}
              />
            </div>

            {/* Sparkle Particle Accents */}
            <div className="absolute -top-2 -left-2 w-1.5 h-1.5 bg-plug-accent rounded-full animate-ping pointer-events-none" />
            <div className="absolute -bottom-1 -right-2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping pointer-events-none" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      ))}
    </div>
  );
};
