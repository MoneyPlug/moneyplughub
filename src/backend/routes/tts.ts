import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db';

const router = Router();

function extractUserId(req: Request): string | null {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)
      || (req as any).cookies?.token;
    if (!token) return null;
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export type BasePersona = 
  | 'vault_explanation' 
  | 'referral_strategy' 
  | 'creator_mode' 
  | 'sigil_forge' 
  | 'creator_passport' 
  | 'active_ai_studio' 
  | 'chamber_unlock' 
  | 'ritual' 
  | 'error_neutral' 
  | 'general_conversation';

export type EmotionOverlay = 
  | 'calm' 
  | 'excited' 
  | 'reverent' 
  | 'analytical' 
  | 'hype' 
  | 'ritualistic' 
  | 'whisper' 
  | 'ascension';

export type VoiceIntent = 
  | 'explore' 
  | 'ask' 
  | 'escalate' 
  | 'unlock' 
  | 'reflect' 
  | 'strategize' 
  | 'create' 
  | 'troubleshoot';

export type SoundscapeType = 
  | 'vault_hum' 
  | 'sigil_shimmer' 
  | 'cyber_pulse' 
  | 'harmonic_drone' 
  | 'none';

interface PersonaMetrics {
  name: string;
  description: string;
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  pace: number;
  spatialPan: 'left' | 'center' | 'right';
  soundscape: SoundscapeType;
  signaturePrefix?: string;
}

export const BASE_PERSONAS: Record<BasePersona, PersonaMetrics> = {
  vault_explanation: {
    name: 'Clarity & Authority',
    description: 'Grounding financial explanation with high clarity and steady presence.',
    stability: 0.55,
    similarity_boost: 0.75,
    style: 0.15,
    use_speaker_boost: true,
    pace: 0.95,
    spatialPan: 'center',
    soundscape: 'vault_hum',
    signaturePrefix: 'Opening the Living Vault. ',
  },
  referral_strategy: {
    name: 'Tactical Creator Strategist',
    description: 'High-conviction, energetic distribution and revenue scaling cadence.',
    stability: 0.35,
    similarity_boost: 0.85,
    style: 0.40,
    use_speaker_boost: true,
    pace: 1.08,
    spatialPan: 'center',
    soundscape: 'cyber_pulse',
    signaturePrefix: 'Initializing your wealth trajectory. ',
  },
  creator_mode: {
    name: 'Creator Performance Engine',
    description: 'Fast, motivational, sharp cadence focused on MRR and contextual trust.',
    stability: 0.32,
    similarity_boost: 0.88,
    style: 0.45,
    use_speaker_boost: true,
    pace: 1.10,
    spatialPan: 'center',
    soundscape: 'cyber_pulse',
    signaturePrefix: 'Signal verified. ',
  },
  sigil_forge: {
    name: 'Mystical Realm Guide',
    description: 'Slow, deliberate, ritual cadence for cryptographic artifacts and sigil forge.',
    stability: 0.65,
    similarity_boost: 0.70,
    style: 0.25,
    use_speaker_boost: false,
    pace: 0.88,
    spatialPan: 'right',
    soundscape: 'sigil_shimmer',
    signaturePrefix: 'Transmuting intent into form. ',
  },
  creator_passport: {
    name: 'Cinematic Identity Narrator',
    description: 'Rising tone, majestic and authoritative verification.',
    stability: 0.45,
    similarity_boost: 0.80,
    style: 0.35,
    use_speaker_boost: true,
    pace: 1.00,
    spatialPan: 'right',
    soundscape: 'sigil_shimmer',
    signaturePrefix: 'Passport credentials confirmed. ',
  },
  active_ai_studio: {
    name: 'Viral Velocity Hype',
    description: 'Rapid-fire, punchy, tactical hook and script generator.',
    stability: 0.30,
    similarity_boost: 0.90,
    style: 0.50,
    use_speaker_boost: true,
    pace: 1.12,
    spatialPan: 'center',
    soundscape: 'cyber_pulse',
    signaturePrefix: 'Pulse rising. Systems aligning. ',
  },
  chamber_unlock: {
    name: 'Mythic Chamber Resonance',
    description: 'Deep resonant reverberation for tier ascensions and chamber unlocks.',
    stability: 0.70,
    similarity_boost: 0.85,
    style: 0.45,
    use_speaker_boost: true,
    pace: 0.85,
    spatialPan: 'center',
    soundscape: 'harmonic_drone',
    signaturePrefix: 'Your next chamber awaits. ',
  },
  ritual: {
    name: 'Cosmic Ritual Voice',
    description: 'Slow, sacred OS cadence for milestone accomplishments.',
    stability: 0.68,
    similarity_boost: 0.82,
    style: 0.38,
    use_speaker_boost: true,
    pace: 0.86,
    spatialPan: 'center',
    soundscape: 'harmonic_drone',
    signaturePrefix: 'The ritual seal is complete. ',
  },
  error_neutral: {
    name: 'Calm Reassurance',
    description: 'Soft, gentle, de-escalating tone.',
    stability: 0.60,
    similarity_boost: 0.65,
    style: 0.10,
    use_speaker_boost: false,
    pace: 0.95,
    spatialPan: 'left',
    soundscape: 'none',
  },
  general_conversation: {
    name: 'Calm Authority',
    description: 'Charismatic, balanced financial co-pilot default tone.',
    stability: 0.42,
    similarity_boost: 0.75,
    style: 0.22,
    use_speaker_boost: true,
    pace: 1.00,
    spatialPan: 'center',
    soundscape: 'none',
  },
};

