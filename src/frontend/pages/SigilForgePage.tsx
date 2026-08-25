import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLivingRealm } from '../context/LivingRealmContext';
import { useGamificationXp } from '../context/GamificationXpContext';
import { PointPackButton } from '../components/PointPackButton';
import { NiagaraParticleCanvas } from '../components/NiagaraParticleCanvas';
import { forgeAudio } from '../utils/forgeAudio';
import { 
  Compass, Sparkles, Shield, Trophy, Zap, 
  RotateCw, Eye, Check, ShoppingBag, Lock, Crown, Award, 
  ExternalLink, Maximize2, RefreshCw, Loader2, Download,
  Sliders, Copy, Dices, Layers, ShieldCheck, Share2,
  Terminal, Sparkle, Flame, Gem, Palette, Type, Scan,
  Volume2, VolumeX, Image, Wand2, Sun, Moon, Orbit, Cpu, Fingerprint
} from 'lucide-react';

interface SigilForgePageProps {
  onNavigate?: (tab: string) => void;
}

interface MarketItem {
  id: string;
  name: string;
  category: 'aura' | 'glyph' | 'ring' | 'crest';
  rarity: 'rare' | 'epic' | 'legendary' | 'cosmic';
  cost_xp: number;
  min_level: number;
  description: string;
  preview_accent: string;
}

interface MythicArchetype {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  accent: string;
  min_level: number;
  config: {
    aura: string;
    glyph: string;
    ring: string;
    crest: string;
    motto: string;
    monogram?: string;
  };
}

const MYTHIC_ARCHETYPES: MythicArchetype[] = [
  {
    id: 'novice_origin',
    name: 'Vector Novice',
    tagline: 'Cyber Matrix & Subatomic PCB Traces',
    icon: '🌱',
    accent: '#00ff88',
    min_level: 1,
    config: {
      aura: 'aura_cyber_emerald',
      glyph: 'glyph_quantum_hex',
      ring: 'ring_circuit_traces',
      crest: 'crest_cyber_spikes',
      motto: 'GENESIS OF WEALTH',
      monogram: 'PLUG',
    }
  },
  {
    id: 'alchemist',
    name: 'Cosmic Alchemist',
    tagline: 'Cosmic Nebula & Sacred Geometry',
    icon: '🌌',
    accent: '#a855f7',
    min_level: 3,
    config: {
      aura: 'aura_cosmic_nebula',
      glyph: 'glyph_octagram',
      ring: 'ring_rune_encryption',
      crest: 'crest_valkyrie_horns',
      motto: 'INFINITE TRANSCENDENCE',
      monogram: 'ALCH',
    }
  },
  {
    id: 'phoenix',
    name: 'Phoenix Sovereign',
    tagline: 'Solar Flare & Continuous Rebirth',
    icon: '🔥',
    accent: '#f97316',
    min_level: 5,
    config: {
      aura: 'aura_solar_flare',
      glyph: 'glyph_apex_crown',
      ring: 'ring_particle_flux',
      crest: 'crest_ouroboros_shield',
      motto: 'UNSTOPPABLE REBIRTH',
      monogram: 'FIRE',
    }
  },
  {
    id: 'seraphim',
    name: 'Seraphim Ascendant',
    tagline: 'Osmium Crystal Light & Biometric Wings',
    icon: '🕊️',
    accent: '#38bdf8',
    min_level: 7,
    config: {
      aura: 'aura_osmium_diamond',
      glyph: 'glyph_merkaba_vehicle',
      ring: 'ring_hex_shield_grid',
      crest: 'crest_angel_wings',
      motto: 'PURE LIGHT ASCENT',
      monogram: 'SOV',
    }
  },
  {
    id: 'dragonlord',
    name: 'Cyber Dragonlord',
    tagline: 'Void Singularity & Mecha Dominance',
    icon: '🐉',
    accent: '#ef4444',
    min_level: 8,
    config: {
      aura: 'aura_void_singularity',
      glyph: 'glyph_dragon_crest',
      ring: 'ring_astral_zodiac',
      crest: 'crest_dragon_horns',
      motto: 'ETERNAL REIGN',
      monogram: 'DRGN',
    }
  },
  {
    id: 'emperor',
    name: 'Sovereign Emperor',
    tagline: 'Imperial 24K Gold & Osmium Dominion',
    icon: '👑',
    accent: '#ffd700',
    min_level: 10,
    config: {
      aura: 'aura_primordial_gold',
      glyph: 'glyph_infinity_ouroboros',
      ring: 'ring_ouroboros_orbit',
      crest: 'crest_omni_sovereign',
      motto: 'SOVEREIGN SUPREME',
      monogram: 'APEX',
    }
  },
];

