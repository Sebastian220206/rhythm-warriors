import { AudioEngine } from '../core/AudioEngine';
import { Conductor } from '../core/Conductor';

export interface MusicPattern {
  kickPattern: number[]; // beat offsets within 4-beat bar (e.g. [0, 1, 2, 3] or [0, 2])
  snarePattern: number[]; // beat offsets (e.g. [1, 3])
  hatPattern: number[]; // beat offsets (e.g. [0.5, 1.5, 2.5, 3.5])
  bassNotes: { beatOffset: number; freq: number; duration: number }[];
  leadNotes: { beatOffset: number; freq: number; duration: number }[];
}

export class Sequencer {
  private conductor: Conductor;
  private audio: AudioEngine;
  private timerId: number | null = null;
  private nextBeatToSchedule: number = 0;
  private scheduleAheadTime: number = 0.15; // 150ms lookahead
  private currentPattern: MusicPattern;
  public combo: number = 0;

  constructor(conductor: Conductor) {
    this.conductor = conductor;
    this.audio = AudioEngine.get();
    this.currentPattern = this.createDefaultPattern();
  }

  public setPattern(pattern: MusicPattern) {
    this.currentPattern = pattern;
  }

  public createDefaultPattern(): MusicPattern {
    // 4-beat electronic/cyber battle groove
    return {
      kickPattern: [0, 2],
      snarePattern: [1, 3],
      hatPattern: [0.5, 1.5, 2.5, 3.5],
      bassNotes: [
        { beatOffset: 0.0, freq: 55, duration: 0.4 },  // A1
        { beatOffset: 1.0, freq: 55, duration: 0.4 },
        { beatOffset: 2.0, freq: 65.4, duration: 0.4 }, // C2
        { beatOffset: 3.0, freq: 73.4, duration: 0.4 }, // D2
      ],
      leadNotes: [
        { beatOffset: 0.0, freq: 220, duration: 0.2 },
        { beatOffset: 0.5, freq: 261.6, duration: 0.2 },
        { beatOffset: 1.0, freq: 329.6, duration: 0.2 },
        { beatOffset: 1.5, freq: 392.0, duration: 0.2 },
        { beatOffset: 2.0, freq: 440, duration: 0.2 },
        { beatOffset: 2.5, freq: 392, duration: 0.2 },
        { beatOffset: 3.0, freq: 329.6, duration: 0.2 },
        { beatOffset: 3.5, freq: 261.6, duration: 0.2 },
      ]
    };
  }

  public start() {
    this.stop();
    this.nextBeatToSchedule = 0;
    this.schedulerLoop();
  }

  public stop() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private schedulerLoop = () => {
    if (!this.conductor.isRunning) {
      this.timerId = window.setTimeout(this.schedulerLoop, 25);
      return;
    }

    const currentAudioTime = this.audio.currentTime;

    // Schedule all musical beats that fall within the lookahead window
    while (true) {
      const beatAudioTime = this.conductor.getAudioTimeForBeat(this.nextBeatToSchedule);

      // If scheduled past our lookahead horizon, stop scheduling for now
      if (beatAudioTime > currentAudioTime + this.scheduleAheadTime) {
        break;
      }

      // Only schedule sounds that occur on or after current audio time
      if (beatAudioTime >= currentAudioTime - 0.05) {
        this.scheduleBarBeat(this.nextBeatToSchedule, beatAudioTime);
      }

      // Advance by eighth-note steps (0.5 beats)
      this.nextBeatToSchedule += 0.5;
    }

    this.timerId = window.setTimeout(this.schedulerLoop, 25);
  };

  private scheduleBarBeat(beat: number, audioTime: number) {
    const barBeat = ((beat % 4) + 4) % 4; // position within current 4-beat bar
    const synth = this.audio.synth;
    const dest = this.audio.musicBus;

    // 1. Kick
    if (this.currentPattern.kickPattern.some(k => Math.abs(k - barBeat) < 0.01)) {
      synth.playKick(audioTime, 0.9, dest);
    }

    // 2. Snare
    if (this.currentPattern.snarePattern.some(s => Math.abs(s - barBeat) < 0.01)) {
      synth.playSnare(audioTime, 0.75, dest);
    }

    // 3. Hi-Hat (Layer increases with combo)
    const isBasicHat = this.currentPattern.hatPattern.some(h => Math.abs(h - barBeat) < 0.01);
    const isEighth = (barBeat % 0.5 === 0);

    if (isBasicHat || (this.combo >= 10 && isEighth)) {
      const isAccent = barBeat % 1.0 === 0;
      synth.playHiHat(audioTime, isAccent ? 0.4 : 0.25, false, dest);
    }

    // 4. Bass
    for (const b of this.currentPattern.bassNotes) {
      if (Math.abs(b.beatOffset - barBeat) < 0.01) {
        synth.playBassNote(audioTime, b.freq, b.duration * this.conductor.secPerBeat, 0.65, dest);
      }
    }

    // 5. Lead Arpeggio (unlocked when combo is 20+)
    if (this.combo >= 20) {
      for (const l of this.currentPattern.leadNotes) {
        if (Math.abs(l.beatOffset - barBeat) < 0.01) {
          synth.playLeadNote(audioTime, l.freq, l.duration * this.conductor.secPerBeat, 0.4, dest);
        }
      }
    }
  }
}
