import { Synth } from '../music/Synth';
import { StorageService } from '../storage/Storage';

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private metronomeGain: GainNode | null = null;
  private synthInstance: Synth | null = null;
  private isUnlocked: boolean = false;

  private constructor() {
    // AudioContext is initialized lazily upon user interaction to comply with browser autoplay policies
  }

  public static get(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes or unlocks the AudioContext on user gesture.
   */
  public async unlock(): Promise<boolean> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master output & buses
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      this.metronomeGain = this.ctx.createGain();
      this.metronomeGain.connect(this.masterGain);

      this.applySavedVolumes();
      this.synthInstance = new Synth(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    }

    this.isUnlocked = this.ctx.state === 'running';
    return this.isUnlocked;
  }

  public applySavedVolumes() {
    if (!this.musicGain || !this.sfxGain || !this.metronomeGain) return;
    const settings = StorageService.get().getSettings();
    this.musicGain.gain.setValueAtTime(settings.volumeMusic, this.currentTime);
    this.sfxGain.gain.setValueAtTime(settings.volumeSfx, this.currentTime);
    this.metronomeGain.gain.setValueAtTime(settings.volumeMetronome, this.currentTime);
  }

  public get synth(): Synth {
    if (!this.synthInstance || !this.ctx) {
      throw new Error('AudioEngine not initialized. Call unlock() first.');
    }
    return this.synthInstance;
  }

  public get musicBus(): GainNode {
    if (!this.musicGain) throw new Error('AudioEngine not initialized.');
    return this.musicGain;
  }

  public get sfxBus(): GainNode {
    if (!this.sfxGain) throw new Error('AudioEngine not initialized.');
    return this.sfxGain;
  }

  public get metronomeBus(): GainNode {
    if (!this.metronomeGain) throw new Error('AudioEngine not initialized.');
    return this.metronomeGain;
  }

  public get currentTime(): number {
    return this.ctx ? this.ctx.currentTime : performance.now() / 1000;
  }

  public get context(): AudioContext | null {
    return this.ctx;
  }

  public get unlocked(): boolean {
    return this.isUnlocked && this.ctx?.state === 'running';
  }
}