// ─── 1. Persona Fusion Matrix ─────────────────────────────────────────
export interface FusionProfile {
  name: string;
  description: string;
  stability: number;
  similarity_boost: number;
  style: number;
  pace: number;
  spatialPan: 'left' | 'center' | 'right';
  soundscape: SoundscapeType;
  signaturePrefix: string;
}

export const PERSONA_FUSION_MAP: Record<string, FusionProfile> = {
  'creator_mode:referral_strategy': {
    name: 'Creator Strategist Hybrid',
    description: 'High-stakes tactical distribution & exponential scaling cadence.',
    stability: 0.33,
    similarity_boost: 0.88,
    style: 0.42,
    pace: 1.09,
    spatialPan: 'center',
    soundscape: 'cyber_pulse',
    signaturePrefix: 'Strategic distribution locked. ',
  },
  'sigil_forge:ritual': {
    name: 'Mythic Forge Voice',
    description: 'Sacred artifact creation with slow ritualistic harmonic cadence.',
    stability: 0.67,
    similarity_boost: 0.78,
    style: 0.32,
    pace: 0.87,
    spatialPan: 'right',
    soundscape: 'sigil_shimmer',
    signaturePrefix: 'Forging eternal cryptographic seal. ',
  },
  'vault_explanation:general_conversation': {
    name: 'Calm Ledger Guide',
    description: 'Effortless, friendly financial advisory with grounded authority.',
    stability: 0.48,
    similarity_boost: 0.76,
    style: 0.18,
    pace: 0.98,
    spatialPan: 'center',
    soundscape: 'vault_hum',
    signaturePrefix: 'Ledger state synchronized. ',
  },
  'active_ai_studio:creator_mode': {
    name: 'Viral Growth Accelerator',
    description: 'Maximum velocity, hype, and 3-second pattern interrupts.',
    stability: 0.31,
    similarity_boost: 0.90,
    style: 0.52,
    pace: 1.14,
    spatialPan: 'center',
    soundscape: 'cyber_pulse',
    signaturePrefix: 'Viral surge initialized. ',
  },
  'chamber_unlock:creator_passport': {
    name: 'Ascended Identity Voice',
    description: 'Majestic ceremonial proclamation for tier ascension & master credentials.',
    stability: 0.62,
    similarity_boost: 0.84,
    style: 0.40,
    pace: 0.92,
    spatialPan: 'right',
    soundscape: 'harmonic_drone',
    signaturePrefix: 'Cosmic ascension verified. ',
  },
};

// ─── 2. Emotional State Modifiers ─────────────────────────────────────
export const EMOTIONAL_OVERLAYS: Record<EmotionOverlay, { pace: number; stability: number; style: number }> = {
  calm: { pace: -0.05, stability: +0.10, style: -0.05 },
  excited: { pace: +0.10, stability: -0.08, style: +0.20 },
  reverent: { pace: -0.08, stability: +0.15, style: +0.10 },
  analytical: { pace: -0.02, stability: +0.12, style: -0.10 },
  hype: { pace: +0.14, stability: -0.10, style: +0.25 },
  ritualistic: { pace: -0.10, stability: +0.18, style: +0.15 },
  whisper: { pace: -0.12, stability: +0.20, style: -0.15 },
  ascension: { pace: -0.08, stability: +0.22, style: +0.30 },
};

