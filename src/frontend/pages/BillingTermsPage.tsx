import React from 'react';
import { DollarSign, Shield, CheckCircle, Clock, RefreshCw, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';

interface BillingTermsPageProps {
  onNavigate?: (tab: string) => void;
}

export const BillingTermsPage: React.FC<BillingTermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 font-sans text-slate-200 animate-fadeIn">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-plug-accent/15 border border-plug-accent/30 text-plug-accent text-xs font-mono font-bold uppercase tracking-wider">
          <DollarSign className="w-3.5 h-3.5" />
          Subscription & Billing Policies
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Billing & Subscription Terms
        </h1>
        <p className="text-sm text-slate-400">
          Last Updated: August 2026 • Transparent SaaS Terms for Creators
        </p>
      </div>

      {/* Plan Summary Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white">1. Subscription Tiers & Pricing</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3">Tier</th>
                <th className="pb-3">Monthly</th>
                <th className="pb-3">Annual (2 Mo Free)</th>
                <th className="pb-3">Trial Period</th>
                <th className="pb-3">Key Features</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 font-bold text-white">Free Lite</td>
                <td className="py-3">$0</td>
                <td className="py-3">$0</td>
                <td className="py-3">Permanent</td>
                <td className="py-3">5 Links, Basic Dashboard, Text MoneyOS</td>
              </tr>
              <tr className="text-plug-accent font-bold">
                <td className="py-3">Creator (Popular)</td>
                <td className="py-3">$29/mo</td>
                <td className="py-3">$290/yr</td>
                <td className="py-3">14 Days Free</td>
                <td className="py-3">ElevenLabs Voice AI, Debt Tools, Unlimited Links</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-white">Pro</td>
                <td className="py-3">$149/mo</td>
                <td className="py-3">$1,490/yr</td>
                <td className="py-3">7 Days Free</td>
                <td className="py-3">Full 12-Module AI Swarm, Net Worth Analytics</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-white">Enterprise</td>
                <td className="py-3">$499/mo</td>
                <td className="py-3">$4,990/yr</td>
                <td className="py-3">Custom SLA</td>
                <td className="py-3">Dedicated Instance, Custom AI Training, White-Label</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trial & Cancellation Policy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>14-Day Free Trials</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All paid plans include a risk-free trial. You will not be charged if you cancel before your trial period concludes. You retain full access to all features throughout your trial.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <RefreshCw className="w-5 h-5 text-purple-400" />
            <span>Cancel Anytime</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You may cancel your subscription at any time with 1 click in your Billing settings. Your subscription remains active until the end of your paid billing cycle.
          </p>
        </div>
      </div>

      {/* Refund Policy & Invoicing */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-white">2. Refund & Invoicing Policy</h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            <strong>Invoices & Receipts:</strong> Automated, downloadable PDF invoices with line-item VAT/sales tax breakdown are generated on each billing event in your billing portal.
          </p>
          <p>
            <strong>Refunds:</strong> If you experience technical failure or billing discrepancy, contact support within 7 days of the charge for an immediate review and refund.
          </p>
          <p>
            <strong>Zero Hidden Fees:</strong> We do not charge transaction surcharges, setup fees, or hidden migration costs. What you see is what you pay.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <button
          onClick={() => onNavigate?.('compliance')}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Compliance & Safety</span>
        </button>
        <button
          onClick={() => onNavigate?.('privacy')}
          className="hover:text-plug-accent transition-colors"
        >
          Privacy & Data Handling →
        </button>
      </div>
    </div>
  );
};
export default BillingTermsPage;
