import React, { useEffect, useRef } from 'react';
import { useLivingVault, WealthVaultTier } from '../context/LivingVaultContext';
import { useGenerativeDesign } from '../context/GenerativeDesignContext';

interface LivingBill {
  type: 'bill';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  rotSpeed: number;
  tilt: number;
  tiltSpeed: number;
  denom: string;
  color: string;
  alpha: number;
}

interface LivingCoin {
  type: 'coin';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  r: number;
  symbol: string;
  spin: number;
  spinSpeed: number;
  color: string;
  alpha: number;
}

interface LivingBullion {
  type: 'bullion';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  angle: number;
  rotSpeed: number;
  tilt: number;
  tiltSpeed: number;
  alpha: number;
}

interface LivingDiamond {
  type: 'diamond';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
  facetColor: string;
  alpha: number;
}

interface LivingSpark {
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

interface CosmicWave {
  type: 'wave';
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

type VaultEntity = LivingBill | LivingCoin | LivingBullion | LivingDiamond | LivingSpark | CosmicWave;

export const LivingVaultBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { tier, tierConfig, netWorthUsd, totalEarningsUsd, shockwaveCount } = useLivingVault();
  const { primaryAccent } = useGenerativeDesign();
  const shockwavesRef = useRef<CosmicWave[]>([]);

