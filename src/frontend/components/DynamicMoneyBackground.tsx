import React, { useEffect, useRef } from 'react';
import { useGenerativeDesign } from '../context/GenerativeDesignContext';

export type MoneyTheme = 
  | 'flying-cash'        // Landing: 3D Tumbling Dollar Bills & Flutter
  | 'commission-cascade' // Referral Hub & Affiliate: Network Node Cascade & Green Link Mesh
  | 'cyber-matrix'       // Plug In OS v5.0: Cybernetic Currency Data Streams & AI Pulse
  | 'financial-brain'    // MoneyOS: Intelligent Neural Synapses & Floating Coins
  | 'command-radar'      // Command Center: Radar Sonar Rings & Orbiting Currency Orbs
  | 'golden-vault'       // Net Worth: Floating Gold Bullion Ingots & Ascending Wealth Beams
  | 'budget-shields'     // Budget: Hexagonal Energy Shields & Balanced Floating Orbs
  | 'debt-avalanche'     // Debts: Crimson-to-Emerald Laser Sparks & Disintegrating Debt Nodes
  | 'target-milestones'  // Goals: Rising Golden Stars & Ascending Target Ring Gates
  | 'gamified-gems'      // Quests & Ranks: Floating Emerald XP Diamonds & Level-Up Bursts
  | 'blockchain-crypto'  // Crypto: 3D Spinning Bitcoin, Ethereum & Solana Block Nodes
  | 'cashback-shower'    // Cashback Pack: Floating Gift Boxes & % Reward Tokens
  | 'vault-security';    // Auth Login/Register: Holographic Security Keyholes & Golden Shields

interface DynamicMoneyBackgroundProps {
  theme?: MoneyTheme;
}

