/**
 * Procedural Web Audio Synthesizer for Sigil Forge
 * Zero external audio files — 100% mathematical Web Audio oscillator synthesis.
 */

class ForgeAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Subtle high-tech tick on item select or hover
   */
  public playTick(freq: number = 880) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  /**
   * Harmonic Solfeggio 528Hz Transformation / Ascension Chord on Forge
   */
  public playAscensionChord() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Solfeggio 528Hz (Transformation/Miracles), 264Hz (Sub-octave), 792Hz (Fifth), 1056Hz (Octave)
      const freqs = [264, 528, 792, 1056, 1584];
      const now = ctx.currentTime;

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.02, now + 1.2);

        const initialVol = 0.08 / (idx + 1);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(initialVol, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

        if (panner) {
          panner.pan.setValueAtTime((idx - 2) * 0.35, now);
          osc.connect(gain);
          gain.connect(panner);
          panner.connect(ctx.destination);
        } else {
          osc.connect(gain);
          gain.connect(ctx.destination);
        }

        osc.start(now + idx * 0.03);
        osc.stop(now + 1.6);
      });
    } catch {}
  }

  /**
   * Fast cybernetic ascending arpeggio on Cosmic Roll
   */
  public playCosmicRoll() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 830.61, 987.77, 1318.51, 1661.22];
      const now = ctx.currentTime;

      notes.forEach((note, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, now + idx * 0.04);

        gain.gain.setValueAtTime(0.05, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.15);
      });
    } catch {}
  }

  /**
   * Supernova Shockwave Blast (low bass drop)
   */
  public playShockwave() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {}
  }
}

export const forgeAudio = new ForgeAudioEngine();