const AURAS_LIST: MarketItem[] = [
  { id: 'aura_cyber_emerald', name: 'Cyber Matrix', category: 'aura', rarity: 'rare', cost_xp: 250, min_level: 1, description: 'Neon Emerald & Cybernetic Laser Pulse shader (Starter Default).', preview_accent: '#00ff88' },
  { id: 'aura_synthwave_sunset', name: 'Retro Synthwave', category: 'aura', rarity: 'rare', cost_xp: 300, min_level: 2, description: 'Neon Magenta & Sunset Orange 80s synthwave horizon.', preview_accent: '#ec4899' },
  { id: 'aura_electric_plasma', name: 'Hyper Plasma', category: 'aura', rarity: 'rare', cost_xp: 350, min_level: 2, description: 'Ultraviolet laser discharge with ionized blue lightning arcs.', preview_accent: '#818cf8' },
  { id: 'aura_cosmic_nebula', name: 'Cosmic Nebula', category: 'aura', rarity: 'epic', cost_xp: 400, min_level: 3, description: 'Deep Supernova Violet & Cyan atmospheric plasma.', preview_accent: '#a855f7' },
  { id: 'aura_quantum_ice', name: 'Quantum Frost', category: 'aura', rarity: 'epic', cost_xp: 600, min_level: 4, description: 'Sub-zero Arctic Cyan & Diamond Frost refraction.', preview_accent: '#22d3ee' },
  { id: 'aura_solar_flare', name: 'Solar Flare', category: 'aura', rarity: 'epic', cost_xp: 750, min_level: 5, description: 'Radiant 24K Gold & Amber thermonuclear rays.', preview_accent: '#eab308' },
  { id: 'aura_jade_dragon', name: 'Jade Sovereign', category: 'aura', rarity: 'epic', cost_xp: 900, min_level: 6, description: 'Deep Dynastic Jade with incandescent emerald flame refraction.', preview_accent: '#10b981' },
  { id: 'aura_osmium_diamond', name: 'Osmium Diamond', category: 'aura', rarity: 'legendary', cost_xp: 1500, min_level: 7, description: 'Prismatic crystal refraction with iridescent dispersion.', preview_accent: '#38bdf8' },
  { id: 'aura_stealth_carbon', name: 'Stealth Carbon', category: 'aura', rarity: 'legendary', cost_xp: 1800, min_level: 8, description: 'Matte carbon-fiber weave with titanium laser telemetry accents.', preview_accent: '#94a3b8' },
  { id: 'aura_void_singularity', name: 'Void Singularity', category: 'aura', rarity: 'cosmic', cost_xp: 2500, min_level: 9, description: 'Event Horizon Dark Matter with glowing crimson accretion disk.', preview_accent: '#f43f5e' },
  { id: 'aura_primordial_gold', name: 'Primordia 24K Alchemy', category: 'aura', rarity: 'cosmic', cost_xp: 3500, min_level: 10, description: 'Liquid 24K Molten Gold with Aureate hyper-radiance.', preview_accent: '#ffd700' },
  { id: 'aura_bifrost_spectrum', name: 'Bifrost Spectrum', category: 'aura', rarity: 'cosmic', cost_xp: 4000, min_level: 10, description: 'Chromatic hyper-spectrum dispersion warping spacetime geometry.', preview_accent: '#f472b6' },
];

const GLYPHS_LIST: MarketItem[] = [
  { id: 'glyph_quantum_hex', name: 'Quantum Hex', category: 'glyph', rarity: 'rare', cost_xp: 450, min_level: 1, description: 'Subatomic hexagonal matrix pulsing with data streams (Starter Default).', preview_accent: '#10b981' },
  { id: 'glyph_metatron', name: "Metatron's Cube", category: 'glyph', rarity: 'rare', cost_xp: 350, min_level: 2, description: 'Ancient Sacred Geometry core mapping multi-dimensional harmony.', preview_accent: '#3b82f6' },
  { id: 'glyph_octagram', name: 'Celestial Octagram', category: 'glyph', rarity: 'epic', cost_xp: 650, min_level: 3, description: '8-Pointed Star of Supreme Alignment and Abundance.', preview_accent: '#f59e0b' },
  { id: 'glyph_flower_of_life', name: 'Flower of Life', category: 'glyph', rarity: 'epic', cost_xp: 850, min_level: 4, description: 'Ancient overlapping circles generating universal resonance.', preview_accent: '#06b6d4' },
  { id: 'glyph_apex_crown', name: 'Apex Sovereign Seal', category: 'glyph', rarity: 'epic', cost_xp: 950, min_level: 5, description: 'Imperial 7-Point diamond-studded crest of digital sovereignty.', preview_accent: '#ffd700' },
  { id: 'glyph_tesseract', name: '4D Tesseract', category: 'glyph', rarity: 'legendary', cost_xp: 1200, min_level: 6, description: 'Transcendent fourth-dimensional mathematical hypercube.', preview_accent: '#8b5cf6' },
  { id: 'glyph_merkaba_vehicle', name: 'Merkaba Star', category: 'glyph', rarity: 'legendary', cost_xp: 1600, min_level: 7, description: 'Dual interlocking tetrahedrons of light and ascension.', preview_accent: '#fbbf24' },
  { id: 'glyph_dragon_crest', name: 'Cyber Dragon', category: 'glyph', rarity: 'legendary', cost_xp: 1750, min_level: 8, description: 'Mecha Dragon crest symbolizing supreme market dominance.', preview_accent: '#ef4444' },
  { id: 'glyph_phoenix_core', name: 'Phoenix Fire Heart', category: 'glyph', rarity: 'legendary', cost_xp: 1900, min_level: 9, description: 'Immortal firebird core generating continuous capital rebirth.', preview_accent: '#f97316' },
  { id: 'glyph_primordia_eye', name: 'Eye of Primordia', category: 'glyph', rarity: 'cosmic', cost_xp: 2000, min_level: 9, description: 'Omniscient core glyph seeing all cashflow vectors in real-time.', preview_accent: '#ec4899' },
  { id: 'glyph_infinity_ouroboros', name: 'Ouroboros Knot', category: 'glyph', rarity: 'cosmic', cost_xp: 2800, min_level: 10, description: 'Infinite dragon loop generating eternal compounding wealth.', preview_accent: '#14b8a6' },
  { id: 'glyph_cyber_lotus', name: 'Geometric Cyber Lotus', category: 'glyph', rarity: 'cosmic', cost_xp: 3200, min_level: 10, description: 'Sacred 8-petal vector lotus of inner peace and compounding.', preview_accent: '#a855f7' },
];

