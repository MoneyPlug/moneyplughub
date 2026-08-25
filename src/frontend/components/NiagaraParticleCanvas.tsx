import React, { useEffect, useRef } from 'react';

interface NiagaraParticleCanvasProps {
  glowColor?: string;
  triggerBurst?: boolean;
  intensity?: 'subtle' | 'normal' | 'supernova';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  angle: number;
  speed: number;
  distance: number;
  orbitSpeed: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const NiagaraParticleCanvas: React.FC<NiagaraParticleCanvasProps> = ({
  glowColor = '#3b82f6',
  triggerBurst = false,
  intensity = 'normal',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const animFrameIdRef = useRef<number>(0);

  // Trigger shockwave burst when triggerBurst changes to true
  useEffect(() => {
    if (triggerBurst && canvasRef.current) {
      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      shockwavesRef.current.push({
        x: centerX,
        y: centerY,
        radius: 10,
        maxRadius: Math.max(canvas.width, canvas.height) * 0.7,
        alpha: 1,
        color: glowColor,
      });

      // Scatter nearby particles
      particlesRef.current.forEach((p) => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 18 / dist;
        p.vx += (dx / dist) * force * 8;
        p.vy += (dy / dist) * force * 8;
      });
    }
  }, [triggerBurst, glowColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    const particleCount = intensity === 'supernova' ? 120 : intensity === 'normal' ? 80 : 50;

    const initParticles = () => {
      const pArr: Particle[] = [];
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < particleCount; i++) {
        const dist = 40 + Math.random() * (Math.min(width, height) * 0.45);
        const angle = Math.random() * Math.PI * 2;
        pArr.push({
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: 1 + Math.random() * 2.5,
          baseAlpha: 0.2 + Math.random() * 0.6,
          alpha: 0.2 + Math.random() * 0.6,
          color: glowColor,
          angle,
          speed: 0.002 + Math.random() * 0.005,
          distance: dist,
          orbitSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.004 + Math.random() * 0.008),
        });
      }
      particlesRef.current = pArr;
    };

    initParticles();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      shockwavesRef.current.push({
        x: clickX,
        y: clickY,
        radius: 5,
        maxRadius: 180,
        alpha: 0.9,
        color: glowColor,
      });

      // Scatter particles from click
      particlesRef.current.forEach((p) => {
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 180) {
          const force = (180 - dist) / 180;
          p.vx += (dx / dist) * force * 5;
          p.vy += (dy / dist) * force * 5;
        }
      });
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
      parent.addEventListener('click', handleCanvasClick);
    }

    // Main Render Loop
    let time = 0;
    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw Shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.08 + 2;
        sw.alpha -= 0.025;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2 * sw.alpha;
        ctx.globalAlpha = sw.alpha * 0.7;
        ctx.stroke();

        // Second subtle outer ring
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, Math.max(0, sw.radius - 15), 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = sw.alpha * 0.4;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Render and update particles
      particlesRef.current.forEach((p) => {
        // Orbital rotation around center
        p.angle += p.orbitSpeed;
        const targetX = centerX + Math.cos(p.angle) * p.distance;
        const targetY = centerY + Math.sin(p.angle) * p.distance;

        p.x += (targetX - p.x) * 0.05 + p.vx;
        p.y += (targetY - p.y) * 0.05 + p.vy;

        // Friction dampening
        p.vx *= 0.94;
        p.vy *= 0.94;

        // Mouse attraction if active
        if (mouseRef.current.active) {
          const mdx = mouseRef.current.x - p.x;
          const mdy = mouseRef.current.y - p.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
          if (mdist < 140) {
            const pull = (140 - mdist) / 140;
            p.vx += (mdx / mdist) * pull * 0.6;
            p.vy += (mdy / mdist) * pull * 0.6;
          }
        }

        // Shimmer alpha
        p.alpha = p.baseAlpha + Math.sin(time * 3 + p.distance) * 0.25;

        // Draw particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = Math.max(0.05, Math.min(1, p.alpha));
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.fill();

        // White core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha * 1.2));
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();
      });

      // 3. Subtle connecting constellation lines between nearby particles
      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 0.5;
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i += 2) {
        for (let j = i + 1; j < particles.length; j += 4) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            ctx.globalAlpha = (1 - dist / 65) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
        parent.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [glowColor, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
