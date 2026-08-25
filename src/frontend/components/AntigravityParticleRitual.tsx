import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  spin: number;
  angle: number;
}

interface AntigravityParticleRitualProps {
  phase: 'idle' | 'inverting' | 'converging' | 'supernova' | 'reveal';
  tierAccent: string;
  particleCount?: number;
  onSupernovaComplete?: () => void;
}

export const AntigravityParticleRitual: React.FC<AntigravityParticleRitualProps> = ({
  phase,
  tierAccent,
  particleCount = 60,
  onSupernovaComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || 500);
    const height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || 400);

    const centerX = width / 2;
    const centerY = height / 2;

    const particles: Particle[] = [];

    // Palette generation based on tier accent
    const colors = [tierAccent, '#ffd700', '#ffffff', '#a855f7', '#38bdf8'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: height - Math.random() * (height * 0.4),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2 - 1, // Default upward antigravity float
        size: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.3,
        life: 0,
        maxLife: Math.random() * 100 + 50,
        spin: (Math.random() - 0.5) * 0.05,
        angle: Math.random() * Math.PI * 2,
      });
    }

    let shockwaveRadius = 0;
    let shockwaveAlpha = 1.0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // ── PHASE 1: IDLE / INVERTING (Particles Float Upward Against Gravity) ──
      if (phase === 'idle' || phase === 'inverting') {
        const upwardForce = phase === 'inverting' ? 4.5 : 1.2;

        particles.forEach((p) => {
          p.y -= upwardForce;
          p.x += p.vx + Math.sin(p.life * 0.05) * 0.8;
          p.angle += p.spin;
          p.life++;

          if (p.y < 0) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.restore();
        });
      }

      // ── PHASE 2: CONVERGING (Particles Spiral Rapidly Into Center Singularity) ──
      else if (phase === 'converging') {
        particles.forEach((p) => {
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Inward gravitational pull + tangential vortex spin
          const angle = Math.atan2(dy, dx) + 0.35;
          const speed = Math.min(18, Math.max(3, 400 / (dist + 10)));

          p.x += Math.cos(angle) * speed + dx * 0.08;
          p.y += Math.sin(angle) * speed + dy * 0.08;
          p.size = Math.max(1, p.size * 0.98);

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 16;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = Math.min(1, p.alpha * 1.3);
          ctx.fill();
          ctx.restore();
        });

        // Pulsing Central Quantum Singularity Core
        ctx.save();
        ctx.beginPath();
        const pulseSize = 16 + Math.sin(Date.now() * 0.02) * 6;
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 35;
        ctx.shadowColor = tierAccent;
        ctx.fill();
        ctx.restore();
      }

      // ── PHASE 3: SUPERNOVA / REVEAL (Molten Gold Shockwave Collapse) ──
      else if (phase === 'supernova' || phase === 'reveal') {
        if (shockwaveRadius < width * 0.8) {
          shockwaveRadius += 16;
          shockwaveAlpha = Math.max(0, 1 - shockwaveRadius / (width * 0.7));

          // Outer Explosive Shockwave Ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 6;
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#ffd700';
          ctx.globalAlpha = shockwaveAlpha;
          ctx.stroke();
          ctx.restore();

          // Secondary Tier Accent Shockwave Ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, shockwaveRadius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = tierAccent;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 20;
          ctx.shadowColor = tierAccent;
          ctx.globalAlpha = shockwaveAlpha * 0.8;
          ctx.stroke();
          ctx.restore();
        }

        // Scattered outward debris
        particles.forEach((p) => {
          p.x += p.vx * 4;
          p.y += p.vy * 4;
          p.alpha = Math.max(0, p.alpha - 0.02);

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [phase, tierAccent, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.3))' }}
    />
  );
};

export default AntigravityParticleRitual;
