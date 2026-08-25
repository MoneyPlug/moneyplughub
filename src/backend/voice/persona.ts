/**
 * MoneyOS Voice Engine v3.1 — Persona & Emotional Tonality Module
 * Location: src/backend/voice/persona.ts
 */

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

export type EmotionalTone = 
  | 'neutral'
  | 'cinematic'
  | 'calm'
  | 'assertive'
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

export interface PersonaProfile {
  id: string;
  name: string;
  description: string;
  tone: EmotionalTone;
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
  spatialPan: 'left' | 'center' | 'right';
  soundscape: string;
  ssmlTemplate?: (text: string) => string;
}

export const PERSONA_PROFILES: Record<BasePersona, PersonaProfile> = {
  vault_explanation: {
    id: 'vault_explanation',
    name: 'Vault Sovereign Guide',
    description: 'Grounding financial explanation with high clarity, steady pace, and authoritative presence.',
    tone: 'calm',
    stability: 0.55,
    similarity_boost: 0.75,
    style: 0.15,
    use_speaker_boost: true,
    speed: 0.95,
    spatialPan: 'center',
    soundscape: 'vault_hum',
  },
  referral_strategy: {
    id: 'referral_strategy',
    name: 'Tactical Growth Strategist',
    description: 'High-conviction, assertive distribution and affiliate revenue scaling cadence.',
    tone: 'assertive',
    stability: 0.35,
    similarity_boost: 0.85,
    style: 0.40,
    use_speaker_boost: true,
    speed: 1.08,
    spatialPan: 'center',
    soundscape: 'cyber_pulse',
  },
  creator_mode: {
    id: 'creator_mode',
    name: 'Creator Performance Engine',
    description: 'Fast, motivational, sharp cadence focused on MRR, viral hooks, and compounding.',
    tone: 'hype',
    stability: 0.30,
    similarity_boost: 0.80,
    style: 0.50,
    use_speaker_boost: true,
    speed: 1.10,
    spatialPan: 'center',
    soundscape: 'cyber_pulse',
  },
  sigil_forge: {
    id: 'sigil_forge',
    name: 'Cryptographic Sigil Architect',
    description: 'Cinematic, resonance-rich cadence with deliberate pauses and harmonics.',
    tone: 'cinematic',
    stability: 0.65,
    similarity_boost: 0.80,
    style: 0.30,
    use_speaker_boost: true,
    speed: 0.88,
    spatialPan: 'center',
    soundscape: 'sigil_shimmer',
  },
  creator_passport: {
    id: 'creator_passport',
    name: 'Passport Herald',
    description: 'Cinematic, rising tone suitable for level progression and identity reveals.',
    tone: 'cinematic',
    stability: 0.45,
    similarity_boost: 0.85,
    style: 0.35,
    use_speaker_boost: true,
    speed: 1.00,
    spatialPan: 'center',
    soundscape: 'harmonic_drone',
  },
  active_ai_studio: {
    id: 'active_ai_studio',
    name: 'Viral Pulse Director',
    description: 'High energy, fast-paced dispatch for 5-Pulse viral hook generation.',
    tone: 'hype',
    stability: 0.28,
    similarity_boost: 0.78,
    style: 0.45,
    use_speaker_boost: true,
    speed: 1.12,
    spatialPan: 'center',
    soundscape: 'cyber_pulse',
  },
  chamber_unlock: {
    id: 'chamber_unlock',
    name: 'Ascension Herald',
    description: 'Triumphant celebration cadence when unlocking higher permission chambers.',
    tone: 'ascension',
    stability: 0.40,
    similarity_boost: 0.90,
    style: 0.60,
    use_speaker_boost: true,
    speed: 1.02,
    spatialPan: 'center',
    soundscape: 'sigil_shimmer',
  },
  ritual: {
    id: 'ritual',
    name: 'Mythic Forge Voice',
    description: 'Deep, resonant, low-frequency whisper for deep philosophy and substrate lore.',
    tone: 'ritualistic',
    stability: 0.70,
    similarity_boost: 0.70,
    style: 0.25,
    use_speaker_boost: false,
    speed: 0.85,
    spatialPan: 'center',
    soundscape: 'harmonic_drone',
  },
  error_neutral: {
    id: 'error_neutral',
    name: 'Diagnostic Auditor',
    description: 'Neutral, calm, diagnostic resolution tone for system alerts.',
    tone: 'neutral',
    stability: 0.60,
    similarity_boost: 0.70,
    style: 0.05,
    use_speaker_boost: false,
    speed: 1.00,
    spatialPan: 'center',
    soundscape: 'none',
  },
  general_conversation: {
    id: 'general_conversation',
    name: 'MoneyOS Primary AI Co-Pilot',
    description: 'Warm, adaptive, articulate conversational tone that seamlessly pivots.',
    tone: 'calm',
    stability: 0.40,
    similarity_boost: 0.80,
    style: 0.20,
    use_speaker_boost: true,
    speed: 1.00,
    spatialPan: 'center',
    soundscape: 'vault_hum',
  },
};

/**
 * Maps emotional tonality overrides onto base persona metrics
 */
export function applyEmotionalTone(
  profile: PersonaProfile, 
  tone?: EmotionalTone
): PersonaProfile {
  if (!tone) return profile;

  const modified = { ...profile, tone };

  switch (tone) {
    case 'cinematic':
      modified.stability = Math.max(0.45, modified.stability);
      modified.style = Math.min(0.60, modified.style + 0.15);
      modified.speed = 0.94;
      break;
    case 'calm':
      modified.stability = Math.min(0.65, modified.stability + 0.10);
      modified.style = Math.max(0.10, modified.style - 0.10);
      modified.speed = 0.96;
      break;
    case 'assertive':
      modified.stability = 0.35;
      modified.similarity_boost = 0.85;
      modified.style = 0.45;
      modified.speed = 1.06;
      break;
    case 'hype':
      modified.stability = 0.25;
      modified.style = 0.60;
      modified.speed = 1.12;
      break;
    case 'ritualistic':
      modified.stability = 0.75;
      modified.style = 0.20;
      modified.speed = 0.85;
      break;
    case 'whisper':
      modified.stability = 0.80;
      modified.style = 0.10;
      modified.speed = 0.90;
      break;
    case 'ascension':
      modified.stability = 0.38;
      modified.style = 0.65;
      modified.speed = 1.04;
      break;
    case 'neutral':
    default:
      modified.stability = 0.50;
      modified.style = 0.15;
      modified.speed = 1.00;
      break;
  }

  return modified;
}

/**
 * Formats SSML tags and micro-pauses for humanized, natural synthesis
 */
export function injectSpeechProsody(text: string, tone: EmotionalTone = 'neutral'): string {
  let cleaned = text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[^\w\s.,!?'"$\-%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Natural punctuation breathing pauses
  cleaned = cleaned.replace(/([.!?])\s+/g, '$1 ');

  return cleaned;
}
