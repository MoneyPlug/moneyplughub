import React, { useState } from 'react';
import { Zap, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { CreatorPlanPaywallModal } from '../../../apps/moneyplughub/components/CreatorPlanPaywallModal';
import { AscensionCeremonyModal } from './AscensionCeremonyModal';

export interface PointPackResult {
  status: string;
  success: boolean;
  packId: string;
  packName: string;
  xpAdded: number;
  newXP: number;
  newLevel: number;
  tier: number;
  tierName: string;
  ascended: boolean;
  vaultShader: string;
  wealthPulse: number;
  sigilGlow: 'subtle' | 'normal' | 'supernova';
  constellationEnergy: number;
  transactionId: string;
}

export interface PointPackButtonProps {
  packId: 'starter' | 'alchemist' | 'archon' | 'sovereign' | string;
  packName: string;
  xpAmount: number;
  priceUsd: number;
  popular?: boolean;
  onSuccess?: (result: PointPackResult) => void;
}

export const PointPackButton: React.FC<Partial<PointPackButtonProps>> = ({
  packId = 'starter',
  packName = 'Starter Sigil Cache',
  xpAmount = 1000,
  priceUsd = 9.99,
  popular = false,
  onSuccess,
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState<boolean>(false);
  const [isAscensionModalOpen, setIsAscensionModalOpen] = useState<boolean>(false);
  const [ascensionData, setAscensionData] = useState<{
    tier: number;
    tierName: string;
    vaultShader?: string;
    wealthPulse?: number;
  } | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string>('');

  const handleButtonClick = async () => {
    setIsChecking(true);
    setPurchaseStatus('');

    try {
      // 1. Check Paywall status
      const checkRes = await fetch('/api/paywall/check');
      const checkData = await checkRes.json();

      if (checkData.status === 'unauthenticated') {
        window.location.href = '/?tab=login';
        return;
      }

      if (checkData.status === 'paywall') {
        // User is on Free tier -> Open Creator Plan Upgrade Paywall Modal
        setIsPaywallModalOpen(true);
        return;
      }

      // 2. User is Allowed -> Execute Point Pack Purchase
      await executePurchase();
    } catch (err: any) {
      console.error('Point pack purchase error:', err);
      setPurchaseStatus('Error connecting to server.');
    } finally {
      setIsChecking(false);
    }
  };

  const executePurchase = async () => {
    setIsChecking(true);
    try {
      const buyRes = await fetch('/api/sigil/points/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });

      const data: PointPackResult = await buyRes.json();

      if (buyRes.ok && data.status === 'SUCCESS') {
        setPurchaseStatus(`+${data.xpAdded.toLocaleString()} XP Claimed!`);

        // 1. Wealth Pulse Event
        if (data.wealthPulse != null) {
          window.dispatchEvent(new CustomEvent('moneyos:wealth_pulse_updated', { detail: data.wealthPulse }));
        }

        // 2. Vault Shader Event
        if (data.vaultShader) {
          window.dispatchEvent(new CustomEvent('moneyos:vault_shader_updated', { detail: data.vaultShader }));
        }

        // 3. Sigil Glow Event
        if (data.sigilGlow) {
          window.dispatchEvent(new CustomEvent('moneyos:sigil_glow_updated', { detail: data.sigilGlow }));
        }

        // 4. Constellation Energy Event
        if (data.constellationEnergy != null) {
          window.dispatchEvent(new CustomEvent('moneyos:constellation_energy_updated', { detail: data.constellationEnergy }));
        }

        // 5. Tier Ascension Ceremony
        if (data.ascended) {
          setAscensionData({
            tier: data.tier,
            tierName: data.tierName,
            vaultShader: data.vaultShader,
            wealthPulse: data.wealthPulse,
          });
          setIsAscensionModalOpen(true);
        }

        onSuccess?.(data);
      } else if ((data as any).error === 'PAYWALL_REQUIRED') {
        setIsPaywallModalOpen(true);
      } else {
        setPurchaseStatus((data as any).message || 'Purchase failed.');
      }
    } catch (err: any) {
      console.error('Execution error:', err);
      setPurchaseStatus('Failed to process XP injection.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <div className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
        popular 
          ? 'bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 border-purple-500/50 shadow-xl shadow-purple-500/10' 
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}>
        {popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-plug-accent text-slate-950 font-mono font-bold text-[10px] uppercase tracking-wider shadow-md">
            Most Popular
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-white text-base tracking-tight">{packName}</h4>
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
              ${(priceUsd ?? 9.99).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-plug-accent font-black text-xl mb-3 font-mono">
            <Zap className="w-5 h-5 fill-current" />
            <span>+{(xpAmount ?? 1000).toLocaleString()} XP</span>
          </div>

          <p className="text-xs text-slate-400 font-mono mb-5">
            Instant algorithmic XP boost to unlock Mythic Sigil Artifacts & elevate Tier ascension.
          </p>
        </div>

        {purchaseStatus && (
          <div className="mb-3 text-center text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{purchaseStatus}</span>
          </div>
        )}

        <button
          onClick={handleButtonClick}
          disabled={isChecking}
          className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            popular
              ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          {isChecking ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Claim +{xpAmount.toLocaleString()} XP</span>
            </>
          )}
        </button>
      </div>

      {/* Creator Plan Paywall Modal */}
      <CreatorPlanPaywallModal
        isOpen={isPaywallModalOpen}
        onClose={() => setIsPaywallModalOpen(false)}
        onSuccess={() => {
          setIsPaywallModalOpen(false);
          executePurchase();
        }}
      />

      {/* Ascension Ceremony Modal */}
      {ascensionData && (
        <AscensionCeremonyModal
          isOpen={isAscensionModalOpen}
          onClose={() => setIsAscensionModalOpen(false)}
          tier={ascensionData.tier}
          tierName={ascensionData.tierName}
          vaultShader={ascensionData.vaultShader}
          wealthPulse={ascensionData.wealthPulse}
        />
      )}
    </>
  );
};

export default PointPackButton;
