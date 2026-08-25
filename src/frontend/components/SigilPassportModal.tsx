import React, { useState, useEffect, useRef } from 'react';
import { useLivingRealm } from '../context/LivingRealmContext';
import { useGamificationXp } from '../context/GamificationXpContext';
import { 
  ShieldCheck, Sparkles, X, Download, Copy, Check, 
  ExternalLink, Share2, Award, Zap, Globe, Lock, Cpu,
  Send, MessageCircle, Twitter, Linkedin, Facebook, MessageSquare, Flame
} from 'lucide-react';
import { forgeAudio } from '../utils/forgeAudio';

export const SigilPassportModal: React.FC = () => {
  const { isPassportOpen, setIsPassportOpen, passportTargetCode, playSound } = useLivingRealm();
  const { awardXp } = useGamificationXp();
  const [passportData, setPassportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  useEffect(() => {
    if (!isPassportOpen || !passportTargetCode) return;

    const fetchPassport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/sigil/passport/${encodeURIComponent(passportTargetCode)}?t=${Date.now()}`);
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

    fetchPassport();
  }, [isPassportOpen, passportTargetCode]);

  if (!isPassportOpen) return null;

  const refLink = `${window.location.origin}/api/referrals/track/${passportTargetCode}`;
  const creatorName = passportData?.creator?.display_name || 'Creator';
  const creatorLevel = passportData?.creator?.level || 1;
  const creatorTier = passportData?.creator?.tier_title || 'Novice Plug';
  
  const shareTitle = `⚡ ${creatorName}'s Cryptographic Creator Passport [Lv. ${creatorLevel} ${creatorTier}]`;
  const shareText = `Check out my verified Cryptographic Sigil Passport on MoneyPlugHub! Join my creator syndicate and access 241ms Voice AI banking + 20-40% recurring commissions 🚀`;
  const fullPromoPitch = `${shareText}\n\nClaim your unique SVG Sigil & Starter XP here:\n${refLink}\n\n#MoneyPlugHub #CreatorEconomy #MoneyOS #Fintech #Affiliate`;

  // ── Multi-Platform Share Handlers ─────────────────────────────────────
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

  // ── PNG Export via Canvas ─────────────────────────────────────────────
  const handleExportPng = async () => {
    if (!passportData?.sigil_svg_data_uri) return;
    try {
      setIsExportingPng(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = passportData.sigil_svg_data_uri;
      await new Promise(r => img.onload = r);

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark background with gradient
      const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 512);
      grad.addColorStop(0, '#040b17');
      grad.addColorStop(1, '#02060d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Draw Sigil
      ctx.drawImage(img, 64, 64, 896, 896);

      const pngData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngData;
      a.download = `sigil_passport_${passportTargetCode}_1024x1024.png`;
      a.click();

      forgeAudio.playAscensionChord();
      awardXp(25, 'Exported 1024x1024 PNG Sigil');
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 font-sans animate-fadeIn overflow-y-auto w-full h-[100dvh]">
      <div className="max-w-2xl w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-200 overflow-hidden">
        {/* Background Hologram Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-plug-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-plug-accent to-indigo-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-plug-accent/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Cryptographic Creator Passport</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VERIFIED ✓
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {passportData?.passport_number || 'PLUG-PASSPORT-OS'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsPassportOpen(false);
              playSound('click');
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Passport Visual Card */}
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-slate-400 animate-pulse">
            Synthesizing Holographic Verification Vectors...
          </div>
        ) : passportData ? (
          <div className="space-y-6 relative z-10">
            {/* 3D Holographic Badge View */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
              {/* SVG Canvas */}
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-black/80 border border-slate-800 p-2 shrink-0 flex items-center justify-center shadow-inner relative group">
                <img
                  src={passportData.sigil_svg_data_uri}
                  alt="Passport Sigil Emblem"
                  className="w-full h-full object-contain drop-shadow-xl animate-slow-spin"
                />
              </div>

              {/* Creator Metadata */}
              <div className="space-y-2 text-center sm:text-left flex-1 min-w-0 font-mono">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                  <Award className="w-3 h-3" />
                  <span>{passportData.creator.tier_title}</span>
                </div>
                <h4 className="text-xl font-black text-white truncate">
                  {passportData.creator.display_name}
                </h4>
                <div className="text-xs text-plug-accent font-bold">
                  Code: [{passportData.creator.referral_code}]
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                  <div>
                    <span className="text-[9px] text-slate-500 block">Level:</span>
                    <strong className="text-white">Lv. {passportData.creator.level} ({passportData.creator.xp.toLocaleString()} XP)</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Annual ARR:</span>
                    <strong className="text-emerald-400">${passportData.stats.annual_arr.toLocaleString()}/yr</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipped Artifact Suite Chips */}
            {passportData.equipped_artifacts?.length > 0 && (
              <div className="space-y-2 font-mono">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                  Equipped Cosmic Artifacts:
                </span>
                <div className="flex flex-wrap gap-2">
                  {passportData.equipped_artifacts.map((art: any) => (
                    <div
                      key={art.id}
                      className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs text-slate-300"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: art.preview_accent }} />
                      <span>{art.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Multi-Platform Social Media Share Grid ──────────────── */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-plug-accent" />
                  <span>Direct Social Media Broadcast (+50 XP)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ⚡ 1-Click Viral Distribution
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono text-xs">
                {/* 𝕏 / Twitter */}
                <button
                  onClick={() => triggerSocialShare('twitter')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer group shadow-sm"
                  title="Share on X (Twitter)"
                >
                  <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">𝕏 / Twitter</span>
                </button>

                {/* Telegram */}
                <button
                  onClick={() => triggerSocialShare('telegram')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-sky-400 flex flex-col items-center gap-1.5 transition-all cursor-pointer group shadow-sm"
                  title="Share on Telegram"
                >
                  <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">Telegram</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => triggerSocialShare('whatsapp')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 flex flex-col items-center gap-1.5 transition-all cursor-pointer group shadow-sm"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">WhatsApp</span>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => triggerSocialShare('linkedin')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-blue-400 flex flex-col items-center gap-1.5 transition-all cursor-pointer group shadow-sm"
                  title="Share on LinkedIn"
                >
                  <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">LinkedIn</span>
                </button>

                {/* Reddit */}
                <button
                  onClick={() => triggerSocialShare('reddit')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 text-orange-400 flex flex-col items-center gap-1.5 transition-all cursor-pointer group shadow-sm"
                  title="Share on Reddit"
                >
                  <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">Reddit</span>
                </button>

                {/* Native OS Share */}
                <button
                  onClick={() => triggerSocialShare('native')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-purple-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer group shadow-sm"
                  title="Native Device Share"
                >
                  <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">More...</span>
                </button>
              </div>
            </div>

            {/* Cryptographic SHA-256 Integrity Seal */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono text-[10px] space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-plug-accent" /> SHA-256 Unique Seed Watermark:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(passportData.verification_hash);
                    setCopiedHash(true);
                    forgeAudio.playTick();
                    setTimeout(() => setCopiedHash(false), 2000);
                  }}
                  className="text-plug-accent hover:text-white cursor-pointer"
                >
                  {copiedHash ? 'Copied' : 'Copy Hash'}
                </button>
              </div>
              <div className="text-slate-500 truncate select-all">
                {passportData.verification_hash}
              </div>
            </div>

            {/* Action Buttons: Copy Pitch & Download Suite */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fullPromoPitch);
                  setCopiedPitch(true);
                  forgeAudio.playTick();
                  awardXp(25, 'Copied Viral Promo Pitch');
                  setTimeout(() => setCopiedPitch(false), 2000);
                }}
                className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-plug-accent" />}
                <span>{copiedPitch ? 'Pitch Copied!' : 'Copy Promo Pitch'}</span>
              </button>

              <a
                href={passportData.sigil_svg_data_uri}
                download={`sigil_passport_${passportTargetCode}.svg`}
                className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Vector SVG</span>
              </a>

              <button
                onClick={handleExportPng}
                disabled={isExportingPng}
                className="py-3 px-3 rounded-xl bg-plug-accent hover:bg-plug-accentHover text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-md shadow-plug-accent/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isExportingPng ? 'Rendering...' : 'Export 1024px PNG'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-rose-400 font-mono">
            Unable to locate creator passport records.
          </div>
        )}
      </div>
    </div>
  );
};

export default SigilPassportModal;
