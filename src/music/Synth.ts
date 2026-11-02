/**
 * Procedural Synthesizer for Rhythm Warriors.
 * Uses Web Audio API nodes (oscillators, noise buffers, biquad filters, gain envelopes)
 * to deliver punchy arcade battle music and responsive hit SFX without any external asset loading.
 */

export class Synth {
  private ctx: AudioContext;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.generateNoiseBuffer();
  }

  private generateNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // --- DRUM VOICES ---

  /** Punchy arcade kick drum */
  public playKick(time: number, velocity: number = 1.0, destination: AudioNode = this.ctx.destination) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Rapid pitch drop gives the characteristic kick "thud"
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  /** Snappy noise + tone snare */
  public playSnare(time: number, velocity: number = 0.8, destination: AudioNode = this.ctx.destination) {
    // 1. Tonal body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    oscGain.gain.setValueAtTime(velocity * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(time);
    osc.stop(time + 0.13);

    // 2. White noise snap
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(velocity, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);

      noise.start(time);
      noise.stop(time + 0.19);
    }
  }

  /** Crisp high-pass hi-hat */
  public playHiHat(time: number, velocity: number = 0.5, open: boolean = false, destination: AudioNode = this.ctx.destination) {
    if (!this.noiseBuffer) return;
    const duration = open ? 0.2 : 0.04;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + duration + 0.01);
  }

  // --- MELODIC & BASS VOICES ---

  /** Heavy synth bass with resonant lowpass filter */
  public playBassNote(time: number, freq: number, duration: number, velocity: number = 0.7, destination: AudioNode = this.ctx.destination) {
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq / 2, time);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4, time);
    filter.frequency.setValueAtTime(freq * 5, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(velocity, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + duration + 0.05);
    subOsc.stop(time + duration + 0.05);
  }

  /** Lead synth for energetic rhythm arpeggios */
  public playLeadNote(time: number, freq: number, duration: number, velocity: number = 0.5, destination: AudioNode = this.ctx.destination) {
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    // slight detune for stereo-ish thickness
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.004, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, time);

    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + duration + 0.02);
    osc2.stop(time + duration + 0.02);
  }

  // --- SOUND EFFECTS ---

  /** High impact blade strike / beat hit sound */
  public playHitSfx(grade: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS', destination: AudioNode = this.ctx.destination) {
    const time = this.ctx.currentTime;
    if (grade === 'MISS') {
      // Dull metallic clank / miss thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(90, time);
      osc.frequency.linearRampToValueAtTime(40, time + 0.15);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.16);
      return;
    }

    // Dynamic pitch based on accuracy
    const baseFreq = grade === 'PERFECT' ? 880 : grade === 'GREAT' ? 660 : 440;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, time + 0.08);

    const amp = grade === 'PERFECT' ? 0.6 : grade === 'GREAT' ? 0.45 : 0.3;
    gain.gain.setValueAtTime(amp, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  /** Dodge swoosh / evasive air rush */
  public playDodgeSfx(destination: AudioNode = this.ctx.destination) {
    if (!this.noiseBuffer) return;
    const time = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3, time);
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(2200, time + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + 0.18);
  }

  /** Metronome click for calibration */
  public playClick(accent: boolean, destination: AudioNode = this.ctx.destination) {
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(accent ? 1200 : 800, time);
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }
}
