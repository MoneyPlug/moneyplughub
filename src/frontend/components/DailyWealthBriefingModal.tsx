import React, { useState, useEffect, useRef } from 'react';
import { useLivingRealm } from '../context/LivingRealmContext';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, Volume2, VolumeX, Sparkles, X, TrendingUp, ShieldCheck, 
  ArrowRight, Play, Pause, Activity, Zap, CheckCircle2 
} from 'lucide-react';

interface DailyWealthBriefingModalProps {
  onNavigate?: (tab: string) => void;
}

export const DailyWealthBriefingModal: React.FC<DailyWealthBriefingModalProps> = ({ onNavigate }) => {
  const { isBriefingOpen, setIsBriefingOpen, playSound } = useLivingRealm();
  const { token } = useAuth();
  const [briefingData, setBriefingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isBriefingOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
      return;
    }

    const fetchBriefing = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/moneyos/briefing', {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
          }
        });

        if (res.ok) {
          const j = await res.json();
          if (j.success) {
            setBriefingData(j.data);
            // Automatically synthesize and play speech
            playSpeech(j.data.voiceScript);
          }
        }
      } catch (e) {
        console.error('Briefing error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [isBriefingOpen, token]);

  const playSpeech = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      const res = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.play().catch(() => setIsPlayingAudio(false));
      } else {
        // Fallback to Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsPlayingAudio(false);
        }
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } else if (briefingData?.voiceScript) {
      playSpeech(briefingData.voiceScript);
    }
  };

  if (!isBriefingOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 font-sans animate-fadeIn overflow-y-auto w-full h-[100dvh]">
      <div className="max-w-2xl w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-200 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-plug-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-plug-accent text-slate-950 flex items-center justify-center font-black shadow-lg shadow-plug-accent/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Autonomous MoneyOS Wealth Briefing</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                AI Co-Pilot Telemetry • ElevenLabs Voice Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isPlayingAudio 
                  ? 'bg-plug-accent text-slate-950 border-plug-accent' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title={isPlayingAudio ? 'Mute AI Voice' : 'Play Voice'}
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsBriefingOpen(false);
                playSound('click');
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-slate-400 animate-pulse">
            Analyzing SQLite Living Vault & Synthesizing Audio Telemetry...
          </div>
        ) : briefingData ? (
          <div className="space-y-6 relative z-10 font-mono">
            {/* Top Stat Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Net Worth:</span>
                <strong className="text-sm font-black text-plug-accent">${briefingData.finances.netWorth.toLocaleString()}</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Vault Stability:</span>
                <strong className="text-sm font-black text-emerald-400">{briefingData.finances.stabilityScore}%</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Active Referrals:</span>
                <strong className="text-sm font-black text-white">{briefingData.finances.referralCount} signups</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">ARR Run-Rate:</span>
                <strong className="text-sm font-black text-sky-400">${briefingData.finances.annualRunRate.toLocaleString()}/yr</strong>
              </div>
            </div>

            {/* Spoken AI Transcript Box */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans relative">
              <div className="flex items-center gap-1.5 text-plug-accent font-mono text-[10px] font-bold uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Spoken Directive Transcript:</span>
              </div>
              <p className="italic text-slate-300">"{briefingData.voiceScript}"</p>
            </div>

            {/* Predictive Directives List */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                Recommended Actions:
              </span>
              <div className="space-y-2">
                {briefingData.directives.map((dir: any) => (
                  <div
                    key={dir.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-white">{dir.title}</h5>
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                          {dir.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans truncate">
                        {dir.description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsBriefingOpen(false);
                        if (onNavigate) onNavigate(dir.action);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-plug-accent hover:bg-plug-accentHover text-slate-950 text-[11px] font-black shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Execute</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DailyWealthBriefingModal;
