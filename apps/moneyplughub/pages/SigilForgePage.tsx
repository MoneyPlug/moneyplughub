import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/frontend/context/AuthContext';
import { useLivingRealm } from '../../src/frontend/context/LivingRealmContext';
import { PointPackButton } from '../components/PointPackButton';
import { 
  Compass, Sparkles, Shield, Trophy, Zap, 
  RotateCw, Eye, Check, ShoppingBag, Lock, Crown, Award, 
  ExternalLink, Maximize2, RefreshCw, Loader2
} from 'lucide-react';

interface SigilForgePageProps {
  onNavigate?: (tab: string) => void;
}

export const SigilForgePage: React.FC<SigilForgePageProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const { openPassport, playSound } = useLivingRealm();

  const [activeTab, setActiveTab] = useState<'forge' | 'store'>('forge');
  const [selectedAura, setSelectedAura] = useState<string>('aura_cyber_emerald');
  const [selectedGlyph, setSelectedGlyph] = useState<string>('glyph_metatron');
  const [selectedRing, setSelectedRing] = useState<string>('ring_celestial_corona');
  const [selectedCrest, setSelectedCrest] = useState<string>('crest_lightning');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [userXp, setUserXp] = useState<number>(user?.xp || 2500);
  const [glowMode, setGlowMode] = useState<'subtle' | 'normal' | 'supernova'>('normal');
  const [sigilSvgDataUri, setSigilSvgDataUri] = useState<string>('');
  const [loadingSigil, setLoadingSigil] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const referralCode = user?.referral_code || 'FOUNDER-PLUG';

  // 1. Fetch user's saved config on initial mount so Forge state matches existing Passport
  useEffect(() => {
    const fetchInitialConfig = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/sigil/config', { headers });
        if (res.ok) {
          const j = await res.json();
          if (j.success && j.data) {
            if (j.data.aura) setSelectedAura(j.data.aura);
            if (j.data.glyph) setSelectedGlyph(j.data.glyph);
            if (j.data.ring) setSelectedRing(j.data.ring);
            if (j.data.crest) setSelectedCrest(j.data.crest);
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial sigil config:', err);
      }
    };
    fetchInitialConfig();
  }, [token]);

  // 2. Listen to cosmic reactive events
  useEffect(() => {
    const handleGlowUpdate = (e: CustomEvent<'subtle' | 'normal' | 'supernova'>) => {
      if (e.detail) setGlowMode(e.detail);
    };
    window.addEventListener('moneyos:sigil_glow_updated', handleGlowUpdate as EventListener);
    return () => {
      window.removeEventListener('moneyos:sigil_glow_updated', handleGlowUpdate as EventListener);
    };
  }, []);

  // 3. Fetch live deterministic SVG Sigil whenever customization changes
  const fetchSigilSvg = async () => {
    try {
      setLoadingSigil(true);
      const params = new URLSearchParams({
        aura: selectedAura,
        glyph: selectedGlyph,
        ring: selectedRing,
        crest: selectedCrest,
        format: 'json',
        size: '512',
        t: Date.now().toString(),
      });

      const res = await fetch(`/api/sigil/${encodeURIComponent(referralCode)}?${params.toString()}`);
      if (res.ok) {
        const j = await res.json();
        if (j.success && j.data?.svg_data_uri) {
          setSigilSvgDataUri(j.data.svg_data_uri);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sigil SVG:', err);
    } finally {
      setLoadingSigil(false);
    }
  };

  useEffect(() => {
    fetchSigilSvg();
  }, [referralCode, selectedAura, selectedGlyph, selectedRing, selectedCrest]);

  const handlePackPurchased = (result: any) => {
    if (result.newXP) setUserXp(result.newXP);
    if (result.sigilGlow) setGlowMode(result.sigilGlow);
    fetchSigilSvg();
    playSound('ascension');
  };

  // 4. Save equipped customization to Cryptographic Ledger & open matching Passport
  const handleSaveAndEquip = async () => {
    try {
      setIsSaving(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/sigil/config/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          aura: selectedAura,
          glyph: selectedGlyph,
          ring: selectedRing,
          crest: selectedCrest,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        playSound('chime');
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to save sigil config:', err);
    } finally {
      setIsSaving(false);
      openPassport(referralCode);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-white">
      {/* Top Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/40 shadow-2xl shadow-purple-500/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-plug-accent/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Chamber IV • The Sigil Forge & Purchase Matrix
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              3D Sigil Forge & Vector Matrix
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-mono leading-relaxed">
              Synthesize your deterministic Cryptographic Sigil from referral coordinates, equip Mythic Artifacts, and mint your SHA-256 Creator Passport.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => openPassport(referralCode)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer transition-all hover:scale-105"
            >
              <Shield className="w-4 h-4" />
              <span>View Creator Passport</span>
            </button>
            <div className="px-5 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono">
              <div className="text-[10px] text-slate-400 uppercase">Current Vault XP</div>
              <div className="text-xl font-black text-plug-accent">+{userXp.toLocaleString()} XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('forge')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'forge'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>3D Sigil Forge & Customizer</span>
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'store'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>XP Point Packs & Store</span>
        </button>
      </div>

      {/* SECTION 1: 3D SIGIL FORGE CUSTOMIZER */}
      {activeTab === 'forge' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Canvas Preview */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-20" />

            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Rotating Outer Dashed Orbital Ring */}
              <div 
                className={`absolute inset-0 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-700 pointer-events-none ${
                  isRotating ? 'animate-spin' : ''
                } ${
                  glowMode === 'supernova'
                    ? 'border-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.5)] ring-8 ring-amber-400/20'
                    : glowMode === 'normal'
                    ? 'border-purple-500/60 shadow-2xl shadow-purple-500/30 ring-4 ring-purple-500/15'
                    : 'border-slate-700 shadow-md'
                }`}
                style={{ animationDuration: glowMode === 'supernova' ? '12s' : '24s' }}
              />

              {/* Live Deterministic Sigil Image Canvas */}
              <div className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-full bg-slate-950 border border-slate-800 p-2 flex items-center justify-center overflow-hidden shadow-inner group">
                {sigilSvgDataUri ? (
                  <img
                    src={sigilSvgDataUri}
                    alt={`Cryptographic Sigil ${referralCode}`}
                    className={`w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 ${
                      isRotating ? 'animate-slow-spin' : 'hover:scale-105'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono animate-pulse gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                    <span>Rendering Vector...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sigil Metadata */}
            <div className="space-y-1 z-10">
              <h3 className="text-xl font-black text-white font-mono tracking-tight">{referralCode}</h3>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1">
                <span>Deterministic Seed:</span>
                <span className="text-plug-accent font-bold">SHA-256</span>
              </div>
            </div>

            {/* Orbit & Glow Controls */}
            <div className="flex items-center gap-2 z-10 w-full">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isRotating ? 'Pause Orbit' : 'Resume Orbit'}</span>
              </button>

              <button
                onClick={() => {
                  const nextGlow = glowMode === 'subtle' ? 'normal' : glowMode === 'normal' ? 'supernova' : 'subtle';
                  setGlowMode(nextGlow);
                }}
                className="py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Toggle Sigil Glow Intensity"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span className="uppercase">{glowMode}</span>
              </button>
            </div>
          </div>

          {/* Right Customizer Panel */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white mb-0.5">Equip Master Artifacts (32 Custom Vectors)</h3>
                <p className="text-xs text-slate-400 font-mono">Customize your harmonic signature across 4 visual quadrants.</p>
              </div>
              <button
                onClick={fetchSigilSvg}
                disabled={loadingSigil}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh Sigil Preview"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSigil ? 'animate-spin text-plug-accent' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. AURAS */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1">
                    ✨ Cosmic Aura
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">8 Shaders</span>
                </div>
                <select
                  value={selectedAura}
                  onChange={(e) => setSelectedAura(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                >
                  <option value="aura_cyber_emerald">Cyber Matrix (Neon Emerald)</option>
                  <option value="aura_synthwave_sunset">Retro Synthwave (Magenta/Sunset)</option>
                  <option value="aura_cosmic_nebula">Cosmic Nebula (Supernova Violet)</option>
                  <option value="aura_quantum_ice">Quantum Frost (Sub-zero Cyan)</option>
                  <option value="aura_solar_flare">Solar Flare (Thermonuclear Gold)</option>
                  <option value="aura_osmium_diamond">Osmium Diamond (Iridescent Prismatic)</option>
                  <option value="aura_void_singularity">Void Singularity (Event Horizon)</option>
                  <option value="aura_primordial_gold">Primordia Pure Alchemy (24K Molten Gold)</option>
                </select>
              </div>

              {/* 2. GLYPHS */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1">
                    🪬 Sacred Core Glyph
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">8 Glyphs</span>
                </div>
                <select
                  value={selectedGlyph}
                  onChange={(e) => setSelectedGlyph(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                >
                  <option value="glyph_metatron">Metatron's Sacred Cube</option>
                  <option value="glyph_quantum_hex">Quantum Hex Matrix</option>
                  <option value="glyph_octagram">Celestial Octagram (8-Point Star)</option>
                  <option value="glyph_flower_of_life">Flower of Life Resonance</option>
                  <option value="glyph_tesseract">4D Hypercube Tesseract</option>
                  <option value="glyph_merkaba_vehicle">Merkaba Star of Ascension</option>
                  <option value="glyph_primordia_eye">Eye of Primordia</option>
                  <option value="glyph_infinity_ouroboros">Ouroboros Infinite Knot</option>
                </select>
              </div>

              {/* 3. RINGS */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1">
                    🪐 Orbital Perimeter Ring
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">8 Rings</span>
                </div>
                <select
                  value={selectedRing}
                  onChange={(e) => setSelectedRing(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                >
                  <option value="ring_celestial_corona">8-Fold Celestial Corona</option>
                  <option value="ring_rune_encryption">Elder Nordic Runic Cipher</option>
                  <option value="ring_circuit_traces">Gold PCB Circuit Traces</option>
                  <option value="ring_particle_flux">Particle Flux Stream Orbit</option>
                  <option value="ring_dual_event_horizon">Dual Event Horizon Rings</option>
                  <option value="ring_astral_zodiac">Astral Constellation Wheel</option>
                  <option value="ring_harmonic_pulse">Harmonic Resonator Wave</option>
                  <option value="ring_singularity_vortex">Graviton Singularity Vortex</option>
                </select>
              </div>

              {/* 4. CRESTS */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1">
                    👑 Imperial Crest
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">8 Crests</span>
                </div>
                <select
                  value={selectedCrest}
                  onChange={(e) => setSelectedCrest(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                >
                  <option value="crest_lightning">Zeus Electrostatic Lightning</option>
                  <option value="crest_valkyrie_horns">Valkyrie Sonic Horns</option>
                  <option value="crest_crown">Crown of the Money Plug</option>
                  <option value="crest_ouroboros_shield">Aegis Diamond Shield</option>
                  <option value="crest_angel_wings">Seraphim Cyber Wings</option>
                  <option value="crest_phoenix_rebirth">Phoenix Rebirth Flames</option>
                  <option value="crest_vault_seal">Imperial Vault Seal Ring</option>
                  <option value="crest_omni_sovereign">Sovereign Crown of Osmium</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-mono">
                {saveSuccess ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Customization Saved to Cryptographic Ledger & Passport!
                  </span>
                ) : (
                  <span>All configurations compile into real-time SVG vector payloads.</span>
                )}
              </div>

              <button
                onClick={handleSaveAndEquip}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-plug-accent hover:from-purple-400 hover:to-emerald-400 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-purple-500/20 transition-all hover:scale-105"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing Ledger...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Render on Passport</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: XP POINT PACKS STORE */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Sigil Points & XP Boosters</h2>
              <p className="text-xs text-slate-400 font-mono">Direct vault injections to trigger Wealth Pulse spikes, vault shader morphs, and tier ascensions.</p>
            </div>
            <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Creator Plan Protected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <PointPackButton
              packId="starter"
              packName="Starter Sigil Cache"
              xpAmount={1000}
              priceUsd={9.99}
              onSuccess={handlePackPurchased}
            />
            <PointPackButton
              packId="alchemist"
              packName="Alchemist Sigil Forge"
              xpAmount={3500}
              priceUsd={24.99}
              popular={true}
              onSuccess={handlePackPurchased}
            />
            <PointPackButton
              packId="archon"
              packName="Archon Power Matrix"
              xpAmount={10000}
              priceUsd={59.99}
              onSuccess={handlePackPurchased}
            />
            <PointPackButton
              packId="sovereign"
              packName="Sovereign Celestial Vault"
              xpAmount={25000}
              priceUsd={129.99}
              onSuccess={handlePackPurchased}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SigilForgePage;
