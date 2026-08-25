import React, { useState, useEffect, useCallback, useRef } from 'react';

interface BootScreenProps {
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const hasTriggeredFade = useRef(false);

  const startFade = useCallback(() => {
    if (hasTriggeredFade.current) return;
    hasTriggeredFade.current = true;
    setFading(true);
    setOpacity(0);

    const v = videoRef.current;
    if (v) {
      const startVol = v.volume || 1;
      const steps = 8;
      let currentStep = 0;
      const fadeAudio = setInterval(() => {
        currentStep++;
        if (v && v.volume > 0.1) {
          v.volume = Math.max(0, startVol * (1 - currentStep / steps));
        } else {
          clearInterval(fadeAudio);
        }
      }, 50);
    }

    setTimeout(() => {
      onBootComplete();
    }, 800);
  }, [onBootComplete]);

  // Video time tracking
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || hasTriggeredFade.current) return;
    if (v.duration && v.duration > 1.5 && v.currentTime >= v.duration - 0.5) {
      startFade();
    }
  };

  const handleVideoEnd = useCallback(() => {
    startFade();
  }, [startFade]);

  // Keyboard skip (Enter, Space, Escape)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        startFade();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [startFade]);

  // Safety fallback: if video finishes or stalls after 8s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasTriggeredFade.current) startFade();
    }, 8000);
    return () => clearTimeout(timer);
  }, [startFade]);

  // Start playback immediately on mount
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = false;
    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented unmuted sound — fall back to muted and play
        if (v) {
          v.muted = true;
          v.play().catch(() => {});
        }
      });
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-black overflow-hidden flex items-center justify-center w-full h-[100dvh] select-none ${
        fading ? 'pointer-events-none' : 'cursor-pointer'
      }`}
      style={{
        opacity,
        transition: 'opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
      onClick={startFade}
    >
      {/* 100% Crisp, Full-Screen Video (Zero Blur, Zero Scaling Artifacts) */}
      <video
        ref={videoRef}
        src="/boot.mp4"
        autoPlay
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
        className="w-full h-full object-contain"
        style={{
          width: '100vw',
          height: '100dvh',
          maxWidth: '100%',
          maxHeight: '100dvh',
          objectFit: 'contain',
          backgroundColor: '#000000',
          display: 'block',
        }}
      >
        <source src="/boot.mp4" type="video/mp4" />
      </video>

      {/* Skip indicator */}
      <div className="absolute bottom-6 right-6 z-50 text-[11px] font-mono text-slate-400/80 bg-black/60 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-sm pointer-events-none">
        Click or Space to skip
      </div>
    </div>
  );
};

export default BootScreen;
