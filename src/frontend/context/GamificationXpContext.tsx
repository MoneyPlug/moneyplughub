import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { forgeAudio } from '../utils/forgeAudio';

export interface FloatingXpParticle {
  id: string;
  amount: number;
  baseAmount: number;
  reason: string;
  multiplier: number;
  comboCount: number;
  x: number; // Viewport percentage X (0 - 100)
  y: number; // Viewport percentage Y (0 - 100)
  createdAt: number;
}

export interface GamificationXpContextType {
  awardXp: (
    amount: number,
    reason: string,
    customMultiplier?: number,
    coords?: { x: number; y: number }
  ) => void;
  comboCount: number;
  comboMultiplier: number;
  activeParticles: FloatingXpParticle[];
  removeParticle: (id: string) => void;
  resetCombo: () => void;
}

const GamificationXpContext = createContext<GamificationXpContextType | undefined>(undefined);

const COMBO_TIMEOUT_MS = 3200;
const PARTICLE_LIFETIME_MS = 2800;

export const GamificationXpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeParticles, setActiveParticles] = useState<FloatingXpParticle[]>([]);
  const [comboCount, setComboCount] = useState<number>(0);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate dynamic combo multiplier based on streak
  const calculateMultiplier = useCallback((combo: number): number => {
    if (combo <= 1) return 1.0;
    if (combo === 2) return 1.25;
    if (combo === 3) return 1.5;
    if (combo === 4) return 2.0;
    return Math.min(3.5, 2.0 + (combo - 4) * 0.5);
  }, []);

  const comboMultiplier = calculateMultiplier(comboCount);

  const removeParticle = useCallback((id: string) => {
    setActiveParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resetCombo = useCallback(() => {
    setComboCount(0);
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }
  }, []);

  const awardXp = useCallback(
    (
      amount: number,
      reason: string,
      customMultiplier?: number,
      coords?: { x: number; y: number }
    ) => {
      // 1. Compute Next Combo Streak
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);

      // Reset combo decay timer
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
      comboTimerRef.current = setTimeout(() => {
        setComboCount(0);
      }, COMBO_TIMEOUT_MS);

      // 2. Multiplier & Final XP Calculation
      const effectiveMultiplier = customMultiplier || calculateMultiplier(nextCombo);
      const finalAmount = Math.round(amount * effectiveMultiplier);

      // 3. Audio synthesis trigger
      const reasonLower = reason.toLowerCase();
      const isMilestoneOrMajor =
        amount >= 100 ||
        reasonLower.includes('quest') ||
        reasonLower.includes('milestone') ||
        reasonLower.includes('ascension') ||
        reasonLower.includes('level');

      if (isMilestoneOrMajor) {
        // Grand celestial Solfeggio 528Hz ascension chord
        forgeAudio.playAscensionChord();
      } else if (nextCombo > 2) {
        // High-speed cybernetic cosmic roll on combo streak
        forgeAudio.playCosmicRoll();
      } else {
        // Crisp high-tech tick oscillator with frequency scale
        const baseFreq = 700 + Math.min(nextCombo * 120, 600);
        forgeAudio.playTick(baseFreq);
      }

      // 4. Coordinates resolution (Convert px to viewport % if large values)
      let posX = 50 + (Math.random() * 20 - 10); // default center-ish
      let posY = 68 + (Math.random() * 8 - 4);  // lower-center

      if (coords) {
        if (coords.x > 100 || coords.y > 100) {
          const vw = window.innerWidth || 1920;
          const vh = window.innerHeight || 1080;
          posX = Math.min(92, Math.max(8, (coords.x / vw) * 100));
          posY = Math.min(90, Math.max(10, (coords.y / vh) * 100));
        } else {
          posX = coords.x;
          posY = coords.y;
        }
      }

      // Add a slight natural jitter so simultaneous floaters do not overlap perfectly
      const jitterX = (Math.random() - 0.5) * 6;
      const jitterY = (Math.random() - 0.5) * 4;

      const newParticle: FloatingXpParticle = {
        id: `xp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        amount: finalAmount,
        baseAmount: amount,
        reason,
        multiplier: effectiveMultiplier,
        comboCount: nextCombo,
        x: Math.min(95, Math.max(5, posX + jitterX)),
        y: Math.min(95, Math.max(5, posY + jitterY)),
        createdAt: Date.now(),
      };

      setActiveParticles((prev) => [...prev, newParticle]);

      // 5. Automatic Particle Decay Timer
      setTimeout(() => {
        removeParticle(newParticle.id);
      }, PARTICLE_LIFETIME_MS);
    },
    [comboCount, calculateMultiplier, removeParticle]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
    };
  }, []);

  return (
    <GamificationXpContext.Provider
      value={{
        awardXp,
        comboCount,
        comboMultiplier,
        activeParticles,
        removeParticle,
        resetCombo,
      }}
    >
      {children}
    </GamificationXpContext.Provider>
  );
};

export const useGamificationXp = (): GamificationXpContextType => {
  const context = useContext(GamificationXpContext);
  if (!context) {
    throw new Error('useGamificationXp must be used within a GamificationXpProvider');
  }
  return context;
};
