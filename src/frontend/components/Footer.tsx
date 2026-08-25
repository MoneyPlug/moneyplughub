import React from 'react';
import { Zap, ShieldCheck, Database, Shield, Lock, Scale, HelpCircle, Activity, Rocket, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-14 px-4 sm:px-6 lg:px-8 mt-20 relative z-20 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Col 1: Brand & Positioning */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500/40 via-amber-500/40 to-cyan-500/40 shadow-md shadow-emerald-500/20 overflow-hidden flex items-center justify-center">
              <img
                src="/moneyplughub_emblem.png"
                alt="MoneyPlugHub Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">
                MoneyPlug<span className="text-plug-accent">Hub</span>
              </span>
              <span className="text-[10px] text-plug-accent font-mono block -mt-1 font-bold">
                Creator Money OS (v1.0.0)
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            The autonomous financial operating system built specifically for creators. Unifying encrypted wealth vaults, 241ms voice banking, 5-pulse AI marketing studio, and self-hosted referral commissions.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <Database className="w-3.5 h-3.5" /> SQLite WAL Encrypted
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" /> FTC 16 CFR Part 255
            </span>
          </div>
        </div>

        {/* Col 2: Product & Architecture */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 font-mono">Product</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><button onClick={() => onNavigate?.('what-is-this')} className="hover:text-white transition-colors text-left cursor-pointer">What Is This?</button></li>
            <li><button onClick={() => onNavigate?.('how-it-works')} className="hover:text-white transition-colors text-left cursor-pointer">How It Works</button></li>
            <li><button onClick={() => onNavigate?.('pricing')} className="hover:text-white transition-colors text-left cursor-pointer">Pricing (4 Tiers)</button></li>
            <li><button onClick={() => onNavigate?.('moneyos')} className="hover:text-emerald-400 transition-colors text-left cursor-pointer">Voice MoneyOS</button></li>
            <li><button onClick={() => onNavigate?.('generate')} className="hover:text-purple-400 transition-colors text-left cursor-pointer">AI Studio (v2.0)</button></li>
            <li><button onClick={() => onNavigate?.('sigil-forge')} className="hover:text-amber-400 transition-colors text-left cursor-pointer font-bold">Sigil Forge (XP Store)</button></li>
            <li><button onClick={() => onNavigate?.('referral-hub')} className="hover:text-plug-accent transition-colors text-left cursor-pointer">Referral Hub</button></li>
          </ul>
        </div>

        {/* Col 3: Safety & Compliance */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 font-mono">Safety & Legal</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><button onClick={() => onNavigate?.('compliance')} className="hover:text-amber-400 transition-colors text-left font-medium cursor-pointer">Creator Safety & FTC</button></li>
            <li><button onClick={() => onNavigate?.('billing-terms')} className="hover:text-white transition-colors text-left cursor-pointer">Billing & Subscription</button></li>
            <li><button onClick={() => onNavigate?.('privacy')} className="hover:text-white transition-colors text-left cursor-pointer">Privacy & Data Handling</button></li>
            <li><button onClick={() => onNavigate?.('security')} className="hover:text-white transition-colors text-left cursor-pointer">Security Standards</button></li>
            <li><span className="text-[10px] text-slate-500 block pt-1">No Guaranteed Income</span></li>
          </ul>
        </div>

        {/* Col 4: Support & Status */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 font-mono">Support & Status</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><button onClick={() => onNavigate?.('help')} className="hover:text-white transition-colors text-left cursor-pointer">Help Center & FAQs</button></li>
            <li><button onClick={() => onNavigate?.('status')} className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer"><Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> Live System Status</button></li>
            <li><button onClick={() => onNavigate?.('changelog')} className="hover:text-white transition-colors text-left cursor-pointer">v1.0.0 Release Notes</button></li>
            <li><button onClick={() => onNavigate?.('changelog')} className="hover:text-sky-400 transition-colors text-left cursor-pointer">2026–2027 Roadmap</button></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
        <div>
          © {new Date().getFullYear()} Creator Money OS • MoneyPlugHub Protocol. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate?.('privacy')} className="hover:underline">Privacy</button>
          <button onClick={() => onNavigate?.('billing-terms')} className="hover:underline">Terms</button>
          <button onClick={() => onNavigate?.('compliance')} className="hover:underline">Compliance</button>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