  // Trigger shockwave when shockwaveCount increments
  useEffect(() => {
    if (shockwaveCount > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      shockwavesRef.current.push({
        type: 'wave',
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        maxRadius: Math.max(canvas.width, canvas.height) * 0.8,
        color: tierConfig.accentColor,
        alpha: 0.9,
      });
    }
  }, [shockwaveCount, tierConfig.accentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse velocity & interactive gravity well
    const mouse = {
      x: -1000,
      y: -1000,
      radius: tier === 'celestial-singularity' ? 320 : tier === 'sovereign-vault' ? 260 : 180,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      shockwavesRef.current.push({
        type: 'wave',
        x: clickX,
        y: clickY,
        radius: 10,
        maxRadius: 280,
        color: tierConfig.accentColor,
        alpha: 0.85,
      });

      // Blast nearby entities
      entities.forEach((ent) => {
        if (ent.type !== 'wave') {
          const dx = ent.x - clickX;
          const dy = ent.y - clickY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 280) {
            const force = (280 - dist) / 280;
            ent.vx += (dx / dist) * force * 14;
            ent.vy += (dy / dist) * force * 14;
          }
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initEntities();
    };

    window.addEventListener('resize', handleResize);

    let entities: VaultEntity[] = [];

    const initEntities = () => {
      entities = [];

      // ── DENSITY & COMPONENT METRICS SCALED FROM TIER CONFIG ──
      const isSingularity = tier === 'celestial-singularity';
      const isSovereign = tier === 'sovereign-vault';
      const isBullion = tier === 'bullion-chamber';
      const isCrypto = tier === 'crypto-matrix';
      const isRiver = tier === 'builder-river';

      const billCount = isSingularity ? 60 : isSovereign ? 45 : isBullion ? 32 : isCrypto ? 22 : isRiver ? 16 : 8;
      const coinCount = isSingularity ? 50 : isSovereign ? 36 : isBullion ? 24 : isCrypto ? 16 : isRiver ? 10 : 6;
      const bullionCount = tierConfig.bullionCount;
      const diamondCount = tierConfig.diamondCount;
      const sparkCount = tierConfig.particleDensity;

      // 1. Multi-Currency Bills ($100 Holographic Blue, $50 Purple, $20 Emerald, Ω Sovereign)
      const billColors = isSingularity || isSovereign
        ? ['#ffd700', '#38bdf8', '#c084fc', '#10b981']
        : isBullion
        ? ['#ffd700', '#38bdf8', '#10b981']
        : isCrypto
        ? ['#c084fc', '#38bdf8', '#10b981']
        : ['#10b981', '#34d399', '#06b6d4'];

      const denoms = isSingularity
        ? ['$100', 'Ω', '100k', '✦', '$100']
        : isSovereign
        ? ['$100', 'Ω', '$50', '$100']
        : isBullion
        ? ['$100', '$50', '$20', 'Ω']
        : isCrypto
        ? ['$100', 'Ξ', '₿', '$50']
        : ['$20', '$10', '$5', '+$10'];

      const speedMultiplier = isSingularity ? 2.2 : isSovereign ? 1.7 : isBullion ? 1.3 : 1.0;

      for (let i = 0; i < billCount; i++) {
        const z = Math.random() * 0.9 + 0.5;
        entities.push({
          type: 'bill',
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.45) * 1.5 * speedMultiplier,
          vy: (Math.random() * 0.8 + 0.6) * z * speedMultiplier,
          w: 58 * z,
          h: 30 * z,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          tilt: Math.random() * Math.PI * 2,
          tiltSpeed: Math.random() * 0.04 + 0.015,
          denom: denoms[Math.floor(Math.random() * denoms.length)],
          color: billColors[Math.floor(Math.random() * billColors.length)],
          alpha: Math.random() * 0.35 + (isSingularity ? 0.55 : isSovereign ? 0.45 : 0.3),
        });
      }

      // 2. 3D Rotating Coins ($, ₿, Ξ, Ω, ✦, 👑)
      const coinSymbols = isSingularity
        ? ['Ω', '👑', '₿', 'Ξ', '✦', '$']
        : isSovereign
        ? ['👑', 'Ω', '₿', 'Ξ', '✦', '$']
        : isBullion
        ? ['$', 'Ω', '₿', '✦', '👑']
        : isCrypto
        ? ['₿', 'Ξ', '$', 'Ω']
        : ['$', 'Ω', '+$10', '✓'];

      const coinColors = isBullion || isSovereign || isSingularity
        ? ['#ffd700', '#fbbf24', '#f59e0b', '#38bdf8']
        : ['#10b981', '#38bdf8', '#a855f7'];

      for (let i = 0; i < coinCount; i++) {
        const z = Math.random() * 0.8 + 0.5;
        entities.push({
          type: 'coin',
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.5) * 1.2 * speedMultiplier,
          vy: (Math.random() * 1.0 + 0.5) * z * speedMultiplier,
          r: (10 + Math.random() * 6) * z,
          symbol: coinSymbols[Math.floor(Math.random() * coinSymbols.length)],
          spin: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1),
          color: coinColors[Math.floor(Math.random() * coinColors.length)],
          alpha: Math.random() * 0.4 + 0.4,
        });
      }

      // 3. 3D Beveled 24K Gold Bullion Bars
      for (let i = 0; i < bullionCount; i++) {
        const z = Math.random() * 0.7 + 0.6;
        entities.push({
          type: 'bullion',
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.5) * 0.9 * speedMultiplier,
          vy: (Math.random() * 0.6 + 0.4) * z * speedMultiplier,
          w: (68 + Math.random() * 16) * z,
          h: (32 + Math.random() * 8) * z,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.012,
          tilt: Math.random() * Math.PI * 2,
          tiltSpeed: Math.random() * 0.02 + 0.008,
          alpha: Math.random() * 0.35 + 0.5,
        });
      }

      // 4. 3D Floating Prismatic Diamonds
      const diamondColors = ['#e0f2fe', '#f0abfc', '#a7f3d0', '#fef08a'];
      for (let i = 0; i < diamondCount; i++) {
        const z = Math.random() * 0.7 + 0.5;
        entities.push({
          type: 'diamond',
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.5) * 1.1 * speedMultiplier,
          vy: (Math.random() * 0.7 + 0.3) * z * speedMultiplier,
          size: (12 + Math.random() * 10) * z,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.025,
          facetColor: diamondColors[Math.floor(Math.random() * diamondColors.length)],
          alpha: Math.random() * 0.4 + 0.5,
        });
      }

      // 5. Ambient Stardust & Matrix Sparks
      for (let i = 0; i < sparkCount; i++) {
        entities.push({
          type: 'spark',
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6 - 0.2,
          size: Math.random() * 2.5 + 1.0,
          color: tierConfig.accentColor,
          alpha: Math.random() * 0.6 + 0.2,
          life: Math.random() * 100,
          maxLife: 100 + Math.random() * 60,
        });
      }
    };

    initEntities();

