/**
 * MoneyOS Voice Engine v3.1 — Google Cloud Speech-to-Text Module
 * Location: src/backend/voice/google-stt.ts
 */

export interface GoogleSTTOptions {
  languageCode?: string;
  sampleRateHertz?: number;
  encoding?: string;
  enableAutomaticPunctuation?: boolean;
  model?: string;
}

export interface STTResult {
  transcript: string;
  confidence: number;
  provider: 'google-stt' | 'gemini-audio' | 'browser-fallback';
  latencyMs: number;
  isFinal: boolean;
}

export class GoogleSTTPipeline {
  private get apiKey(): string {
    return process.env.GOOGLE_SPEECH_API_KEY || 
           process.env.GOOGLE_CLOUD_API_KEY || 
           process.env.GEMINI_API_KEY || 
           '';
  }

  public get isConfigured(): boolean {
    return this.apiKey.length > 20; // Valid Google Cloud / Gemini keys are typically 39 chars
  }

  /**
   * Transcribe base64 or raw audio buffer using Google Cloud Speech-to-Text or Gemini Audio API
   */
  public async transcribeAudio(
    audioBuffer: Buffer | string,
    mimeType: string = 'audio/webm;codecs=opus',
    options: GoogleSTTOptions = {}
  ): Promise<STTResult> {
    const startTime = Date.now();
    const base64Audio = typeof audioBuffer === 'string' ? audioBuffer : audioBuffer.toString('base64');
    const key = this.apiKey;

    // 1. Try Google Cloud Speech-to-Text v1
    if (key && key.length > 20) {
      try {
        const encoding = mimeType.includes('wav') 
          ? 'LINEAR16' 
          : mimeType.includes('flac') 
          ? 'FLAC' 
          : 'WEBM_OPUS';

        const requestBody = {
          config: {
            encoding,
            sampleRateHertz: options.sampleRateHertz || 48000,
            languageCode: options.languageCode || 'en-US',
            enableAutomaticPunctuation: options.enableAutomaticPunctuation !== false,
            model: options.model || 'default',
          },
          audio: {
            content: base64Audio,
          },
        };

        const res = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) {
          const data = await res.json() as any;
          const results = data.results || [];
          if (results.length > 0 && results[0].alternatives && results[0].alternatives.length > 0) {
            const best = results[0].alternatives[0];
            const latencyMs = Date.now() - startTime;
            return {
              transcript: best.transcript || '',
              confidence: best.confidence || 0.95,
              provider: 'google-stt',
              latencyMs,
              isFinal: true,
            };
          }
        } else {
          // 2. Try Gemini 1.5 Flash Audio transcription as alternative Google API endpoint
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [
                    { text: 'Transcribe this spoken audio exactly as words with no commentary or introductory text:' },
                    { inlineData: { mimeType: mimeType.split(';')[0], data: base64Audio } }
                  ]
                }]
              })
            });

            if (geminiRes.ok) {
              const gData = await geminiRes.json() as any;
              const text = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text.trim()) {
                return {
                  transcript: text.trim(),
                  confidence: 0.98,
                  provider: 'gemini-audio',
                  latencyMs: Date.now() - startTime,
                  isFinal: true,
                };
              }
            }
          } catch {}
        }
      } catch (err: any) {
        console.warn(`[GoogleSTT] Speech transcription error:`, err.message);
      }
    }

    // Fallback: Inform client to process via Web Speech API or local pipeline
    const latencyMs = Date.now() - startTime;
    return {
      transcript: '',
      confidence: 0,
      provider: 'browser-fallback',
      latencyMs,
      isFinal: true,
    };
  }
}

export const googleSTT = new GoogleSTTPipeline();
