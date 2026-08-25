import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLivingRealm } from '../context/LivingRealmContext';
import { soundDesign } from '../utils/soundDesignEngine';
import { 
  Bot, Send, Sparkles, Trash2, RefreshCw, DollarSign, 
  TrendingUp, CreditCard, PieChart, Target, Shield, Zap, 
  ArrowRight, User, Wallet, Landmark, CheckCircle, ChevronRight,
  Minus, Square, X, Move, ArrowLeftRight, Receipt, Mic, MicOff,
  Volume2, VolumeX, Radio, PhoneCall, PhoneOff, Key, AlertCircle, ExternalLink
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  metadata?: any;
  receipt?: any;
}

/**
 * Voice Conversation State Machine:
 *   IDLE → LISTENING → PROCESSING → SPEAKING → LISTENING (continuous loop)
 *   Any state can be interrupted back to LISTENING when the user speaks (barge-in)
 */
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface FloatingMoneyOSProps {
  onNavigate?: (tab: string) => void;
}

export const FloatingMoneyOSWindow: React.FC<FloatingMoneyOSProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const { setIsBriefingOpen, openPassport, playSound } = useLivingRealm();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [walletContext, setWalletContext] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activePersona, setActivePersona] = useState<string>('Clarity & Authority');
  const [activeEmotion, setActiveEmotion] = useState<string>('calm');
  const [activeSoundscape, setActiveSoundscape] = useState<string>('none');

  // ─── Real-Time Two-Way Voice Conversation Engine ───────────────────
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [conversationMode, setConversationMode] = useState(false); // continuous loop on/off
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const conversationModeRef = useRef(false);  // stable ref for async callbacks
  const voiceOutputRef = useRef(true);
  const voiceStateRef = useRef<VoiceState>('idle');
  const isProcessingRef = useRef(false); // guard against double-sends

  // Keep refs in sync with state
  useEffect(() => { conversationModeRef.current = conversationMode; }, [conversationMode]);
  useEffect(() => { voiceOutputRef.current = voiceOutputEnabled; }, [voiceOutputEnabled]);
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);

  // Position coordinates for draggable window
  const [position, setPosition] = useState(() => {
    const isMobile = window.innerWidth < 640;
    return isMobile
      ? { x: 8, y: 60 }
      : { x: window.innerWidth - 460, y: window.innerHeight - 620 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0, startY: 0, posX: 0, posY: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── Speech Synthesis (MoneyOS Talks — ElevenLabs or Browser Fallback) ──

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const currentSpeechGenerationRef = useRef<number>(0);
  const [ttsProvider, setTtsProvider] = useState<'elevenlabs' | 'browser' | 'checking'>('checking');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'elevenlabs' | 'google'>('elevenlabs');
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [googleStatus, setGoogleStatus] = useState<any>(null);
  const [newApiKeyInput, setNewApiKeyInput] = useState('');
  const [newGoogleKeyInput, setNewGoogleKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [savingGoogleKey, setSavingGoogleKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [googleKeyMessage, setGoogleKeyMessage] = useState<{ success: boolean; text: string } | null>(null);

  const fetchQuotaInfo = useCallback(async () => {
    try {
      const [qRes, gRes] = await Promise.all([
        fetch('/api/voice/quota'),
        fetch('/api/voice/google-status'),
      ]);
      if (qRes.ok) {
        const j = await qRes.json();
        if (j.success && j.data) {
          setQuotaInfo(j.data);
          if (j.data.remainingCharacters > 0) {
            setTtsProvider('elevenlabs');
          } else if (j.data.status === 'quota_exhausted') {
            setTtsProvider('browser');
          }
        }
      }
      if (gRes.ok) {
        const gj = await gRes.json();
        if (gj.success) setGoogleStatus(gj.data);
      }
    } catch {}
  }, []);

  // Check ElevenLabs and Google STT availability on mount
  useEffect(() => {
    fetchQuotaInfo();
  }, [fetchQuotaInfo]);

  const handleSaveGoogleKey = async () => {
    if (!newGoogleKeyInput.trim()) return;
    setSavingGoogleKey(true);
    setGoogleKeyMessage(null);
    try {
      const res = await fetch('/api/voice/google-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newGoogleKeyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGoogleKeyMessage({ success: true, text: 'Google Cloud Speech & Gemini API Key connected!' });
        setNewGoogleKeyInput('');
        fetchQuotaInfo();
        setTimeout(() => {
          setIsKeyModalOpen(false);
          setGoogleKeyMessage(null);
        }, 1800);
      } else {
        setGoogleKeyMessage({ success: false, text: data.error || 'Failed to update Google API Key.' });
      }
    } catch (e: any) {
      setGoogleKeyMessage({ success: false, text: e.message || 'Network error updating key.' });
    } finally {
      setSavingGoogleKey(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKeyInput.trim()) return;
    setSavingKey(true);
    setKeySaveMessage(null);
    try {
      const res = await fetch('/api/voice/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newApiKeyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeySaveMessage({ 
          success: true, 
          text: `Verified! ${data.data?.remainingCharacters?.toLocaleString() || '10,000'} chars available.` 
        });
        setNewApiKeyInput('');
        setTtsProvider('elevenlabs');
        fetchQuotaInfo();
        setTimeout(() => {
          setIsKeyModalOpen(false);
          setKeySaveMessage(null);
        }, 1800);
      } else {
        setKeySaveMessage({ success: false, text: data.error || 'Failed to verify key with ElevenLabs.' });
      }
    } catch (e: any) {
      setKeySaveMessage({ success: false, text: e.message || 'Network error updating key.' });
    } finally {
      setSavingKey(false);
    }
  };

  const interruptSpeech = useCallback(() => {
    // Invalidate any active or in-flight speech requests immediately
    currentSpeechGenerationRef.current += 1;

    // Immediately stop and unload HTML Audio element
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current.load();
      } catch {}
      audioRef.current = null;
    }

    // Revoke previous blob URL to free memory
    if (activeAudioUrlRef.current) {
      try { URL.revokeObjectURL(activeAudioUrlRef.current); } catch {}
      activeAudioUrlRef.current = null;
    }

    // Stop procedural audio soundscapes
    soundDesign.stopSoundscape();

    // Cancel browser SpeechSynthesis
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }, []);

  const speakWithBrowser = useCallback((text: string, onDone?: () => void) => {
    if (!('speechSynthesis' in window)) {
      setVoiceState(conversationModeRef.current ? 'listening' : 'idle');
      onDone?.();
      return;
    }
    try {
      interruptSpeech();
      const thisGen = currentSpeechGenerationRef.current;

      const clean = text
        .replace(/###|\*\*|\*|#|`|---|⚡|💳|📊|🎯|💸|🤖|🏛️|👋|🧹|📈|🎙️|💰|🔥|✨|🚀|💪|🤙|🙏|😄|😂|😅|🌤️|📞|📴|🔊|🎶|🔇/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, '. ')
        .replace(/\.\s*\./g, '.')
        .trim();
      if (!clean) { onDone?.(); setVoiceState(conversationModeRef.current ? 'listening' : 'idle'); return; }

      const utterance = new SpeechSynthesisUtterance(clean.substring(0, 1500));
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(v =>
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Ava')) &&
        v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (v) utterance.voice = v;

      utterance.onstart = () => {
        if (thisGen !== currentSpeechGenerationRef.current) {
          window.speechSynthesis.cancel();
          return;
        }
        setVoiceState('speaking');
      };
      utterance.onend = () => {
        if (thisGen !== currentSpeechGenerationRef.current) return;
        if (conversationModeRef.current) {
          setVoiceState('listening');
          setTimeout(() => {
            if (conversationModeRef.current) {
              try { startListening(); } catch {}
            }
          }, 250);
        } else {
          setVoiceState('idle');
        }
        onDone?.();
      };
      utterance.onerror = () => {
        if (thisGen !== currentSpeechGenerationRef.current) return;
        if (conversationModeRef.current) {
          setVoiceState('listening');
          setTimeout(() => {
            if (conversationModeRef.current) {
              try { startListening(); } catch {}
            }
          }, 250);
        } else {
          setVoiceState('idle');
        }
        onDone?.();
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setVoiceState(conversationModeRef.current ? 'listening' : 'idle');
      onDone?.();
    }
  }, [interruptSpeech]);

  const speakResponse = useCallback((text: string, onDone?: () => void) => {
    if (!voiceOutputRef.current) {
      onDone?.();
      return;
    }

    // 1. Immediately terminate any previous audio playback & invalidate in-flight fetches
    interruptSpeech();
    const thisGen = currentSpeechGenerationRef.current;

    // 2. Pause microphone listening so speaker audio does not self-interrupt
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    setVoiceState('speaking');

    // ── FAST ZERO-LAG ELEVENLABS WITH VOICE ENGINE V4 SOUNDSCAPES & FUSIONS ──
    if (ttsProvider !== 'browser') {
      fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
        .then(async (res) => {
          // If a new message was sent while fetching, discard this audio!
          if (thisGen !== currentSpeechGenerationRef.current) return;
          if (!res.ok) throw new Error('ElevenLabs unavailable');

          const personaName = res.headers.get('X-MoneyOS-Persona-Name') || 'Calm Authority';
          const spatialPanStr = res.headers.get('X-MoneyOS-Spatial-Pan') || 'center';
          const personaKey = res.headers.get('X-MoneyOS-Persona') || 'general_conversation';
          const emotion = res.headers.get('X-MoneyOS-Emotion') || 'calm';
          const soundscape = (res.headers.get('X-MoneyOS-Soundscape') || 'none') as any;

          setActivePersona(personaName);
          setActiveEmotion(emotion);
          setActiveSoundscape(soundscape);

          const blob = await res.blob();
          if (thisGen !== currentSpeechGenerationRef.current) return;

          const url = URL.createObjectURL(blob);
          activeAudioUrlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;

          // Start Contextual Soundscape Bed
          if (soundscape && soundscape !== 'none') {
            soundDesign.setSoundscape(soundscape);
          }

          // Attach Spatial Panning & Shimmer Reverb
          const panVal = spatialPanStr === 'left' ? -0.35 : (spatialPanStr === 'right' ? 0.35 : 0.0);
          const isRitual = personaKey === 'chamber_unlock' || personaKey === 'sigil_forge' || personaKey === 'ritual' || emotion === 'ritualistic' || emotion === 'ascension';
          soundDesign.attachSpatialPan(audio, panVal, isRitual);

          audio.onended = () => {
            if (thisGen !== currentSpeechGenerationRef.current) return;
            soundDesign.stopSoundscape();
            if (activeAudioUrlRef.current) {
              try { URL.revokeObjectURL(activeAudioUrlRef.current); } catch {}
              activeAudioUrlRef.current = null;
            }
            audioRef.current = null;
            if (conversationModeRef.current) {
              setVoiceState('listening');
              setTimeout(() => {
                if (conversationModeRef.current) {
                  try { startListening(); } catch {}
                }
              }, 250);
            } else {
              setVoiceState('idle');
            }
            onDone?.();
          };

          audio.onerror = () => {
            if (thisGen !== currentSpeechGenerationRef.current) return;
            soundDesign.stopSoundscape();
            if (activeAudioUrlRef.current) {
              try { URL.revokeObjectURL(activeAudioUrlRef.current); } catch {}
              activeAudioUrlRef.current = null;
            }
            audioRef.current = null;
            if (conversationModeRef.current) {
              setVoiceState('listening');
              setTimeout(() => {
                if (conversationModeRef.current) {
                  try { startListening(); } catch {}
                }
              }, 250);
            } else {
              setVoiceState('idle');
            }
            onDone?.();
          };

          audio.play().catch(() => {
            if (thisGen !== currentSpeechGenerationRef.current) return;
            soundDesign.stopSoundscape();
            if (activeAudioUrlRef.current) {
              try { URL.revokeObjectURL(activeAudioUrlRef.current); } catch {}
              activeAudioUrlRef.current = null;
            }
            audioRef.current = null;
            speakWithBrowser(text, onDone);
          });
        })
        .catch(() => {
          if (thisGen !== currentSpeechGenerationRef.current) return;
          speakWithBrowser(text, onDone);
        });
      return;
    }

    // ── BROWSER FALLBACK ──
    speakWithBrowser(text, onDone);
  }, [ttsProvider, interruptSpeech, speakWithBrowser]);

  // ─── Speech Recognition (User Talks) ──────────────────────────────
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

        // Prevent speaker audio from self-interrupting while AI is speaking
        if (voiceStateRef.current === 'speaking') {
          return;
        }

        const combined = (finalTranscript || interim).trim();
        if (combined) {
          lastSpokenTextRef.current = combined;
          setInterimTranscript(combined);
          setInputMessage(combined);

          // Debounce: send automatically if user pauses for 950ms
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
        // If there is pending speech that was never marked final, send it immediately
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

  // ─── Send a Voice-Transcribed Message ──────────────────────────────

  const sendVoiceMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    
    // Immediately terminate any previous voice playback
    interruptSpeech();
    
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

          // Navigate to a page if the AI detected a navigation command
          if (j.data.navigate && onNavigate) {
            setTimeout(() => onNavigate(j.data.navigate), 600);
          }

          // Trigger Antigravity XP Conversion Chamber if mentioned
          if (/(?:convert|transmute|cash\s*out).*xp/i.test(text) || /xp.*(?:convert|cash)/i.test(text)) {
            setTimeout(() => (window as any).openXpConversion?.(), 400);
          }

          // Speak the response, then resume listening (continuous loop)
          if (j.data.content) {
            speakResponse(j.data.content, () => {
              isProcessingRef.current = false;
              // After speaking, resume listening if in conversation mode
              if (conversationModeRef.current) {
                startListening();
              }
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

  // ─── Toggle Continuous Conversation Mode On/Off ────────────────────

  const toggleConversationMode = useCallback(() => {
    if (conversationMode) {
      // Turn OFF
      setConversationMode(false);
      conversationModeRef.current = false;
      interruptSpeech();
      stopListening();
      setVoiceState('idle');
      isProcessingRef.current = false;
      setToast('🔇 Voice conversation ended.');
      setTimeout(() => setToast(null), 2500);
    } else {
      // Turn ON
      setConversationMode(true);
      conversationModeRef.current = true;
      setToast('🎙️ Live Conversation ON — Speak anytime. Interrupt freely.');
      setTimeout(() => setToast(null), 3000);
      startListening();
    }
  }, [conversationMode, interruptSpeech, stopListening, startListening]);

  // Cleanup on unmount or window close
  useEffect(() => {
    return () => {
      interruptSpeech();
      stopListening();
    };
  }, [interruptSpeech, stopListening]);

  // ─── Text-Based Chat (Existing) ───────────────────────────────────

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
              id: 'msg_welcome_dock',
              role: 'assistant',
              content: `### 🤖 MoneyOS Live Voice Conversation\n\nI'm your financial AI. Hit the **Call** button to start a live voice conversation — talk naturally and interrupt me anytime.\n\n*Try saying:*\n* "Send $100 from savings to checking"\n* "Pay $150 on my credit card"\n* "How should I invest $500?"`,
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

  useEffect(() => {
    if (isOpen) fetchContextAndHistory();
  }, [isOpen, token]);

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  // Draggable window
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: position.x, posY: position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
          x: Math.max(0, Math.min(window.innerWidth - Math.min(430, window.innerWidth - 16), dragRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 200, dragRef.current.posY + dy)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const text = customPrompt || inputMessage;
    if (!text.trim() || loading) return;

    // Immediately terminate any previous voice playback
    interruptSpeech();

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
          if (j.data.content && voiceOutputEnabled) {
            speakResponse(j.data.content);
          }
          if (j.data.receipt) {
            setToast(`⚡ Command Executed: ${j.data.receipt.type}`);
            setTimeout(() => setToast(null), 3500);
            fetchContextAndHistory();
          }
          // Navigate to a page if the AI detected a navigation command
          if (j.data.navigate && onNavigate) {
            setTimeout(() => onNavigate(j.data.navigate), 600);
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

  const ACTION_CHIPS = [
    { label: '💸 Send $100 Savings → Checking', prompt: 'Send $100 from savings to checking' },
    { label: '💳 Pay $150 on Credit Card', prompt: 'Pay $150 on my credit card' },
    { label: '📈 How do I invest $500?', prompt: 'How do I invest $500?' },
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

  const voiceStateBorderColor = (() => {
    switch (voiceState) {
      case 'listening': return 'border-emerald-500/80';
      case 'processing': return 'border-amber-500/80';
      case 'speaking': return 'border-cyan-500/80';
      default: return 'border-slate-700';
    }
  })();

  const voiceStateBarBg = (() => {
    switch (voiceState) {
      case 'listening': return 'bg-emerald-950/90';
      case 'processing': return 'bg-amber-950/90';
      case 'speaking': return 'bg-cyan-950/90';
      default: return '';
    }
  })();

  const voiceStateBarColor = (() => {
    switch (voiceState) {
      case 'listening': return 'text-emerald-300';
      case 'processing': return 'text-amber-300';
      case 'speaking': return 'text-cyan-300';
      default: return '';
    }
  })();

  const voiceBarDotColor = (() => {
    switch (voiceState) {
      case 'listening': return 'bg-emerald-400';
      case 'processing': return 'bg-amber-400';
      case 'speaking': return 'bg-cyan-400';
      default: return 'bg-slate-500';
    }
  })();

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <>
      {/* 1. Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="fixed bottom-5 left-5 z-50 px-4 py-2.5 rounded-full bg-slate-950/95 hover:bg-slate-900 border-2 border-emerald-500/80 shadow-2xl backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-2.5 transition-all hover:scale-105 group cursor-pointer"
          style={{ boxShadow: '0 0 25px -4px rgba(16, 185, 129, 0.45)' }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-extrabold">MoneyOS AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1">
              <PhoneCall className="w-2.5 h-2.5" />
              Live Voice
            </span>
          </div>
        </button>
      )}

      {/* 2. Draggable Floating Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all font-sans ${
            isMaximized
              ? 'inset-2 sm:inset-4 md:inset-10 w-auto h-auto rounded-2xl sm:rounded-3xl'
              : isMinimized
              ? 'bottom-5 left-5 w-72 sm:w-80 h-14 rounded-2xl'
              : 'w-[calc(100vw-16px)] sm:w-[430px] h-[calc(100vh-80px)] sm:h-[620px] rounded-2xl sm:rounded-3xl'
          } bg-slate-950/95 border-2 ${conversationMode ? voiceStateBorderColor : 'border-slate-700'} shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden`}
          style={
            !isMaximized && !isMinimized
              ? {
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  boxShadow: conversationMode
                    ? '0 20px 60px -15px rgba(0,0,0,0.8), 0 0 40px -5px rgba(16,185,129,0.4)'
                    : '0 20px 60px -15px rgba(0,0,0,0.8), 0 0 30px -5px rgba(16,185,129,0.25)',
                }
              : {}
          }
        >
          {/* Header Bar */}
          <div
            onMouseDown={handleMouseDown}
            className={`p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between select-none ${!isMaximized ? 'cursor-move' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black shadow-md ${
                conversationMode
                  ? 'bg-gradient-to-tr from-emerald-400 to-cyan-400 text-slate-950 animate-pulse'
                  : 'bg-gradient-to-tr from-emerald-500 to-plug-accent text-plug-dark'
              }`}>
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-xs tracking-tight">MoneyOS AI</span>
                  {conversationMode && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/30 text-emerald-300 flex items-center gap-1 animate-pulse">
                      <Radio className="w-2.5 h-2.5" />
                      LIVE
                    </span>
                  )}
                </div>
                {!isMinimized && walletContext && (
                  <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
                    Net Worth: ${walletContext.finances.netWorthUsd}
                  </span>
                )}
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              {/* Daily Wealth Briefing Button */}
              <button
                onClick={() => {
                  playSound('chime');
                  setIsBriefingOpen(true);
                }}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-500/30 transition-all cursor-pointer"
                title="Synthesize Daily Wealth Briefing"
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Briefing</span>
              </button>

              {/* Voice Output Mute/Unmute */}
              <button
                onClick={() => {
                  if (voiceOutputEnabled) interruptSpeech();
                  setVoiceOutputEnabled(!voiceOutputEnabled);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  voiceOutputEnabled ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
                title={voiceOutputEnabled ? 'Voice Output ON' : 'Voice Output Muted'}
              >
                {voiceOutputEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button onClick={() => { setIsMaximized(!isMaximized); setIsMinimized(false); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                <Square className="w-3 h-3" />
              </button>

              <button onClick={() => {
                  if (conversationMode) toggleConversationMode();
                  interruptSpeech();
                  stopListening();
                  setIsOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80">
              {/* ═══ Voice Engine v3.1 Dual-Pipeline Kernel Status Bar ═══ */}
              <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-bold">Voice Kernel v3.1</span>
                  <span className="text-emerald-300 hidden sm:inline">• Google STT + ElevenLabs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      fetchQuotaInfo();
                      setIsKeyModalOpen(true);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                      quotaInfo?.remainingCharacters > 0
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                        : 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-800/80 animate-pulse'
                    }`}
                    title="Manage ElevenLabs API Key & Character Quota"
                  >
                    <Key className="w-2.5 h-2.5 text-amber-400" />
                    <span>
                      {quotaInfo?.remainingCharacters > 0 
                        ? `${(quotaInfo.remainingCharacters / 1000).toFixed(1)}k chars`
                        : quotaInfo?.status === 'quota_exhausted'
                        ? 'Quota Maxed'
                        : 'Key / Quota'}
                    </span>
                  </button>

                  <select
                    value={activePersona}
                    onChange={(e) => setActivePersona(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] rounded px-1.5 py-0.5 focus:outline-none font-sans"
                  >
                    <option value="general_conversation">Sovereign Co-Pilot</option>
                    <option value="vault_explanation">Vault Guide (Calm)</option>
                    <option value="referral_strategy">Growth Strategist (Assertive)</option>
                    <option value="creator_mode">Hype Performance</option>
                    <option value="sigil_forge">Sigil Architect (Cinematic)</option>
                    <option value="ritual">Mythic Lore</option>
                  </select>
                </div>
              </div>

              {/* ═══ Live Voice State Bar ═══ */}
              {conversationMode && voiceState !== 'idle' && (
                <div className={`py-2.5 px-3.5 ${voiceStateBarBg} border-b border-slate-800 ${voiceStateBarColor} text-[11px] font-mono font-bold flex items-center justify-between animate-fadeIn`}>
                  <div className="flex items-center gap-2.5">
                    {/* Animated audio waveform bars */}
                    <div className="flex items-center gap-0.5 h-4">
                      {[0, 100, 200, 300, 400, 500].map((delay, i) => (
                        <span
                          key={i}
                          className={`w-[3px] rounded-full ${voiceBarDotColor} ${voiceState === 'listening' || voiceState === 'speaking' ? 'animate-bounce' : 'opacity-50'}`}
                          style={{
                            animationDelay: `${delay}ms`,
                            height: `${8 + Math.sin(i * 1.2) * 6}px`,
                          }}
                        />
                      ))}
                    </div>
                    <span>{voiceStateLabel}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Show interim transcript as user speaks */}
                    {voiceState === 'listening' && interimTranscript && (
                      <span className="text-[10px] text-emerald-200/70 italic max-w-[140px] truncate">
                        "{interimTranscript}"
                      </span>
                    )}
                    {voiceState === 'speaking' && (
                      <button
                        onClick={() => {
                          interruptSpeech();
                          setVoiceState('listening');
                          startListening();
                        }}
                        className="px-2 py-0.5 rounded bg-cyan-800/60 hover:bg-cyan-700 text-white text-[9px] font-bold"
                      >
                        Interrupt
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Voice Engine v4 Voice Organism Status Bar */}
              {voiceOutputEnabled && (
                <div className="px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-plug-accent animate-pulse" />
                    <span><strong className="text-slate-200">{activePersona}</strong></span>
                    {activeEmotion !== 'calm' && (
                      <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] uppercase font-bold">
                        {activeEmotion}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold">
                    {activeSoundscape !== 'none' && (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Volume2 className="w-2.5 h-2.5" />
                        {activeSoundscape.replace('_', ' ')}
                      </span>
                    )}
                    <span className="text-purple-400 tracking-wider uppercase flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5" /> 3D Spatial
                    </span>
                  </div>
                </div>
              )}

              {toast && (
                <div className="py-1.5 px-3 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5 animate-fadeIn">
                  <Zap className="w-3 h-3 fill-current shrink-0" />
                  <span>{toast}</span>
                </div>
              )}

              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={m.id} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs shadow-md ${
                        isUser ? 'bg-purple-600 text-white' : 'bg-gradient-to-tr from-emerald-500 to-plug-accent text-plug-dark font-black'
                      }`}>
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-purple-600 text-white font-medium rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-mono space-y-2'
                      }`}>
                        <div className="whitespace-pre-wrap">{m.content}</div>

                        {m.receipt && (
                          <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-mono text-emerald-300 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>LIVE RECEIPT: {m.receipt.type}</span>
                            </div>
                            <div className="text-[10px] text-slate-300">
                              Amount: <strong className="text-white">{m.receipt.amount}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 animate-pulse">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-plug-accent animate-ping" />
                      <span>Thinking & calculating financial route...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion Chips */}
              <div className="p-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-bold shrink-0 ml-1">Suggested:</span>
                {ACTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, chip.prompt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-mono whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>

              {/* ═══ Input Bar with Live Conversation Toggle ═══ */}
              <form
                onSubmit={(e) => handleSendMessage(e)}
                className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
              >
                {/* 📞 Live Conversation Toggle (main voice button) */}
                <button
                  type="button"
                  onClick={toggleConversationMode}
                  className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-md ${
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
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-plug-accent transition-colors"
                  disabled={conversationMode && voiceState === 'processing'}
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="p-2.5 bg-plug-accent hover:bg-plug-accentHover disabled:opacity-40 text-plug-dark font-black rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                  title="Send Command"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="p-2.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* ═══ Dual-Pipeline Voice Engine Settings Drawer / Modal ═══ */}
          {isKeyModalOpen && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 p-5 flex flex-col justify-between animate-fadeIn overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">Dual-Pipeline Voice Engine v3.1</h4>
                      <p className="text-[11px] text-slate-400">Google Cloud STT + ElevenLabs TTS</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsKeyModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Pipeline Switcher Tabs */}
                <div className="mt-3.5 flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveDrawerTab('elevenlabs')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeDrawerTab === 'elevenlabs'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>ElevenLabs (Output)</span>
                  </button>
                  <button
                    onClick={() => setActiveDrawerTab('google')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeDrawerTab === 'google'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Google STT (Input)</span>
                  </button>
                </div>

                {/* TAB 1: ELEVENLABS TTS */}
                {activeDrawerTab === 'elevenlabs' && (
                  <div className="mt-3 animate-fadeIn">
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 font-mono">Character Balance:</span>
                        <span className={`font-mono font-bold ${quotaInfo?.remainingCharacters > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {quotaInfo?.remainingCharacters?.toLocaleString() || 0} / {quotaInfo?.characterLimit?.toLocaleString() || 40000}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2.5">
                        <div
                          className={`h-full transition-all ${
                            quotaInfo?.remainingCharacters > 0 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-rose-500'
                          }`}
                          style={{
                            width: `${Math.min(100, ((quotaInfo?.characterCount || 0) / (quotaInfo?.characterLimit || 40000)) * 100)}%`
                          }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Tier: <span className="text-emerald-300 font-bold uppercase">{quotaInfo?.tier || 'starter'}</span> • Model: <span className="text-white font-mono">eleven_flash_v2_5</span>
                      </p>
                    </div>

                    <div className="mt-3">
                      <label className="block text-[11px] font-mono text-slate-300 mb-1 font-bold">
                        Update ElevenLabs API Key:
                      </label>
                      <input
                        type="password"
                        value={newApiKeyInput}
                        onChange={(e) => setNewApiKeyInput(e.target.value)}
                        placeholder="sk_..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    {keySaveMessage && (
                      <div className={`mt-2 p-2 rounded-lg text-[11px] font-mono ${
                        keySaveMessage.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                      }`}>
                        {keySaveMessage.text}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: GOOGLE CLOUD STT */}
                {activeDrawerTab === 'google' && (
                  <div className="mt-3 animate-fadeIn">
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-400 font-mono">Google Speech Pipeline:</span>
                        <span className={`font-mono font-bold ${googleStatus?.configured ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {googleStatus?.configured ? '🟢 Configured & Active' : '🟡 Web Speech Fallback'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Engine: <span className="text-white font-mono">Google Cloud Speech-to-Text v1 + Gemini Audio</span>
                      </p>
                    </div>

                    <div className="mt-3">
                      <label className="block text-[11px] font-mono text-slate-300 mb-1 font-bold">
                        Connect Google Cloud / Gemini API Key:
                      </label>
                      <input
                        type="password"
                        value={newGoogleKeyInput}
                        onChange={(e) => setNewGoogleKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Use any Google Cloud Speech API key or Gemini API key.
                      </p>
                    </div>

                    {googleKeyMessage && (
                      <div className={`mt-2 p-2 rounded-lg text-[11px] font-mono ${
                        googleKeyMessage.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                      }`}>
                        {googleKeyMessage.text}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
                {activeDrawerTab === 'elevenlabs' ? (
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!newApiKeyInput.trim() || savingKey}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    {savingKey ? 'Verifying...' : 'Save ElevenLabs Key'}
                  </button>
                ) : (
                  <button
                    onClick={handleSaveGoogleKey}
                    disabled={!newGoogleKeyInput.trim() || savingGoogleKey}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    {savingGoogleKey ? 'Verifying...' : 'Save Google Key'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
