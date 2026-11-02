import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreSystem } from '../src/gameplay/ScoreSystem';

describe('ScoreSystem', () => {
  let scoreSystem: ScoreSystem;

  beforeEach(() => {
    scoreSystem = new ScoreSystem();
  });

  it('calculates combo multiplier scaling', () => {
    // 0-9 combo -> x1
    for (let i = 0; i < 9; i++) {
      scoreSystem.recordJudgment('PERFECT');
    }
    expect(scoreSystem.multiplier).toBe(1);

    // 10th note reaches 10 combo -> x2
    scoreSystem.recordJudgment('PERFECT');
    expect(scoreSystem.multiplier).toBe(2);

    // Reach 20 combo -> x3
    for (let i = 0; i < 10; i++) {
      scoreSystem.recordJudgment('PERFECT');
    }
    expect(scoreSystem.multiplier).toBe(3);

    // Reach 40 combo -> x4
    for (let i = 0; i < 20; i++) {
      scoreSystem.recordJudgment('PERFECT');
    }
    expect(scoreSystem.multiplier).toBe(4);
  });

  it('resets combo and drains health on MISS', () => {
    scoreSystem.recordJudgment('PERFECT');
    scoreSystem.recordJudgment('PERFECT');
    expect(scoreSystem.getStats().combo).toBe(2);

    scoreSystem.recordJudgment('MISS');
    const stats = scoreSystem.getStats();
    expect(stats.combo).toBe(0);
    expect(stats.health).toBe(85); // 100 - 15 = 85
  });

  it('calculates Grade S for >= 95% accuracy', () => {
    for (let i = 0; i < 20; i++) {
      scoreSystem.recordJudgment('PERFECT');
    }
    expect(scoreSystem.getStats().accuracy).toBe(100);
    expect(scoreSystem.getStats().grade).toBe('S');
  });
});
