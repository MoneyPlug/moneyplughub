import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Check, X, ArrowRight, Zap, Lock, Gift } from 'lucide-react';

interface CreatorPlanPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatorPlanPaywallModal: React.FC<CreatorPlanPaywallModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [promoCode, setPromoCode] = useState<string>('');
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsUpgrading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'creator-monthly',
          promoCode: promoCode.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'SUCCESS') {
        setSuccessMsg('🎉 Creator Plan successfully activated!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.message || data.error || 'Failed to activate Creator Plan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while contacting billing server.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-purple-500/40 p-6 sm:p-8 shadow-2xl shadow-purple-500/20 text-white font-sans overflow-hidden">
        {/* Ambient Cosmic Shimmer */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-plug-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-plug-accent flex items-center justify-center text-slate-950 font-black shadow-lg shadow-purple-500/30">
            <Lock className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Creator Plan Required
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Unlock Creator Money OS
            </h3>
          </div>
        </div>

        {/* Value Proposition */}
        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          Sigil Points injection, 32 Master Artifacts, and autonomous ElevenLabs voice banking require an active <strong className="text-purple-300">Creator Plan ($29/mo)</strong>.
        </p>

        {/* Feature List */}
        <div className="space-y-2.5 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Direct XP & Sigil Points Store Access</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sub-250ms ElevenLabs Voice AI Financial Banking</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cryptographic SHA-256 Verifiable Creator Passport</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Unlimited Referral Conduits + 40% Commission Splits</span>
          </div>
        </div>

        {/* Promo Code Input */}
        <div className="mb-6 space-y-2">
          <label className="block text-[11px] font-mono uppercase font-bold text-slate-400">
            Have a VIP Beta Invite Code?
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Gift className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="e.g. FOUNDING50 (100% OFF)"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono uppercase"
              />
            </div>
            <button
              type="button"
              onClick={() => setPromoCode('FOUNDING50')}
              className="px-2.5 py-2 text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-colors"
            >
              Use FOUNDING50
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
            {successMsg}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSubscribe}
          disabled={isUpgrading}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-plug-accent hover:from-purple-400 hover:to-plug-accentHover text-slate-950 font-black text-sm transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isUpgrading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Upgrade to Creator Plan {promoCode.toUpperCase() === 'FOUNDING50' ? '($0.00 / Free VIP)' : '($29/mo)'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreatorPlanPaywallModal;