// ─── 3. Voice Memory & Topic Drift State ──────────────────────────────
interface MemoryState {
  persona: BasePersona;
  fusionKey?: string;
  emotion: EmotionOverlay;
  intent: VoiceIntent;
  topicStreak: number;
  timestamp: number;
  snippet: string;
}
const voiceMemoryMap = new Map<string, MemoryState[]>();

function recordMemory(clientId: string, state: MemoryState) {
  const history = voiceMemoryMap.get(clientId) || [];
  history.push(state);
  if (history.length > 10) history.shift();
  voiceMemoryMap.set(clientId, history);
}

function getMemory(clientId: string): MemoryState | null {
  const history = voiceMemoryMap.get(clientId);
  if (!history || history.length === 0) return null;
  return history[history.length - 1];
}

// ─── 4. Voice Intent & Emotion Prediction ─────────────────────────────
export function classifyVoiceIntentAndEmotion(
  text: string, 
  clientId?: string
): { intent: VoiceIntent; emotion: EmotionOverlay; basePersona: BasePersona; fusionKey?: string } {
  const p = text.toLowerCase();

  // Intent classification
  let intent: VoiceIntent = 'ask';
  if (/\b(unlock|ascend|chamber|level\s*up|ceremony|tier)\b/i.test(p)) intent = 'unlock';
  else if (/\b(sigil|forge|create|build|render|transmute|generate)\b/i.test(p)) intent = 'create';
  else if (/\b(strategy|scale|mrr|commission|referral|conversion|k-factor)\b/i.test(p)) intent = 'strategize';
  else if (/\b(explore|browse|walkthrough|what\s*is|how\s*does|overview)\b/i.test(p)) intent = 'explore';
  else if (/\b(error|failed|broken|bug|issue|warning|wrong)\b/i.test(p)) intent = 'troubleshoot';
  else if (/\b(urgent|now|fast|boost|surge|hyperdrive)\b/i.test(p)) intent = 'escalate';
  else if (/\b(why|reflect|think|perspective|meaning|future|goal)\b/i.test(p)) intent = 'reflect';

  // Emotion classification
  let emotion: EmotionOverlay = 'calm';
  if (intent === 'unlock') emotion = 'ascension';
  else if (/\b(sigil|glyph|cosmic|nebula|mystic|sacred)\b/i.test(p)) emotion = 'ritualistic';
  else if (/\b(fire|hype|rocket|surge|boost|viral|100%|insane)\b/i.test(p)) emotion = 'hype';
  else if (/\b(k-factor|metric|formula|percent|cents|math|calculate|ratio)\b/i.test(p)) emotion = 'analytical';
  else if (/\b(awesome|great|excited|congrats|milestone|winning)\b/i.test(p)) emotion = 'excited';
  else if (/\b(secret|whisper|exclusive|classified|private)\b/i.test(p)) emotion = 'whisper';
  else if (/\b(honor|revere|legendary|eternal|founder)\b/i.test(p)) emotion = 'reverent';

  // Base persona mapping
  let basePersona: BasePersona = 'general_conversation';
  if (intent === 'unlock' || /\b(chamber|ascension|level)\b/i.test(p)) basePersona = 'chamber_unlock';
  else if (/\b(sigil|glyph|crest|artifact|forge)\b/i.test(p)) basePersona = 'sigil_forge';
  else if (/\b(passport|identity|sha-256|credential)\b/i.test(p)) basePersona = 'creator_passport';
  else if (/\b(referral|commission|bounty|mrr|affiliate|high-ticket|high-volume)\b/i.test(p)) basePersona = 'creator_mode';
  else if (/\b(ai\s*studio|5-pulse|viral\s*hook|video\s*script)\b/i.test(p)) basePersona = 'active_ai_studio';
  else if (/\b(living\s*vault|acid|ledger|net\s*worth|liquid\s*cash|debt|budget)\b/i.test(p)) basePersona = 'vault_explanation';
  else if (intent === 'troubleshoot') basePersona = 'error_neutral';

  // Check Memory Drift and potential Fusion
  let fusionKey: string | undefined = undefined;
  if (clientId) {
    const prev = getMemory(clientId);
    if (prev && Date.now() - prev.timestamp < 60000) {
      if (prev.persona === 'creator_mode' && basePersona === 'creator_mode') {
        fusionKey = 'creator_mode:referral_strategy';
      } else if (prev.persona === 'sigil_forge' && (basePersona === 'sigil_forge' || emotion === 'ritualistic')) {
        fusionKey = 'sigil_forge:ritual';
      } else if (prev.persona === 'vault_explanation' && basePersona === 'general_conversation') {
        fusionKey = 'vault_explanation:general_conversation';
      } else if (basePersona === 'active_ai_studio' && emotion === 'hype') {
        fusionKey = 'active_ai_studio:creator_mode';
      } else if (basePersona === 'chamber_unlock' && prev.persona === 'creator_passport') {
        fusionKey = 'chamber_unlock:creator_passport';
      }
    }
  }

  return { intent, emotion, basePersona, fusionKey };
}

