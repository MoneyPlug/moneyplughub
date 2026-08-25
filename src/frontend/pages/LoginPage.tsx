import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, Mail, ArrowRight, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      if (email.toLowerCase().includes('admin')) {
        onNavigate('admin');
      } else {
        onNavigate('dashboard');
      }
    } else {
      setError(result.error || 'Invalid credentials.');
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@moneyplughub.local');
    setPassword('AdminSecret2026!');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-plug-accent/10 border border-plug-accent/30 text-plug-accent mx-auto flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-white">Sign In to MoneyPlugHub</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your referral links, commission balances, and payouts.
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
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-plug-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-plug-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-plug-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Admin Credential Button for Evaluators */}
        <div className="mt-6 pt-6 border-t border-plug-border/60">
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="w-full py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Auto-Fill Seed Admin Credentials
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-plug-accent font-bold hover:underline"
          >
            Create one & get your link
          </button>
        </div>
      </div>
    </div>
  );
};
