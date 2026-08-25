import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  HelpCircle, Search, ChevronDown, ChevronUp, AlertCircle, 
  Send, CheckCircle, Bug, MessageSquare, Mic, DollarSign, Shield, Zap 
} from 'lucide-react';

interface HelpCenterPageProps {
  onNavigate?: (tab: string) => void;
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Ticket Form State
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('bug_report');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const faqs = [
    {
      q: 'How do referral payouts and commissions work?',
      a: 'When someone signs up through your custom referral link (/api/referrals/track/:code), a 30-day attribution cookie is placed. You automatically earn +350 XP immediately and a 20% to 40% recurring commission on their subscription plan. Approved commissions are credited directly into your account balance in the Commission Ledger.',
      category: 'referrals',
    },
    {
      q: 'Why is microphone permission required for MoneyOS?',
      a: 'MoneyOS uses browser-native Web Speech recognition to allow hands-free voice banking and voice navigation. If the microphone is blocked, click the lock/settings icon in your browser URL bar, enable Microphone permissions for this site, and refresh.',
      category: 'voice',
    },
    {
      q: 'What is a Procedural Sigil and how is it generated?',
      a: 'Every user is assigned a unique cryptographic vector sigil derived from the SHA-256 hash of their referral code. It determines radial symmetry, glyph geometries, and color palettes deterministically. You can embed or download your sigil via /api/sigil/:code.',
      category: 'sigil',
    },
    {
      q: 'How does the 14-day free trial work for the Creator Plan?',
      a: 'You receive full access to ElevenLabs Voice AI, unlimited referral links, and advanced Living Vault instruments for 14 days with zero charge. You can cancel anytime before the 14 days conclude with 1 click in your billing settings.',
      category: 'billing',
    },
    {
      q: 'How does Creator Money OS ensure FTC compliance?',
      a: 'Our AI Studio automatically injects on-screen disclosure cues ([On-Screen: #ad | Affiliate Link]) and description footers into 100% of generated scripts, guaranteeing full FTC 16 CFR Part 255 compliance.',
      category: 'compliance',
    },
  ];

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !subject || !message) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          category,
          subject,
          message,
          user_id: user?.id || null,
        }),
      });

      if (res.ok) {
        const j = await res.json();
        setTicketSuccess(j.message);
        setSubject('');
        setMessage('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12 font-sans text-slate-200 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-plug-accent/15 border border-plug-accent/30 text-plug-accent text-xs font-mono font-bold tracking-wider uppercase">
          <HelpCircle className="w-3.5 h-3.5" />
          Creator Help Center & Knowledge Base
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          How Can We <span className="text-plug-accent">Help You</span>?
        </h1>
        <p className="text-base text-slate-400 leading-relaxed">
          Search frequently asked questions, access troubleshooting guides, or submit a direct ticket to our engineering team.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto pt-2">
          <Search className="w-4 h-4 absolute left-4 top-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search FAQs (e.g. referrals, microphone, voice AI, billing)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-plug-accent transition-colors font-mono"
          />
        </div>
      </div>

      {/* FAQs Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-plug-accent" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-white flex items-center justify-between gap-4 hover:text-plug-accent transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-slate-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Troubleshooting Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Mic className="w-4 h-4" />
            <span>Microphone Issue?</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Ensure browser permissions are set to "Allow". For best results, use Google Chrome or Microsoft Edge.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <DollarSign className="w-4 h-4" />
            <span>Missing Commission?</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Attribution cookies last 30 days. Confirm the referred user completed email verification upon signup.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>Check System Status</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            View live uptime, ElevenLabs voice latency (241ms), and SQLite WAL health on the System Status page.
          </p>
          <button
            onClick={() => onNavigate?.('status')}
            className="text-sky-400 hover:underline font-bold text-[11px] pt-1 block"
          >
            Open Status Monitor →
          </button>
        </div>
      </div>

      {/* Support Ticket / Bug Report Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 shadow-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-400" />
            Submit a Support Ticket or Bug Report
          </h2>
          <p className="text-xs text-slate-400">
            Our engineering team reviews all incoming creator tickets within 24 hours.
          </p>
        </div>

        {ticketSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{ticketSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold">Your Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@yourdomain.com"
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-plug-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-plug-accent"
              >
                <option value="bug_report">🐛 Bug Report</option>
                <option value="voice_ai">🎙️ Voice AI / Microphone</option>
                <option value="referral">💸 Referrals & Commissions</option>
                <option value="billing">💳 Billing & Invoices</option>
                <option value="feature_request">💡 Feature Request</option>
                <option value="compliance">⚖️ Compliance / Legal</option>
                <option value="other">💬 Other Inquiry</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-plug-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold">Detailed Message / Description</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide steps to reproduce the issue or details on your inquiry..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-plug-accent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-plug-accent hover:bg-plug-accentHover disabled:opacity-40 text-plug-dark font-black text-xs font-mono transition-all flex items-center gap-2 shadow-lg shadow-plug-accent/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default HelpCenterPage;
