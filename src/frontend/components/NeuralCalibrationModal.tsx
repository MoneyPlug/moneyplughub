import React, { useState } from 'react';
import { useAdaptiveProfile } from '../context/AdaptiveProfileContext';
import { useLivingRealm } from '../context/LivingRealmContext';
import { 
  Sparkles, X, ChevronRight, Check, Rocket, ShieldCheck, 
  Compass, Zap, Crown, Radio, Brain, Gauge, Volume2
} from 'lucide-react';

export const NeuralCalibrationModal: React.FC = () => {
  const { profile, isCalibrationModalOpen, setIsCalibrationModalOpen, submitCalibration } = useAdaptiveProfile();
  const { playSound } = useLivingRealm();

  const [step, setStep] = useState<number>(1);
  const [ambition, setAmbition] = useState<string>('growth');
  const [rhythm, setRhythm] = useState<string>('sprinter');
  const [voicePreference, setVoicePreference] = useState<string>('tactical');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedProfile, setCompletedProfile] = useState<any>(null);

  if (!isCalibrationModalOpen) return null;

  const handleFinish = async () => {
    setIsSubmitting(true);
    playSound('ascension');
    try {
      await submitCalibration({ ambition, rhythm, voicePreference });
      setCompletedProfile({
        ambition,
        rhythm,
        voicePreference,
      });
      setStep(4); // Reveal Step
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmblemIcon = (emblemName: string) => {
    switch (emblemName) {
      case 'Rocket': return <Rocket className="w-8 h-8 text-amber-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-8 h-8 text-emerald-400" />;
      case 'Compass': return <Compass className="w-8 h-8 text-purple-400" />;
      case 'Zap': return <Zap className="w-8 h-8 text-cyan-400" />;
      default: return <Crown className="w-8 h-8 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn font-sans">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg font-black">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-extrabold text-base flex items-center gap-2">
                <span>Neural Calibration Matrix</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                  Bespoke Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">Customizes MoneyOS interface & voice to your exact operating rhythm</p>
            </div>
          </div>
          <button
            onClick={() => setIsCalibrationModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Tracker */}
        {step <= 3 && (
          <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span>Step {step} of 3</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                {step === 1 ? 'Primary Ambition' : step === 2 ? 'Execution Rhythm' : 'Voice Resonance'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Passive Telemetry: <strong>{profile?.actionCount || 0}/5</strong> Actions</span>
            </div>
          </div>
        )}

        {/* Body Steps */}
        <div className="p-6">
          {/* Step 1: Ambition */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm">1. What is your primary objective inside MoneyPlugHub?</h3>
                <p className="text-xs text-slate-400">This prioritizes your default command center modules.</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'growth', title: 'Scale Affiliate Revenue & Viral Creator Funnels', desc: 'Prioritizes 5-Pulse AI Studio & 2026 Contextual Referral Web', icon: Rocket, color: 'text-amber-400' },
                  { id: 'vault', title: 'Eliminate Debt & Bulletproof Net Worth', desc: 'Prioritizes Debt Avalanche, Budget Shields & Living Vault Ledger', icon: ShieldCheck, color: 'text-emerald-400' },
                  { id: 'alchemist', title: 'Forge Cryptographic Sigils & Digital Artifacts', desc: 'Prioritizes 3D Sigil Forge, Creator Passport & Chamber Ascension', icon: Compass, color: 'text-purple-400' },
                  { id: 'quant', title: 'Autonomous Crypto Yield & Rapid Execution', desc: 'Prioritizes Multi-Asset Ledgers & High-Velocity Yield Simulators', icon: Zap, color: 'text-cyan-400' },
                  { id: 'sovereign', title: 'Build a Multi-Hyphenate Financial Empire', desc: 'Balanced master command center spanning all wealth chambers', icon: Crown, color: 'text-emerald-400' },
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSelected = ambition === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setAmbition(opt.id); playSound('click'); }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-800/90 border-emerald-400/80 shadow-lg shadow-emerald-500/10' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${opt.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-xs">{opt.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => { setStep(2); playSound('click'); }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Execution Rhythm */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm">2. How do you prefer to interact and take action?</h3>
                <p className="text-xs text-slate-400">Calibrates AI voice velocity and quick-action tooltips.</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'sprinter', title: 'Kinetic Sprinter (Fast Bursts & High Velocity)', desc: 'Rapid 2-minute tasks, punchy feedback, high-energy pace (1.12x)' },
                  { id: 'steady', title: 'Disciplined Builder (Calm & Methodical)', desc: 'Deep financial metrics, steady compounding, calm cadence (0.95x)' },
                  { id: 'hands_free', title: 'Hands-Free Voice Commander (Zero Manual Entry)', desc: 'Direct voice banking commands, automated autonomous execution' },
                ].map(opt => {
                  const isSelected = rhythm === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setRhythm(opt.id); playSound('click'); }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-800/90 border-emerald-400/80 shadow-lg shadow-emerald-500/10' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="text-white font-bold text-xs">{opt.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{opt.desc}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => { setStep(1); playSound('click'); }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => { setStep(3); playSound('click'); }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Voice Resonance */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm">3. What voice persona should MoneyOS use with you?</h3>
                <p className="text-xs text-slate-400">Sets your custom vocal synthesis preset & ambient soundscape.</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'tactical', title: 'Tactical Creator Strategist', desc: 'Direct, energetic, MRR-focused with Cyber Pulse telemetry bed', soundscape: 'Cyber Pulse' },
                  { id: 'guardian', title: 'Calm Financial Guardian', desc: 'Grounding, authoritative clarity with 48Hz Sub-Bass Vault Hum', soundscape: 'Vault Hum' },
                  { id: 'mythic', title: 'Mythic Realm Guide', desc: 'Slow, ritualistic cadence with 528Hz Crystalline Sigil Shimmer', soundscape: 'Sigil Shimmer' },
                ].map(opt => {
                  const isSelected = voicePreference === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setVoicePreference(opt.id); playSound('click'); }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-800/90 border-emerald-400/80 shadow-lg shadow-emerald-500/10' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="text-white font-bold text-xs flex items-center gap-2">
                          <span>{opt.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono">
                            {opt.soundscape}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{opt.desc}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => { setStep(2); playSound('click'); }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer"
                >
                  {isSubmitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Synthesizing Archetype...' : '⚡ Lock In My Archetype'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Reveal & Completed Archetype */}
          {step === 4 && (
            <div className="space-y-6 text-center py-4 animate-fadeIn">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-950 border-2 border-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                {getEmblemIcon(profile?.archetypeEmblem || 'Crown')}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  Bespoke Archetype Calibrated
                </div>
                <h2 className="text-2xl font-black text-white">{profile?.archetypeTitle}</h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {profile?.archetypeTagline}
                </p>
              </div>

              {/* Archetype Features Matrix */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>🎨 Cosmic Palette:</span>
                  <span className="text-emerald-300 font-bold uppercase">{profile?.paletteTheme} Harmony</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>🗣️ Voice Preset:</span>
                  <span className="text-purple-300 font-bold">{profile?.voicePreset} ({profile?.voiceSpeed}x)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>🎯 Priority Layout:</span>
                  <span className="text-cyan-300 font-bold">{profile?.uiPriorityTabs?.slice(0, 3).join(' → ')}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-slate-300 italic text-[11px]">
                  "{profile?.voiceGreeting}"
                </div>
              </div>

              <button
                onClick={() => setIsCalibrationModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg cursor-pointer"
              >
                🚀 Enter My Bespoke Operating System
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NeuralCalibrationModal;
