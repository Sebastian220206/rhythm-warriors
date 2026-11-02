import { describe, it, expect } from 'vitest';
import { PatternGenerator } from '../src/gameplay/PatternGenerator';

describe('PatternGenerator & Worlds Progression', () => {
  it('generates all 6 worlds + endless trial', () => {
    const levels = PatternGenerator.getAllLevels();
    expect(levels.length).toBe(7);

    // World 1
    expect(levels[0].world).toBe(1);
    expect(levels[0].notes.length).toBeGreaterThan(0);

    // World 6 (Polyrhythms)
    expect(levels[5].world).toBe(6);
    expect(levels[5].concept).toContain('Polyrhythm');
  });

  it('generates true 3:2 polyrhythms in World 6', () => {
    const w6 = PatternGenerator.generateWorld6();
    // Verify notes exist with fractional intervals corresponding to 2/3 beat (0.667)
    const polyNotesL = w6.notes.filter(n => n.lane === 'L');
    expect(polyNotesL.some(n => Math.abs((n.beat % 1) - 0.667) < 0.01)).toBe(true);
  });
});
