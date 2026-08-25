import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, DollarSign, Copy, Check, 
  ExternalLink, Zap, Flame, ShieldCheck, ArrowRight, Layers, Bot 
} from 'lucide-react';

export const CashbackPackPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cashback-pack')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData.data);
      })
      .catch(console.error);
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const stanStoreListingCopy = `Product title:
Cashback Stack Pack — Make Your Money Back Today

Price:
$25

Thumbnail text:
$25 FLASH SALE
Make Your Money Back Today
Style: bold neon green text on black background

Product description:
Stop leaving free money on the table.
The Cashback Stack Pack gives you the exact apps, tools, and stacking strategy I use to get free money back on everyday purchases — groceries, gas, food delivery, online shopping, subscriptions, everything.
You’ll make your $25 back today, guaranteed.

Inside, you’ll get:
✅ My full cashback stack
✅ The apps I use daily
✅ How to stack rewards for maximum payout
✅ The exact setup I use
✅ Step‑by‑step instructions
✅ Bonus: How to make your $25 back today
✅ Bonus: My personal cashback workflow

Flash Sale: $25 Today Only`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Product Hero Banner */}
      <div className="relative bg-gradient-to-r from-emerald-950/60 via-plug-card to-slate-900 border-2 border-plug-accent/40 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden glow-accent">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-plug-accent/20 border border-plug-accent/40 text-plug-accent text-xs font-mono font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-current" />
              $25 Flash Sale • Make Your Money Back Today
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Cashback Stack Pack
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Stop leaving free money on the table. The exact apps, card-linking triggers, and Triple-Dip stacking workflows to claim continuous cash back on groceries, gas, food delivery, and online shopping.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 100% Guaranteed ROI
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-sky-400 font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Stanley AI Automation
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-plug-border rounded-2xl p-6 text-center w-full md:w-72 shrink-0 shadow-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Flash Sale Access</span>
            <div className="text-4xl font-black text-plug-accent mt-1 tracking-tight">$25.00</div>
            <span className="text-[11px] text-slate-500 line-through">Regular $97.00</span>

            <a
              href="https://ig.getstanley.ai/?ref=cashplugmedia"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full py-3 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold text-xs rounded-xl transition-all shadow-md shadow-plug-accent/20 flex items-center justify-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              Plug In Stanley AI Engine
            </a>
          </div>
        </div>
      </div>

      {/* Module 1: Make Your $25 Back Today */}
      <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-plug-border pb-4">
          <div>
            <span className="text-xs font-bold text-plug-accent uppercase font-mono tracking-wider">Module 01</span>
            <h2 className="text-2xl font-black text-white mt-1">Make Your $25 Back Today (Fast-Action Guide)</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
            Immediate ROI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-plug-accent text-plug-dark flex items-center justify-center font-black text-sm">
              01
            </div>
            <h3 className="font-bold text-white text-base">Receipt Scanning ($5–$10)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Download <strong>Fetch Rewards</strong> and <strong>Receipt Hog</strong>. Scan 3 receipts from the last 7 days (groceries, gas, coffee) to claim welcome bonus points.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-sky-400 text-plug-dark flex items-center justify-center font-black text-sm">
              02
            </div>
            <h3 className="font-bold text-white text-base">Gas Rebate Link ($5.00+)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open <strong>Upside</strong>, claim a gas rebate near your location (up to 25¢/gal cash back), and pay with your cashback credit card for Layer 2 stacking.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-400 text-white flex items-center justify-center font-black text-sm">
              03
            </div>
            <h3 className="font-bold text-white text-base">Portal Bonus ($10–$30)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Activate <strong>Rakuten</strong> before ordering food delivery or shopping online to instantly trigger the $10–$30 new member cashback bonus.
            </p>
          </div>
        </div>
      </div>

      {/* Module 2: The Cashback Stack List & App Directory */}
      <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-plug-border pb-4">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase font-mono tracking-wider">Module 02</span>
            <h2 className="text-2xl font-black text-white mt-1">The Cashback Stack List & Core Apps</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold font-mono">
            Active Stack
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Rakuten', role: 'Online Shopping Portal', reward: '1% - 15% Cash Back + $30 Bonus' },
            { name: 'Upside', role: 'Gas & Groceries', reward: 'Up to 25¢/gal + 10% on Dining' },
            { name: 'Fetch Rewards', role: 'Receipt Scanner', reward: 'Points for Amazon & Visa Cards' },
            { name: 'Ibotta', role: 'Grocery Rebates', reward: '$5 - $20 Instant Cash Rebates' },
            { name: 'Dosh', role: 'Card-Linked Cash Back', reward: 'Passive restaurant & hotel cash' },
            { name: 'Honey / PayPal', role: 'Browser Trigger', reward: 'Auto coupons + PayPal cash points' },
          ].map((app, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{app.name}</span>
                <span className="text-[10px] font-mono text-slate-400">{app.role}</span>
              </div>
              <p className="text-xs text-plug-accent font-mono">{app.reward}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module 3: Triple-Dip Stacking Strategy */}
      <div className="bg-gradient-to-r from-slate-900 via-plug-card to-slate-900 border border-plug-border rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-plug-accent" />
          <h2 className="text-2xl font-black text-white">The Triple-Dip Stacking Strategy</h2>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Never settle for a single cash back reward. A Triple-Dip stacks 3 separate financial layers on every standard transaction:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-plug-accent font-bold">LAYER 01: Card Rail</span>
            <p className="text-slate-400">2% – 5% Cash Back Credit Card on primary transaction</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-sky-400 font-bold">LAYER 02: Shopping Portal</span>
            <p className="text-slate-400">5% – 15% Portal activation (Rakuten / Upside)</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-amber-400 font-bold">LAYER 03: Receipt & Scan</span>
            <p className="text-slate-400">Fetch / Ibotta receipt scan point multiplier</p>
          </div>
        </div>
      </div>

      {/* Stan Store Copy-Paste Kit */}
      <div className="bg-plug-card border border-plug-border rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-plug-border pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase font-mono tracking-wider">Marketing Kit</span>
            <h2 className="text-2xl font-black text-white mt-1">Stan Store Paste-Ready Promo Copy</h2>
          </div>
          <button
            onClick={() => copyToClipboard(stanStoreListingCopy, 'stan_full')}
            className="px-3.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-xs rounded-xl transition-colors border border-indigo-500/30 flex items-center gap-1.5"
          >
            {copiedKey === 'stan_full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedKey === 'stan_full' ? 'Copied Listing Copy!' : 'Copy Full Stan Listing'}
          </button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {stanStoreListingCopy}
        </pre>
      </div>
    </div>
  );
};