/**
 * Clean & Format text for high-fidelity speech prosody with micro-expressions
 */
function prepareSpeechText(
  text: string, 
  signaturePrefix?: string, 
  injectSignature = false,
  emotion: EmotionOverlay = 'calm'
): string {
  let clean = text
    .replace(/###|\*\*|\*|#|`|---|⚡|💳|📊|🎯|💸|🤖|🏛️|👋|🧹|📈|🎙️|💰|🔥|✨|🚀|💪|🤙|🙏|😄|😂|😅|🌤️|📞|📴|🔊|🎶|🔇/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/PLUG-[A-Z0-9]+/g, (match) => match.split('').join(' '))
    .replace(/(\d+)\/mo/g, '$1 dollars per month')
    .replace(/(\d+)x\b/gi, '$1 times')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Inject signature phrase
  if (injectSignature && signaturePrefix && !clean.toLowerCase().includes(signaturePrefix.toLowerCase().trim())) {
    clean = signaturePrefix + clean;
  }

  // Micro-Expressions & Natural Breath Pausing based on emotion
  if (emotion === 'ritualistic' || emotion === 'ascension') {
    clean = clean.replace(/\./g, '... ').replace(/,/g, ', ... ');
  } else if (emotion === 'hype' || emotion === 'excited') {
    clean = clean.replace(/!/g, '! ').replace(/\./g, '. ');
  } else {
    clean = clean.replace(/,/g, ', ').replace(/\.\s+/g, '... ');
  }

  // Generous limit (up to 2,500 characters) - smart boundary so sentences are NEVER cut in half
  if (clean.length > 2500) {
    const truncated = clean.substring(0, 2450);
    const lastPunctuation = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    if (lastPunctuation > 1800) {
      return truncated.substring(0, lastPunctuation + 1);
    }
    return truncated + '...';
  }

  return clean;
}

/**
 * POST /api/tts/speak
 * 
 * MoneyOS Voice Engine v4 (Self-Modulating Cinematic Voice Organism)
 */
router.post('/speak', async (req: Request, res: Response) => {
  const { text, persona: explicitPersona, emotion: explicitEmotion, injectSignature = false } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ success: false, error: 'Text is required' });
    return;
  }

  if (!config.elevenLabs.isEnabled) {
    res.status(503).json({ 
      success: false, 
      error: 'ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in .env',
      fallback: 'browser'
    });
    return;
  }

  const clientId = (req.ip || 'anonymous') + (req.headers['user-agent'] || '');
  
  // 1. Classification & Prediction
  const analysis = classifyVoiceIntentAndEmotion(text, clientId);
  const emotion: EmotionOverlay = (explicitEmotion as EmotionOverlay) || analysis.emotion;
  const basePersona: BasePersona = (explicitPersona as BasePersona) || analysis.basePersona;
  const fusionKey = analysis.fusionKey && PERSONA_FUSION_MAP[analysis.fusionKey] ? analysis.fusionKey : undefined;

  // 2. Resolve Metrics (Fusion vs Base Persona)
  let metrics: PersonaMetrics | FusionProfile = fusionKey 
    ? PERSONA_FUSION_MAP[fusionKey] 
    : BASE_PERSONAS[basePersona];

  // 3. Apply Emotional Overlay
  const emoMod = EMOTIONAL_OVERLAYS[emotion] || EMOTIONAL_OVERLAYS.calm;
  const finalStability = Math.max(0.20, Math.min(0.95, metrics.stability + emoMod.stability));
  const finalStyle = Math.max(0.05, Math.min(0.90, metrics.style + emoMod.style));
  const finalPace = Math.max(0.75, Math.min(1.30, metrics.pace + emoMod.pace));

  // 4. Check Chamber Progression Evolution (Tier Multipliers)
  let evolutionTier = 'Chamber I: Standard Core';
  try {
    const userId = extractUserId(req);
    if (userId && userId !== 'demo_guest_user') {
      const u = db.prepare('SELECT level FROM users WHERE id = ?').get(userId) as any;
      const lvl = Number(u?.level || 1);
      if (lvl >= 10) evolutionTier = 'Chamber V: Full Cosmic Orchestration';
      else if (lvl >= 8) evolutionTier = 'Chamber IV: Persona Fusion & Memory Drift';
      else if (lvl >= 6) evolutionTier = 'Chamber III: Emotional Overlays Active';
      else if (lvl >= 3) evolutionTier = 'Chamber II: Enhanced Soundscapes Active';
    }
  } catch {}

  // 5. Speech text preparation
  const spokenText = prepareSpeechText(text, metrics.signaturePrefix, Boolean(injectSignature), emotion);
  if (!spokenText) {
    res.status(400).json({ success: false, error: 'No speakable text after cleaning' });
    return;
  }

  // 6. Record into Voice Memory
  recordMemory(clientId, {
    persona: basePersona,
    fusionKey,
    emotion,
    intent: analysis.intent,
    topicStreak: (getMemory(clientId)?.topicStreak || 0) + 1,
    timestamp: Date.now(),
    snippet: spokenText,
  });

  try {
    const elevenLabsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabs.voiceId}/stream?output_format=mp3_22050_32&optimize_streaming_latency=4`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.elevenLabs.apiKey,
        },
        body: JSON.stringify({
          text: spokenText,
          model_id: config.elevenLabs.modelId,
          voice_settings: {
            stability: finalStability,
            similarity_boost: metrics.similarity_boost,
            style: finalStyle,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenLabsRes.ok) {
      const errorText = await elevenLabsRes.text();
      console.error('ElevenLabs API error:', elevenLabsRes.status, errorText);
      res.status(502).json({ 
        success: false, 
        error: `ElevenLabs API returned ${elevenLabsRes.status}`,
        fallback: 'browser'
      });
      return;
    }

    // Set Rich v4 Metadata Headers
    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-MoneyOS-Persona': basePersona,
      'X-MoneyOS-Persona-Name': metrics.name,
      'X-MoneyOS-Fusion-Mode': fusionKey || 'none',
      'X-MoneyOS-Emotion': emotion,
      'X-MoneyOS-Intent': analysis.intent,
      'X-MoneyOS-Soundscape': metrics.soundscape,
      'X-MoneyOS-Spatial-Pan': metrics.spatialPan,
      'X-MoneyOS-Pace': finalPace.toFixed(2),
      'X-MoneyOS-Evolution-Tier': evolutionTier,
    });

    const reader = elevenLabsRes.body?.getReader();
    if (!reader) {
      res.status(502).json({ success: false, error: 'No response body', fallback: 'browser' });
      return;
    }

    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(Buffer.from(value));
      return pump();
    };
    await pump();

  } catch (err: any) {
    console.error('MoneyOS Voice Engine v4 Error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      fallback: 'browser'
    });
  }
});

/**
 * GET /api/tts/personas
 * Returns all active Base Personas, Fusion Modes, and Emotional Overlays
 */
router.get('/personas', (_req: Request, res: Response) => {
  res.json({
    success: true,
    engine: 'MoneyOS Voice Engine v4 (Self-Modulating Cinematic Voice Organism)',
    basePersonas: BASE_PERSONAS,
    fusionModes: PERSONA_FUSION_MAP,
    emotionalOverlays: EMOTIONAL_OVERLAYS,
  });
});

/**
 * GET /api/tts/status
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    elevenLabs: config.elevenLabs.isEnabled,
    voiceId: config.elevenLabs.voiceId,
    modelId: config.elevenLabs.modelId,
    version: 'v4.0.0-voice-organism',
  });
});

export default router;
