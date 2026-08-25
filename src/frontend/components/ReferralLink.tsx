import React, { useState } from 'react';
import { Copy, Check, Share2, QrCode, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { useGamificationXp } from '../context/GamificationXpContext';

interface ReferralLinkProps {
  referralCode: string;
  commissionRateUsd: number;
}

export const ReferralLink: React.FC<ReferralLinkProps> = ({ referralCode, commissionRateUsd }) => {
  const { awardXp } = useGamificationXp();
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const origin = window.location.origin;
  const referralLink = `${origin}/register?ref=${referralCode}`;

  const handleCopy = (e?: React.MouseEvent) => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    awardXp(25, 'Referral Link Copied! 🚀', undefined, e ? { x: e.clientX, y: e.clientY } : undefined);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = encodeURIComponent(
    `Join MoneyPlugHub and start earning $${commissionRateUsd.toFixed(2)} per referral! Sign up with my link:`
  );

  return (
    <div className="bg-plug-card border border-plug-border rounded-2xl p-6 glow-card relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-plug-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-plug-accent/20 text-plug-accent uppercase tracking-wide">
              Active Referral Channel
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Earn ${commissionRateUsd.toFixed(2)} / signup
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Your Personal Referral Link</h3>
        </div>

        <button
          onClick={() => setShowQrModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4 text-plug-accent" />
          Show QR Code
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2">
        <div className="flex-1 flex items-center px-3 py-2 text-sm font-mono text-slate-200 overflow-x-auto select-all whitespace-nowrap scrollbar-none">
          {referralLink}
        </div>
        <button
          onClick={(e) => handleCopy(e)}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 ${
            copied
              ? 'bg-emerald-500 text-plug-dark shadow-md shadow-emerald-500/20'
              : 'bg-plug-accent hover:bg-plug-accentHover text-plug-dark shadow-md shadow-plug-accent/20'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied to Clipboard!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Referral Link
            </>
          )}
        </button>
      </div>

      {/* Share shortcuts */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
        <span className="flex items-center gap-1 font-semibold text-slate-300">
          <Share2 className="w-3.5 h-3.5" /> Instant Share:
        </span>
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(referralLink)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
        >
          X / Twitter
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          Telegram
        </a>
        <a
          href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(referralLink)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          WhatsApp
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent('Join me on MoneyPlugHub')}&body=${shareText}%0A%0A${encodeURIComponent(referralLink)}`}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          Email
        </a>
      </div>

      {/* QR Code Modal */}
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="Scan & Join MoneyPlugHub">
        <div className="flex flex-col items-center text-center p-4 space-y-4">
          <div className="p-4 bg-white rounded-2xl shadow-xl">
            {/* Quick SVG QR code visualizer based on Google Charts API for instant, zero-dependency high-res rendering */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`}
              alt="Referral QR Code"
              className="w-48 h-48 mx-auto"
              onError={(e) => {
                // Fallback visual if offline
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="font-bold text-white text-base">Referral Code: <span className="font-mono text-plug-accent">{referralCode}</span></div>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Direct friends to scan this code with their smartphone camera to automatically apply your referral reward.
            </p>
          </div>
          <button
            onClick={(e) => handleCopy(e)}
            className="w-full py-2.5 bg-plug-accent text-plug-dark font-bold text-xs rounded-xl hover:bg-plug-accentHover transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Copied!' : 'Copy Direct URL'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