export const DynamicMoneyBackground: React.FC<DynamicMoneyBackgroundProps> = ({ 
  theme = 'flying-cash' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { seed, palette, primaryAccent, secondaryAccent, glowColor } = useGenerativeDesign();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 170,
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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener('resize', handleResize);

    // Objects storage
    let items: any[] = [];

    const init = () => {
      items = [];

      // THEME 1: FLYING CASH (Dollar Bills, Coins, Sparks)
      if (theme === 'flying-cash') {
        const count = Math.min(32, Math.floor(width / 50));
        for (let i = 0; i < count; i++) {
          const z = Math.random() * 0.8 + 0.5;
          items.push({
            kind: 'bill',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.45) * 1.2,
            vy: Math.random() * 0.9 + 0.6 * z,
            w: 52 * z,
            h: 28 * z,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            tilt: Math.random() * Math.PI * 2,
            tiltSpeed: Math.random() * 0.03 + 0.015,
            denom: ['$100', '$50', '$20', '$10', 'Ω'][Math.floor(Math.random() * 5)],
            alpha: Math.random() * 0.35 + 0.35,
          });
        }
        for (let i = 0; i < 24; i++) {
          const z = Math.random() * 0.8 + 0.5;
          items.push({
            kind: 'coin',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.45) * 1.1,
            vy: Math.random() * 0.8 + 0.5 * z,
            r: (14 + Math.random() * 8) * z,
            symbol: ['$', 'Ω', '₿', 'Ξ', '✦'][Math.floor(Math.random() * 5)],
            spin: Math.random() * Math.PI * 2,
            spinSpeed: Math.random() * 0.045 + 0.02,
            alpha: Math.random() * 0.4 + 0.4,
          });
        }
      }

      // THEME 2: COMMISSION CASCADE (Network Nodes, Branching Money Flow, Referral Links)
      else if (theme === 'commission-cascade') {
        const count = Math.min(45, Math.floor(width / 35));
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'node',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: Math.random() * 0.8 + 0.4,
            r: Math.random() * 8 + 4,
            color: ['#10b981', '#34d399', '#06b6d4', '#38bdf8', '#f59e0b'][Math.floor(Math.random() * 5)],
            label: ['+$10', '+$30', '+$15', '+$25', 'Ω'][Math.floor(Math.random() * 5)],
            pulse: Math.random() * Math.PI,
          });
        }
      }

      // THEME 3: CYBER MATRIX (Matrix Streams with Currency Glyphs)
      else if (theme === 'cyber-matrix') {
        const columns = Math.floor(width / 36);
        for (let i = 0; i < columns; i++) {
          items.push({
            kind: 'matrix-stream',
            x: i * 36 + 10,
            y: Math.random() * -height,
            speed: Math.random() * 3 + 2,
            chars: ['$ ', 'Ω ', '₿ ', '1 ', '0 ', 'Ξ ', '✦ ', '7 '],
            charLength: Math.floor(Math.random() * 12 + 8),
            color: Math.random() > 0.4 ? '#10b981' : '#06b6d4',
          });
        }
      }

      // THEME 4: FINANCIAL BRAIN (Synapses & Intelligent Golden Waveforms)
      else if (theme === 'financial-brain') {
        const count = 40;
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'synapse',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            r: Math.random() * 5 + 3,
            pulse: Math.random() * Math.PI * 2,
            symbol: ['AI', '$', '⚡', '🧠', 'Ω', '📊'][Math.floor(Math.random() * 6)],
          });
        }
      }

      // THEME 5: COMMAND RADAR (Concentric Sonar Rings & Orbiting Sats)
      else if (theme === 'command-radar') {
        const count = 28;
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'radar-sat',
            orbitRadius: Math.random() * (Math.min(width, height) * 0.45) + 60,
            angle: Math.random() * Math.PI * 2,
            angularSpeed: (Math.random() - 0.5) * 0.012 + 0.006,
            r: Math.random() * 6 + 4,
            color: ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 4)],
            symbol: ['OS', '$', '⚡', 'Ω'][Math.floor(Math.random() * 4)],
          });
        }
      }

      // THEME 6: GOLDEN VAULT (3D Bullion Bars & Gold Shimmer Dust)
      else if (theme === 'golden-vault') {
        const count = Math.min(30, Math.floor(width / 50));
        for (let i = 0; i < count; i++) {
          const z = Math.random() * 0.8 + 0.5;
          items.push({
            kind: 'bullion',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            w: 48 * z,
            h: 24 * z,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.015,
            z,
            alpha: Math.random() * 0.4 + 0.4,
          });
        }
        for (let i = 0; i < 40; i++) {
          items.push({
            kind: 'gold-dust',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -Math.random() * 1.2 - 0.4,
            size: Math.random() * 3 + 1,
            alpha: Math.random() * 0.6 + 0.3,
          });
        }
      }

      // THEME 7: BUDGET SHIELDS (Hexagons & Balanced Asset Spheres)
      else if (theme === 'budget-shields') {
        const count = Math.min(35, Math.floor(width / 45));
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'hex-shield',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            r: Math.random() * 18 + 12,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            color: ['#06b6d4', '#10b981', '#3b82f6', '#14b8a6'][Math.floor(Math.random() * 4)],
            pct: [50, 30, 20, 80, 100][Math.floor(Math.random() * 5)] + '%',
          });
        }
      }

      // THEME 8: DEBT AVALANCHE (Laser Shredder Sparks & Dissolving Balances)
      else if (theme === 'debt-avalanche') {
        const count = 50;
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'avalanche-spark',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            size: Math.random() * 4 + 1.5,
            color: Math.random() > 0.5 ? '#f43f5e' : '#10b981',
            alpha: Math.random() * 0.7 + 0.3,
            decay: Math.random() * 0.02 + 0.01,
          });
        }
      }

      // THEME 9: TARGET MILESTONES (Rising Stars & Milestone Rings)
      else if (theme === 'target-milestones') {
        const count = 35;
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'target-star',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -Math.random() * 1.5 - 0.6, // rising up
            r: Math.random() * 10 + 6,
            spikes: 5,
            pulse: Math.random() * Math.PI * 2,
            color: ['#f59e0b', '#fbbf24', '#10b981', '#a855f7'][Math.floor(Math.random() * 4)],
          });
        }
      }

      // THEME 10: GAMIFIED GEMS & XP (Diamonds & Level-up Bursts)
      else if (theme === 'gamified-gems') {
        const count = 36;
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'xp-gem',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.9,
            vy: (Math.random() - 0.5) * 0.9,
            r: Math.random() * 14 + 8,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.03,
            xp: ['+50 XP', '+100 XP', '+250 XP', 'LVL UP'][Math.floor(Math.random() * 4)],
            color: ['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][Math.floor(Math.random() * 4)],
          });
        }
      }

      // THEME 11: BLOCKCHAIN CRYPTO (Spinning 3D Bitcoin & Crypto Nodes)
      else if (theme === 'blockchain-crypto') {
        const count = Math.min(30, Math.floor(width / 50));
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'crypto-node',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            r: Math.random() * 16 + 12,
            symbol: ['₿', 'Ξ', '◎', 'Ω', '₮', 'ADA'][Math.floor(Math.random() * 6)],
            spin: Math.random() * Math.PI * 2,
            spinSpeed: Math.random() * 0.03 + 0.015,
            color: ['#f59e0b', '#627eea', '#14f195', '#10b981', '#26a17b'][Math.floor(Math.random() * 5)],
          });
        }
      }

      // THEME 12: CASHBACK SHOWER (Gift Boxes, % Percent Tokens)
      else if (theme === 'cashback-shower') {
        const count = 35;
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'cashback-token',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.0,
            vy: Math.random() * 1.2 + 0.6,
            r: Math.random() * 14 + 10,
            text: ['10%', '15%', '25%', '$25', '🎁', '⚡'][Math.floor(Math.random() * 6)],
            spin: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.03,
            color: ['#10b981', '#ec4899', '#f59e0b', '#06b6d4'][Math.floor(Math.random() * 4)],
          });
        }
      }

      // THEME 13: VAULT SECURITY (Keyholes & Holographic Shield Rings)
      else if (theme === 'vault-security') {
        const count = 25;
        for (let i = 0; i < count; i++) {
          items.push({
            kind: 'vault-ring',
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            r: Math.random() * 24 + 14,
            pulse: Math.random() * Math.PI * 2,
            symbol: ['🔒', '🛡️', '256', 'SSL', 'KEY'][Math.floor(Math.random() * 5)],
          });
        }
      }
    };

    init();

    // 60FPS Main Render Engine
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render items per theme
      items.forEach((item) => {
        // --- 1. BILL ---
        if (item.kind === 'bill') {
          item.tilt += item.tiltSpeed;
          item.rotation += item.rotSpeed;
          item.x += item.vx;
          item.y += item.vy;

          if (item.y > height + 60) { item.y = -60; item.x = Math.random() * width; }
          if (item.x > width + 60) item.x = -60;
          if (item.x < -60) item.x = width + 60;

          const scaleY = Math.cos(item.tilt);
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.rotation);
          ctx.scale(1, Math.max(0.15, Math.abs(scaleY)));
          ctx.globalAlpha = item.alpha;

          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.35)';

          ctx.fillStyle = '#064e3b';
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-item.w / 2, -item.h / 2, item.w, item.h, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#6ee7b7';
          ctx.font = `bold ${Math.round(item.h * 0.42)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.denom, 0, 1);
          ctx.restore();
        }

        // --- 2. COIN ---
        else if (item.kind === 'coin') {
          item.spin += item.spinSpeed;
          item.x += item.vx;
          item.y += item.vy;

          if (item.y > height + 40) { item.y = -40; item.x = Math.random() * width; }
          if (item.x > width + 40) item.x = -40;
          if (item.x < -40) item.x = width + 40;

          const scaleX = Math.abs(Math.cos(item.spin));
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.scale(Math.max(0.12, scaleX), 1);
          ctx.globalAlpha = item.alpha;

          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';

          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(0, 0, item.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (scaleX > 0.35) {
            ctx.fillStyle = '#78350f';
            ctx.font = `black ${Math.round(item.r * 1.05)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.symbol, 0, 1);
          }
          ctx.restore();
        }

        // --- 3. COMMISSION CASCADE NODES ---
        else if (item.kind === 'node') {
          item.x += item.vx;
          item.y += item.vy;
          item.pulse += 0.03;

          if (item.y > height + 40) { item.y = -40; item.x = Math.random() * width; }

          ctx.save();
          ctx.globalAlpha = 0.5 + Math.sin(item.pulse) * 0.2;
          ctx.shadowBlur = 12;
          ctx.shadowColor = item.color;
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.label, item.x, item.y - item.r - 5);
          ctx.restore();
        }

        // --- 4. CYBER MATRIX STREAM ---
        else if (item.kind === 'matrix-stream') {
          item.y += item.speed;
          if (item.y > height + 200) item.y = -200;

          ctx.save();
          ctx.font = 'bold 13px monospace';
          for (let k = 0; k < item.charLength; k++) {
            const charY = item.y - k * 18;
            const alpha = Math.max(0, 1 - k / item.charLength);
            ctx.fillStyle = k === 0 ? '#ffffff' : item.color;
            ctx.globalAlpha = alpha * 0.65;
            ctx.fillText(item.chars[(k + Math.floor(item.y / 20)) % item.chars.length], item.x, charY);
          }
          ctx.restore();
        }

        // --- 5. FINANCIAL SYNAPSES ---
        else if (item.kind === 'synapse') {
          item.x += item.vx;
          item.y += item.vy;
          item.pulse += 0.04;

          if (item.x < 0 || item.x > width) item.vx *= -1;
          if (item.y < 0 || item.y > height) item.vy *= -1;

          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#10b981';
          ctx.fillStyle = '#064e3b';
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.r + Math.sin(item.pulse) * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.symbol, item.x, item.y);
          ctx.restore();
        }

        // --- 6. COMMAND RADAR ORBITS ---
        else if (item.kind === 'radar-sat') {
          item.angle += item.angularSpeed;
          const centerX = width / 2;
          const centerY = height / 2;
          const satX = centerX + Math.cos(item.angle) * item.orbitRadius;
          const satY = centerY + Math.sin(item.angle) * item.orbitRadius;

          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.shadowBlur = 10;
          ctx.shadowColor = item.color;
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(satX, satY, item.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.symbol, satX, satY);
          ctx.restore();
        }

        // --- 7. GOLDEN BULLION & DUST ---
        else if (item.kind === 'bullion') {
          item.angle += item.rotSpeed;
          item.x += item.vx;
          item.y += item.vy;

          if (item.x < 0 || item.x > width) item.vx *= -1;
          if (item.y < 0 || item.y > height) item.vy *= -1;

          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.angle);
          ctx.globalAlpha = item.alpha;
          ctx.shadowBlur = 14;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';

          ctx.fillStyle = '#d97706';
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(-item.w / 2, -item.h / 2, item.w, item.h, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#78350f';
          ctx.font = 'black 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('999.9 GOLD', 0, 0);
          ctx.restore();
        } else if (item.kind === 'gold-dust') {
          item.x += item.vx;
          item.y += item.vy;
          if (item.y < -20) { item.y = height + 20; item.x = Math.random() * width; }

          ctx.save();
          ctx.globalAlpha = item.alpha;
          ctx.fillStyle = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#fbbf24';
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // --- 8. BUDGET HEX SHIELDS ---
        else if (item.kind === 'hex-shield') {
          item.angle += item.rotSpeed;
          item.x += item.vx;
          item.y += item.vy;

          if (item.x < 0 || item.x > width) item.vx *= -1;
          if (item.y < 0 || item.y > height) item.vy *= -1;

          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.angle);
          ctx.globalAlpha = 0.45;
          ctx.shadowBlur = 12;
          ctx.shadowColor = item.color;
          ctx.strokeStyle = item.color;
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const a = (s * Math.PI) / 3;
            const px = Math.cos(a) * item.r;
            const py = Math.sin(a) * item.r;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.pct, 0, 0);
          ctx.restore();
        }

        // --- 9. DEBT AVALANCHE SPARKS ---
        else if (item.kind === 'avalanche-spark') {
          item.x += item.vx;
          item.y += item.vy;
          if (item.y > height + 20) { item.y = -20; item.x = Math.random() * width; }

          ctx.save();
          ctx.globalAlpha = item.alpha;
          ctx.fillStyle = item.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = item.color;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // --- 10. TARGET MILESTONE STARS ---
        else if (item.kind === 'target-star') {
          item.y += item.vy;
          item.pulse += 0.03;
          if (item.y < -30) { item.y = height + 30; item.x = Math.random() * width; }

          ctx.save();
          ctx.globalAlpha = 0.55 + Math.sin(item.pulse) * 0.2;
          ctx.fillStyle = item.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = item.color;

          ctx.beginPath();
          ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎯', item.x, item.y);
          ctx.restore();
        }

        // --- 11. GAMIFIED GEMS (XP) ---
        else if (item.kind === 'xp-gem') {
          item.rotation += item.rotSpeed;
          item.x += item.vx;
          item.y += item.vy;

          if (item.x < 0 || item.x > width) item.vx *= -1;
          if (item.y < 0 || item.y > height) item.vy *= -1;

          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.rotation);
          ctx.globalAlpha = 0.6;
          ctx.shadowBlur = 12;
          ctx.shadowColor = item.color;
          ctx.fillStyle = item.color;

          // Diamond
          ctx.beginPath();
          ctx.moveTo(0, -item.r);
          ctx.lineTo(item.r, 0);
          ctx.lineTo(0, item.r);
          ctx.lineTo(-item.r, 0);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.xp, 0, 0);
          ctx.restore();
        }

        // --- 12. BLOCKCHAIN CRYPTO NODES ---
        else if (item.kind === 'crypto-node') {
          item.spin += item.spinSpeed;
          item.x += item.vx;
          item.y += item.vy;

          if (item.x < 0 || item.x > width) item.vx *= -1;
          if (item.y < 0 || item.y > height) item.vy *= -1;

          const scaleX = Math.abs(Math.cos(item.spin));
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.scale(Math.max(0.15, scaleX), 1);
          ctx.globalAlpha = 0.55;
          ctx.shadowBlur = 14;
          ctx.shadowColor = item.color;
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(0, 0, item.r, 0, Math.PI * 2);
          ctx.fill();

          if (scaleX > 0.35) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(item.r * 1.05)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.symbol, 0, 1);
          }
          ctx.restore();
        }

        // --- 13. CASHBACK TOKENS ---
        else if (item.kind === 'cashback-token') {
          item.spin += item.rotSpeed;
          item.x += item.vx;
          item.y += item.vy;

          if (item.y > height + 40) { item.y = -40; item.x = Math.random() * width; }

          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.spin);
          ctx.globalAlpha = 0.55;
          ctx.shadowBlur = 12;
          ctx.shadowColor = item.color;
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(0, 0, item.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.text, 0, 0);
          ctx.restore();
        }

        // --- 14. VAULT SECURITY ---
        else if (item.kind === 'vault-ring') {
          item.pulse += 0.03;
          item.x += item.vx;
          item.y += item.vy;

          if (item.x < 0 || item.x > width) item.vx *= -1;
          if (item.y < 0 || item.y > height) item.vy *= -1;

          ctx.save();
          ctx.globalAlpha = 0.45 + Math.sin(item.pulse) * 0.15;
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#10b981';
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.symbol, item.x, item.y);
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
  }, [theme, seed, palette]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-85"
        style={{ filter: 'contrast(120%)' }}
      />
      {/* Universal Vignette & Contrast Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-plug-dark/50 via-transparent to-plug-dark/80 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-plug-dark/30 to-plug-dark pointer-events-none" />
    </div>
  );
};
