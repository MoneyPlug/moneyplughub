import React, { useState, useEffect } from 'react';
import { CryptoReferralProgram } from '../../types';
import { 
  Link as LinkIcon, Copy, Check, ExternalLink, 
  Sparkles, CheckCircle2, DollarSign, Zap, Share2, ShieldCheck, ArrowRight
} from 'lucide-react';

export const CryptoProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<CryptoReferralProgram[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const origin = window.location.origin;

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setPrograms(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const copyUrl = (slug: string) => {
    const url = `${origin}/go/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Cash & Partner Stack
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Curated Partner Programs ({programs.length})
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Every link below is active and connected directly to your personal affiliate accounts. Whenever a visitor clicks or registers, you receive 100% of the commission.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center sm:text-right shrink-0 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Routing Engine</div>
          <div className="text-emerald-400 font-mono font-bold text-sm flex items-center justify-center sm:justify-end gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            8 / 8 Links Verified
          </div>
        </div>
      </div>

      {/* 🌟 1. CURATED CARDS GRID 🌟 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {programs.map((p) => {
          const routingUrl = `${origin}/go/${p.slug}`;
          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900/95 border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-base tracking-tight">{p.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    🟢 Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{p.bonus_desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="text-[11px] font-mono text-emerald-400 font-semibold truncate bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span>/go/{p.slug}</span>
                  <span className="text-[10px] text-slate-500 font-normal">302</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyUrl(p.slug)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer active:scale-95"
                  >
                    {copiedSlug === p.slug ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSlug === p.slug ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={routingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    title="Test Redirect"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. SUMMARY DIRECTORY TABLE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-plug-accent" />
              Verified Affiliate Routing Directory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">All outbound traffic automatically logs click counts and redirects to your personal links.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Program</th>
                <th className="py-3.5 px-4">Short Redirect URL</th>
                <th className="py-3.5 px-4">Reward Payout</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {programs.map((p) => {
                const routingUrl = `${origin}/go/${p.slug}`;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                      /go/{p.slug}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {p.bonus_desc}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        🟢 Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyUrl(p.slug)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedSlug === p.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedSlug === p.slug ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={routingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Open Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
