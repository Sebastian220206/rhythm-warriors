import { JudgmentGrade } from './Note';

export interface ScoreStats {
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  health: number;
  isAlive: boolean;
  accuracy: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  counts: {
    PERFECT: number;
    GREAT: number;
    GOOD: number;
    MISS: number;
  };
}

export class ScoreSystem {
  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private health: number = 100;
  private counts = {
    PERFECT: 0,
    GREAT: 0,
    GOOD: 0,
    MISS: 0,
  };
  private totalNotesJudged: number = 0;
  private totalRawPoints: number = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.health = 100;
    this.counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    this.totalNotesJudged = 0;
    this.totalRawPoints = 0;
  }

  public get multiplier(): number {
    if (this.combo >= 40) return 4;
    if (this.combo >= 20) return 3;
    if (this.combo >= 10) return 2;
    return 1;
  }

  public recordJudgment(grade: JudgmentGrade): ScoreStats {
    this.counts[grade]++;
    this.totalNotesJudged++;

    if (grade === 'MISS') {
      this.combo = 0;
      this.health = Math.max(0, this.health - 15);
    } else {
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      let basePoints = 100;
      let healthRegen = 0.5;
      if (grade === 'PERFECT') {
        basePoints = 300;
        healthRegen = 2.0;
      } else if (grade === 'GREAT') {
        basePoints = 200;
        healthRegen = 1.0;
      }

      this.totalRawPoints += basePoints;
      this.score += basePoints * this.multiplier;
      this.health = Math.min(100, this.health + healthRegen);
    }

    return this.getStats();
  }

  public getStats(): ScoreStats {
    const maxPossibleRaw = this.totalNotesJudged > 0 ? this.totalNotesJudged * 300 : 1;
    const accuracy = this.totalNotesJudged > 0 ? (this.totalRawPoints / maxPossibleRaw) * 100 : 100;

    let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
    if (accuracy >= 95) grade = 'S';
    else if (accuracy >= 85) grade = 'A';
    else if (accuracy >= 75) grade = 'B';
    else if (accuracy >= 60) grade = 'C';

    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      multiplier: this.multiplier,
      health: this.health,
      isAlive: this.health > 0,
      accuracy: Math.round(accuracy * 10) / 10,
      grade,
      counts: { ...this.counts }
    };
  }
}
