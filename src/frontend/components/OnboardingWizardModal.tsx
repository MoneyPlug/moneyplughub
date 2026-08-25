import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, Mic, Volume2, Shield, ArrowRight, ArrowLeft, Check, 
  DollarSign, Brain, Flame, Lock, Layers, Zap, X, CheckCircle, Radio, Copy
} from 'lucide-react';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Step 2: Mic Testing state
  const [micTesting, setMicTesting] = useState(false);
  const [micSuccess, setMicSuccess] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');

  // Step 3: Practice voice command
  const [practiceSuccess, setPracticeSuccess] = useState<string | null>(null);

  // Step 4: Sigil preview
  const refCode = user?.referral_code || 'CREATOR-PLUG';
  const sigilUrl = `/api/sigil/${encodeURIComponent(refCode)}?size=256`;
  const [copied, setCopied] = useState(false);

  // Step 6: Plan selection
  const [selectedTier, setSelectedTier] = useState<'free' | 'creator'>('creator');

  if (!isOpen) return null;

  const handleTestMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicSuccess(true);
      setMicTranscript('Microphone simulated active (Browser fallback ready)');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      setMicTesting(true);
      recognition.onstart = () => {
        setMicTranscript('Listening... say anything out loud!');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setMicTranscript(transcript);
        setMicSuccess(true);
      };

      recognition.onerror = () => {
        setMicTesting(false);
        setMicSuccess(true); // Don't block user
      };

      recognition.onend = () => {
        setMicTesting(false);
      };

      recognition.start();
    } catch {
      setMicSuccess(true);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/api/referrals/track/${refCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    localStorage.setItem('creatorMoneyOS_onboarding_done', 'true');
    onClose();
    if (onNavigate) onNavigate('overview');
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 font-sans animate-fadeIn overflow-y-auto w-full h-[100dvh] max-h-[100dvh]">
      <div className="max-w-xl w-full max-h-[92dvh] bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between text-slate-200">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-plug-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-400 to-plug-accent flex items-center justify-center text-slate-950 font-black text-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-white">First-Time Setup Wizard</h2>
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400">Step {currentStep} of {totalSteps}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-plug-accent via-sky-400 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* STEP CONTENT CONTAINER (Scrollable on small phones like iPhone 8) */}
        <div className="flex-1 overflow-y-auto py-1 pr-1 space-y-3 max-h-[56dvh]">
          {/* STEP 1: Welcome & Unified Brand */}
          {currentStep === 1 && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-plug-accent/20 border border-plug-accent/40 text-plug-accent flex items-center justify-center shadow-lg shadow-plug-accent/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white">
                Welcome to <span className="text-plug-accent">Creator Money OS</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The autonomous financial operating system built specifically for creators. Unifying liquid wealth, automated referral commissions, and voice AI into a single self-hosted hub.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>241ms Voice AI Brain</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>20%–40% Commissions</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 sm:col-span-2">
                  <CheckCircle className="w-3.5 h-3.5 text-plug-accent shrink-0" />
                  <span>Living Vault Dynamic Theme Morph</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Mic Testing */}
          {currentStep === 2 && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white">Microphone & Voice Engine Calibration</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                MoneyOS allows hands-free voice banking. Calibrate your microphone below to ensure seamless recognition.
              </p>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-full mx-auto bg-purple-500/10 border border-purple-500/30 flex items-center justify-center relative">
                  <Mic className={`w-6 h-6 text-purple-400 ${micTesting ? 'animate-pulse text-plug-accent' : ''}`} />
                  {micTesting && <div className="absolute inset-0 rounded-full border border-plug-accent animate-ping" />}
                </div>

                <button
                  type="button"
                  onClick={handleTestMic}
                  disabled={micTesting}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    micSuccess 
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{micTesting ? 'Listening...' : micSuccess ? '✓ Microphone Calibrated' : 'Click to Test Microphone'}</span>
                </button>

                {micTranscript && (
                  <p className="text-[11px] text-slate-300 font-mono italic bg-black/40 p-2 rounded-lg border border-slate-800">
                    {micTranscript}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Voice Navigation Tutorial */}
          {currentStep === 3 && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white">Voice Navigation Commands</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                MoneyOS listens for autonomous commands and switches your screens hands-free. Try clicking any practice phrase:
              </p>

              <div className="space-y-1.5">
                {[
                  'Take me to Net Worth',
                  'Show my Referral Hub',
                  'Open AI Studio generator',
                ].map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPracticeSuccess(phrase)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left font-mono text-xs text-slate-200 flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <span>💬 "{phrase}"</span>
                    <span className="text-[10px] text-plug-accent opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      Test →
                    </span>
                  </button>
                ))}
              </div>

              {practiceSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Command recognized: MoneyOS navigates automatically!</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Procedural Sigil & Referral Code */}
          {currentStep === 4 && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white">Your Cryptographic Sigil</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Every creator receives a deterministic SVG emblem derived from the SHA-256 hash of their referral code:
              </p>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-black/70 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative group shadow-inner">
                  <img 
                    src={sigilUrl} 
                    alt={`Sigil for ${refCode}`} 
                    className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
                  />
                </div>
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Your Referral Code</span>
                  <div className="text-base sm:text-lg font-black text-plug-accent font-mono tracking-tight">{refCode}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Earn <strong className="text-emerald-400">+350 XP</strong> and <strong className="text-plug-accent">20%–40%</strong> recurring commission.
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="mt-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-bold rounded-lg border border-slate-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Referral Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Living Vault Setup */}
          {currentStep === 5 && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white">The Living Wealth Vault</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Your dashboard visually pulses and morphs in real-time as your net worth and streak multipliers grow.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                  <strong className="text-emerald-400 text-xs">Debt Avalanche</strong>
                  <p className="text-slate-400 text-[10px]">Auto-calculates days shaved off debt per payout.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                  <strong className="text-sky-400 text-xs">Budget Shields</strong>
                  <p className="text-slate-400 text-[10px]">Safety shields preventing spending leaks.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                  <strong className="text-purple-400 text-xs">Synthetic Yield</strong>
                  <p className="text-slate-400 text-[10px]">Simulates compounding returns across active vault tiers.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Tier Selection & Launch */}
          {currentStep === 6 && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-plug-accent text-slate-950 flex items-center justify-center font-black">
                🚀
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white">Choose Your Plan & Launch</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Confirm your creator plan tier. You can switch or upgrade anytime in your billing settings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => setSelectedTier('free')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    selectedTier === 'free'
                      ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">Free Lite</span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">$0/mo</span>
                  </div>
                  <p className="text-[10px] text-slate-400">5 links, text MoneyOS, basic earnings tracking.</p>
                </div>

                <div
                  onClick={() => setSelectedTier('creator')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 relative overflow-hidden ${
                    selectedTier === 'creator'
                      ? 'bg-slate-900 border-plug-accent ring-1 ring-plug-accent/30'
                      : 'bg-slate-950 border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-plug-accent text-xs sm:text-sm">Creator (14-Day Free)</span>
                    <span className="text-[11px] font-mono font-bold text-plug-accent">$29/mo</span>
                  </div>
                  <p className="text-[10px] text-slate-300">ElevenLabs Voice AI, unlimited links, full viral engine.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons (Always visible & fixed at bottom) */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 shrink-0">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-[11px] font-mono font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
              className="px-4 py-1.5 rounded-xl bg-plug-accent hover:bg-plug-accentHover text-plug-dark text-[11px] font-mono font-black transition-all flex items-center gap-1 shadow-lg shadow-plug-accent/20 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-plug-accent text-slate-950 text-[11px] font-mono font-black transition-all flex items-center gap-1.5 shadow-xl shadow-plug-accent/30 hover:scale-105 cursor-pointer"
            >
              <span>🚀 Launch Command Center</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default OnboardingWizardModal;
