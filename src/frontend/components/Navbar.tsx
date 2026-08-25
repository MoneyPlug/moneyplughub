import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLivingRealm } from '../context/LivingRealmContext';
import { useAdaptiveProfile } from '../context/AdaptiveProfileContext';
import { 
  Zap, Shield, LogOut, LayoutDashboard, PieChart, 
  CreditCard, Target, Trophy, Wallet, Users, Sparkles, Gift, Share2, Compass, Cpu, Bot, Award, ShieldCheck, Calculator, Brain, Rocket, Crown, BarChart3, Swords 
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenWizard?: () => void;
  onOpenXpConversion?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenWizard, onOpenXpConversion }) => {
  const { user, logout } = useAuth();
  const { openPassport } = useLivingRealm();
  const { profile, setIsCalibrationModalOpen } = useAdaptiveProfile();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-plug-border/80 bg-plug-dark/95 backdrop-blur-md">
      <div className="w-full px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <button
          onClick={() => setCurrentTab(user ? 'overview' : 'landing')}
          className="flex items-center gap-2.5 group text-left focus:outline-none shrink-0"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500/40 via-amber-500/40 to-cyan-500/40 shadow-lg shadow-emerald-500/20 group-hover:scale-105 group-hover:shadow-emerald-500/40 transition-all overflow-hidden flex items-center justify-center">
            <img
              src="/moneyplughub_emblem.png"
              alt="MoneyPlugHub Logo"
              className="w-full h-full object-cover rounded-full drop-shadow-md"
            />
          </div>
          <div className="hidden sm:block">
            <div className="font-extrabold tracking-tight text-base sm:text-lg text-white flex items-center gap-1">
              MoneyPlug<span className="text-plug-accent">Hub</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-plug-accent font-mono -mt-1 tracking-wider uppercase font-bold">
              Creator Money OS
            </div>
          </div>
        </button>

        {/* Center Nav Links (Clean, Non-Redundant Core Chambers) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/70 p-1 rounded-2xl border border-slate-800 text-xs font-mono">
          {user ? (
            <>
              <button
                onClick={() => setCurrentTab('overview')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'overview' || currentTab === 'command-center' 
                    ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Command</span>
              </button>

              <button
                onClick={() => setCurrentTab('moneyos')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'moneyos' || currentTab === 'chat' 
                    ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>MoneyOS</span>
              </button>

              <button
                onClick={() => setCurrentTab('referral-hub')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'referral-hub' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Referrals</span>
              </button>

              <button
                onClick={() => setCurrentTab('sigil-forge')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'sigil-forge' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Sigil Forge</span>
              </button>

              <button
                onClick={() => setCurrentTab('net-worth')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'net-worth' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Vault</span>
                {user.role !== 'admin' && (user.level || 1) < 3 && (
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">Lv.3</span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('budget')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'budget' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Budget</span>
                {user.role !== 'admin' && (user.level || 1) < 3 && (
                  <span className="text-[9px] px-1 py-0.2 bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">Lv.3</span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('generate')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'generate' 
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Studio</span>
                {user.role !== 'admin' && (user.level || 1) < 6 && (
                  <span className="text-[9px] px-1 py-0.2 bg-pink-500/20 text-pink-300 rounded border border-pink-500/30">Lv.6</span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('quests')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'quests' || currentTab === 'leaderboard'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Quests</span>
                {user.role !== 'admin' && (user.level || 1) < 3 && (
                  <span className="text-[9px] px-1 py-0.2 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30">Lv.3</span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('achievements')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'achievements' || currentTab === 'trophies' || currentTab === 'prestige'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Trophies</span>
              </button>

              <button
                onClick={() => setCurrentTab('syndicates')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'syndicates' || currentTab === 'guilds' || currentTab === 'guild-wars'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Syndicates</span>
              </button>

              <button
                onClick={() => setCurrentTab('primordia')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentTab === 'primordia' || currentTab === 'v5' || currentTab === 'swarm'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>PrimordiaOS</span>
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={() => setCurrentTab('analytics')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    currentTab === 'analytics' || currentTab === 'metrics'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Metrics</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentTab('landing')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  currentTab === 'landing' 
                    ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/30' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => setCurrentTab('primordia')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  currentTab === 'primordia' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>PrimordiaOS</span>
              </button>

              <button
                onClick={() => setCurrentTab('landing-calc')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  currentTab === 'landing-calc' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Simulator</span>
              </button>

              <button
                onClick={() => setCurrentTab('sigil-forge')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  currentTab === 'sigil-forge' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Sigil Forge</span>
              </button>

              <button
                onClick={() => setCurrentTab('how-it-works')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  currentTab === 'how-it-works' 
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                How It Works
              </button>

              <button
                onClick={() => setCurrentTab('pricing')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  currentTab === 'pricing' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Pricing
              </button>
            </>
          )}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* XP -> Cash Antigravity Conversion Button */}
          {onOpenXpConversion && (
            <button
              onClick={onOpenXpConversion}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/25 hover:from-emerald-500/35 hover:to-cyan-500/35 border border-emerald-400/50 text-emerald-300 font-mono text-xs font-black flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer shadow-lg shadow-emerald-500/20 animate-pulse"
              title="Antigravity Conversion Chamber (Convert XP to Real Cash)"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span className="hidden sm:inline">XP → Cash</span>
              <span className="sm:hidden">Cash</span>
              {user && <span className="px-1.5 py-0.2 rounded bg-slate-950/60 text-emerald-300 text-[10px]">{user.xp?.toLocaleString() || 0} XP</span>}
            </button>
          )}

          {/* Neural Calibration / Bespoke Archetype Badge */}
          {user && (
            <button
              onClick={() => setIsCalibrationModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer shadow-sm shadow-emerald-500/10"
              title="Neural Calibration Matrix & Emergent Archetype"
            >
              <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden md:inline truncate max-w-[130px]">{profile?.archetypeTitle || 'Calibration'}</span>
              <span className="md:hidden">Archetype</span>
            </button>
          )}

          {/* Creator Passport Button (for logged-in creators) */}
          {user && (
            <button
              onClick={() => openPassport(user.referral_code)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer shadow-sm shadow-purple-500/10"
              title="View Cryptographic Creator Passport"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Passport</span>
            </button>
          )}

          {/* Setup Wizard Button */}
          {onOpenWizard && (
            <button
              onClick={onOpenWizard}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer shadow-sm shadow-indigo-500/10"
              title="Launch Setup Wizard Tour"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Setup Wizard</span>
              <span className="sm:hidden">Tour</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user.display_name}</div>
                <div className="text-[10px] text-plug-accent font-mono">
                  Lv. {user.level || 1} • {user.xp || 0} XP
                </div>
              </div>

              {/* Mobile Quick Switcher */}
              <div className="md:hidden">
                <select
                  value={currentTab}
                  onChange={(e) => setCurrentTab(e.target.value)}
                  className="px-2 py-1 bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded-lg focus:outline-none"
                >
                  <option value="overview">⭐ Command</option>
                  <option value="moneyos">💬 MoneyOS</option>
                  <option value="referral-hub">💸 Referrals</option>
                  <option value="sigil-forge">🪬 Sigil Forge</option>
                  <option value="net-worth">🏦 Living Vault</option>
                  <option value="budget">📊 Budget</option>
                  <option value="generate">🔮 AI Studio</option>
                  <option value="quests">🎮 Quests</option>
                  <option value="achievements">🏆 Trophies</option>
                  {user.role === 'admin' && <option value="admin">🛡️ Auditor</option>}
                  {user.role === 'admin' && <option value="analytics">📊 Metrics & DB</option>}
                </select>
              </div>

              <button
                onClick={async () => {
                  await logout();
                  setCurrentTab('landing');
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentTab('register')}
                className="px-3.5 py-1.5 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-bold text-xs rounded-xl transition-all shadow-md shadow-plug-accent/20 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
