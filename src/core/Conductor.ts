import { AudioEngine } from './AudioEngine';
import { StorageService } from '../storage/Storage';

export class Conductor {
  public bpm: number = 120;
  public secPerBeat: number = 0.5;
  public startTime: number = 0;
  public songDurationBeats: number = 64;
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private pauseTime: number = 0;
  private totalPauseDuration: number = 0;

  constructor(bpm: number = 120) {
    this.setBpm(bpm);
  }

  public setBpm(bpm: number) {
    this.bpm = bpm;
    this.secPerBeat = 60 / bpm;
  }

  /**
   * Starts playback aligned to the master audio clock.
   * countdownBeats gives the player preparation time before notes start.
   */
  public start(countdownBeats: number = 4) {
    const audio = AudioEngine.get();
    const leadInSeconds = countdownBeats * this.secPerBeat;
    this.startTime = audio.currentTime + leadInSeconds;
    this.totalPauseDuration = 0;
    this.isRunning = true;
    this.isPaused = false;
  }

  public pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.pauseTime = AudioEngine.get().currentTime;
  }

  public resume() {
    if (!this.isRunning || !this.isPaused) return;
    const now = AudioEngine.get().currentTime;
    this.totalPauseDuration += (now - this.pauseTime);
    this.isPaused = false;
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * Raw audio time minus start time and pauses, plus user calibration offset.
   */
  public get songTime(): number {
    if (!this.isRunning) return 0;
    const audio = AudioEngine.get();
    const current = this.isPaused ? this.pauseTime : audio.currentTime;
    const calibrationOffsetSec = StorageService.get().getSettings().calibrationOffsetMs / 1000;
    return (current - this.startTime - this.totalPauseDuration) - calibrationOffsetSec;
  }

  /**
   * Current fractional beat of the song.
   * Can be negative during countdown/lead-in!
   */
  public get songBeat(): number {
    return this.songTime / this.secPerBeat;
  }

  /**
   * 0.0 to 1.0 pulse progress through current beat. Useful for scaling visuals.
   */
  public get beatFraction(): number {
    const b = this.songBeat;
    return ((b % 1) + 1) % 1;
  }

  public beatToSeconds(beat: number): number {
    return beat * this.secPerBeat;
  }

  public secondsToBeat(seconds: number): number {
    return seconds / this.secPerBeat;
  }

  /**
   * Absolute AudioContext time when a specific beat will play.
   */
  public getAudioTimeForBeat(beat: number): number {
    return this.startTime + this.totalPauseDuration + (beat * this.secPerBeat);
  }
}
