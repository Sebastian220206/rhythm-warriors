import { describe, it, expect, beforeEach } from 'vitest';
import { Judge } from '../src/gameplay/Judge';
import { Conductor } from '../src/core/Conductor';
import { Note } from '../src/gameplay/Note';

describe('Judge Hit Evaluation', () => {
  let judge: Judge;
  let conductor: Conductor;

  beforeEach(() => {
    judge = new Judge();
    conductor = new Conductor(120); // 1 beat = 0.5 sec
    conductor.startTime = 0;
    conductor.isRunning = true;
  });

  it('correctly grades PERFECT hit (within ±45ms)', () => {
    const notes: Note[] = [
      { id: '1', type: 'strike', lane: 'L', beat: 2.0 } // target time = 1.000s
    ];
    judge.loadNotes(notes);

    // Hit at 1.020s (+20ms) -> PERFECT
    const result = judge.onAction('STRIKE_L', 1.020, conductor);
    expect(result).not.toBeNull();
    expect(result?.grade).toBe('PERFECT');
    expect(result?.deltaMs).toBe(20);
    expect(result?.note.judged).toBe(true);
  });

  it('correctly grades GREAT hit (within ±90ms)', () => {
    const notes: Note[] = [
      { id: '2', type: 'strike', lane: 'R', beat: 2.0 } // target time = 1.000s
    ];
    judge.loadNotes(notes);

    // Hit at 1.070s (+70ms) -> GREAT
    const result = judge.onAction('STRIKE_R', 1.070, conductor);
    expect(result).not.toBeNull();
    expect(result?.grade).toBe('GREAT');
  });

  it('correctly grades GOOD hit (within ±135ms)', () => {
    const notes: Note[] = [
      { id: '3', type: 'strike', lane: 'L', beat: 2.0 } // target time = 1.000s
    ];
    judge.loadNotes(notes);

    // Hit at 0.880s (-120ms early) -> GOOD
    const result = judge.onAction('STRIKE_L', 0.880, conductor);
    expect(result).not.toBeNull();
    expect(result?.grade).toBe('GOOD');
  });

  it('ignores hits that are outside the window (too early)', () => {
    const notes: Note[] = [
      { id: '4', type: 'strike', lane: 'L', beat: 2.0 } // target time = 1.000s
    ];
    judge.loadNotes(notes);

    // Hit at 0.700s (-300ms too early)
    const result = judge.onAction('STRIKE_L', 0.700, conductor);
    expect(result).toBeNull();
  });

  it('auto-misses notes when they pass the window', () => {
    const notes: Note[] = [
      { id: '5', type: 'strike', lane: 'L', beat: 2.0 } // target time = 1.000s
    ];
    judge.loadNotes(notes);

    // Song time advances to 1.200s (past the 1.000 + 0.135 = 1.135s window)
    const misses = judge.update(1.200, conductor);
    expect(misses.length).toBe(1);
    expect(misses[0].grade).toBe('MISS');
    expect(judge.notes[0].judged).toBe(true);
  });
});
