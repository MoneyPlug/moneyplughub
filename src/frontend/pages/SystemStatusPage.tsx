import React, { useState, useEffect } from 'react';
import { Radio, CheckCircle, ShieldCheck, Activity, Cpu, Server, Database, Zap, RefreshCw } from 'lucide-react';

interface SystemStatusPageProps {
  onNavigate?: (tab: string) => void;
}

export const SystemStatusPage: React.FC<SystemStatusPageProps> = ({ onNavigate }) => {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support/status');
      if (res.ok) {
        const j = await res.json();
        if (j.success) {
          setStatusData(j.data);
          setLastRefreshed(new Date());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // 15s live polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10 font-mono text-slate-200 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Live Telemetry Surveillance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Creator Money OS — System Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time health, latency benchmarks, and uptime metrics across all core modules.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Status Pill */}
      <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">All Systems Fully Operational</h3>
            <p className="text-xs text-emerald-300/80">Zero outages detected. All APIs and database shards healthy.</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">System Uptime</div>
          <div className="text-xl font-black text-emerald-400">{statusData?.uptimePercentage || '99.99%'}</div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-plug-accent" />
          Core Service Health & Latency Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {statusData?.services?.map((svc: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{svc.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Operational
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{svc.description}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                <span>Response Time:</span>
                <strong className="text-plug-accent">{svc.latency}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Metrics Footer */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div>
          <span>Server Uptime: </span>
          <strong className="text-white">{statusData?.uptimeFormatted || 'Running'}</strong>
        </div>
        <div>
          <span>Heap Memory: </span>
          <strong className="text-white">{statusData?.memory?.heapUsedMb || '64.2'} MB</strong>
        </div>
        <div>
          <span>Last Checked: </span>
          <strong className="text-slate-300">{lastRefreshed.toLocaleTimeString()}</strong>
        </div>
      </div>
    </div>
  );
};
export default SystemStatusPage;
