import React from 'react';
import { 
  CheckCircle, ArrowRight, UserPlus, Wallet, Mic, 
  DollarSign, Sparkles, Zap
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate?: (tab: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Sign Up for Free in 10 Seconds',
      icon: UserPlus,
      color: 'from-emerald-400 to-teal-500',
      description:
        'Create your account with just a username and email. No credit card required. You get instant access to your full dashboard and AI voice assistant.',
      details: ['100% Free starter access', 'Instant setup', 'No credit card needed'],
    },
    {
      num: '02',
      title: 'See All Your Money in One Place',
      icon: Wallet,
      color: 'from-sky-400 to-blue-500',
      description:
        'Enter your cash balances, credit card debts, and monthly bills. Your net worth and budget automatically calculate and stay up to date in real time.',
      details: ['Total cash & net worth at a glance', 'Credit card payoff calculator', 'Monthly spending tracker'],
    },
    {
      num: '03',
      title: 'Talk to MoneyOS Hands-Free',
      icon: Mic,
      color: 'from-purple-400 to-indigo-500',
      description:
        'Speak naturally to your AI financial companion. Tell it to move money between accounts, log spending, check your balances, or switch pages without clicking.',
      details: ['Natural two-way voice conversations', 'Hands-free money transfers', 'Instant budgeting advice'],
    },
    {
      num: '04',
      title: 'Share Your Link & Earn Real Cash',
      icon: DollarSign,
      color: 'from-amber-400 to-yellow-500',
      description:
        'Copy your custom invite link and share it on TikTok, YouTube, Instagram, or with friends. Earn $10 instant cash per referral plus 20% to 40% monthly commissions.',
      details: ['$10 cash for every friend who joins', '20% to 40% monthly recurring income', 'Real-time earnings tracking'],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16 space-y-16 font-sans text-slate-200 animate-fadeIn">
      {/* ── Header ── */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-plug-accent/15 border border-plug-accent/30 text-plug-accent text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Simple 4-Step Guide
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          How <span className="text-plug-accent">MoneyPlugHub</span> Works
        </h1>
        <p className="text-base text-slate-300">
          Everything you need to manage your money, talk to your AI assistant, and earn extra income in 4 easy steps.
        </p>
      </div>

      {/* ── Steps Grid ── */}
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center shadow-xl"
            >
              {/* Step Number & Icon */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="font-mono text-3xl font-black text-slate-600">
                  {step.num}
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-slate-950 flex items-center justify-center font-bold shadow-lg`}>
                  <Icon className="w-7 h-7" />
                </div>
              </div>

              {/* Step Info */}
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {step.details.map((d, dIdx) => (
                    <span
                      key={dIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-950/80 border border-slate-800 text-slate-300 font-medium"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Call to Action ── */}
      <div className="text-center p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 max-w-xl mx-auto">
        <h3 className="text-2xl font-black text-white">Ready to take control of your money?</h3>
        <p className="text-sm text-slate-400">
          Get started for free today and talk to MoneyOS in seconds.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate?.('overview')}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-plug-accent hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm transition-all shadow-xl hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
