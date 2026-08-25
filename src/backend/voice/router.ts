/**
 * MoneyOS Voice Engine v3.1 — Voice Kernel API Router
 * Location: src/backend/voice/router.ts
 */

import { Router, Request, Response } from 'express';
import { voiceKernel } from './kernel';
import { elevenLabsTTS } from './elevenlabs-tts';
import { googleSTT } from './google-stt';
import { PERSONA_PROFILES, BasePersona, EmotionalTone } from './persona';

const router = Router();

/**
 * GET /api/voice/benchmark
 * Returns real-time latency metrics and dual-pipeline operational status
 */
router.get('/benchmark', (req: Request, res: Response) => {
  const summary = voiceKernel.getBenchmarkSummary();
  res.json({
    success: true,
    data: summary,
  });
});

/**
 * GET /api/voice/personas
 * Lists all registered voice profiles and emotional modulation presets
 */
router.get('/personas', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      personas: Object.values(PERSONA_PROFILES),
      tones: ['neutral', 'cinematic', 'calm', 'assertive', 'hype', 'ritualistic', 'whisper', 'ascension'],
      activePersona: voiceKernel.getConfig().activePersona,
      activeTone: voiceKernel.getConfig().activeTone,
    },
  });
});

/**
 * POST /api/voice/config
 * Updates kernel toggles (e.g. voice.useGoogle(), voice.useElevenLabs())
 */
router.post('/config', (req: Request, res: Response) => {
  const { useGoogleSTT, useElevenLabsTTS, activePersona, activeTone, targetLatencyMs } = req.body;

  if (typeof useGoogleSTT === 'boolean') voiceKernel.useGoogle(useGoogleSTT);
  if (typeof useElevenLabsTTS === 'boolean') voiceKernel.useElevenLabs(useElevenLabsTTS);
  if (activePersona) voiceKernel.setPersona(activePersona as BasePersona, activeTone as EmotionalTone);
  if (typeof targetLatencyMs === 'number') voiceKernel.updateConfig({ targetLatencyMs });

  res.json({
    success: true,
    data: voiceKernel.getConfig(),
  });
});

/**
 * GET /api/voice/quota
 * Returns live character balance and quota from ElevenLabs
 */
router.get('/quota', async (req: Request, res: Response) => {
  const apiKey = process.env.ELEVENLABS_API_KEY || '';
  if (!apiKey || apiKey.length < 10) {
    res.json({
      success: true,
      data: {
        configured: false,
        status: 'no_key',
        characterCount: 0,
        characterLimit: 0,
        remainingCharacters: 0,
      }
    });
    return;
  }

  try {
    const elRes = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey }
    });

    if (elRes.ok) {
      const sub = await elRes.json() as any;
      const count = sub.character_count || 0;
      const limit = sub.character_limit || 0;
      const remaining = Math.max(0, limit - count);

      res.json({
        success: true,
        data: {
          configured: true,
          status: remaining > 0 ? 'active' : 'quota_exhausted',
          tier: sub.tier || 'free',
          characterCount: count,
          characterLimit: limit,
          remainingCharacters: remaining,
          resetDateUnix: sub.next_character_count_reset_unix,
        }
      });
    } else {
      const err = await elRes.json() as any;
      res.json({
        success: true,
        data: {
          configured: true,
          status: 'error',
          error: err?.detail?.message || `ElevenLabs returned ${elRes.status}`,
          characterCount: 0,
          characterLimit: 0,
          remainingCharacters: 0,
        }
      });
    }
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/voice/api-key
 * Dynamically updates the ElevenLabs API Key in memory and persistence
 */