const RINGS_LIST: MarketItem[] = [
  { id: 'ring_circuit_traces', name: 'Cyber PCB Traces', category: 'ring', rarity: 'rare', cost_xp: 500, min_level: 1, description: 'Gold microchip motherboard circuit traces and bus nodes (Starter Default).', preview_accent: '#10b981' },
  { id: 'ring_celestial_corona', name: 'Celestial Corona', category: 'ring', rarity: 'rare', cost_xp: 300, min_level: 2, description: 'Pulsing radial solar corona surrounding outer perimeter.', preview_accent: '#06b6d4' },
  { id: 'ring_rune_encryption', name: 'Runic Cipher Ring', category: 'ring', rarity: 'rare', cost_xp: 400, min_level: 3, description: 'Ancient Nordic runic encryption boundary guarding the sigil.', preview_accent: '#94a3b8' },
  { id: 'ring_laser_scanlines', name: 'Laser Radar Sweep', category: 'ring', rarity: 'rare', cost_xp: 450, min_level: 4, description: 'Twin high-precision radar laser sweep lines scanning 360 degrees.', preview_accent: '#34d399' },
  { id: 'ring_particle_flux', name: 'Particle Flux Orbit', category: 'ring', rarity: 'epic', cost_xp: 600, min_level: 5, description: 'Dotted particle orbit ring simulating relativistic motion.', preview_accent: '#a855f7' },
  { id: 'ring_dual_event_horizon', name: 'Dual Event Horizon', category: 'ring', rarity: 'epic', cost_xp: 750, min_level: 6, description: 'Twin intersecting tilted gravitational event horizon rings.', preview_accent: '#38bdf8' },
  { id: 'ring_hex_shield_grid', name: 'Aegis Hex Grid', category: 'ring', rarity: 'epic', cost_xp: 850, min_level: 7, description: 'Fortified hexagonal nano-shield grid perimeter.', preview_accent: '#38bdf8' },
  { id: 'ring_astral_zodiac', name: 'Astral Constellation', category: 'ring', rarity: 'legendary', cost_xp: 1300, min_level: 8, description: '12-node celestial star alignment ring with connecting lines.', preview_accent: '#f59e0b' },
  { id: 'ring_harmonic_pulse', name: 'Harmonic Resonator', category: 'ring', rarity: 'legendary', cost_xp: 1400, min_level: 9, description: 'Triple frequency sinusoidal oscillation wave.', preview_accent: '#f97316' },
  { id: 'ring_diamond_bezel', name: '16-Facet Diamond Bezel', category: 'ring', rarity: 'legendary', cost_xp: 1600, min_level: 9, description: 'Ultra-luxurious multi-faceted gemstone vector bevel ring.', preview_accent: '#e0e7ff' },
  { id: 'ring_singularity_vortex', name: 'Singularity Vortex', category: 'ring', rarity: 'cosmic', cost_xp: 2200, min_level: 10, description: 'Deep space warping spiral galaxy arms twisting inward.', preview_accent: '#e11d48' },
  { id: 'ring_ouroboros_orbit', name: 'Celestial Dragon Orbit', category: 'ring', rarity: 'cosmic', cost_xp: 3000, min_level: 10, description: 'Mythic serpent encircling the perimeter with glowing scales.', preview_accent: '#ffd700' },
];

const CRESTS_LIST: MarketItem[] = [
  { id: 'crest_cyber_spikes', name: 'Mecha Hyper-Spikes', category: 'crest', rarity: 'rare', cost_xp: 550, min_level: 1, description: 'Tri-blade aggressive aerodynamic mecha crown spikes (Starter Default).', preview_accent: '#34d399' },
  { id: 'crest_lightning', name: 'Zeus Dual Lightning', category: 'crest', rarity: 'rare', cost_xp: 350, min_level: 2, description: 'Twin electrostatic bolts crowning the upper sigil arc.', preview_accent: '#38bdf8' },
  { id: 'crest_valkyrie_horns', name: 'Valkyrie Sonic Horns', category: 'crest', rarity: 'rare', cost_xp: 450, min_level: 3, description: 'Neo-Nordic high-frequency resonance antennae.', preview_accent: '#c084fc' },
  { id: 'crest_crown', name: 'Imperial Plug Crown', category: 'crest', rarity: 'epic', cost_xp: 650, min_level: 4, description: '5-Point Imperial Crown of Digital Sovereignty.', preview_accent: '#eab308' },
  { id: 'crest_ouroboros_shield', name: 'Aegis Diamond Shield', category: 'crest', rarity: 'epic', cost_xp: 800, min_level: 5, description: 'Heavy fortified diamond barricade crest guarding against loss.', preview_accent: '#06b6d4' },
  { id: 'crest_halo_ascendance', name: 'Ascendant Tri-Halo', category: 'crest', rarity: 'epic', cost_xp: 1250, min_level: 6, description: 'Floating angelic luminous triple-ring halo of enlightenment.', preview_accent: '#fef08a' },
  { id: 'crest_angel_wings', name: 'Seraphim Cyber Wings', category: 'crest', rarity: 'legendary', cost_xp: 1100, min_level: 7, description: 'Dual biometric angel wings arching across the sigil.', preview_accent: '#c084fc' },
  { id: 'crest_phoenix_rebirth', name: 'Phoenix Fire Wings', category: 'crest', rarity: 'legendary', cost_xp: 1500, min_level: 8, description: 'Immortal golden firebird crest ascending from the ashes.', preview_accent: '#f97316' },
  { id: 'crest_dragon_horns', name: 'Mecha Dragon Horns', category: 'crest', rarity: 'legendary', cost_xp: 1650, min_level: 8, description: 'Twin curved cybernetic dragon horns radiating dominance.', preview_accent: '#ef4444' },
  { id: 'crest_vault_seal', name: 'Imperial Vault Seal', category: 'crest', rarity: 'cosmic', cost_xp: 1800, min_level: 9, description: 'Ancient runic encryption ring sealing the living vault.', preview_accent: '#14b8a6' },
  { id: 'crest_quantum_antenna', name: 'Quantum Telemetry', category: 'crest', rarity: 'cosmic', cost_xp: 3400, min_level: 9, description: 'Subatomic orbital communications antenna bridging realms.', preview_accent: '#38bdf8' },
  { id: 'crest_omni_sovereign', name: 'Crown of Osmium', category: 'crest', rarity: 'cosmic', cost_xp: 5000, min_level: 10, description: 'The supreme master crest of PrimordiaOS. Infinite status.', preview_accent: '#ffd700' },
];

