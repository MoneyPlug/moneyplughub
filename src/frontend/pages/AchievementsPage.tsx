import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Achievement, AchievementsSummary, AchievementTier, AchievementCategory } from '../../types';
import { 
  Trophy, Award, Crown, Shield, ShieldCheck, Zap, Sparkles, 
  Mic, Radio, Volume2, Share2, TrendingUp, Flame, Rocket, 
  Lock, Gem, Feather, Sun, Link2, Briefcase, Check, CheckCircle2, 
  ChevronRight, Filter, Search, ArrowUpRight, Compass, RefreshCw, 
  Crosshair, Star, Coins, DollarSign, Bot, Wallet, Users
} from 'lucide-react';

interface AchievementsPageProps {
  onNavigate?: (tab: string) => void;
}

// ── 3D Confetti Particle Engine ──
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  shape: 'rect' | 'circle' | 'star';
}

export const AchievementsPage: React.FC<AchievementsPageProps> = ({ onNavigate }) => {
  const { token, user, refreshUser } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [summary, setSummary] = useState<AchievementsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [claimCelebration, setClaimCelebration] = useState<{ achievement: Achievement; xp: number; cents: number } | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Claimable' | 'Unlocked' | 'Locked'>('All');

  // Canvas for 3D Confetti Burst
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/achievements', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAchievements(data.data.achievements);
          setSummary(data.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [token]);

  // ── Confetti Particle Animation ──
  const triggerConfetti = (startX?: number, startY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ffd700', '#00ff88', '#38bdf8', '#c084fc', '#f43f5e', '#fbbf24', '#ffffff'];
    const originX = startX ?? window.innerWidth / 2;
    const originY = startY ?? window.innerHeight / 2;

    const newParticles: ConfettiParticle[] = [];
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      newParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 5 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        shape: Math.random() > 0.6 ? 'star' : Math.random() > 0.3 ? 'rect' : 'circle',
      });
    }

    particlesRef.current = newParticles;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.012;

        if (p.alpha <= 0) continue;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(Math.cos((18 + s * 72) * 0.01745) * p.size, -Math.sin((18 + s * 72) * 0.01745) * p.size);
            ctx.lineTo(Math.cos((54 + s * 72) * 0.01745) * (p.size / 2), -Math.sin((54 + s * 72) * 0.01745) * (p.size / 2));
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }

        ctx.restore();
      }

      particlesRef.current = particles.filter((p) => p.alpha > 0);

      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  };

  const handleClaim = async (e: React.MouseEvent, achievement: Achievement) => {
    e.stopPropagation();
    if (!token) {
      if (onNavigate) onNavigate('login');
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    setClaimingId(achievement.id);

    try {
      const res = await fetch(`/api/achievements/claim/${achievement.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerConfetti(clickX, clickY);
        setToastMessage(data.message);
        setClaimCelebration({
          achievement,
          xp: achievement.reward_xp,
          cents: achievement.reward_cents,
        });

        await fetchAchievements();
        await refreshUser();
        setTimeout(() => setToastMessage(null), 6000);
      } else {
        setToastMessage(data.error || 'Claim failed.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setToastMessage('Connection error during claim.');
    } finally {
      setClaimingId(null);
    }
  };

  // Helper for dynamic icon mapping
  const renderIcon = (iconName: string, tier: AchievementTier, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Compass':
        return <Compass className={className} />;
      case 'Mic':
        return <Mic className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'Volume2':
        return <Volume2 className={className} />;
      case 'Cpu':
        return <Bot className={className} />;
      case 'Share2':
        return <Share2 className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Rocket':
        return <Rocket className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Crosshair':
        return <Crosshair className={className} />;
      case 'Lock':
        return <Wallet className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Feather':
        return <Feather className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Gem':
        return <Gem className={className} />;
      case 'Sun':
        return <Sun className={className} />;
      case 'Link2':
        return <Link2 className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'Trophy':
      default:
        return <Trophy className={className} />;
    }
  };

  // Medal 3D styling & Shaders
  const getTierVisuals = (tier: AchievementTier) => {
    switch (tier) {
      case 'Bronze':
        return {
          gradient: 'from-amber-700/30 via-orange-900/20 to-amber-950/40',
          border: 'border-amber-700/50 hover:border-amber-500/80',
          accent: '#d97706',
          badgeBg: 'bg-amber-900/40 text-amber-300 border-amber-600/40',
          glow: 'shadow-amber-900/20 hover:shadow-amber-600/30',
          pedestal: 'from-amber-600/20 to-amber-900/40',
          iconBg: 'bg-gradient-to-b from-amber-500 to-amber-800 text-amber-100',
          prestigePts: 100,
        };
      case 'Silver':
        return {
          gradient: 'from-slate-400/20 via-slate-600/10 to-slate-900/40',
          border: 'border-slate-400/50 hover:border-slate-300/80',
          accent: '#cbd5e1',
          badgeBg: 'bg-slate-800/60 text-slate-200 border-slate-500/40',
          glow: 'shadow-slate-500/20 hover:shadow-slate-400/30',
          pedestal: 'from-slate-400/20 to-slate-700/40',
          iconBg: 'bg-gradient-to-b from-slate-200 to-slate-500 text-slate-900',
          prestigePts: 250,
        };
      case 'Gold':
        return {
          gradient: 'from-amber-500/25 via-yellow-600/15 to-slate-950/40',
          border: 'border-amber-400/60 hover:border-yellow-300/90',
          accent: '#fbbf24',
          badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50',
          glow: 'shadow-yellow-500/30 hover:shadow-yellow-400/50',
          pedestal: 'from-yellow-400/30 to-amber-700/50',
          iconBg: 'bg-gradient-to-b from-yellow-300 to-amber-600 text-amber-950',
          prestigePts: 500,
        };
      case 'Platinum':
        return {
          gradient: 'from-cyan-500/25 via-purple-600/15 to-slate-950/40',
          border: 'border-cyan-400/60 hover:border-cyan-300/90',
          accent: '#38bdf8',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
          glow: 'shadow-cyan-500/30 hover:shadow-cyan-400/50',
          pedestal: 'from-cyan-400/30 to-purple-800/50',
          iconBg: 'bg-gradient-to-b from-cyan-300 via-blue-400 to-purple-600 text-white',
          prestigePts: 1000,
        };
      case 'Diamond Apex':
      default:
        return {
          gradient: 'from-pink-500/30 via-purple-600/20 to-cyan-500/30',
          border: 'border-pink-400/70 hover:border-pink-300/95',
          accent: '#f472b6',
          badgeBg: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-200 border-pink-400/60',
          glow: 'shadow-pink-500/40 hover:shadow-pink-400/60 ring-1 ring-pink-400/30',
          pedestal: 'from-pink-500/30 via-purple-600/40 to-cyan-500/30',
          iconBg: 'bg-gradient-to-tr from-pink-400 via-purple-500 to-cyan-300 text-white',
          prestigePts: 2500,
        };
    }
  };

  // Filtered Achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((ach) => {
      // Category filter
      if (selectedCategory !== 'All' && ach.category !== selectedCategory) return false;

      // Tier filter
      if (selectedTier !== 'All' && ach.tier !== selectedTier) return false;

      // Status filter
      if (statusFilter === 'Claimable' && (!ach.is_unlocked || ach.is_claimed)) return false;
      if (statusFilter === 'Unlocked' && !ach.is_unlocked) return false;
      if (statusFilter === 'Locked' && ach.is_unlocked) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ach.title.toLowerCase().includes(q) ||
          ach.description.toLowerCase().includes(q) ||
          ach.category.toLowerCase().includes(q) ||
          ach.tier.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [achievements, selectedCategory, selectedTier, statusFilter, searchQuery]);

  const categories = ['All', 'Voice AI', 'Viral Growth', 'Wealth Vault', 'Sigil Mastery', 'Syndicates'];
  const tiers = ['All', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond Apex'];

  // Fast-Track Action Router for Next Milestone
  const handleFastTrack = (milestone: Achievement) => {
    if (!onNavigate) return;
    if (milestone.category === 'Voice AI') onNavigate('moneyos');
    else if (milestone.category === 'Viral Growth') onNavigate('referral-hub');
    else if (milestone.category === 'Wealth Vault') onNavigate('net-worth');
    else if (milestone.category === 'Sigil Mastery') onNavigate('sigil-forge');
    else if (milestone.category === 'Syndicates') onNavigate('referral-hub');
    else onNavigate('overview');
  };

  return (
    <div className="min-h-screen bg-plug-dark relative text-slate-100 pb-24">
      {/* Canvas for zero-overhead particle bursts */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-slate-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold shadow-2xl flex items-center gap-3 backdrop-blur-xl">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Claim Celebration Modal */}
      {claimCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-gradient-to-b from-slate-900 to-plug-card border-2 border-plug-accent/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl shadow-plug-accent/30 space-y-6 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-plug-accent/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl" />

            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-600 p-0.5 shadow-xl shadow-yellow-500/30 flex items-center justify-center animate-pulse">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-yellow-400">
                {renderIcon(claimCelebration.achievement.icon, claimCelebration.achievement.tier, 'w-10 h-10')}
              </div>
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-black uppercase tracking-wider border border-plug-accent/40">
                {claimCelebration.achievement.tier} Trophy Claimed
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                {claimCelebration.achievement.title}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {claimCelebration.achievement.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">XP Awarded</div>
                <div className="text-lg font-black text-plug-accent flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4 fill-current" />
                  +{claimCelebration.xp} XP
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Cash Credited</div>
                <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                  <Coins className="w-4 h-4" />
                  +${(claimCelebration.cents / 100).toFixed(2)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setClaimCelebration(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-plug-accent to-emerald-400 text-plug-dark font-black text-sm tracking-wide shadow-lg shadow-plug-accent/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Continue Ascending
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* ── Summary Prestige HUD ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Subtle Ambient Light Orb */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-plug-accent/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Left Headline */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-mono font-bold tracking-wider uppercase">
                <Crown className="w-3.5 h-3.5" />
                <span>Prestige Showcase • 25 Tiered Trophies</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Achievement Trophies
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Forge your financial sovereignty. Unlock rare 3D medals, harvest instant cash bounties, and climb the Prestige rankings across Voice AI, Viral Funnels, and Wealth Vaults.
              </p>
            </div>

            {/* Right HUD Metrics Card */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800/90 shrink-0">
              {/* Trophies Unlocked */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span>Unlocked</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {summary?.total_unlocked || 0}
                  <span className="text-xs text-slate-500 font-normal"> / {summary?.total_achievements || 25}</span>
                </div>
                <div className="text-[9px] text-emerald-400 font-mono mt-0.5">
                  {summary ? Math.round((summary.total_unlocked / (summary.total_achievements || 1)) * 100) : 0}% Complete
                </div>
              </div>

              {/* Prestige Score */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-center gap-1">
                  <Award className="w-3 h-3 text-plug-accent" />
                  <span>Prestige Score</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-plug-accent mt-1">
                  {(summary?.prestige_score || 0).toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Max: {(summary?.max_prestige_score || 21750).toLocaleString()}
                </div>
              </div>

              {/* Claimed Rewards */}
              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3 text-emerald-400" />
                  <span>Bounties Claimed</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                  {summary?.total_claimed || 0}
                  <span className="text-xs text-slate-500 font-normal"> / {summary?.total_achievements || 25}</span>
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Cash + XP
                </div>
              </div>
            </div>
          </div>

          {/* ── Next Unlockable Milestone Fast-Track Banner ── */}
          {summary?.next_milestone && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-plug-accent/30 to-yellow-500/20 border border-plug-accent/40 flex items-center justify-center text-plug-accent shrink-0 shadow-lg shadow-plug-accent/10">
                  {renderIcon(summary.next_milestone.icon, summary.next_milestone.tier, 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      Next Priority Milestone
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {summary.next_milestone.category} • {summary.next_milestone.tier}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                    <span>{summary.next_milestone.title}</span>
                    <span className="text-xs text-emerald-400 font-mono font-normal">
                      (+{summary.next_milestone.reward_xp} XP / ${(summary.next_milestone.reward_cents / 100).toFixed(2)})
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-1">
                    {summary.next_milestone.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Mini Progress */}
                <div className="w-36 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-plug-accent font-bold">{summary.next_milestone.progress_pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-plug-accent to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${summary.next_milestone.progress_pct}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleFastTrack(summary.next_milestone!)}
                  className="px-4 py-2 rounded-xl bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-plug-accent/20 cursor-pointer whitespace-nowrap hover:scale-105"
                >
                  <span>Fast-Track</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Category & Filter Bar ── */}
        <div className="space-y-4">
          {/* Top Filter Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-plug-accent text-plug-dark shadow-md shadow-plug-accent/20'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search trophies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 focus:border-plug-accent/50 rounded-xl text-xs text-white placeholder-slate-500 font-mono outline-none"
              />
            </div>
          </div>

          {/* Secondary Tier & Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
            {/* Tier Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px] mr-1">Tier:</span>
              {tiers.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTier === tier
                      ? 'bg-slate-700 text-white border border-slate-500'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/80'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['All', 'Claimable', 'Unlocked', 'Locked'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-800 text-plug-accent shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3D Trophy Showcase Grid (25 Tiered Medals) ── */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-plug-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs font-mono text-slate-400">Syncing Holographic Trophy Vault...</div>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-base font-bold text-slate-300">No Achievements Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your category or tier filters to explore all 25 creator milestones.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedTier('All');
                setStatusFilter('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-mono text-plug-accent border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((ach) => {
              const visuals = getTierVisuals(ach.tier);
              const isClaimable = ach.is_unlocked && !ach.is_claimed;
              const isClaimed = ach.is_claimed;
              const isLocked = !ach.is_unlocked;
              const current = ach.current_value || 0;
              const target = ach.target_value || 1;
              const pct = ach.progress_pct || 0;

              return (
                <div
                  key={ach.id}
                  className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden group border ${
                    visuals.border
                  } bg-gradient-to-br ${visuals.gradient} ${visuals.glow} ${
                    isClaimable ? 'ring-2 ring-plug-accent/60 animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: 'rgba(11, 17, 33, 0.85)',
                  }}
                >
                  {/* 3D Glass Accent Flare */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />

                  {/* Card Header & 3D Medal Showcase */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* 3D Medal Trophy Emblem */}
                      <div className="relative">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center p-0.5 shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-3 ${
                            isLocked ? 'grayscale opacity-60' : ''
                          }`}
                          style={{
                            background: `linear-gradient(135deg, ${visuals.accent}, #000)`,
                          }}
                        >
                          <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${visuals.iconBg} shadow-inner`}>
                            {renderIcon(ach.icon, ach.tier, 'w-7 h-7')}
                          </div>
                        </div>

                        {/* Prestige Level Pip */}
                        <div
                          className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold shadow"
                          style={{
                            backgroundColor: visuals.accent,
                            color: '#0a0f1d',
                          }}
                        >
                          +{visuals.prestigePts}p
                        </div>
                      </div>

                      {/* Tier & Category Badges */}
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${visuals.badgeBg}`}>
                          {ach.tier}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {ach.category}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight group-hover:text-plug-accent transition-colors flex items-center gap-2">
                        <span>{ach.title}</span>
                        {isClaimed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom: Rewards + Progress Bar + CTA */}
                  <div className="mt-6 space-y-4 pt-4 border-t border-slate-800/80">
                    {/* Bounties & Live Progress Info */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-plug-accent/10 border border-plug-accent/30 text-plug-accent font-mono font-bold text-[11px]">
                          +{ach.reward_xp} XP
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[11px]">
                          +${(ach.reward_cents / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right font-mono text-[11px] text-slate-400">
                        <span className="text-white font-bold">{current.toLocaleString()}</span> / {target.toLocaleString()}
                      </div>
                    </div>

                    {/* Live Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-900/90 overflow-hidden border border-slate-800 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isClaimed
                              ? 'bg-emerald-400'
                              : isClaimable
                              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-plug-accent animate-pulse'
                              : 'bg-gradient-to-r from-slate-600 to-plug-accent'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {isClaimed ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-inner">
                          <Check className="w-4 h-4" />
                          <span>Trophy Claimed</span>
                        </div>
                      ) : isClaimable ? (
                        <button
                          onClick={(e) => handleClaim(e, ach)}
                          disabled={claimingId === ach.id}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-plug-accent via-emerald-400 to-yellow-400 hover:brightness-110 text-plug-dark font-mono font-black text-xs tracking-wider uppercase shadow-lg shadow-plug-accent/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {claimingId === ach.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Claiming Bounty...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 fill-current" />
                              <span>1-Click Claim Bounty</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFastTrack(ach)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-mono text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            <span>In Progress ({pct}%)</span>
                          </span>
                          <span className="text-[10px] text-plug-accent flex items-center gap-0.5">
                            Execute <ChevronRight className="w-3 h-3" />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Prestige Rank Explainer Footer ── */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="font-mono font-bold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span>How Trophy Prestige & Bounties Work</span>
          </div>
          <p className="leading-relaxed">
            Every completed action is verified by the MoneyOS distributed ledger in real-time. Unlocking a trophy instantly rewards you with verifiable Prestige Score points (Bronze: +100p, Silver: +250p, Gold: +500p, Platinum: +1,000p, Diamond Apex: +2,500p) and unlocks a 1-Click cash incentive credited directly to your creator balance.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AchievementsPage;
