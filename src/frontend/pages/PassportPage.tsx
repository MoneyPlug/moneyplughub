import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLivingRealm } from '../context/LivingRealmContext';
import { useGamificationXp } from '../context/GamificationXpContext';
import { NiagaraParticleCanvas } from '../components/NiagaraParticleCanvas';
import { forgeAudio } from '../utils/forgeAudio';
import { 
  ShieldCheck, Sparkles, Download, Copy, Check, 
  Share2, Award, Globe, Cpu,
  Send, MessageCircle, Twitter, Linkedin, Flame,
  ArrowLeft, RefreshCw, Volume2, VolumeX
} from 'lucide-react';

interface PassportPageProps {
  onNavigate?: (tab: string) => void;
  targetCode?: string;
}

export const PassportPage: React.FC<PassportPageProps> = ({ onNavigate, targetCode }) => {
  const { user } = useAuth();
  const { awardXp } = useGamificationXp();

  const codeToView = targetCode || user?.referral_code || 'ADMIN-PLUG';
  const [passportData, setPassportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(forgeAudio.getMuted());

  // 3D Card Tilt Parallax State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const fetchPassport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sigil/passport/${encodeURIComponent(codeToView)}?t=${Date.now()}`);
      if (res.ok) {
        const j = await res.json();
        if (j.success) {
          setPassportData(j.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch passport:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassport();
  }, [codeToView]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / (rect.height / 2)) * -10;
    const tiltY = (x / (rect.width / 2)) * 10;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const refLink = `${window.location.origin}/api/referrals/track/${codeToView}`;
  const creatorName = passportData?.creator?.display_name || 'Creator';
  const creatorLevel = passportData?.creator?.level || 1;
  const creatorTier = passportData?.creator?.tier_title || 'Novice Plug';
  
  const shareTitle = `⚡ ${creatorName}'s Cryptographic Creator Passport [Lv. ${creatorLevel} ${creatorTier}]`;
  const shareText = `Check out my verified Cryptographic Sigil Passport on MoneyPlugHub! Join my creator syndicate and access 241ms Voice AI banking + 20-40% recurring commissions 🚀`;
  const fullPromoPitch = `${shareText}\n\nClaim your unique SVG Sigil & Starter XP here:\n${refLink}\n\n#MoneyPlugHub #CreatorEconomy #MoneyOS #Fintech #Affiliate`;

  const triggerSocialShare = (platform: 'twitter' | 'telegram' | 'whatsapp' | 'linkedin' | 'facebook' | 'reddit' | 'native') => {
    forgeAudio.playTick();
    awardXp(50, `Shared Passport to ${platform.toUpperCase()}`);

    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: refLink,
      }).catch(() => {});
      return;
    }

    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(refLink)}&hashtags=MoneyPlugHub,CreatorMoneyOS,Fintech`;
    } else if (platform === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${refLink}`)}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refLink)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refLink)}`;
    } else if (platform === 'reddit') {
      shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(refLink)}&title=${encodeURIComponent(shareTitle)}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
  };

  const handleExportPng = async () => {
    if (!passportData?.sigil_svg_data_uri) return;
    try {
      setIsExportingPng(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = passportData.sigil_svg_data_uri;
      await new Promise(r => img.onload = r);

      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const grad = ctx.createRadialGradient(1024, 1024, 100, 1024, 1024, 1024);
      grad.addColorStop(0, '#040b17');
      grad.addColorStop(1, '#02040a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 2048);

      ctx.drawImage(img, 128, 128, 1792, 1792);

      const pngData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngData;
      a.download = `sigil_passport_${codeToView}_2048x2048.png`;
      a.click();

      forgeAudio.playAscensionChord();
      awardXp(25, 'Exported 2048x2048 PNG Sigil');
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#02050e] text-slate-100 overflow-hidden flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Niagara Particle Space Canvas */}
      <NiagaraParticleCanvas
        tier={6}
        accentColor="#06b6d4"
        particleCount={75}
        speed={0.4}
        interactive={true}
      />

      {/* Atmospheric Radial Nebulae */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-600/15 via-purple-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Floating Action Header */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => {
                forgeAudio.playTick();
                onNavigate('sigil-forge');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-mono transition-all backdrop-blur-md cursor-pointer group shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Sigil Forge</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Holographic Protocol v5.0</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextMuted = !isAudioMuted;
              forgeAudio.setMuted(nextMuted);
              setIsAudioMuted(nextMuted);
            }}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition-all backdrop-blur-md cursor-pointer"
            title={isAudioMuted ? 'Unmute Solfeggio Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={() => {
              forgeAudio.playCosmicRoll();
              fetchPassport();
            }}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition-all backdrop-blur-md cursor-pointer"
            title="Refresh Verification"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Cinematic Showcase Hero */}
      <main className="relative z-20 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center animate-spin">
              <Sparkles className="w-8 h-8 text-cyan-300" />
            </div>
            <p className="text-sm font-mono text-cyan-300 animate-pulse">
              Synthesizing Cryptographic Vector Artifacts...
            </p>
          </div>
        ) : passportData ? (
          <div className="w-full space-y-8 animate-fadeIn">
            {/* 3D Holographic Passport Card */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
              className="relative w-full rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden group"
            >
              {/* Prismatic Border Glare */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Massive Vector Sigil Visual */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-black/90 border-2 border-cyan-500/30 p-3 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative overflow-hidden group-hover:border-cyan-400 transition-colors">
                    <img
                      src={passportData.sigil_svg_data_uri}
                      alt="Creator Sigil Emblem"
                      className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer"
                      onClick={() => {
                        forgeAudio.playLaserPulse();
                        awardXp(10, 'Inspected Hologram');
                      }}
                    />
                    <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      SHA-256 ✓
                    </div>
                  </div>
                </div>

                {/* Passport Creator Info & Telemetry */}
                <div className="flex-1 text-center lg:text-left space-y-4 font-mono w-full">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>OFFICIALLY VERIFIED</span>
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/40 flex items-center gap-1.5 shadow-sm">
                      <Award className="w-3.5 h-3.5" />
                      <span>{passportData.creator.tier_title}</span>
                    </span>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                      {passportData.creator.display_name}
                    </h1>
                    <p className="text-xs sm:text-sm text-cyan-400 font-bold mt-1">
                      PASSPORT ID: [{passportData.passport_number}]
                    </p>
                  </div>

                  {/* Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block uppercase">Level:</span>
                      <strong className="text-white text-sm">Lv. {passportData.creator.level}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block uppercase">Reward XP:</span>
                      <strong className="text-cyan-300 text-sm">{passportData.creator.xp.toLocaleString()} XP</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block uppercase">Referrals:</span>
                      <strong className="text-white text-sm">{passportData.stats.active_referrals}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block uppercase">Annual ARR:</span>
                      <strong className="text-emerald-400 text-sm">${passportData.stats.annual_arr.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Equipped Cosmic Artifact Suite */}
                  {passportData.equipped_artifacts?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-2 text-left">
                        Equipped Visual Artifacts:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {passportData.equipped_artifacts.map((art: any) => (
                          <div
                            key={art.id}
                            className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300"
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: art.preview_accent }} />
                            <span>{art.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Social Broadcast & Quick Action Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Social Media Viral Hub */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>Viral Social Media Broadcast</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    ⚡ +50 XP Reward
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono text-xs">
                  <button
                    onClick={() => triggerSocialShare('twitter')}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Share on X"
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="text-[10px]">𝕏 Post</span>
                  </button>
                  <button
                    onClick={() => triggerSocialShare('telegram')}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-sky-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Share on Telegram"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-[10px]">Telegram</span>
                  </button>
                  <button
                    onClick={() => triggerSocialShare('whatsapp')}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-[10px]">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => triggerSocialShare('linkedin')}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-blue-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-[10px]">LinkedIn</span>
                  </button>
                  <button
                    onClick={() => triggerSocialShare('reddit')}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 text-orange-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Share on Reddit"
                  >
                    <Flame className="w-4 h-4" />
                    <span className="text-[10px]">Reddit</span>
                  </button>
                  <button
                    onClick={() => triggerSocialShare('native')}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-purple-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="More Share Options"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-[10px]">More...</span>
                  </button>
                </div>
              </div>

              {/* Export & Tracking Link Actions */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4 backdrop-blur-xl flex flex-col justify-between font-mono">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Your Viral Tracking URL:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(refLink);
                        setCopiedLink(true);
                        forgeAudio.playTick();
                        awardXp(15, 'Copied Tracking URL');
                        setTimeout(() => setCopiedLink(false), 2500);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 truncate select-all">
                    {refLink}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(fullPromoPitch);
                      setCopiedPitch(true);
                      forgeAudio.playAscensionChord();
                      awardXp(20, 'Copied Viral Promo Pitch');
                      setTimeout(() => setCopiedPitch(false), 2500);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPitch ? 'Pitch Copied!' : 'Copy Viral Pitch'}</span>
                  </button>

                  <button
                    onClick={handleExportPng}
                    disabled={isExportingPng}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPng ? 'Exporting...' : 'Export 2048px PNG'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cryptographic Verification Hash Bar */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2 truncate max-w-full">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-500 shrink-0">SHA-256 SEED:</span>
                <span className="text-slate-300 truncate">{passportData.verification_hash}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(passportData.verification_hash);
                  setCopiedHash(true);
                  forgeAudio.playTick();
                  setTimeout(() => setCopiedHash(false), 2500);
                }}
                className="text-cyan-400 hover:text-cyan-300 text-xs shrink-0 cursor-pointer flex items-center gap-1"
              >
                {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'Hash Copied!' : 'Copy Hash'}</span>
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs font-mono text-slate-500 border-t border-slate-800/80">
        MoneyPlugHub Sovereign Protocol • Encrypted & Preserved in Osmium Ledger
      </footer>
    </div>
  );
};