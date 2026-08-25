import React, { useEffect, useRef } from 'react';

interface FlyingCashBill {
  type: 'bill';
  x: number;
  y: number;
  z: number; // depth 0.4 to 1.5
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  rotSpeed: number;
  tiltAngle: number;
  tiltSpeed: number;
  swayOffset: number;
  swaySpeed: number;
  denomination: string;
  alpha: number;
}

interface FlyingCoin {
  type: 'coin';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  radius: number;
  symbol: string;
  spinAngle: number;
  spinSpeed: number;
  tilt: number;
  alpha: number;
}

interface SparkleParticle {
  type: 'spark';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

type MoneyEntity = FlyingCashBill | FlyingCoin | SparkleParticle;

export const CosmicDynamicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse velocity & position for currency wind / turbulence physics
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      vx: 0,
      vy: 0,
      radius: 180,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      if (mouse.x > 0) {
        mouse.vx = (newX - mouse.x) * 0.25;
        mouse.vy = (newY - mouse.y) * 0.25;
      }

      mouse.x = newX;
      mouse.y = newY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.vx = 0;
      mouse.vy = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initEntities();
    };

    window.addEventListener('resize', handleResize);

    let entities: MoneyEntity[] = [];

    const denominations = ['$100', '$50', '$20', '$10', 'Ω'];
    const coinSymbols = ['$', 'Ω', '₿', 'Ξ', '✦'];

    const initEntities = () => {
      entities = [];

      // Density calculation
      const numBills = Math.min(38, Math.max(16, Math.floor(width / 45)));
      const numCoins = Math.min(30, Math.max(14, Math.floor(width / 55)));
      const numSparks = 45;

      // 1. Flying Cash Dollar Bills
      for (let i = 0; i < numBills; i++) {
        const z = Math.random() * 0.9 + 0.5; // depth scale
        entities.push({
          type: 'bill',
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.45) * 1.2,
          vy: Math.random() * 0.9 + 0.6 * z, // gentle downward/sideways float
          width: 52 * z,
          height: 28 * z,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          tiltAngle: Math.random() * Math.PI * 2,
          tiltSpeed: Math.random() * 0.035 + 0.015,
          swayOffset: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.025 + 0.015,
          denomination: denominations[Math.floor(Math.random() * denominations.length)],
          alpha: Math.random() * 0.35 + 0.35,
        });
      }

      // 2. Spinning Golden / Holographic Coins
      for (let i = 0; i < numCoins; i++) {
        const z = Math.random() * 0.8 + 0.5;
        entities.push({
          type: 'coin',
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.45) * 1.1,
          vy: Math.random() * 0.8 + 0.5 * z,
          radius: (14 + Math.random() * 8) * z,
          symbol: coinSymbols[Math.floor(Math.random() * coinSymbols.length)],
          spinAngle: Math.random() * Math.PI * 2,
          spinSpeed: Math.random() * 0.045 + 0.02,
          tilt: (Math.random() - 0.5) * 0.6,
          alpha: Math.random() * 0.4 + 0.4,
        });
      }

      // 3. Golden & Emerald Sparkles
      for (let i = 0; i < numSparks; i++) {
        entities.push({
          type: 'spark',
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 2.5 + 1.2,
          color: Math.random() > 0.4 ? '#10b981' : '#f59e0b',
          alpha: Math.random() * 0.6 + 0.2,
          life: Math.random() * 100,
          maxLife: 100,
        });
      }
    };

    initEntities();

    // 60FPS Draw Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Dampen mouse wind velocity
      mouse.vx *= 0.92;
      mouse.vy *= 0.92;

      entities.forEach((entity) => {
        // --- 1. BILL RENDER & PHYSICS ---
        if (entity.type === 'bill') {
          // Organic sway & drift
          entity.swayOffset += entity.swaySpeed;
          entity.tiltAngle += entity.tiltSpeed;
          entity.rotation += entity.rotSpeed;

          const swayX = Math.sin(entity.swayOffset) * 0.9;
          entity.x += entity.vx + swayX;
          entity.y += entity.vy;

          // Mouse wind interaction
          const dx = mouse.x - entity.x;
          const dy = mouse.y - entity.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            entity.x -= (dx / dist) * force * 4.5;
            entity.y -= (dy / dist) * force * 4.5;
            entity.rotation += (mouse.vx * 0.02 + 0.05) * force;
          }

          // Screen wraparound
          if (entity.y > height + 60) {
            entity.y = -60;
            entity.x = Math.random() * width;
          }
          if (entity.x > width + 60) entity.x = -60;
          if (entity.x < -60) entity.x = width + 60;

          // 3D Perspective Compression (simulate tumbling in air)
          const scaleY = Math.cos(entity.tiltAngle);

          ctx.save();
          ctx.translate(entity.x, entity.y);
          ctx.rotate(entity.rotation);
          ctx.scale(1, Math.max(0.15, Math.abs(scaleY)));
          ctx.globalAlpha = entity.alpha * (scaleY < 0 ? 0.65 : 1);

          // Bill Outer Shadow / Glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.35)';

          // Cash Body (Dark Emerald Gradient)
          const grad = ctx.createLinearGradient(-entity.width / 2, -entity.height / 2, entity.width / 2, entity.height / 2);
          grad.addColorStop(0, '#064e3b');   // Deep emerald
          grad.addColorStop(0.5, '#047857'); // Rich bill green
          grad.addColorStop(1, '#022c22');   // Shadow green

          ctx.fillStyle = grad;
          ctx.strokeStyle = '#34d399'; // Mint green border
          ctx.lineWidth = 1.5;

          // Rounded rectangle bill
          const r = 3;
          ctx.beginPath();
          ctx.roundRect(-entity.width / 2, -entity.height / 2, entity.width, entity.height, r);
          ctx.fill();
          ctx.stroke();

          // Inner Decorative Guilloche Border
          ctx.strokeStyle = 'rgba(110, 231, 183, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-entity.width / 2 + 3, -entity.height / 2 + 3, entity.width - 6, entity.height - 6);

          // Center Currency Circle
          ctx.beginPath();
          ctx.arc(0, 0, entity.height * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(6, 78, 59, 0.8)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
          ctx.stroke();

          // Center Text Denomination
          ctx.fillStyle = '#6ee7b7';
          ctx.font = `bold ${Math.round(entity.height * 0.42)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(entity.denomination, 0, 1);

          // Corner Mini Denominations
          ctx.font = `bold ${Math.max(6, Math.round(entity.height * 0.24))}px monospace`;
          ctx.fillText('$', -entity.width / 2 + 7, -entity.height / 2 + 7);
          ctx.fillText('$', entity.width / 2 - 7, entity.height / 2 - 7);

          ctx.restore();
        }

        // --- 2. COIN RENDER & PHYSICS ---
        else if (entity.type === 'coin') {
          entity.spinAngle += entity.spinSpeed;
          entity.x += entity.vx;
          entity.y += entity.vy;

          // Mouse wind interaction
          const dx = mouse.x - entity.x;
          const dy = mouse.y - entity.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            entity.x -= (dx / dist) * force * 5;
            entity.y -= (dy / dist) * force * 5;
          }

          if (entity.y > height + 40) {
            entity.y = -40;
            entity.x = Math.random() * width;
          }
          if (entity.x > width + 40) entity.x = -40;
          if (entity.x < -40) entity.x = width + 40;

          // 3D Horizontal Spin compression
          const cosSpin = Math.cos(entity.spinAngle);
          const widthScale = Math.abs(cosSpin);

          ctx.save();
          ctx.translate(entity.x, entity.y);
          ctx.rotate(entity.tilt);
          ctx.scale(Math.max(0.12, widthScale), 1);
          ctx.globalAlpha = entity.alpha;

          // Golden Specular Glow
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';

          // Gold Coin Gradient
          const coinGrad = ctx.createLinearGradient(-entity.radius, 0, entity.radius, 0);
          coinGrad.addColorStop(0, '#b45309'); // Dark amber
          coinGrad.addColorStop(0.3, '#f59e0b'); // Gold
          coinGrad.addColorStop(0.7, '#fef3c7'); // Specular highlight
          coinGrad.addColorStop(1, '#d97706'); // Warm gold

          ctx.fillStyle = coinGrad;
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.6;

          ctx.beginPath();
          ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Coin Inner Ring
          ctx.beginPath();
          ctx.arc(0, 0, entity.radius * 0.75, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(180, 83, 9, 0.6)';
          ctx.stroke();

          // Coin Symbol
          if (widthScale > 0.35) {
            ctx.fillStyle = '#78350f';
            ctx.font = `black ${Math.round(entity.radius * 1.05)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(entity.symbol, 0, 1);
          }

          ctx.restore();
        }

        // --- 3. GOLD & EMERALD SPARKLE PARTICLES ---
        else if (entity.type === 'spark') {
          entity.x += entity.vx;
          entity.y += entity.vy;
          entity.life += 1;

          if (entity.life > entity.maxLife) {
            entity.life = 0;
            entity.x = Math.random() * width;
            entity.y = Math.random() * height;
          }

          const progress = entity.life / entity.maxLife;
          const currentAlpha = Math.sin(progress * Math.PI) * entity.alpha;

          ctx.save();
          ctx.globalAlpha = currentAlpha;
          ctx.fillStyle = entity.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = entity.color;

          ctx.beginPath();
          ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-85"
        style={{ filter: 'contrast(120%)' }}
      />
      {/* Cinematic Vignette Overlays for Depth and Crystal-Clear Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-plug-dark/60 via-transparent to-plug-dark/85 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-plug-dark/30 to-plug-dark pointer-events-none" />
    </div>
  );
};
