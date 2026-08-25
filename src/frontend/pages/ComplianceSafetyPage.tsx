import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Scale, FileText, Lock, Globe, ArrowLeft } from 'lucide-react';

interface ComplianceSafetyPageProps {
  onNavigate?: (tab: string) => void;
}

export const ComplianceSafetyPage: React.FC<ComplianceSafetyPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 font-sans text-slate-200 animate-fadeIn">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Scale className="w-3.5 h-3.5" />
          Legal Disclosures & Creator Standards
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Creator Safety, Platform Compliance & Legal Disclosures
        </h1>
        <p className="text-sm text-slate-400">
          Last Updated: August 2026 • Creator Money OS (MoneyPlugHub Directive Layer)
        </p>
      </div>

      {/* Prominent No Guaranteed Income Disclaimer */}
      <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-500/40 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>IMPORTANT: NO GUARANTEED INCOME DISCLAIMER</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Creator Money OS provides financial management tools, budgeting algorithms, and a self-hosted affiliate tracking infrastructure. 
          <strong> Nothing on this platform constitutes a promise, guarantee, or representation of earnings, income, or financial success.</strong> 
          Any examples, calculations, or simulated metrics are for educational, budgeting, and illustrative purposes only. 
          Your actual results will depend entirely on your individual effort, audience, execution, market conditions, and regulatory compliance.
        </p>
      </div>

      {/* Section 1: FTC Endorsement & Affiliate Disclosure Requirements */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-plug-accent" />
          1. FTC 16 CFR Part 255 Affiliate Disclosure Standards
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          In compliance with the United States Federal Trade Commission (FTC) guidelines concerning endorsements and testimonials:
        </p>
        <div className="space-y-2 text-xs sm:text-sm text-slate-400">
          <div className="p-3 rounded-xl bg-black/40 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Clear & Conspicuous Disclosure</strong>: Creators sharing referral links must clearly disclose their affiliate relationship before the user clicks or signs up.
            </span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Mandatory Hashtag & Visual Tags</strong>: All video content (TikTok, YouTube Shorts, Instagram Reels) must include on-screen disclosures and hashtags such as <code>#ad</code>, <code>#affiliate</code>, or <code>#sponsored</code> in the first 3 lines of the caption.
            </span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-slate-800 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Automated Studio Enforcement</strong>: Our AI Studio (v2.0) automatically injects compliant disclosure cues into 100% of generated scripts and marketing assets.
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Platform Alignment & Anti-Spam Policy */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-400" />
          2. Social Platform Alignment Policy (TikTok, Meta, YouTube, X)
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          To maintain creator account longevity and adhere to social media terms of service:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-400 list-disc list-inside">
          <li><strong>No Deceptive or Get-Rich-Quick Claims</strong>: Creators are strictly prohibited from advertising guaranteed dollar amounts, fake bank balances, or unrealistic returns.</li>
          <li><strong>No Automated Spam or DM Bots</strong>: Distribution must be ethical and genuine. Automated mass-messaging, comment scraping, or bot-driven traffic is strictly prohibited.</li>
          <li><strong>Insulated SaaS Link Architecture</strong>: All referral tracking operates through professional, clean SaaS domains rather than volatile direct redirect chains.</li>
        </ul>
      </div>

      {/* Section 3: Anti-Fraud & Anti-Self-Referral Enforcement */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-rose-400" />
          3. Anti-Fraud & Self-Referral Prevention Policy
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          MoneyPlugHub maintains automated algorithmic fraud surveillance to protect the integrity of creator commissions and the network:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800">
            <strong>Self-Referral Prohibition:</strong> Users cannot refer their own accounts or alternate emails. Attempts result in automatic forfeiture of XP and commission.
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800">
            <strong>IP Rate Limiting:</strong> A maximum of 5 attribution clicks per IP per hour prevents click-flooding and cookie-stuffing abuse.
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800">
            <strong>24-Hour Deduplication:</strong> Multiple clicks from the same IP within 24 hours are deduplicated to ensure genuine conversion attribution.
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800">
            <strong>ACID Audit Log:</strong> All commission payouts, approvals, and balance adjustments are immutably logged in the system ledger.
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <button
          onClick={() => onNavigate?.('overview')}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Command Center</span>
        </button>
        <button
          onClick={() => onNavigate?.('billing-terms')}
          className="hover:text-plug-accent transition-colors"
        >
          Billing & Subscription Terms →
        </button>
      </div>
    </div>
  );
};
export default ComplianceSafetyPage;
