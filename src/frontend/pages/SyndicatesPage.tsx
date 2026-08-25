import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGamificationXp } from '../context/GamificationXpContext';
import { Syndicate, SyndicateMember, MySyndicateResponse } from '../../types';
import {
  Shield, Users, Trophy, Zap, Crown, Flame, Plus,
  Sparkles, CheckCircle2, ChevronRight, Search,
  Award, TrendingUp, DollarSign, Swords, Star,
  Info, Compass, ShieldAlert, ArrowUpRight, Copy, Check
} from 'lucide-react';

const SIGIL_OPTIONS = [
  { id: 'CYBER-DRAGON', label: 'Cyber Dragon', icon: '🐉', color: 'from-emerald-500 to-cyan-500', glow: 'shadow-emerald-500/30' },
  { id: 'SOVEREIGN-EMP', label: 'Sovereign Emperor', icon: '👑', color: 'from-amber-400 to-yellow-600', glow: 'shadow-amber-500/30' },
  { id: 'VIRAL-PULSE', label: 'Viral Pulse', icon: '⚡', color: 'from-fuchsia-500 to-pink-500', glow: 'shadow-pink-500/30' },
  { id: 'QUANT-MATRIX', label: 'Quant Matrix', icon: '🧬', color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30' },
  { id: 'PHOENIX-FLAME', label: 'Phoenix Flame', icon: '🔥', color: 'from-orange-500 to-red-600', glow: 'shadow-orange-500/30' },
  { id: 'TITAN-AEGIS', label: 'Titan Aegis', icon: '🛡️', color: 'from-teal-400 to-emerald-600', glow: 'shadow-teal-500/30' },
  { id: 'CELESTIAL-VAULT', label: 'Celestial Vault', icon: '🌌', color: 'from-purple-500 to-indigo-500', glow: 'shadow-purple-500/30' },
  { id: 'NEON-VIPER', label: 'Neon Viper', icon: '🐍', color: 'from-lime-400 to-emerald-500', glow: 'shadow-lime-500/30' },
];

export const SyndicatesPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user, token, refreshUser } = useAuth();
  const { awardXp } = useGamificationXp();

  // State
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [mySyndicateData, setMySyndicateData] = useState<MySyndicateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'all' | 'my-guild' | 'rules'>('leaderboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isJoiningId, setIsJoiningId] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newSyndicateName, setNewSyndicateName] = useState<string>('');
  const [newSyndicateTag, setNewSyndicateTag] = useState<string>('');
  const [newSyndicateSigil, setNewSyndicateSigil] = useState<string>('CYBER-DRAGON');
  const [newSyndicateDesc, setNewSyndicateDesc] = useState<string>('');

  // Roster Modal State
  const [selectedRosterSyndicate, setSelectedRosterSyndicate] = useState<Syndicate | null>(null);
  const [rosterMembers, setRosterMembers] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);

  // Copy helper
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const fetchSyndicatesData = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [syndicatesRes, myRes] = await Promise.all([
        fetch('/api/syndicates', { headers }),
        token ? fetch('/api/syndicates/my', { headers }) : Promise.resolve(null),
      ]);

      if (syndicatesRes.ok) {
        const synJson = await syndicatesRes.json();
        if (synJson.success) setSyndicates(synJson.data);
      }

      if (myRes && myRes.ok) {
        const myJson = await myRes.json();
        if (myJson.success) setMySyndicateData(myJson.data);
      }
    } catch (err) {
      console.error('Failed to load syndicates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyndicatesData();
  }, [token]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const formatUsd = (cents: number = 0) =>
    `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handleJoinSyndicate = async (syndicate: Syndicate, e?: React.MouseEvent) => {
    if (!token) {
      showToast('Please log in to join a Creator Syndicate.', 'error');
      if (onNavigate) onNavigate('login');
      return;
    }

    setIsJoiningId(syndicate.id);
    try {
      const res = await fetch(`/api/syndicates/${syndicate.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Joined [${syndicate.tag}] ${syndicate.name}!`, 'success');
        awardXp(250, `Joined Guild [${syndicate.tag}] ⚔️`, 1.15, e ? { x: e.clientX, y: e.clientY } : undefined);
        await fetchSyndicatesData();
        if (refreshUser) refreshUser();
      } else {
        showToast(data.error || 'Failed to join syndicate.', 'error');
      }
    } catch (err) {
      showToast('Network error joining syndicate.', 'error');
    } finally {
      setIsJoiningId(null);
    }
  };

  const handleCreateSyndicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Please log in to establish a syndicate.', 'error');
      return;
    }

    if (!newSyndicateName.trim() || newSyndicateName.trim().length < 3) {
      showToast('Syndicate name must be at least 3 characters.', 'error');
      return;
    }

    if (!newSyndicateTag.trim() || newSyndicateTag.trim().length < 2) {
      showToast('Guild Tag must be 2 to 8 characters.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/syndicates/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newSyndicateName.trim(),
          tag: newSyndicateTag.trim().toUpperCase(),
          emblem_sigil: newSyndicateSigil,
          description: newSyndicateDesc.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 Syndicate [${newSyndicateTag.toUpperCase()}] established!`, 'success');
        awardXp(500, `Founded Syndicate [${newSyndicateTag.toUpperCase()}] 👑`, 1.25);
        setIsCreateModalOpen(false);
        setNewSyndicateName('');
        setNewSyndicateTag('');
        setNewSyndicateDesc('');
        await fetchSyndicatesData();
        if (refreshUser) refreshUser();
      } else {
        showToast(data.error || 'Failed to create syndicate.', 'error');
      }
    } catch (err) {
      showToast('Error creating syndicate.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenRoster = async (syndicate: Syndicate) => {
    setSelectedRosterSyndicate(syndicate);
    setIsLoadingRoster(true);
    try {
      const res = await fetch(`/api/syndicates/${syndicate.id}/members`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setRosterMembers(data.data);
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const filteredSyndicates = useMemo(() => {
    let list = [...syndicates];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tag.toLowerCase().includes(q) ||
          s.emblem_sigil.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [syndicates, searchQuery]);

  const topThree = useMemo(() => syndicates.slice(0, 3), [syndicates]);

  const getSigilMeta = (sigilKey: string) => {
    return SIGIL_OPTIONS.find((s) => s.id === sigilKey) || SIGIL_OPTIONS[0];
  };

  const isUserMemberOf = (syndicateId: string) => {
    return mySyndicateData?.syndicate?.id === syndicateId;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 font-mono text-sm ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
              : 'bg-red-950/90 border-red-500/50 text-red-300 shadow-red-950/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-plug-accent" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-plug-border/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/50 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-plug-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-plug-accent/10 border border-plug-accent/30 text-plug-accent text-xs font-mono font-bold tracking-wider uppercase">
              <Swords className="w-3.5 h-3.5" />
              Creator Guild Wars • Season 4: Cyber Dawn
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Creator Syndicates & <span className="text-transparent bg-clip-text bg-gradient-to-r from-plug-accent via-emerald-400 to-teal-300">Guild Wars</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Form high-conviction creator syndicates, pool referral net worth, and wage weekly algorithmic guild wars for communal dividend prize pools.
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
            <div className="text-center px-4 border-r border-slate-800">
              <div className="text-[10px] font-mono uppercase text-slate-400">Weekly Prize Pool</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">$25,000</div>
              <div className="text-[10px] text-slate-500 font-mono">Treasury Payout</div>
            </div>
            <div className="text-center px-4">
              <div className="text-[10px] font-mono uppercase text-slate-400">War Round 12</div>
              <div className="text-xl sm:text-2xl font-black text-plug-accent font-mono">3d 14h</div>
              <div className="text-[10px] text-slate-500 font-mono">Until Round Reset</div>
            </div>
          </div>
        </div>
      </div>

      {/* Communal Buff Status Badge / HUD */}
      <div className="rounded-2xl border border-plug-border bg-plug-card/90 backdrop-blur-md p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 font-black ${
              mySyndicateData?.communal_buff?.active
                ? 'bg-gradient-to-tr from-emerald-500 to-plug-accent text-plug-dark shadow-lg shadow-plug-accent/20 animate-pulse'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}>
              <Zap className="w-6 h-6 fill-current" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                  mySyndicateData?.communal_buff?.active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {mySyndicateData?.communal_buff?.badge || '⚡ +15% Guild XP Multiplier Active'}
                </span>
                {mySyndicateData?.syndicate && (
                  <span className="text-xs font-mono font-bold text-white bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded-full">
                    Guild: [{mySyndicateData.syndicate.tag}] {mySyndicateData.syndicate.name}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {mySyndicateData?.communal_buff?.description ||
                  'All syndicate members receive a passive +15% XP & commission velocity multiplier on all quests and daily actions.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mySyndicateData?.syndicate ? (
              <button
                onClick={() => setActiveTab('my-guild')}
                className="px-4 py-2 rounded-xl bg-plug-accent/20 border border-plug-accent/40 text-plug-accent text-xs font-mono font-bold hover:bg-plug-accent/30 transition-all flex items-center gap-1.5"
              >
                <span>My Syndicate HQ</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-plug-accent text-plug-dark font-black text-xs font-mono hover:scale-105 transition-transform shadow-lg shadow-plug-accent/20 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Found Syndicate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3D Rank Podiums for Top 3 Guilds */}
      {topThree.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Guild War Apex Podiums
            </h2>
            <span className="text-xs font-mono text-slate-400">Live Weekly Points</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-end">
            {/* Rank 2 - Silver Podium */}
            {topThree[1] && (
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/80 rounded-3xl p-6 text-center space-y-4 relative overflow-hidden shadow-xl hover:border-slate-500 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-400/10 rounded-full blur-xl pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-slate-300/20">
                  🥈
                </div>

                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-200 text-[10px] font-mono font-bold uppercase mb-1">
                    [{topThree[1].tag}] Rank 2 Challenger
                  </div>
                  <h3 className="text-lg font-bold text-white truncate">{topThree[1].name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Sigil: <span className="text-slate-200 font-semibold">{topThree[1].emblem_sigil}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 grid grid-cols-2 gap-2 text-left font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">War Points</div>
                    <div className="text-sm font-bold text-plug-accent">{topThree[1].weekly_score.toLocaleString()} PTS</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Members</div>
                    <div className="text-sm font-bold text-white">{topThree[1].member_count} Creators</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRoster(topThree[1])}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                  >
                    View Roster
                  </button>
                  <button
                    onClick={(e) => handleJoinSyndicate(topThree[1], e)}
                    disabled={isUserMemberOf(topThree[1].id) || isJoiningId === topThree[1].id}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      isUserMemberOf(topThree[1].id)
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                        : 'bg-plug-accent/20 hover:bg-plug-accent/30 border border-plug-accent/40 text-plug-accent'
                    }`}
                  >
                    {isUserMemberOf(topThree[1].id) ? 'Joined' : '1-Click Join'}
                  </button>
                </div>
              </div>
            )}

            {/* Rank 1 - Golden Grand Champion Podium */}
            {topThree[0] && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-plug-card to-slate-950 border-2 border-amber-400/80 rounded-3xl p-7 text-center space-y-4 relative overflow-hidden shadow-2xl shadow-amber-500/10 md:-translate-y-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
                <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 mx-auto flex items-center justify-center font-black text-3xl shadow-xl shadow-amber-400/30 ring-4 ring-amber-400/30">
                  👑
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-bold font-mono uppercase tracking-wider">
                    🏆 #1 Reigning Syndicate
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-2 truncate">
                    [{topThree[0].tag}] {topThree[0].name.replace(/^\[.*?\]\s*/, '')}
                  </h3>
                  <div className="text-xs text-amber-300/80 font-mono mt-1">
                    Emblem: <span className="font-bold">{topThree[0].emblem_sigil}</span> • 🔥 {topThree[0].streak_days}d Streak
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-amber-400/30 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left font-mono">
                  <div>
                    <div className="text-[10px] text-amber-300/60 uppercase">Dominance Score</div>
                    <div className="text-lg font-black text-amber-300">{topThree[0].weekly_score.toLocaleString()} PTS</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-300/60 uppercase">Net Worth Power</div>
                    <div className="text-lg font-black text-white">{formatUsd(topThree[0].total_net_worth_cents)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRoster(topThree[0])}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                  >
                    View Roster
                  </button>
                  <button
                    onClick={(e) => handleJoinSyndicate(topThree[0], e)}
                    disabled={isUserMemberOf(topThree[0].id) || isJoiningId === topThree[0].id}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      isUserMemberOf(topThree[0].id)
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 hover:scale-105'
                    }`}
                  >
                    {isUserMemberOf(topThree[0].id) ? 'Active Guild' : '⚡ 1-Click Join'}
                  </button>
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze Podium */}
            {topThree[2] && (
              <div className="order-3 bg-gradient-to-b from-amber-950/20 to-slate-900/90 border border-amber-700/60 rounded-3xl p-6 text-center space-y-4 relative overflow-hidden shadow-xl hover:border-amber-600 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-700/10 rounded-full blur-xl pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-700/20">
                  🥉
                </div>

                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/40 text-[10px] font-mono font-bold uppercase mb-1">
                    [{topThree[2].tag}] Rank 3 Contender
                  </div>
                  <h3 className="text-lg font-bold text-white truncate">{topThree[2].name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Sigil: <span className="text-slate-200 font-semibold">{topThree[2].emblem_sigil}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 grid grid-cols-2 gap-2 text-left font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">War Points</div>
                    <div className="text-sm font-bold text-plug-accent">{topThree[2].weekly_score.toLocaleString()} PTS</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Members</div>
                    <div className="text-sm font-bold text-white">{topThree[2].member_count} Creators</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRoster(topThree[2])}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                  >
                    View Roster
                  </button>
                  <button
                    onClick={(e) => handleJoinSyndicate(topThree[2], e)}
                    disabled={isUserMemberOf(topThree[2].id) || isJoiningId === topThree[2].id}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      isUserMemberOf(topThree[2].id)
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                        : 'bg-plug-accent/20 hover:bg-plug-accent/30 border border-plug-accent/40 text-plug-accent'
                    }`}
                  >
                    {isUserMemberOf(topThree[2].id) ? 'Joined' : '1-Click Join'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-plug-border/80 pb-4">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-plug-accent/20 text-plug-accent border border-plug-accent/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Syndicates ({syndicates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my-guild')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'my-guild'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>My Guild HQ</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>War Rules</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guild, tag, sigil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-plug-accent/60"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-plug-accent text-plug-dark font-black text-xs font-mono hover:scale-105 transition-transform shadow-md shadow-plug-accent/20 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Syndicate</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Tab: Leaderboard Directory */}
      {(activeTab === 'leaderboard' || activeTab === 'all') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSyndicates.map((syndicate, index) => {
              const sigilMeta = getSigilMeta(syndicate.emblem_sigil);
              const isUserGuild = isUserMemberOf(syndicate.id);

              return (
                <div
                  key={syndicate.id}
                  className={`bg-plug-card border rounded-3xl p-6 space-y-4 relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] ${
                    isUserGuild
                      ? 'border-plug-accent/80 shadow-lg shadow-plug-accent/10 ring-1 ring-plug-accent/40'
                      : 'border-plug-border/80 hover:border-slate-600'
                  }`}
                >
                  {/* Top Bar with Rank & Tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-black text-slate-300 flex items-center justify-center">
                        {syndicate.rank === 1 ? '🥇' : syndicate.rank === 2 ? '🥈' : syndicate.rank === 3 ? '🥉' : `#${syndicate.rank || index + 1}`}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-plug-accent text-xs font-mono font-bold">
                        [{syndicate.tag}]
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>{syndicate.streak_days}d streak</span>
                    </div>
                  </div>

                  {/* Sigil & Name */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${sigilMeta.color} flex items-center justify-center text-2xl shadow-lg ${sigilMeta.glow} shrink-0`}>
                      {sigilMeta.icon}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-black text-white text-base truncate">{syndicate.name}</h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Emblem: <span className="text-slate-300 font-bold">{syndicate.emblem_sigil}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guild Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {syndicate.description}
                  </p>

                  {/* Live Metrics Grid */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center font-mono">
                    <div>
                      <div className="text-[9px] uppercase text-slate-500">Points</div>
                      <div className="text-xs sm:text-sm font-bold text-plug-accent truncate">
                        {syndicate.weekly_score.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-slate-500">Net Worth</div>
                      <div className="text-xs sm:text-sm font-bold text-white truncate">
                        {formatUsd(syndicate.total_net_worth_cents)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-slate-500">Members</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                        {syndicate.member_count}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenRoster(syndicate)}
                      className="flex-1 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                    >
                      Roster
                    </button>
                    <button
                      onClick={(e) => handleJoinSyndicate(syndicate, e)}
                      disabled={isUserGuild || isJoiningId === syndicate.id}
                      className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isUserGuild
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                          : 'bg-plug-accent hover:bg-emerald-400 text-plug-dark font-black shadow-md shadow-plug-accent/20'
                      }`}
                    >
                      {isJoiningId === syndicate.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-plug-dark border-t-transparent rounded-full animate-spin" />
                      ) : isUserGuild ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Joined</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Join Guild</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSyndicates.length === 0 && (
            <div className="text-center py-16 bg-plug-card/40 rounded-3xl border border-plug-border">
              <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Syndicates Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No active creator syndicates match your search query. Try another keyword or create your own guild.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: My Guild HQ */}
      {activeTab === 'my-guild' && (
        <div className="space-y-6">
          {mySyndicateData?.syndicate ? (
            <div className="space-y-6">
              {/* Guild Hero Profile */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/40 border border-purple-500/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
                      {getSigilMeta(mySyndicateData.syndicate.emblem_sigil).icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
                          [{mySyndicateData.syndicate.tag}]
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Rank #{mySyndicateData.war_status.rank || '1'} in Guild Wars
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                        {mySyndicateData.syndicate.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                        {mySyndicateData.syndicate.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 font-mono">
                    <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                      <span className="text-slate-500">Your Role: </span>
                      <span className="text-plug-accent font-bold uppercase">{mySyndicateData.membership?.role || 'Member'}</span>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                      <span className="text-slate-500">Your XP Contributed: </span>
                      <span className="text-white font-bold">{mySyndicateData.membership?.contributed_xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guild Buff Perks Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-plug-card border border-plug-border rounded-3xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-plug-accent fill-current" />
                    Active Communal Buff Perks
                  </h3>
                  <div className="space-y-3">
                    {mySyndicateData.communal_buff.perks.map((perk, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-plug-card border border-plug-border rounded-3xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Guild War Season 4 Summary
                  </h3>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Round:</span>
                      <span className="text-white font-bold">Round 12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total War Score:</span>
                      <span className="text-plug-accent font-bold">{mySyndicateData.syndicate.weekly_score.toLocaleString()} PTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Syndicate Net Worth:</span>
                      <span className="text-white font-bold">{formatUsd(mySyndicateData.syndicate.total_net_worth_cents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gap to #1 Apex:</span>
                      <span className="text-amber-400 font-bold">{mySyndicateData.war_status.leaderboard_summary.user_syndicate_gap.toLocaleString()} PTS</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRoster(mySyndicateData.syndicate!)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-colors"
                  >
                    View Full Member Roster ({mySyndicateData.syndicate.member_count})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-plug-card/40 rounded-3xl border border-plug-border p-8 space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-plug-accent/10 border border-plug-accent/30 text-plug-accent mx-auto flex items-center justify-center text-3xl">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-white">You Are Not in a Syndicate</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Joining or founding a creator syndicate unlocks the communal <strong className="text-plug-accent">+15% Guild XP multiplier</strong>, weekly treasury dividends, and guild battle participation.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-all"
                >
                  Browse Guilds
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-plug-accent text-plug-dark font-mono text-xs font-black shadow-lg shadow-plug-accent/20 hover:scale-105 transition-transform"
                >
                  Found New Guild
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Guild War Rules */}
      {activeTab === 'rules' && (
        <div className="bg-plug-card border border-plug-border rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Swords className="w-6 h-6 text-plug-accent" />
              Creator Guild Wars Code & Mechanics
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Everything you need to know about point scoring, communal buffs, and weekly dividend distributions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="text-2xl">⚡</div>
              <h4 className="font-bold text-white text-sm font-mono">1. Communal +15% Buff</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every member of an active syndicate passively receives a +15% XP multiplier on daily quests, cash flow tracking, and referral activations.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="text-2xl">🏆</div>
              <h4 className="font-bold text-white text-sm font-mono">2. Weekly War Points</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Syndicate scores are calculated from all members’ combined weekly XP gains, referral volume, and total verified net worth.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="text-2xl">💰</div>
              <h4 className="font-bold text-white text-sm font-mono">3. Treasury Dividends</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                At the end of every 7-day round, the $25,000 seasonal prize pool is split between the top 3 Apex guilds based on point share.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create New Syndicate Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-plug-dark border border-plug-border rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-plug-accent flex items-center justify-center text-plug-dark font-black">
                  <Shield className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Found Creator Syndicate</h3>
                  <p className="text-xs text-slate-400 font-mono">Establish your guild flag on the global leaderboard</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSyndicate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-semibold">
                  Syndicate Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. [HYPER] Sovereign Matrix Guild"
                  value={newSyndicateName}
                  onChange={(e) => setNewSyndicateName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-plug-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-semibold">
                    Guild Tag (2-6 letters)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. HYPR"
                    value={newSyndicateTag}
                    onChange={(e) => setNewSyndicateTag(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white uppercase focus:outline-none focus:border-plug-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-semibold">
                    Emblem Sigil
                  </label>
                  <select
                    value={newSyndicateSigil}
                    onChange={(e) => setNewSyndicateSigil(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-plug-accent"
                  >
                    {SIGIL_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-semibold">
                  Guild Motto & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your syndicate's mission, viral strategy, and member requirements..."
                  value={newSyndicateDesc}
                  onChange={(e) => setNewSyndicateDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-plug-accent"
                />
              </div>

              {/* Live Preview Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-500">Live Syndicate Badge Preview</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-plug-accent flex items-center justify-center text-xl">
                    {getSigilMeta(newSyndicateSigil).icon}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">
                      [{newSyndicateTag || 'TAG'}] {newSyndicateName || 'Your Syndicate Name'}
                    </div>
                    <div className="text-[10px] text-plug-accent font-mono">
                      Emblem: {newSyndicateSigil} • Founder: {user?.display_name || 'You'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-plug-accent text-plug-dark font-mono text-xs font-black shadow-lg shadow-plug-accent/20 hover:scale-105 transition-transform flex items-center gap-2"
                >
                  {isCreating ? (
                    <div className="w-4 h-4 border-2 border-plug-dark border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Establish Syndicate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Syndicate Member Roster Modal */}
      {selectedRosterSyndicate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-plug-dark border border-plug-border rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-2xl">
                  {getSigilMeta(selectedRosterSyndicate.emblem_sigil).icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    [{selectedRosterSyndicate.tag}] {selectedRosterSyndicate.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Member Roster • {selectedRosterSyndicate.member_count} Active Creators
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRosterSyndicate(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {isLoadingRoster ? (
                <div className="text-center py-8 text-xs font-mono text-slate-400">Loading roster...</div>
              ) : rosterMembers.length > 0 ? (
                rosterMembers.map((member, idx) => (
                  <div
                    key={member.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-slate-500 font-bold">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {member.display_name}
                          {member.role === 'founder' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase font-black">
                              Founder
                            </span>
                          )}
                          {member.role === 'officer' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-400/20 text-purple-300 border border-purple-400/40 uppercase font-bold">
                              Officer
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {member.tier_title || 'Novice Plug'} • Level {member.level || 1}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-plug-accent">{member.contributed_xp?.toLocaleString()} XP</div>
                      <div className="text-[10px] text-slate-500">Contributed</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs font-mono text-slate-400">
                  No public roster entries found.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRosterSyndicate(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