router.post('/api-key', async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    res.status(400).json({ success: false, error: 'Valid ElevenLabs API Key is required.' });
    return;
  }

  const cleanKey = apiKey.trim();
  process.env.ELEVENLABS_API_KEY = cleanKey;

  // Validate the key with ElevenLabs
  try {
    const elRes = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': cleanKey }
    });

    if (elRes.ok) {
      const sub = await elRes.json() as any;
      const remaining = Math.max(0, (sub.character_limit || 0) - (sub.character_count || 0));

      res.json({
        success: true,
        message: 'ElevenLabs API key successfully verified and updated!',
        data: {
          tier: sub.tier,
          characterCount: sub.character_count,
          characterLimit: sub.character_limit,
          remainingCharacters: remaining,
        }
      });
    } else {
      const err = await elRes.json() as any;
      res.status(400).json({
        success: false,
        error: err?.detail?.message || 'ElevenLabs rejected this API Key.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/voice/google-status
 * Checks status of Google Cloud Speech / Gemini API key
 */
router.get('/google-status', (req: Request, res: Response) => {
  const isConfigured = googleSTT.isConfigured;
  res.json({
    success: true,
    data: {
      configured: isConfigured,
      active: voiceKernel.getConfig().useGoogleSTT,
      provider: isConfigured ? 'google-cloud-stt' : 'browser-web-speech',
      keyPreview: isConfigured ? 'AIzaSy...' : 'Not configured (using Web Speech API)'
    }
  });
});

/**
 * POST /api/voice/google-key
 * Updates Google Speech / Cloud API Key dynamically
 */
router.post('/google-key', (req: Request, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 15) {
    res.status(400).json({ success: false, error: 'Valid Google Cloud / Gemini API key required.' });
    return;
  }

  const cleanKey = apiKey.trim();
  process.env.GOOGLE_SPEECH_API_KEY = cleanKey;
  process.env.GOOGLE_CLOUD_API_KEY = cleanKey;
  process.env.GEMINI_API_KEY = cleanKey;

  res.json({
    success: true,
    message: 'Google Cloud Speech & Gemini API Key updated successfully!',
    data: {
      configured: true,
      active: true,
    }
  });
});

/**
 * POST /api/voice/stt
 * Processes streaming or base64 audio through Google Cloud Speech-to-Text
 */
router.post('/stt', async (req: Request, res: Response) => {
  try {
    const { audio, mimeType, sampleRateHertz, languageCode } = req.body;

    if (!audio) {
      res.status(400).json({ success: false, error: 'Audio data is required (base64 string).' });
      return;
    }

    const config = voiceKernel.getConfig();
    if (!config.useGoogleSTT) {
      res.json({
        success: true,
        data: {
          transcript: '',
          confidence: 0,
          provider: 'browser-fallback',
          note: 'Google STT disabled by kernel toggle',
        },
      });
      return;
    }

    const result = await googleSTT.transcribeAudio(audio, mimeType || 'audio/webm;codecs=opus', {
      sampleRateHertz,
      languageCode,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[VoiceRouter] STT error:', err.message);
    res.status(500).json({ success: false, error: 'STT pipeline error', fallback: 'browser' });
  }
});

/**
 * POST /api/voice/tts
 * Synthesizes speech text through ElevenLabs low-latency stream with dynamic personas
 */
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, persona, tone, stability, similarity_boost, style, speed } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ success: false, error: 'Text is required for speech synthesis' });
      return;
    }

    const config = voiceKernel.getConfig();
    if (!config.useElevenLabsTTS) {
      res.status(200).json({
        success: false,
        fallback: 'browser',
        text: text.trim(),
        note: 'ElevenLabs disabled by kernel toggle',
      });
      return;
    }

    const benchmark = await elevenLabsTTS.streamSpeech(text.trim(), res, {
      persona: persona || config.activePersona,
      tone: tone || config.activeTone,
      stability,
      similarity_boost,
      style,
      speed,
      optimizeLatency: 4,
    });

    voiceKernel.recordTTSLatency(benchmark);
  } catch (err: any) {
    console.error('[VoiceRouter] TTS error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, fallback: 'browser', error: 'TTS stream failed' });
    }
  }
});

export default router;
