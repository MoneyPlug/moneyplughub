import React from 'react';
import { Lock, Shield, Database, EyeOff, CheckCircle, ArrowLeft, ArrowRight, Server } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate?: (tab: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 font-sans text-slate-200 animate-fadeIn">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          Data Architecture & Privacy Pledge
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Privacy & Data Handling Policy
        </h1>
        <p className="text-sm text-slate-400">
          Last Updated: August 2026 • Encrypted ACID Storage & Zero Data Selling Guarantee
        </p>
      </div>

      {/* Core Privacy Pledge Banner */}
      <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
          <EyeOff className="w-5 h-5" />
          <span>OUR ZERO-DATA-SELLING PLEDGE</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          We do not sell, rent, monetize, or broker your personal financial records, voice interactions, or referral analytics to advertisers, data aggregators, or third-party institutions. Your financial data exists solely to power your autonomous Creator Money OS.
        </p>
      </div>

      {/* Section 1: Data Architecture & Encryption */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-plug-accent" />
          1. Encrypted ACID Data Architecture
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            Creator Money OS stores financial transactions, budgets, debts, and referral balances using an embedded <strong>ACID-compliant SQLite engine with Write-Ahead Logging (WAL)</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <strong className="text-white">At-Rest & In-Transit Encryption:</strong>
              <p className="text-slate-400">All data streams over TLS 1.3 encryption. Passwords and credentials use salted SHA-256 / bcrypt hashes.</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <strong className="text-white">Atomic Transaction Safety:</strong>
              <p className="text-slate-400">Financial transfers and ledger balances execute atomically (all-or-nothing), preventing state corruption.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: ElevenLabs Voice Privacy & Audio Handling */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          2. Voice & Speech Recognition Privacy
        </h2>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
          <li><strong>Zero Audio Storage</strong>: Voice audio streams generated via ElevenLabs (<code>eleven_flash_v2_5</code>) are streamed ephemerally in real time and are never saved to permanent disk storage.</li>
          <li><strong>Client-Side Speech Processing</strong>: Microphone speech recognition operates directly within your browser (Web Speech API) and is only active when explicitly enabled by you.</li>
        </ul>
      </div>

      {/* Section 3: Attribution Cookies & Your Rights */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-sky-400" />
          3. 30-Day Attribution Cookies & User Data Rights
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            <strong>Attribution Cookies:</strong> When users visit your referral link (<code>/api/referrals/track/:code</code>), a lightweight 30-day first-party cookie is set to attribute signups and credit commissions accurately.
          </p>
          <p>
            <strong>Data Export & Deletion:</strong> In accordance with GDPR and CCPA, you have the right to export your complete financial ledger or request full permanent account deletion at any time.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <button
          onClick={() => onNavigate?.('billing-terms')}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Billing & Subscription Terms</span>
        </button>
        <button
          onClick={() => onNavigate?.('overview')}
          className="hover:text-plug-accent transition-colors"
        >
          Back to Command Center →
        </button>
      </div>
    </div>
  );
};
export default PrivacyPolicyPage;
