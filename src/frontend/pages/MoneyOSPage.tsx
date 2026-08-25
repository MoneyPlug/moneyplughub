import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, Send, Sparkles, Trash2, RefreshCw, DollarSign, 
  TrendingUp, CreditCard, PieChart, Target, Shield, Zap, 
  ArrowRight, User, Wallet, Landmark, CheckCircle, ChevronRight,
  Mic, MicOff, Volume2, VolumeX, Radio, PhoneCall, PhoneOff
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  metadata?: any;
  receipt?: any;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export const MoneyOSPage: React.FC = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [walletContext, setWalletContext] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ─── Real-Time Voice Conversation Engine ───────────────────────────
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [conversationMode, setConversationMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const conversationModeRef = useRef(false);
  const voiceOutputRef = useRef(true);
  const voiceStateRef = useRef<VoiceState>('idle');
  const isProcessingRef = useRef(false);

  useEffect(() => { conversationModeRef.current = conversationMode; }, [conversationMode]);
  useEffect(() => { voiceOutputRef.current = voiceOutputEnabled; }, [voiceOutputEnabled]);
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── Speech Synthesis (ElevenLabs or Browser Fallback) ──────────────

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsProvider, setTtsProvider] = useState<'elevenlabs' | 'browser' | 'checking'>('checking');

  useEffect(() => {
    fetch('/api/tts/status')
      .then(r => r.json())
      .then(j => setTtsProvider(j.elevenLabs ? 'elevenlabs' : 'browser'))
      .catch(() => setTtsProvider('browser'));
  }, []);

  const speakWithBrowser = useCallback((text: string, onDone?: () => void) => {
    if (!('speechSynthesis' in window)) {
      setVoiceState(conversationModeRef.current ? 'listening' : 'idle');
      onDone?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const clean = text
        .replace(/###|\*\*|\*|#|`|---|⚡|💳|📊|🎯|💸|🤖|🏛️|👋|🧹|📈|🎙️|💰|🔥|✨|🚀|💪|🤙|🙏|😄|😂|😅|🌤️|📞|📴|🔊|🎶|🔇/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, '. ')
        .replace(/\.\ s*\./g, '.')
        .trim();
      if (!clean) { onDone?.(); setVoiceState(conversationModeRef.current ? 'listening' : 'idle'); return; }

      const utterance = new SpeechSynthesisUtterance(clean.substring(0, 800));
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(v =>
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Ava')) &&
        v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (v) utterance.voice = v;

      utterance.onstart = () => setVoiceState('speaking');
      utterance.onend = () => { setVoiceState(conversationModeRef.current ? 'listening' : 'idle'); onDone?.(); };
      utterance.onerror = () => { setVoiceState(conversationModeRef.current ? 'listening' : 'idle'); onDone?.(); };
      window.speechSynthesis.speak(utterance);
    } catch {
      setVoiceState(conversationModeRef.current ? 'listening' : 'idle');
      onDone?.();
    }
  }, []);

  const speakResponse = useCallback((text: string, onDone?: () => void) => {
    if (!voiceOutputRef.current) { onDone?.(); return; }

    // Cancel any existing speech
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setVoiceState('speaking');

    if (ttsProvider !== 'browser') {
      fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
        .then(res => { if (!res.ok) throw new Error('fail'); return res.blob(); })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; setVoiceState(conversationModeRef.current ? 'listening' : 'idle'); onDone?.(); };
          audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; setVoiceState(conversationModeRef.current ? 'listening' : 'idle'); onDone?.(); };
          audio.play().catch(() => { URL.revokeObjectURL(url); audioRef.current = null; speakWithBrowser(text, onDone); });
        })
        .catch(() => speakWithBrowser(text, onDone));
      return;
    }
    speakWithBrowser(text, onDone);
  }, [ttsProvider, speakWithBrowser]);

  const interruptSpeech = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  // ─── Speech Recognition ────────────────────────────────────────────
  const lastSpokenTextRef = useRef('');
  const speechSilenceTimeoutRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast('⚠️ Speech recognition not supported. Please use Chrome or Edge.');
      setTimeout(() => setToast(null), 3500);
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
        setInterimTranscript('');
        lastSpokenTextRef.current = '';
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        const combined = (finalTranscript || interim).trim();
        if (combined) {
          lastSpokenTextRef.current = combined;
          setInterimTranscript(combined);
          setInputMessage(combined);

          if (voiceStateRef.current === 'speaking') {
            interruptSpeech();
          }

          if (speechSilenceTimeoutRef.current) clearTimeout(speechSilenceTimeoutRef.current);
          speechSilenceTimeoutRef.current = setTimeout(() => {
            const textToSend = lastSpokenTextRef.current.trim();
            if (textToSend && !isProcessingRef.current) {
              lastSpokenTextRef.current = '';
              setInterimTranscript('');
              setInputMessage('');
              sendVoiceMessage(textToSend);
            }
          }, 950);
        }

        if (finalTranscript.trim()) {
          if (speechSilenceTimeoutRef.current) clearTimeout(speechSilenceTimeoutRef.current);
          const textToSend = finalTranscript.trim();
          lastSpokenTextRef.current = '';
          setInterimTranscript('');
          setInputMessage('');
          if (!isProcessingRef.current) {
            sendVoiceMessage(textToSend);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        console.error('Speech recognition error:', event.error);
        if (!conversationModeRef.current) setVoiceState('idle');
      };

      recognition.onend = () => {
        const pending = lastSpokenTextRef.current.trim();
        if (pending && !isProcessingRef.current) {
          lastSpokenTextRef.current = '';
          setInterimTranscript('');
          setInputMessage('');
          sendVoiceMessage(pending);
          return;
        }

        if (conversationModeRef.current && voiceStateRef.current !== 'processing') {
          setTimeout(() => {
            if (conversationModeRef.current) {
              try { startListening(); } catch {}
            }
          }, 200);
        } else if (!conversationModeRef.current) {
          setVoiceState('idle');
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setVoiceState('idle');
    }
  }, [interruptSpeech]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setInterimTranscript('');
  }, []);

  // ─── Send Voice Message ────────────────────────────────────────────

  const sendVoiceMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setVoiceState('processing');

    const userMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/moneyos/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text.trim() }),
      });

      if (res.ok) {
        const j = await res.json();
        if (j.success) {
          setMessages(prev => [...prev, j.data]);

          if (j.data.receipt) {
            setToast(`⚡ Command Executed: ${j.data.receipt.type}`);
            setTimeout(() => setToast(null), 3500);
            fetchContextAndHistory();
          }

          if (j.data.content) {
            speakResponse(j.data.content, () => {
              isProcessingRef.current = false;
              if (conversationModeRef.current) startListening();
            });
          } else {
            isProcessingRef.current = false;
            if (conversationModeRef.current) startListening();
          }
        } else {
          isProcessingRef.current = false;
          if (conversationModeRef.current) startListening();
        }
      } else {
        setToast('⚠️ MoneyOS failed to respond.');
        setTimeout(() => setToast(null), 3000);
        isProcessingRef.current = false;
        if (conversationModeRef.current) startListening();
      }
    } catch (e) {
      console.error(e);
      setToast('⚠️ Network connection error.');
      setTimeout(() => setToast(null), 3000);
      isProcessingRef.current = false;
      if (conversationModeRef.current) startListening();
    } finally {
      setLoading(false);
    }
  }, [token, speakResponse, startListening]);

  // ─── Toggle Conversation Mode ──────────────────────────────────────

  const toggleConversationMode = useCallback(() => {
    if (conversationMode) {
      setConversationMode(false);
      conversationModeRef.current = false;
      interruptSpeech();
      stopListening();
      setVoiceState('idle');
      isProcessingRef.current = false;
      setToast('🔇 Voice conversation ended.');
      setTimeout(() => setToast(null), 2500);
    } else {
      setConversationMode(true);
      conversationModeRef.current = true;
      setToast('🎙️ Live Conversation ON — Speak anytime. Interrupt freely.');
      setTimeout(() => setToast(null), 3000);
      startListening();
    }
  }, [conversationMode, interruptSpeech, stopListening, startListening]);

  useEffect(() => {
    return () => { interruptSpeech(); stopListening(); };
  }, [interruptSpeech, stopListening]);

  // ─── Data Fetching ─────────────────────────────────────────────────

  const fetchContextAndHistory = async () => {
    try {
      setFetchingHistory(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [ctxRes, histRes] = await Promise.all([
        fetch('/api/moneyos/context', { headers }),
        fetch('/api/moneyos/history', { headers }),
      ]);

      if (ctxRes.ok) {
        const j = await ctxRes.json();
        if (j.success) setWalletContext(j.data);
      }

      if (histRes.ok) {
        const j = await histRes.json();
        if (j.success && j.data.length > 0) {
          setMessages(j.data);
        } else {
          setMessages([
            {
              id: 'msg_welcome',
              role: 'assistant',
              content: `### 🤖 MoneyOS Live Voice Orchestrator\n\nHit the **📞 Call** button to start a real-time voice conversation. Talk naturally, interrupt me mid-sentence, and I'll respond instantly.\n\n*Try saying:*\n* "Send $100 from savings to checking"\n* "Pay $150 on my credit card"\n* "How should I invest $500?"`,
              created_at: new Date().toISOString(),
            }
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => { fetchContextAndHistory(); }, [token]);
  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const text = customPrompt || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/moneyos/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text.trim() }),
      });

      if (res.ok) {
        const j = await res.json();
        if (j.success) {
          setMessages(prev => [...prev, j.data]);
          if (j.data.content && voiceOutputEnabled) speakResponse(j.data.content);
          if (j.data.receipt) {
            setToast(`⚡ Command Executed: ${j.data.receipt.type}`);
            setTimeout(() => setToast(null), 3500);
            fetchContextAndHistory();
          }
        }
      } else {
        setToast('⚠️ Failed to receive MoneyOS response.');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setToast('⚠️ Network connection error.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    interruptSpeech();
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/moneyos/history', { method: 'DELETE', headers });
      setMessages([
        {
          id: 'msg_reset',
          role: 'assistant',
          content: '### 🧹 MoneyOS Memory Reset\n\nHow can I help you route or optimize your money?',
          created_at: new Date().toISOString(),
        }
      ]);
      setToast('✨ Chat history cleared.');
      setTimeout(() => setToast(null), 2500);
    } catch {}
  };

  const QUICK_PROMPTS = [
    { label: '💸 Send $100 Savings → Checking', prompt: 'Send $100 from savings to checking' },
    { label: '💳 Pay $150 on Credit Card', prompt: 'Pay $150 on my credit card' },
    { label: '📈 How do I invest $500?', prompt: 'How do I invest $500?' },
    { label: '📊 Set Food Budget to $500', prompt: 'Set food budget to 500' },
    { label: '🏛️ Real Bank Routing', prompt: 'How does real-world bank account routing work?' },
  ];

  // ─── Voice State Visual Helpers ────────────────────────────────────

  const voiceStateLabel = (() => {
    switch (voiceState) {
      case 'listening': return '🎙️ Listening — Speak now...';
      case 'processing': return '⚡ Processing your command...';
      case 'speaking': return '🔊 MoneyOS Speaking — Interrupt anytime';
      default: return '';
    }
  })();

  const voiceBarColor = (() => {
    switch (voiceState) {
      case 'listening': return { bg: 'bg-emerald-950/90', text: 'text-emerald-300', dot: 'bg-emerald-400', border: 'border-emerald-500/40' };
      case 'processing': return { bg: 'bg-amber-950/90', text: 'text-amber-300', dot: 'bg-amber-400', border: 'border-amber-500/40' };
      case 'speaking': return { bg: 'bg-cyan-950/90', text: 'text-cyan-300', dot: 'bg-cyan-400', border: 'border-cyan-500/40' };
      default: return { bg: '', text: '', dot: 'bg-slate-500', border: '' };
    }
  })();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Toast */}
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-fadeIn">
          <Zap className="w-4 h-4 fill-current shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border ${
        conversationMode ? 'border-emerald-500/60' : 'border-plug-border/80'
      } shadow-2xl backdrop-blur-xl relative overflow-hidden transition-colors`}>
        <div className="flex items-center gap-4 relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-lg ${
            conversationMode
              ? 'bg-gradient-to-tr from-emerald-400 to-cyan-400 text-slate-950 animate-pulse shadow-emerald-500/30'
              : 'bg-gradient-to-tr from-emerald-500 to-plug-accent text-plug-dark shadow-plug-accent/25'
          }`}>
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">MoneyOS Orchestrator</h1>
              {conversationMode && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                  <Radio className="w-3 h-3" />
                  LIVE CALL
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {conversationMode
                ? 'Real-time voice conversation active — speak freely, interrupt anytime'
                : 'Live Financial AI • Voice Orchestrator • ACID Command Router'
              }
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 relative z-10">
          {/* ═══ MAIN CALL BUTTON ═══ */}
          <button
            onClick={toggleConversationMode}
            className={`px-5 py-2.5 rounded-2xl text-sm font-black border transition-all flex items-center gap-2 cursor-pointer ${
              conversationMode
                ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 ring-4 ring-rose-500/20 animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {conversationMode ? <PhoneOff className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
            <span>{conversationMode ? 'End Call' : 'Start Voice Call'}</span>
          </button>

          {/* Voice Output Toggle */}
          <button
            onClick={() => {
              if (voiceOutputEnabled) interruptSpeech();
              setVoiceOutputEnabled(!voiceOutputEnabled);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center gap-1.5 ${
              voiceOutputEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {voiceOutputEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voiceOutputEnabled ? 'Voice ON' : 'Muted'}</span>
          </button>

          <button onClick={fetchContextAndHistory}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Refresh Context"
          >
            <RefreshCw className={`w-4 h-4 ${fetchingHistory ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={handleClearHistory}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financial Context Cards */}
      {walletContext && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Net Worth', value: `$${walletContext.finances.netWorthUsd}`, color: 'text-white' },
            { label: 'Liquid Cash', value: `$${walletContext.finances.totalCashUsd}`, color: 'text-emerald-400' },
            { label: 'Total Liabilities', value: `$${walletContext.finances.totalDebtUsd}`, color: 'text-rose-400' },
            { label: 'Savings Rate', value: `${walletContext.finances.savingsRatePct}%`, color: 'text-plug-accent' },
          ].map((card, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">{card.label}</span>
              <div className={`text-base font-black font-mono mt-0.5 ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Chat Interface */}
      <div className={`rounded-3xl bg-slate-900/90 border ${
        conversationMode ? 'border-emerald-500/40' : 'border-plug-border/80'
      } shadow-2xl backdrop-blur-xl flex flex-col h-[580px] overflow-hidden transition-colors`}>

        {/* ═══ Live Voice State Bar ═══ */}
        {conversationMode && voiceState !== 'idle' && (
          <div className={`py-2.5 px-4 ${voiceBarColor.bg} border-b ${voiceBarColor.border} ${voiceBarColor.text} text-xs font-mono font-bold flex items-center justify-between animate-fadeIn`}>
            <div className="flex items-center gap-2.5">
              {/* Animated waveform */}
              <div className="flex items-center gap-0.5 h-5">
                {[0, 80, 160, 240, 320, 400, 480].map((delay, i) => (
                  <span
                    key={i}
                    className={`w-[3px] rounded-full ${voiceBarColor.dot} ${voiceState !== 'processing' ? 'animate-bounce' : 'opacity-50'}`}
                    style={{
                      animationDelay: `${delay}ms`,
                      height: `${6 + Math.sin(i * 1.4) * 8}px`,
                    }}
                  />
                ))}
              </div>
              <span>{voiceStateLabel}</span>

              {voiceState === 'listening' && interimTranscript && (
                <span className="text-[10px] opacity-70 italic max-w-[200px] truncate ml-2">
                  "{interimTranscript}"
                </span>
              )}
            </div>

            {voiceState === 'speaking' && (
              <button
                onClick={() => { interruptSpeech(); setVoiceState('listening'); startListening(); }}
                className="px-3 py-1 rounded-lg bg-cyan-800/80 hover:bg-cyan-700 text-white text-[10px] font-bold"
              >
                Interrupt
              </button>
            )}
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs shadow-md ${
                  isUser ? 'bg-purple-600 text-white' : 'bg-gradient-to-tr from-emerald-500 to-plug-accent text-plug-dark font-black'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] rounded-3xl p-4 text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-purple-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none font-mono'
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.receipt && (
                    <div className="mt-2 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-xs font-mono text-emerald-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>LIVE RECEIPT: {m.receipt.type}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Amount: <strong className="text-white">{m.receipt.amount}</strong>
                      </div>
                    </div>
                  )}

                  <div className={`text-[10px] pt-1 font-mono ${isUser ? 'text-purple-200 text-right' : 'text-slate-500'}`}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-plug-accent text-plug-dark flex items-center justify-center font-black text-xs shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-plug-accent animate-ping" />
                <span>MoneyOS is analyzing your live financial context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Chips */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold shrink-0 ml-2">Quick Ask:</span>
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(undefined, q.prompt)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{q.label}</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          ))}
        </div>

        {/* Input Bar with Live Voice Call Toggle */}
        <form
          onSubmit={(e) => handleSendMessage(e)}
          className="p-4 bg-slate-900 border-t border-plug-border/80 flex items-center gap-3"
        >
          {/* Call Toggle Button */}
          <button
            type="button"
            onClick={toggleConversationMode}
            className={`p-3 rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-md ${
              conversationMode
                ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500'
            }`}
            title={conversationMode ? 'End Voice Conversation' : 'Start Live Voice Conversation'}
          >
            {conversationMode ? <PhoneOff className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              conversationMode
                ? voiceState === 'listening'
                  ? '🎙️ Listening... speak freely or type here'
                  : voiceState === 'speaking'
                  ? '🔊 MoneyOS speaking... interrupt anytime'
                  : '⚡ Processing...'
                : "Ask MoneyOS or start a voice call..."
            }
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-mono text-xs focus:outline-none focus:border-plug-accent transition-colors"
            disabled={conversationMode && voiceState === 'processing'}
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="p-3 bg-plug-accent hover:bg-plug-accentHover disabled:opacity-50 text-plug-dark font-black rounded-2xl transition-all shadow-md shadow-plug-accent/20 flex items-center justify-center shrink-0 cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
