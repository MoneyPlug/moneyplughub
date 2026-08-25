import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, Plus, Trash2, Copy, Check, Shield, AlertCircle, Sparkles, X, Lock } from 'lucide-react';
import { forgeAudio } from '../utils/forgeAudio';

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  scope: string;
  created_at: string;
  last_used_at?: string;
}

export const ApiKeyManagerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScope, setKeyScope] = useState('read_write');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/primordia/keys');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setKeys(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setNewlyCreatedKey(null);
    }
  }, [isOpen]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      const res = await fetch('/api/primordia/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim(), scope: keyScope }),
      });

      const json = await res.json();
      if (json.success) {
        setNewlyCreatedKey(json.data.apiKey);
        setKeyName('');
        forgeAudio.playCosmicRoll();
        fetchKeys();
      } else {
        setToast(json.error || 'Failed to generate key');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const res = await fetch(`/api/primordia/keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        forgeAudio.playTick();
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    forgeAudio.playTick();
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                API Key Management & External Telemetry
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Scoped authentication keys for external agent pipelines & SDK calls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Newly Created Secret Key Banner */}
        {newlyCreatedKey && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-2 relative z-10 animate-bounceOnce">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
              <Sparkles className="w-4 h-4" />
              <span>KEY GENERATED — SAVE IMMEDIATELY</span>
            </div>
            <p className="text-[11px] text-slate-300">
              For security, this secret token is only displayed once and cannot be retrieved again:
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30 font-mono text-xs text-emerald-300">
              <span className="truncate flex-1">{newlyCreatedKey}</span>
              <button
                onClick={() => copyToClipboard(newlyCreatedKey)}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold flex items-center gap-1 shrink-0 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Create Key Form */}
        <form onSubmit={handleGenerateKey} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative z-10">
          <span className="text-xs font-mono font-bold uppercase text-slate-400 block">
            Generate New Scoped Key
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Key Name (e.g. Runway_Worker_Node_1)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="sm:col-span-7 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <select
              value={keyScope}
              onChange={(e) => setKeyScope(e.target.value)}
              className="sm:col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
            >
              <option value="read_write">Read / Write</option>
              <option value="read_only">Read Only</option>
              <option value="telemetry_only">Telemetry Only</option>
            </select>
            <button
              type="submit"
              className="sm:col-span-2 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-cyan-500/20 transition-all font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              Create
            </button>
          </div>
        </form>

        {/* Existing Keys Table */}
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-mono font-bold uppercase text-slate-400 block">
            Active Keys ({keys.length})
          </span>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {keys.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No active API keys created yet.
              </div>
            ) : (
              keys.map((k) => (
                <div
                  key={k.id}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{k.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400 uppercase">
                        {k.scope}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Prefix: <code className="text-slate-300">{k.key_prefix}</code> • Created: {new Date(k.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeKey(k.id)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all shrink-0"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold border border-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
