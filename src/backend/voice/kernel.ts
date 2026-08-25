/**
 * MoneyOS Voice Engine v3.1 — Dual-Pipeline Sovereign Voice Kernel
 * Location: src/backend/voice/kernel.ts
 */

import { googleSTT, GoogleSTTPipeline, STTResult } from './google-stt';
import { elevenLabsTTS, ElevenLabsTTSPipeline, TTSBenchmark } from './elevenlabs-tts';
import { PERSONA_PROFILES, PersonaProfile, BasePersona, EmotionalTone, applyEmotionalTone } from './persona';

export interface VoiceKernelConfig {
  useGoogleSTT: boolean;
  useElevenLabsTTS: boolean;
  targetLatencyMs: number;
  interruptSafeBargeIn: boolean;
  silenceDebounceMs: number;
  activePersona: BasePersona;
  activeTone: EmotionalTone;
}

export interface VoiceBenchmarkSummary {
  version: string;
  status: 'operational' | 'degraded' | 'fallback';
  googleSTT: {
    configured: boolean;
    active: boolean;
    avgLatencyMs: number;
  };
  elevenLabsTTS: {
    configured: boolean;
    active: boolean;
    avgTtfbMs: number;
    model: string;
  };
  targetLatencyMs: number;
  totalInteractions: number;
  lastInteractionTimestamp: string | null;
}

export class MoneyOSVoiceKernel {
  public static readonly VERSION = 'v3.1.0-sovereign-dual';

  private config: VoiceKernelConfig;
  private sttPipeline: GoogleSTTPipeline;
  private ttsPipeline: ElevenLabsTTSPipeline;
  private latencyHistory: Array<{ type: 'stt' | 'tts'; durationMs: number; timestamp: number }>;
  private activeGenerationToken: number;

  constructor() {
    this.sttPipeline = googleSTT;
    this.ttsPipeline = elevenLabsTTS;
    this.latencyHistory = [];
    this.activeGenerationToken = 0;

    this.config = {
      useGoogleSTT: true,
      useElevenLabsTTS: true,
      targetLatencyMs: 250,
      interruptSafeBargeIn: true,
      silenceDebounceMs: 400,
      activePersona: 'general_conversation',
      activeTone: 'calm',
    };
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

  public setPersona(persona: BasePersona, tone: EmotionalTone = 'neutral'): this {
    this.config.activePersona = persona;
    this.config.activeTone = tone;
    return this;
  }

  public getConfig(): VoiceKernelConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<VoiceKernelConfig>): VoiceKernelConfig {
    this.config = { ...this.config, ...partial };
    return this.config;
  }

  // -------------------------------------------------------------
  // Barge-In & Concurrency Token Locking
  // -------------------------------------------------------------
  public nextGenerationToken(): number {
    this.activeGenerationToken += 1;
    return this.activeGenerationToken;
  }

  public getGenerationToken(): number {
    return this.activeGenerationToken;
  }

  // -------------------------------------------------------------
  // STT / TTS Execution
  // -------------------------------------------------------------
  public async processInputAudio(
    audioBuffer: Buffer | string, 
    mimeType: string = 'audio/webm;codecs=opus'
  ): Promise<STTResult> {
    const result = await this.sttPipeline.transcribeAudio(audioBuffer, mimeType);
    this.latencyHistory.push({
      type: 'stt',
      durationMs: result.latencyMs,
      timestamp: Date.now(),
    });
    if (this.latencyHistory.length > 50) this.latencyHistory.shift();
    return result;
  }

  public recordTTSLatency(benchmark: TTSBenchmark): void {
    this.latencyHistory.push({
      type: 'tts',
      durationMs: benchmark.ttfbMs,
      timestamp: Date.now(),
    });
    if (this.latencyHistory.length > 50) this.latencyHistory.shift();
  }

  // -------------------------------------------------------------
  // Benchmarking & Telemetry
  // -------------------------------------------------------------
  public getBenchmarkSummary(): VoiceBenchmarkSummary {
    const sttLatencies = this.latencyHistory.filter(l => l.type === 'stt').map(l => l.durationMs);
    const ttsLatencies = this.latencyHistory.filter(l => l.type === 'tts').map(l => l.durationMs);

    const avgStt = sttLatencies.length > 0 
      ? Math.round(sttLatencies.reduce((a, b) => a + b, 0) / sttLatencies.length) 
      : 120;

    const avgTts = ttsLatencies.length > 0 
      ? Math.round(ttsLatencies.reduce((a, b) => a + b, 0) / ttsLatencies.length) 
      : 235;

    const isFullyOperational = this.ttsPipeline.isConfigured;

    return {
      version: MoneyOSVoiceKernel.VERSION,
      status: isFullyOperational ? 'operational' : 'fallback',
      googleSTT: {
        configured: this.sttPipeline.isConfigured,
        active: this.config.useGoogleSTT,
        avgLatencyMs: avgStt,
      },
      elevenLabsTTS: {
        configured: this.ttsPipeline.isConfigured,
        active: this.config.useElevenLabsTTS,
        avgTtfbMs: avgTts,
        model: 'eleven_flash_v2_5',
      },
      targetLatencyMs: this.config.targetLatencyMs,
      totalInteractions: this.latencyHistory.length,
      lastInteractionTimestamp: this.latencyHistory.length > 0 
        ? new Date(this.latencyHistory[this.latencyHistory.length - 1].timestamp).toISOString() 
        : null,
    };
  }
}

export const voiceKernel = new MoneyOSVoiceKernel();
