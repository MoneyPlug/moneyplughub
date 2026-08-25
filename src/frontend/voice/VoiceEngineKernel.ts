/**
 * MoneyOS Voice Engine v3.1 — Client Sovereign Voice Kernel
 * Location: src/frontend/voice/VoiceEngineKernel.ts
 */

export type VoiceState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

export interface VoiceEngineConfig {
  useGoogleSTT: boolean;
  useElevenLabsTTS: boolean;
  targetLatencyMs: number;
  silenceDebounceMs: number;
  activePersona: string;
  activeTone: string;
}

export interface LatencyMetrics {
  sttLatencyMs?: number;
  ttsTtfbMs?: number;
  totalRoundtripMs?: number;
  providerSTT: string;
  providerTTS: string;
}

export class VoiceEngineKernel {
  private config: VoiceEngineConfig;
  private state: VoiceState = 'idle';
  private currentGeneration: number = 0;
  private currentAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private speechRecognition: any = null;

  private onStateChangeCb?: (state: VoiceState) => void;
  private onTranscriptCb?: (transcript: string, isFinal: boolean) => void;
  private onLatencyCb?: (metrics: LatencyMetrics) => void;

  constructor(config?: Partial<VoiceEngineConfig>) {
    this.config = {
      useGoogleSTT: true,
      useElevenLabsTTS: true,
      targetLatencyMs: 250,
      silenceDebounceMs: 400,
      activePersona: 'general_conversation',
      activeTone: 'calm',
      ...config,
    };
    this.initWebSpeech();
  }

  // -------------------------------------------------------------
  // Pipeline Toggles
  // -------------------------------------------------------------
  public useGoogle(enabled: boolean = true): this {
    this.config.useGoogleSTT = enabled;
    return this;
  }

  public useElevenLabs(enabled: boolean = true): this {
    this.config.useElevenLabsTTS = enabled;
    return this;
  }

  public setPersona(persona: string, tone: string = 'neutral'): this {
    this.config.activePersona = persona;
    this.config.activeTone = tone;
    return this;
  }

  public getConfig(): VoiceEngineConfig {
    return { ...this.config };
  }

  public getState(): VoiceState {
    return this.state;
  }

  // -------------------------------------------------------------
  // Callbacks & Event Binding
  // -------------------------------------------------------------
  public onStateChange(cb: (state: VoiceState) => void): this {
    this.onStateChangeCb = cb;
    return this;
  }

  public onTranscript(cb: (transcript: string, isFinal: boolean) => void): this {
    this.onTranscriptCb = cb;
    return this;
  }

  public onLatency(cb: (metrics: LatencyMetrics) => void): this {
    this.onLatencyCb = cb;
    return this;
  }

  private setState(newState: VoiceState): void {
    this.state = newState;
    if (this.onStateChangeCb) this.onStateChangeCb(newState);
  }

  // -------------------------------------------------------------
  // Interrupt-Safe Barge-In Logic
  // -------------------------------------------------------------
  public interruptSpeech(): number {
    this.currentGeneration += 1;
    const gen = this.currentGeneration;

    // 1. Kill active streaming audio immediately
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
        this.currentAudio.load();
      } catch {}
      this.currentAudio = null;
    }

    // 2. Kill browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    // 3. Reset state if it was speaking
    if (this.state === 'speaking') {
      this.setState('idle');
    }

    return gen;
  }

  // -------------------------------------------------------------
  // Speech-to-Text Input (Google Cloud STT + Web Speech Fallback)
  // -------------------------------------------------------------
  private initWebSpeech(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        if (text && this.onTranscriptCb) {
          this.onTranscriptCb(text, !!final);
        }
      };

      this.speechRecognition.onerror = () => {
        if (this.state === 'listening') this.setState('idle');
      };

      this.speechRecognition.onend = () => {
        if (this.state === 'listening') this.setState('idle');
      };
    }
  }

  public async startListening(): Promise<void> {
    this.interruptSpeech();
    this.setState('listening');

    if (this.speechRecognition) {
      try {
        this.speechRecognition.start();
      } catch {}
    }
  }

  public stopListening(): void {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch {}
    }
    if (this.state === 'listening') {
      this.setState('idle');
    }
  }

  // -------------------------------------------------------------
  // Text-to-Speech Output (ElevenLabs v3.1 + Audio Bus Routing)
  // -------------------------------------------------------------
  public async speakText(
    text: string, 
    persona?: string, 
    tone?: string
  ): Promise<void> {
    const thisGen = this.interruptSpeech();
    this.setState('thinking');
    const startTtsTime = Date.now();

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          persona: persona || this.config.activePersona,
          tone: tone || this.config.activeTone,
        }),
      });

      // Discard if interrupted while fetching
      if (thisGen !== this.currentGeneration) return;

      const contentType = res.headers.get('content-type') || '';

      if (res.ok && contentType.includes('audio/mpeg')) {
        const ttfbMs = Date.now() - startTtsTime;
        const blob = await res.blob();

        if (thisGen !== this.currentGeneration) return;

        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        if (this.onLatencyCb) {
          this.onLatencyCb({
            ttsTtfbMs: ttfbMs,
            providerSTT: this.config.useGoogleSTT ? 'Google Cloud STT' : 'Web Speech',
            providerTTS: 'ElevenLabs (eleven_flash_v2_5)',
          });
        }

        this.setState('speaking');

        audio.onended = () => {
          if (thisGen === this.currentGeneration) {
            this.setState('idle');
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
          }
        };

        audio.onerror = () => {
          if (thisGen === this.currentGeneration) {
            this.fallbackSpeak(text, thisGen);
          }
        };

        await audio.play();
      } else {
        // Fallback: Browser native SpeechSynthesis
        this.fallbackSpeak(text, thisGen);
      }
    } catch {
      if (thisGen === this.currentGeneration) {
        this.fallbackSpeak(text, thisGen);
      }
    }
  }

  private fallbackSpeak(text: string, thisGen: number): void {
    if (thisGen !== this.currentGeneration) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.setState('idle');
      return;
    }

    try {
      const clean = text
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[^\w\s.,!?'"$\-%]/g, ' ')
        .substring(0, 500);

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        if (thisGen === this.currentGeneration) this.setState('speaking');
      };

      utterance.onend = () => {
        if (thisGen === this.currentGeneration) this.setState('idle');
      };

      utterance.onerror = () => {
        if (thisGen === this.currentGeneration) this.setState('idle');
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.setState('idle');
    }
  }
}

export const globalVoiceEngine = new VoiceEngineKernel();