    // ── MAIN RENDER LOOP ──────────────────────────────────────────
    let time = 0;
    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw Multi-Layer Perlin-Style Harmonic Auroras
      ctx.save();
      const waveCount = tier === 'celestial-singularity' ? 4 : tier === 'sovereign-vault' ? 3 : 2;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseAlpha = (tier === 'celestial-singularity' ? 0.09 : tier === 'sovereign-vault' ? 0.07 : 0.04) / (w + 1);
        ctx.fillStyle = tierConfig.ambientGlow;
        ctx.globalAlpha = baseAlpha;

        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 40) {
          const y = height * 0.65 + Math.sin(x * 0.003 + time * (0.8 + w * 0.4) + w) * (60 + w * 25);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 2. Draw Gravitational Accretion Singularity Vortex (Tier 6)
      if (tier === 'celestial-singularity') {
        ctx.save();
        const vortexRadius = Math.min(width, height) * 0.35;
        const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, vortexRadius);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        grad.addColorStop(0.2, 'rgba(244, 63, 94, 0.25)');
        grad.addColorStop(0.6, 'rgba(255, 215, 0, 0.15)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, vortexRadius, 0, Math.PI * 2);
        ctx.fill();

        // Accretion disk orbiting rings
        for (let r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, vortexRadius * (0.3 * r), vortexRadius * (0.12 * r), time * 0.5 * (r % 2 === 0 ? 1 : -1), 0, Math.PI * 2);
          ctx.strokeStyle = r % 2 === 0 ? '#ffd700' : '#f43f5e';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.35;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Process & Draw Shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.06 + 3;
        sw.alpha -= 0.02;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 3 * sw.alpha;
        ctx.globalAlpha = sw.alpha * 0.7;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, Math.max(0, sw.radius - 20), 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = sw.alpha * 0.4;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Update and Render All Entities
      entities.forEach((ent) => {
        // Mouse Gravity / Repulsion
        const dx = mouse.x - ent.x;
        const dy = mouse.y - ent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          const pull = tier === 'celestial-singularity' ? 0.8 : -0.6; // In singularity, mouse pulls; else repels
          ent.vx += (dx / dist) * force * pull;
          ent.vy += (dy / dist) * force * pull;
        }

        // Singularity Center Gravity (for Tier 6)
        if (tier === 'celestial-singularity' && ent.type !== 'spark') {
          const cdx = centerX - ent.x;
          const cdy = centerY - ent.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
          const cForce = Math.min(0.4, 120 / (cdist + 50));
          // Tangential orbital velocity + inward pull
          ent.vx += (-cdy / cdist) * cForce * 1.2 + (cdx / cdist) * cForce * 0.4;
          ent.vy += (cdx / cdist) * cForce * 1.2 + (cdy / cdist) * cForce * 0.4;
        }

        // Friction
        ent.vx *= 0.98;
        ent.vy *= 0.98;

        ent.x += ent.vx;
        ent.y += ent.vy;

        // Wrap around boundaries
        if (ent.x < -100) ent.x = width + 90;
        if (ent.x > width + 100) ent.x = -90;
        if (ent.y < -100) ent.y = height + 90;
        if (ent.y > height + 100) ent.y = -90;

        ctx.save();

        // ── A. DRAW BILL ──────────────────────────────────────────
        if (ent.type === 'bill') {
          ent.rot += ent.rotSpeed;
          ent.tilt += ent.tiltSpeed;

          ctx.translate(ent.x, ent.y);
          ctx.rotate(ent.rot);
          const scaleY = Math.cos(ent.tilt);
          ctx.scale(1, Math.abs(scaleY) < 0.1 ? 0.1 : scaleY);

          ctx.globalAlpha = Math.max(0.04, Math.min(0.55, ent.alpha * 0.7));

          // Bill gradient & border
          const billGrad = ctx.createLinearGradient(-ent.w / 2, -ent.h / 2, ent.w / 2, ent.h / 2);
          billGrad.addColorStop(0, ent.color);
          billGrad.addColorStop(0.5, '#0f172a');
          billGrad.addColorStop(1, ent.color);

          ctx.fillStyle = billGrad;
          ctx.strokeStyle = ent.color;
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          ctx.roundRect(-ent.w / 2, -ent.h / 2, ent.w, ent.h, 3);
          ctx.fill();
          ctx.stroke();

          // Guilloche Inner Oval
          ctx.beginPath();
          ctx.ellipse(0, 0, ent.w * 0.32, ent.h * 0.32, 0, 0, Math.PI * 2);
          ctx.strokeStyle = ent.color;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Denomination Text
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(11 * ent.z)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ent.denom, 0, 0);
        }

        // ── B. DRAW 3D COIN ───────────────────────────────────────
        else if (ent.type === 'coin') {
          ent.spin += ent.spinSpeed;
          ctx.translate(ent.x, ent.y);
          const scaleX = Math.cos(ent.spin);
          ctx.scale(Math.abs(scaleX) < 0.15 ? 0.15 : scaleX, 1);

          ctx.globalAlpha = Math.max(0.06, Math.min(0.60, ent.alpha * 0.7));

          // Coin Disc
          ctx.beginPath();
          ctx.arc(0, 0, ent.r, 0, Math.PI * 2);
          const coinGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, ent.r);
          coinGrad.addColorStop(0, '#ffffff');
          coinGrad.addColorStop(0.4, ent.color);
          coinGrad.addColorStop(1, '#78350f');
          ctx.fillStyle = coinGrad;
          ctx.shadowColor = ent.color;
          ctx.shadowBlur = 8;
          ctx.fill();

          // Outer Bezel Ring
          ctx.beginPath();
          ctx.arc(0, 0, ent.r * 0.85, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Stamped Symbol
          ctx.fillStyle = '#0f172a';
          ctx.font = `bold ${Math.round(ent.r * 0.95)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ent.symbol, 0, 0);
        }

        // ── C. DRAW 3D BEVELED 24K GOLD BULLION BAR ───────────────
        else if (ent.type === 'bullion') {
          ent.angle += ent.rotSpeed;
          ent.tilt += ent.tiltSpeed;

          ctx.translate(ent.x, ent.y);
          ctx.rotate(ent.angle);
          const tiltScale = Math.sin(ent.tilt) * 0.35 + 0.75;
          ctx.scale(1, tiltScale);

          ctx.globalAlpha = Math.max(0.08, Math.min(0.65, ent.alpha * 0.75));

          const hw = ent.w / 2;
          const hh = ent.h / 2;

          // Main 24K Ingot Top Face
          const goldGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
          goldGrad.addColorStop(0, '#fef08a');
          goldGrad.addColorStop(0.3, '#ffd700');
          goldGrad.addColorStop(0.7, '#d97706');
          goldGrad.addColorStop(1, '#78350f');

          ctx.fillStyle = goldGrad;
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.roundRect(-hw, -hh, ent.w, ent.h, 4);
          ctx.fill();
          ctx.stroke();

          // Beveled Inset
          ctx.beginPath();
          ctx.roundRect(-hw + 5, -hh + 4, ent.w - 10, ent.h - 8, 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Stamped Ingot Hallmark
          ctx.fillStyle = '#451a03';
          ctx.font = `bold ${Math.round(8 * ent.z)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('999.9 GOLD', 0, -hh * 0.25);
          ctx.fillText('Ω 1000g', 0, hh * 0.35);
        }

        // ── D. DRAW 3D PRISMATIC DIAMOND ──────────────────────────
        else if (ent.type === 'diamond') {
          ent.rot += ent.rotSpeed;
          ctx.translate(ent.x, ent.y);
          ctx.rotate(ent.rot);

          ctx.globalAlpha = Math.max(0.08, Math.min(0.65, ent.alpha * 0.75));
          const s = ent.size;

          // Brilliant-Cut Octagonal Diamond Gem
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.7, -s * 0.5);
          ctx.lineTo(s, 0);
          ctx.lineTo(0, s * 1.2);
          ctx.lineTo(-s, 0);
          ctx.lineTo(-s * 0.7, -s * 0.5);
          ctx.closePath();

          const diaGrad = ctx.createLinearGradient(-s, -s, s, s);
          diaGrad.addColorStop(0, '#ffffff');
          diaGrad.addColorStop(0.3, ent.facetColor);
          diaGrad.addColorStop(0.7, '#38bdf8');
          diaGrad.addColorStop(1, '#a855f7');

          ctx.fillStyle = diaGrad;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Inner Facet Reflection Lines
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(0, s * 1.2);
          ctx.moveTo(-s, 0);
          ctx.lineTo(s, 0);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }

        // ── E. DRAW STARDUST SPARK ────────────────────────────────
        else if (ent.type === 'spark') {
          ent.life++;
          if (ent.life > ent.maxLife) {
            ent.x = Math.random() * width;
            ent.y = Math.random() * height;
            ent.life = 0;
          }

          const progress = ent.life / ent.maxLife;
          const sparkAlpha = Math.sin(progress * Math.PI) * ent.alpha;

          ctx.beginPath();
          ctx.arc(ent.x, ent.y, ent.size, 0, Math.PI * 2);
          ctx.fillStyle = ent.color;
          ctx.globalAlpha = Math.max(0.03, sparkAlpha * 0.6);
          ctx.shadowColor = ent.color;
          ctx.shadowBlur = 6;
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [tier, tierConfig]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-60 transition-opacity duration-1000"
    />
  );
};
