import React, { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (tab: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Free Lite",
      tag: "Get Started",
      price: "$0",
      description: "Perfect for new creators getting started with tracking.",
      features: [
        "5 referral links",
        "Basic earnings dashboard",
        "MoneyOS AI chat (text only)",
        "Commission tracking",
        "Community access"
      ],
      cta: "Start Free",
      highlight: false
    },
    {
      name: "Creator",
      tag: "Most Popular",
      price: isAnnual ? "$24" : "$29",
      period: "/mo",
      description: "Everything you need to grow your financial empire.",
      features: [
        "Everything in Free, plus:",
        "Unlimited referral links",
        "MoneyOS AI Voice (ElevenLabs)",
        "Voice navigation commands",
        "Budget & debt tools",
        "Synthetic yield simulator",
        "Cashback pack access",
        "Priority support"
      ],
      cta: "Start Creator Plan",
      highlight: true
    },
    {
      name: "Pro",
      tag: "Scale Up",
      price: isAnnual ? "$124" : "$149",
      period: "/mo",
      description: "Advanced tools for high-volume creators.",
      features: [
        "Everything in Creator, plus:",
        "Full AI Swarm Orchestrator (12 modules)",
        "Advanced net worth analytics",
        "Crypto portfolio tracking",
        "Custom Living Vault themes",
        "Multi-platform referral hub",
        "API access",
        "Dedicated account manager"
      ],
      cta: "Go Pro",
      highlight: false
    },
    {
      name: "Enterprise",
      tag: "Custom",
      price: isAnnual ? "$415+" : "$499+",
      period: "/mo",
      description: "Bespoke solutions for large creator agencies.",
      features: [
        "Everything in Pro, plus:",
        "White-label deployment",
        "Custom AI agent training",
        "Dedicated infrastructure",
        "SLA guarantees",
        "Bulk referral management",
        "Custom integrations",
        "Priority engineering support"
      ],
      cta: "Contact Sales",
      highlight: false
    }
  ];

  return (
    <div className="w-full min-h-screen bg-slate-900/50 p-6 space-y-12 text-slate-300">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white">Simple, transparent pricing</h1>
        <p className="text-lg text-slate-400">Unlock the full power of Creator Money OS. No hidden fees.</p>
        
        {/* Toggle */}
        <div className="flex items-center justify-center space-x-3 pt-6">
          <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-7 bg-plug-card border border-plug-border rounded-full flex items-center p-1 relative transition-colors duration-300"
          >
            <div className={`w-5 h-5 bg-plug-accent rounded-full transform transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm flex items-center gap-1 ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
            Annually <span className="text-xs bg-plug-accent/20 text-plug-accent px-2 py-0.5 rounded-full ml-1">2 months free</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <div 
            key={index} 
            className={`bg-plug-card rounded-2xl p-6 border flex flex-col relative transition-all duration-300 hover:-translate-y-1 ${
              plan.highlight 
                ? 'border-plug-accent shadow-[0_0_20px_rgba(var(--color-plug-accent),0.15)] ring-1 ring-plug-accent' 
                : 'border-plug-border hover:border-slate-500'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-plug-accent text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Zap size={12} className="fill-current" />
                Most Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-slate-400">{plan.period}</span>}
              </div>
              <p className="text-sm text-slate-400 mt-3">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check size={16} className={`mt-0.5 shrink-0 ${plan.highlight ? 'text-plug-accent' : 'text-slate-400'}`} />
                  <span className={i === 0 && feature.includes('Everything') ? 'font-medium text-slate-300' : 'text-slate-400'}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => onNavigate('register')}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.highlight 
                  ? 'bg-plug-accent text-white hover:bg-plug-accent/90' 
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Feature Matrix */}
      <div className="max-w-5xl mx-auto pt-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-plug-border">
                <th className="py-4 px-6 text-slate-300 font-medium">Features</th>
                <th className="py-4 px-6 text-center text-slate-300 font-medium">Free Lite</th>
                <th className="py-4 px-6 text-center text-plug-accent font-medium">Creator</th>
                <th className="py-4 px-6 text-center text-slate-300 font-medium">Pro</th>
                <th className="py-4 px-6 text-center text-slate-300 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-plug-border/50">
                <td className="py-4 px-6 text-slate-400">Referral Links</td>
                <td className="py-4 px-6 text-center text-slate-300">5</td>
                <td className="py-4 px-6 text-center text-slate-300">Unlimited</td>
                <td className="py-4 px-6 text-center text-slate-300">Unlimited</td>
                <td className="py-4 px-6 text-center text-slate-300">Unlimited</td>
              </tr>
              <tr className="border-b border-plug-border/50">
                <td className="py-4 px-6 text-slate-400">AI Chat</td>
                <td className="py-4 px-6 text-center text-slate-300">Text Only</td>
                <td className="py-4 px-6 text-center text-slate-300">Text + Voice</td>
                <td className="py-4 px-6 text-center text-slate-300">Text + Voice + Swarm</td>
                <td className="py-4 px-6 text-center text-slate-300">Custom Models</td>
              </tr>
              <tr className="border-b border-plug-border/50">
                <td className="py-4 px-6 text-slate-400">Yield Simulator</td>
                <td className="py-4 px-6 text-center"><X size={16} className="mx-auto text-slate-600" /></td>
                <td className="py-4 px-6 text-center"><Check size={16} className="mx-auto text-plug-accent" /></td>
                <td className="py-4 px-6 text-center"><Check size={16} className="mx-auto text-plug-accent" /></td>
                <td className="py-4 px-6 text-center"><Check size={16} className="mx-auto text-plug-accent" /></td>
              </tr>
              <tr className="border-b border-plug-border/50">
                <td className="py-4 px-6 text-slate-400">API Access</td>
                <td className="py-4 px-6 text-center"><X size={16} className="mx-auto text-slate-600" /></td>
                <td className="py-4 px-6 text-center"><X size={16} className="mx-auto text-slate-600" /></td>
                <td className="py-4 px-6 text-center"><Check size={16} className="mx-auto text-plug-accent" /></td>
                <td className="py-4 px-6 text-center"><Check size={16} className="mx-auto text-plug-accent" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto pt-16 pb-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-plug-card border border-plug-border rounded-xl p-6">
            <h4 className="text-white font-medium mb-2">Can I switch plans later?</h4>
            <p className="text-sm text-slate-400">Absolutely. You can upgrade or downgrade your plan at any time. Prorated charges or credits will be applied to your account automatically.</p>
          </div>
          <div className="bg-plug-card border border-plug-border rounded-xl p-6">
            <h4 className="text-white font-medium mb-2">What happens to my data if I downgrade to Free Lite?</h4>
            <p className="text-sm text-slate-400">Your historical data is safely stored. However, access to premium features and data beyond the Free tier limits will be locked until you upgrade again.</p>
          </div>
          <div className="bg-plug-card border border-plug-border rounded-xl p-6">
            <h4 className="text-white font-medium mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-slate-400">We offer a 14-day money-back guarantee on all premium plans. If you're not satisfied, just let us know within your first 14 days and we'll refund you in full.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