export const SigilForgePage: React.FC<SigilForgePageProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const { openPassport, playSound } = useLivingRealm();
  const { awardXp } = useGamificationXp();

  const userLevel = user?.level || 1;
  const isAdmin = user?.role === 'admin';
  const userXp = user?.xp || 0;
  const referralCode = user?.referral_code || 'CREATOR-OS';

  const [activeTab, setActiveTab] = useState<'forge' | 'store'>('forge');
  const [activeCategory, setActiveCategory] = useState<'aura' | 'glyph' | 'ring' | 'crest' | 'inscribe' | 'advanced'>('aura');
  
  // Forge Customizer State
  const [selectedAura, setSelectedAura] = useState<string>('aura_cyber_emerald');
  const [selectedGlyph, setSelectedGlyph] = useState<string>('glyph_quantum_hex');
  const [selectedRing, setSelectedRing] = useState<string>('ring_circuit_traces');
  const [selectedCrest, setSelectedCrest] = useState<string>('crest_cyber_spikes');
  const [customHandle, setCustomHandle] = useState<string>('');
  const [customMotto, setCustomMotto] = useState<string>('SOVEREIGN CREATOR');
  const [customMonogram, setCustomMonogram] = useState<string>('');

  // Creative & Immersion Controls
  const [hueShift, setHueShift] = useState<number>(0);
  const [rotationSpeed, setRotationSpeed] = useState<'off' | 'slow' | 'normal' | 'warp'>('normal');
  const [glowMode, setGlowMode] = useState<'subtle' | 'normal' | 'supernova'>('normal');
  const [particleBurst, setParticleBurst] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(forgeAudio.getMuted());
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>('novice_origin');
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Advanced Customizer Extensions
  const [orbitSpeedFactor, setOrbitSpeedFactor] = useState<number>(1.0);
  const [particleDensity, setParticleDensity] = useState<number>(24);
  const [chromaticAberration, setChromaticAberration] = useState<boolean>(false);

  // SVG Data & State
  const [sigilSvgDataUri, setSigilSvgDataUri] = useState<string>('');
  const [rawSvgString, setRawSvgString] = useState<string>('');
  const [loadingSigil, setLoadingSigil] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);

  // 3D Tilt Parallax State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── Fetch User Equipped Sigil Configuration ───────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/sigil/config', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            if (data.data.aura) setSelectedAura(data.data.aura);
            if (data.data.glyph) setSelectedGlyph(data.data.glyph);
            if (data.data.ring) setSelectedRing(data.data.ring);
            if (data.data.crest) setSelectedCrest(data.data.crest);
            if (data.data.motto) setCustomMotto(data.data.motto);
            if (data.data.monogram) setCustomMonogram(data.data.monogram);
            if (data.data.handle) setCustomHandle(data.data.handle);
          }
        }
      } catch (e) {
        console.error('Failed to fetch sigil config:', e);
      }
    };

    fetchConfig();
  }, [token]);

  // ── Real-Time Live SVG Preview Synthesis ──────────────────────────────
  useEffect(() => {
    let isCancelled = false;
    const synthesizeSigil = async () => {
      setLoadingSigil(true);
      try {
        const params = new URLSearchParams({
          aura: selectedAura,
          glyph: selectedGlyph,
          ring: selectedRing,
          crest: selectedCrest,
          handle: customHandle || user?.display_name || referralCode,
          motto: customMotto,
          monogram: customMonogram,
          size: '420',
        });

        const res = await fetch(`/api/sigil/${encodeURIComponent(referralCode)}?${params.toString()}`);
        if (res.ok && !isCancelled) {
          const svgText = await res.text();
          setRawSvgString(svgText);
          const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
          setSigilSvgDataUri(encoded);
        }
      } catch (e) {
        console.error('Failed to synthesize sigil SVG:', e);
      } finally {
        if (!isCancelled) setLoadingSigil(false);
      }
    };

    const timer = setTimeout(synthesizeSigil, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedAura, selectedGlyph, selectedRing, selectedCrest, customHandle, customMotto, customMonogram, referralCode, user?.display_name]);

  // ── 3D Tilt Parallax Handlers ─────────────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / (rect.height / 2)) * -14;
    const tiltY = (x / (rect.width / 2)) * 14;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // ── Sound & Audio Triggers ────────────────────────────────────────────
  const triggerShockwave = () => {
    setParticleBurst(true);
    forgeAudio.playLaserPulse();
    setTimeout(() => setParticleBurst(false), 800);
  };

  // ── Save & Equip ──────────────────────────────────────────────────────
  const handleSaveAndEquip = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setLockedNotice(null);
    try {
      const res = await fetch('/api/sigil/config/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          aura: selectedAura,
          glyph: selectedGlyph,
          ring: selectedRing,
          crest: selectedCrest,
          monogram: customMonogram,
          motto: customMotto,
          handle: customHandle,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        forgeAudio.playAscensionChord();
        awardXp(50, 'Forged & Equipped Custom Sigil');
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setLockedNotice(data.error || 'Failed to save configuration.');
        forgeAudio.playTick(400);
      }
    } catch (e: any) {
      setLockedNotice(e.message || 'Error saving sigil.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Archetype Preset Loader ───────────────────────────────────────────
  const handleSelectArchetype = (archetype: MythicArchetype) => {
    if (userLevel < archetype.min_level && !isAdmin) {
      setLockedNotice(`🔒 "${archetype.name}" requires Level ${archetype.min_level} (Current: Lv. ${userLevel}). Earn XP from Quests to unlock!`);
      forgeAudio.playTick(400);
      return;
    }
    setLockedNotice(null);
    setSelectedArchetype(archetype.id);
    setSelectedAura(archetype.config.aura);
    setSelectedGlyph(archetype.config.glyph);
    setSelectedRing(archetype.config.ring);
    setSelectedCrest(archetype.config.crest);
    setCustomMotto(archetype.config.motto);
    if (archetype.config.monogram) setCustomMonogram(archetype.config.monogram);
    forgeAudio.playCosmicRoll();
    triggerShockwave();
    awardXp(15, `Loaded Archetype: ${archetype.name}`);
  };

  // ── Cosmic Roll Randomizer (Only Unlocked Parts) ──────────────────────
  const handleRandomize = () => {
    setLockedNotice(null);
    const validAuras = AURAS_LIST.filter(a => isAdmin || userLevel >= a.min_level);
    const validGlyphs = GLYPHS_LIST.filter(g => isAdmin || userLevel >= g.min_level);
    const validRings = RINGS_LIST.filter(r => isAdmin || userLevel >= r.min_level);
    const validCrests = CRESTS_LIST.filter(c => isAdmin || userLevel >= c.min_level);

    const randAura = validAuras[Math.floor(Math.random() * validAuras.length)] || AURAS_LIST[0];
    const randGlyph = validGlyphs[Math.floor(Math.random() * validGlyphs.length)] || GLYPHS_LIST[0];
    const randRing = validRings[Math.floor(Math.random() * validRings.length)] || RINGS_LIST[0];
    const randCrest = validCrests[Math.floor(Math.random() * validCrests.length)] || CRESTS_LIST[0];

    setSelectedAura(randAura.id);
    setSelectedGlyph(randGlyph.id);
    setSelectedRing(randRing.id);
    setSelectedCrest(randCrest.id);
    setSelectedArchetype(null);
    forgeAudio.playCosmicRoll();
    triggerShockwave();
    awardXp(10, 'Cosmic Sigil Roll');
  };

  // ── Download Helpers ──────────────────────────────────────────────────
  const handleDownloadSvg = () => {
    if (!rawSvgString) return;
    const blob = new Blob([rawSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigil_${referralCode.toLowerCase()}_master.svg`;
    a.click();
    URL.revokeObjectURL(url);
    forgeAudio.playLaserPulse();
    awardXp(20, 'Exported Master Vector SVG');
  };

  const handleDownloadPng = async () => {
    if (!rawSvgString) return;
    setIsExportingPng(true);
    try {
      const img = new Image();
      const svgBlob = new Blob([rawSvgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL_ = window.URL || window.webkitURL || window;
      const blobURL = URL_.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, 2048, 2048);
        ctx.drawImage(img, 0, 0, 2048, 2048);
        URL_.revokeObjectURL(blobURL);

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `sigil_${referralCode.toLowerCase()}_2048x2048.png`;
        a.click();
        forgeAudio.playAscensionChord();
        awardXp(30, 'Exported 2048x2048 PNG Sigil');
        setIsExportingPng(false);
      };
      img.src = blobURL;
    } catch (e) {
      console.error('PNG export error:', e);
      setIsExportingPng(false);
    }
  };

  const handleCopySvgCode = () => {
    if (!rawSvgString) return;
    navigator.clipboard.writeText(rawSvgString);
    setCopySuccess(true);
    forgeAudio.playTick(1200);
    awardXp(10, 'Copied SVG XML');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // ── Helper Category Resolvers ─────────────────────────────────────────
  const getCurrentCategoryItems = (): MarketItem[] => {
    switch (activeCategory) {
      case 'aura': return AURAS_LIST;
      case 'glyph': return GLYPHS_LIST;
      case 'ring': return RINGS_LIST;
      case 'crest': return CRESTS_LIST;
      default: return [];
    }
  };

  const getSelectedIdForCategory = (cat: string): string => {
    switch (cat) {
      case 'aura': return selectedAura;
      case 'glyph': return selectedGlyph;
      case 'ring': return selectedRing;
      case 'crest': return selectedCrest;
      default: return '';
    }
  };

  const setSelectedIdForCategory = (cat: string, id: string, itemMinLevel: number = 1) => {
    if (userLevel < itemMinLevel && !isAdmin) {
      setLockedNotice(`🔒 Unlocks at Level ${itemMinLevel} (Current: Lv. ${userLevel}). Complete Daily Quests & Referral Milestones to unlock!`);
      forgeAudio.playTick(400);
      return;
    }
    setLockedNotice(null);
    setSelectedArchetype(null);
    switch (cat) {
      case 'aura': setSelectedAura(id); break;
      case 'glyph': setSelectedGlyph(id); break;
      case 'ring': setSelectedRing(id); break;
      case 'crest': setSelectedCrest(id); break;
    }
    forgeAudio.playTick(1000);
  };

  const activeAuraObj = AURAS_LIST.find(a => a.id === selectedAura) || AURAS_LIST[0];
  const activeGlowColor = activeAuraObj.preview_accent;

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'rare':
        return <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold border border-blue-500/30">RARE</span>;
      case 'epic':
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/30">EPIC</span>;
      case 'legendary':
        return <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">LEGENDARY</span>;
      case 'cosmic':
        return <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30">COSMIC 🪐</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">COMMON</span>;
    }
  };

  const getRotationClass = () => {
    switch (rotationSpeed) {
      case 'off': return '';
      case 'slow': return 'animate-[spin_60s_linear_infinite]';
      case 'normal': return 'animate-[spin_20s_linear_infinite]';
      case 'warp': return 'animate-[spin_6s_linear_infinite]';
    }
  };

  return (
    <div className="relative min-h-screen bg-[#060814] text-slate-100 pb-24 overflow-hidden">
      {/* Background Ambient Aura Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] blur-[150px] pointer-events-none transition-colors duration-700 opacity-25"
        style={{ background: activeGlowColor }}
      />

      {/* Main Studio Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 relative z-10">
        
        {/* Header HUD Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                AAA Procedural Studio
              </span>
              <span className="text-xs text-slate-500 font-mono">v4.5 SOVEREIGN</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                Lv. {userLevel} ({userXp.toLocaleString()} XP)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 text-white flex items-center gap-3">
              🔮 Sigil Forge & Vector Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
              Deterministic 3D vector art engine mapped to your cryptographic seed <code className="text-plug-accent font-mono">({referralCode})</code>. Every sigil has unique stardust coordinates ensuring no two emblems are ever identical.
            </p>
          </div>

          {/* Quick HUD Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                const muted = forgeAudio.toggleMute();
                setIsAudioMuted(muted);
              }}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-mono font-bold ${
                !isAudioMuted 
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10' 
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={isAudioMuted ? 'Unmute Procedural Audio' : 'Mute Audio'}
            >
              {!isAudioMuted ? (
                <>
                  <Volume2 className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="hidden sm:inline">528Hz ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">MUTED</span>
                </>
              )}
            </button>

            {/* Passport View Button */}
            <button
              onClick={() => openPassport(referralCode)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Passport Modal
            </button>

            {/* Save & Equip CTA */}
            <button
              onClick={handleSaveAndEquip}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-plug-accent via-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-plug-accent/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Flame className="w-4 h-4 text-amber-300" />
              )}
              {saveSuccess ? 'Equipped!' : 'Forge & Equip (+50 XP)'}
            </button>
          </div>
        </div>

        {/* Lock Warning / Error Banner */}
        {lockedNotice && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{lockedNotice}</span>
            </div>
            <button
              onClick={() => setLockedNotice(null)}
              className="text-amber-400 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mythic Archetypes Quick-Loader Bar */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1-Click Mythic Archetype Presets (Level Gated)
              </span>
            </div>
            <button
              onClick={handleRandomize}
              className="px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 hover:border-purple-400 text-purple-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5 text-purple-400" />
              🎲 Cosmic Roll
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {MYTHIC_ARCHETYPES.map((arch) => {
              const isEquipped = selectedArchetype === arch.id;
              const isArchLocked = userLevel < arch.min_level && !isAdmin;

              return (
                <button
                  key={arch.id}
                  onClick={() => handleSelectArchetype(arch)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    isEquipped 
                      ? 'bg-slate-800/90 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50' 
                      : isArchLocked
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-80'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{arch.icon}</span>
                    {isArchLocked ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Lv.{arch.min_level}
                      </span>
                    ) : isEquipped ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-mono">UNLOCKED</span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-white truncate group-hover:text-amber-300 transition-colors">
                    {arch.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {arch.tagline}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Master Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          
          {/* LEFT: 3D Holographic Parallax Viewport (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* 3D Holographic Card Viewport */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full aspect-square max-w-[420px] rounded-3xl p-6 bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-2xl transition-transform duration-100 ease-out cursor-crosshair group overflow-hidden"
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: 'preserve-3d',
                boxShadow: `0 25px 60px -15px ${activeGlowColor}33, 0 0 30px ${activeGlowColor}15`,
              }}
            >
              {/* Niagara Interactive Particle Canvas */}
              <NiagaraParticleCanvas
                glowColor={activeGlowColor}
                triggerBurst={particleBurst}
                intensity={glowMode}
              />

              {/* Holographic Foil Rainbow Reflection Sheen */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity duration-500 rounded-3xl"
                style={{
                  background: `linear-gradient(${115 + tilt.y * 3}deg, transparent 20%, rgba(255, 0, 128, 0.4) 40%, rgba(0, 255, 255, 0.4) 60%, transparent 80%)`,
                  mixBlendMode: 'color-dodge',
                }}
              />

              {/* Dynamic Specular Glare Highlight */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300 opacity-15 group-hover:opacity-30"
                style={{
                  background: `radial-gradient(circle at ${50 + tilt.y * 2}% ${50 - tilt.x * 2}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                }}
              />

              {/* HUD Calibration Header */}
              <div className="flex items-center justify-between relative z-10 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CRYPTOGRAPHIC_MATRIX
                </span>
                <span className="text-slate-500">
                  X:{(tilt?.x ?? 0).toFixed(1)}° Y:{(tilt?.y ?? 0).toFixed(1)}°
                </span>
              </div>

              {/* Central Vector Emblem */}
              <div className="relative w-full h-[calc(100%-28px)] flex items-center justify-center z-10">
                {!sigilSvgDataUri && loadingSigil ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-plug-accent animate-spin" />
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                      Synthesizing Geometry...
                    </span>
                  </div>
                ) : sigilSvgDataUri ? (
                  <div 
                    className={`relative w-full h-full flex items-center justify-center transition-all ${getRotationClass()}`}
                    style={{
                      filter: `${hueShift !== 0 ? `hue-rotate(${hueShift}deg)` : ''} ${chromaticAberration ? 'drop-shadow(-2px 0px 0px rgba(255,0,0,0.7)) drop-shadow(2px 0px 0px rgba(0,255,255,0.7))' : ''}`,
                    }}
                  >
                    <img
                      src={sigilSvgDataUri}
                      alt="Vector Sigil"
                      className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] select-none pointer-events-none"
                    />
                    {loadingSigil && (
                      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 border border-purple-500/50 shadow-md">
                        <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-mono">Synthesizing Sigil...</div>
                )}
              </div>

              {/* Viewport Laser Scanlines Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none rounded-3xl opacity-20" />
            </div>

            {/* Unique Cryptographic Watermark Banner */}
            <div className="w-full max-w-[420px] mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Fingerprint className="w-4 h-4 text-plug-accent" />
                <span>Zero-Duplicate Guarantee</span>
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                SEED: {referralCode}
              </span>
            </div>

            {/* Viewport Controls Bar */}
            <div className="w-full max-w-[420px] mt-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5">
              
              {/* Glow Mode Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-bold flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Luminosity
                </span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                  {(['subtle', 'normal', 'supernova'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setGlowMode(mode);
                        forgeAudio.playTick(mode === 'supernova' ? 1200 : 800);
                      }}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors font-bold ${
                        glowMode === mode 
                          ? 'bg-plug-accent text-white shadow' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotation Velocity Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-bold flex items-center gap-1.5">
                  <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                  Spin Velocity
                </span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                  {[
                    { id: 'off', label: 'Static' },
                    { id: 'slow', label: '60s' },
                    { id: 'normal', label: '20s' },
                    { id: 'warp', label: '6s ⚡' },
                  ].map((speed) => (
                    <button
                      key={speed.id}
                      onClick={() => {
                        setRotationSpeed(speed.id as any);
                        forgeAudio.playTick(900);
                      }}
                      className={`px-2 py-1 rounded-lg transition-colors font-bold ${
                        rotationSpeed === speed.id 
                          ? 'bg-purple-600 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 360° Chromatic Hue Shift Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-slate-400 font-bold flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-pink-400" />
                    Chromatic Hue Wheel
                  </span>
                  <span className="text-xs font-mono text-slate-300 font-bold">{hueShift}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hueShift}
                  onChange={(e) => setHueShift(Number(e.target.value))}
                  className="w-full accent-pink-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                />
              </div>

              {/* Export Suite Buttons */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2">
                <button
                  onClick={handleDownloadSvg}
                  className="py-2 px-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Download infinite-resolution vector file"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  4K SVG
                </button>
                <button
                  onClick={handleDownloadPng}
                  disabled={isExportingPng}
                  className="py-2 px-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  title="Export 2048x2048 high-res PNG image"
                >
                  {isExportingPng ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Image className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  4K PNG
                </button>
                <button
                  onClick={handleCopySvgCode}
                  className="py-2 px-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Copy raw vector SVG XML to clipboard"
                >
                  {copySuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  {copySuccess ? 'Copied!' : 'Copy SVG'}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Master Customization Suite (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col">
            
            {/* Category Switcher Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl overflow-x-auto scrollbar-hide">
              {[
                { id: 'aura', label: 'Auras & Shaders', icon: Sparkle, count: 12 },
                { id: 'glyph', label: 'Core Glyphs', icon: Gem, count: 12 },
                { id: 'ring', label: 'Orbital Rings', icon: Layers, count: 12 },
                { id: 'crest', label: 'Imperial Crests', icon: Crown, count: 12 },
                { id: 'inscribe', label: 'Laser Monogram & Inscribe', icon: Type, count: 'TXT' },
                { id: 'advanced', label: 'Advanced FX', icon: Sliders, count: 'FX' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveCategory(tab.id as any);
                      forgeAudio.playTick(800);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-plug-accent to-purple-600 text-white shadow-lg shadow-plug-accent/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/60 font-mono">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Customization Content Container */}
            <div className="mt-4 p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl flex-1 flex flex-col justify-between">
              
              {activeCategory !== 'inscribe' && activeCategory !== 'advanced' ? (
                /* 12-Item Visual Card Grid for Aura, Glyph, Ring, Crest with Gamified Locks */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                      Select {activeCategory.toUpperCase()} Component (Progression Gated)
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Equipped: <strong className="text-white">{getCurrentCategoryItems().find(i => i.id === getSelectedIdForCategory(activeCategory))?.name || 'Standard'}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
                    {getCurrentCategoryItems().map((item) => {
                      const isSelected = getSelectedIdForCategory(activeCategory) === item.id;
                      const isLocked = userLevel < item.min_level && !isAdmin;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedIdForCategory(activeCategory, item.id, item.min_level);
                            if (!isLocked) triggerShockwave();
                          }}
                          onMouseEnter={() => forgeAudio.playTick(1100)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? 'bg-slate-800/90 border-plug-accent shadow-lg shadow-plug-accent/20 ring-1 ring-plug-accent'
                              : isLocked
                              ? 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-85'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {/* Accent Color Pip */}
                          <div 
                            className="absolute top-0 right-0 w-16 h-16 blur-2xl opacity-20 pointer-events-none"
                            style={{ background: item.preview_accent }}
                          />

                          <div className="flex items-center justify-between mb-2">
                            {getRarityBadge(item.rarity)}
                            {isLocked ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30 flex items-center gap-1 font-bold">
                                <Lock className="w-3 h-3" /> Lv. {item.min_level}
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-400">
                                <Zap className="w-3 h-3 text-amber-400" />
                                {item.cost_xp} XP
                              </div>
                            )}
                          </div>

                          <div className="text-sm font-bold text-white flex items-center justify-between">
                            <span className={isLocked ? 'text-slate-300' : 'text-white'}>{item.name}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Level Lock Warning */}
                          {isLocked && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-500/30">
                              <Lock className="w-3 h-3 shrink-0" />
                              <span>Requires Level {item.min_level} (You are Lv. {userLevel})</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeCategory === 'inscribe' ? (
                /* Laser Monogram & Inscription Studio */
                <div className="space-y-6 max-w-xl py-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Type className="w-4 h-4 text-plug-accent" />
                      <h3 className="text-base font-bold text-white">Laser Monogram & Inscription Studio</h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Laser-etch your personal 1-4 character seal into the central core, and inscribe your custom creator handle and motto along the circular perimeter vector path.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Central Core Monogram Input */}
                    <div>
                      <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                        <span>Central Core Monogram / Sigil Seal (1 - 4 Chars)</span>
                        <span className="text-purple-400 font-normal text-[10px]">✨ Laser Etched</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customMonogram}
                          placeholder="e.g. APEX, Ω, 777, ₿, VIP"
                          onChange={(e) => setCustomMonogram(e.target.value.toUpperCase())}
                          maxLength={4}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-purple-500/50 text-white font-mono text-sm focus:outline-none focus:border-plug-accent uppercase font-bold tracking-widest"
                        />
                        <span className="absolute right-3 top-3.5 text-xs font-mono text-purple-400">
                          {customMonogram.length}/4
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                        Creator Handle / Cashtag
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customHandle}
                          placeholder={user?.display_name ? `@${user.display_name.toUpperCase()}` : `@${referralCode}`}
                          onChange={(e) => setCustomHandle(e.target.value)}
                          maxLength={24}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-plug-accent"
                        />
                        <span className="absolute right-3 top-3.5 text-xs font-mono text-slate-500">
                          {customHandle.length}/24
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                        Outer Perimeter Motto
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customMotto}
                          placeholder="SOVEREIGN CREATOR"
                          onChange={(e) => setCustomMotto(e.target.value.toUpperCase())}
                          maxLength={32}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-plug-accent uppercase"
                        />
                        <span className="absolute right-3 top-3.5 text-xs font-mono text-slate-500">
                          {customMotto.length}/32
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1.5 font-mono">
                      <div className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Scan className="w-3.5 h-3.5 text-purple-400" />
                        Live Vector Inscription Preview:
                      </div>
                      <div>• Core Monogram Seal: <strong className="text-purple-300 font-bold">{customMonogram || 'DEFAULT'}</strong></div>
                      <div>• Rim Inscription: <strong className="text-white">{customHandle || user?.display_name || referralCode}</strong></div>
                      <div>• Motto Circular Path: <strong className="text-white">{customMotto}</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Advanced Shader & FX Controls */
                <div className="space-y-6 max-w-xl py-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-base font-bold text-white">Advanced Shaders & Visual Physics</h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Fine-tune subatomic particles, chromatic aberration dispersion, and relativistic quantum physics.
                    </p>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    {/* Chromatic Dispersion Toggle */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold">RGB Chromatic Dispersion</div>
                        <div className="text-slate-500 text-[11px]">Prismatic red/cyan color splitting effect</div>
                      </div>
                      <button
                        onClick={() => {
                          setChromaticAberration(!chromaticAberration);
                          forgeAudio.playTick(900);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          chromaticAberration ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {chromaticAberration ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>

                    {/* Particle Density */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Quantum Particle Density</span>
                        <span className="text-plug-accent">{particleDensity} Nodes</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        value={particleDensity}
                        onChange={(e) => setParticleDensity(Number(e.target.value))}
                        className="w-full accent-emerald-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
                      />
                    </div>

                    {/* Unique Seed Watermark Details */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 text-[11px] space-y-1">
                      <div className="text-purple-300 font-bold flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-plug-accent" />
                        <span>Deterministic SHA-256 Micro-Geometry Matrix</span>
                      </div>
                      <div className="text-slate-400">
                        14 Stardust vertices + {7 + (referralCode.length % 12)}-cycle harmonic wave unique to seed <code className="text-plug-accent">[{referralCode}]</code>.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Quick Action Banner */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 font-mono">
                  Current Level: <strong className="text-white">Level {userLevel}</strong> ({userXp.toLocaleString()} XP)
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <PointPackButton />
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SigilForgePage;
