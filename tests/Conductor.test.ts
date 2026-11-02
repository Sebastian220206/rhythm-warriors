import { describe, it, expect, beforeEach } from 'vitest';
import { Conductor } from '../src/core/Conductor';

describe('Conductor Rhythmic Timing Engine', () => {
  let conductor: Conductor;

  beforeEach(() => {
    conductor = new Conductor(120); // 120 BPM = 0.5 sec per beat
  });

  it('calculates seconds per beat correctly for various tempos', () => {
    expect(conductor.secPerBeat).toBeCloseTo(0.5);

    conductor.setBpm(60);
    expect(conductor.secPerBeat).toBeCloseTo(1.0);

    conductor.setBpm(150);
    expect(conductor.secPerBeat).toBeCloseTo(0.4);
  });

  it('accurately converts beats to seconds and back', () => {
    conductor.setBpm(120);
    expect(conductor.beatToSeconds(4)).toBeCloseTo(2.0);
    expect(conductor.beatToSeconds(0.5)).toBeCloseTo(0.25);

    expect(conductor.secondsToBeat(2.0)).toBeCloseTo(4.0);
    expect(conductor.secondsToBeat(0.75)).toBeCloseTo(1.5);
  });
});
