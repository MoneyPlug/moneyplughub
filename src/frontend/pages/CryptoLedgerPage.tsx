import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { CryptoWallet, CryptoLedgerTx, CryptoCurrency } from '../../types';
import { 
  Wallet, Send, ArrowDownLeft, ArrowUpRight, Copy, 
  Check, Sparkles, ShieldCheck, Database, Bitcoin, ExternalLink 
} from 'lucide-react';

export const CryptoLedgerPage: React.FC = () => {
  const { token, refreshUser } = useAuth();
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [ledger, setLedger] = useState<CryptoLedgerTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency>('USDC');
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchCryptoData = async () => {
    if (!token) return;
    try {
      // 1. Wallets
      const wRes = await fetch('/api/crypto/wallets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData.success) setWallets(wData.data);
      }

      // 2. Ledger
      const lRes = await fetch('/api/crypto/ledger', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (lRes.ok) {
        const lData = await lRes.json();
        if (lData.success) setLedger(lData.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
  }, [token]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !transferAmount || !recipientAddress) return;

    try {
      const res = await fetch('/api/crypto/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currency: selectedCurrency,
          amount: parseFloat(transferAmount),
          recipient_address: recipientAddress,
          notes: transferNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast(data.message);
        setShowTransferModal(false);
        setTransferAmount('');
        setRecipientAddress('');
        setTransferNotes('');
        await fetchCryptoData();
        await refreshUser();
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast(data.error || 'Transfer failed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const totalCryptoUsd = wallets.reduce((acc, w) => acc + w.usd_value_cents, 0);
  const formatUsd = (cents: number = 0) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-plug-card border border-plug-border p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Multi-Asset Crypto Ledger
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-plug-accent/20 text-plug-accent text-xs font-mono font-bold">
              SHA256 Verifiable
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Durable on-disk ledger of all cryptocurrency balances, task rewards, and blockchain transfers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2.5 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-bold text-xs rounded-xl transition-all shadow-md shadow-plug-accent/20 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            Send Crypto (+50 XP)
          </button>
        </div>
      </div>

      {/* Wallets Multi-Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {wallets.map((w) => (
          <div key={w.id} className="bg-plug-card border border-plug-border rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-white">
                {w.currency}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {w.currency === 'USDC' ? '$1.00' : w.currency === 'SOL' ? '$150' : w.currency === 'BTC' ? '$65K' : w.currency === 'ETH' ? '$3.5K' : '$0.10'}
              </span>
            </div>

            <div>
              <div className="text-xl font-black text-white font-mono">
                {w.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })} {w.currency}
              </div>
              <div className="text-xs text-emerald-400 font-mono mt-0.5">
                ≈ {formatUsd(w.usd_value_cents)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono truncate flex items-center justify-between">
              <span>{w.address.substring(0, 10)}...</span>
              <button onClick={() => copyToClipboard(w.address, w.id)} className="hover:text-white">
                {copiedHash === w.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Transactions Table */}
      <div className="bg-plug-card border border-plug-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-plug-border/80 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-plug-accent" />
            Immutable Crypto Ledger Transactions ({ledger.length})
          </h3>
          <span className="text-xs font-mono text-slate-500">Durable SQLite WAL Sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-plug-border/50">
              <tr>
                <th className="py-3 px-4">Tx Hash (SHA256)</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">USD Valuation</th>
                <th className="py-3 px-4">Recipient / Sender</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plug-border/40 text-slate-300">
              {ledger.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono text-[11px] text-plug-accent flex items-center gap-1.5">
                    <span>{tx.tx_hash.substring(0, 16)}...</span>
                    <button onClick={() => copyToClipboard(tx.tx_hash, tx.id)} className="text-slate-500 hover:text-white">
                      {copiedHash === tx.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-mono uppercase text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tx.tx_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {tx.amount} {tx.currency}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {formatUsd(tx.usd_value_cents)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                    {tx.to_address.substring(0, 16)}...
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Send Crypto & Execute Ledger (+50 XP)">
        <form onSubmit={handleTransfer} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Asset</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as CryptoCurrency)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-plug-accent"
            >
              <option value="USDC">USDC (USD Coin)</option>
              <option value="SOL">SOL (Solana)</option>
              <option value="BTC">BTC (Bitcoin)</option>
              <option value="ETH">ETH (Ethereum)</option>
              <option value="MPH">MPH (MoneyPlugHub Utility Token)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Transfer Amount</label>
            <input
              type="number"
              step="any"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.5"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-plug-accent"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Recipient Public Address</label>
            <input
              type="text"
              required
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x71C... or Solana Address"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-plug-accent"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Memo / Notes (Optional)</label>
            <input
              type="text"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="e.g. Peer Stash Settlement"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-plug-accent"
            />
          </div>

          <div className="p-3 rounded-xl bg-plug-accent/10 border border-plug-accent/20 text-plug-accent text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>You will earn <strong>+50 XP</strong> upon transaction broadcast!</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-plug-accent hover:bg-plug-accentHover text-plug-dark font-extrabold rounded-xl transition-all shadow-md"
          >
            Broadcast Ledger Transaction
          </button>
        </form>
      </Modal>
    </div>
  );
};
