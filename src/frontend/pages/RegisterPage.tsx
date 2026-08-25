import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, Mail, User, ArrowRight, Gift, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (tab: string) => void;
  initialRefCode?: string;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, initialRefCode }) => {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referrerInfo, setReferrerInfo] = useState<{ name: string; amount: number } | null>(null);
  const [isValidatingRef, setIsValidatingRef] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract referral code from URL query param on mount if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref') || initialRefCode || '';
    if (refParam) {
      setReferralCode(refParam.toUpperCase());
      validateReferralCode(refParam.toUpperCase());
    }
  }, [initialRefCode]);

  const validateReferralCode = async (code: string) => {
    if (!code || code.trim().length < 3) {
      setReferrerInfo(null);
      return;
    }
    setIsValidatingRef(true);
    try {
      const res = await fetch(`/api/auth/validate-ref/${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setReferrerInfo({
          name: data.data.referrer_name,
          amount: data.data.bonus_amount_usd,
        });
      } else {
        setReferrerInfo(null);
      }
    } catch (err) {
      setReferrerInfo(null);
    } finally {
      setIsValidatingRef(false);
    }
  };

  const handleRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setReferralCode(val);
    validateReferralCode(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await register(email, password, displayName, referralCode);
    setIsSubmitting(false);

    if (result.success) {
      onNavigate('dashboard');
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-plug-accent/10 border border-plug-accent/30 text-plug-accent mx-auto flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-white">Join MoneyPlugHub</h2>
          <p className="text-xs text-slate-400 mt-1">
            Get your instant referral code and start collecting $10 commissions.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name or Alias
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-plug-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-plug-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-plug-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Referral Code (Optional)
              </label>
              {isValidatingRef && (
                <span className="text-[10px] text-slate-400 font-mono">Checking code...</span>
              )}
            </div>
            <div className="relative">
              <Gift className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={referralCode}
                onChange={handleRefChange}
                placeholder="e.g. PLUG-XXXXX"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 uppercase font-mono focus:outline-none focus:border-plug-accent transition-colors"
              />
            </div>

            {/* Referrer Verification Notice */}
            {referrerInfo && (
              <div className="mt-2 p-2.5 rounded-xl bg-plug-accent/10 border border-plug-accent/30 text-plug-accent text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Referred by <strong>{referrerInfo.name}</strong>. $10.00 commission will be credited!
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-plug-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-plug-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Create Account & Claim Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-plug-accent font-bold hover:underline"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};
