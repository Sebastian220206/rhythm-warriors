import { Note, JudgmentGrade, Lane } from './Note';
import { Conductor } from '../core/Conductor';

export interface JudgmentResult {
  note: Note;
  grade: JudgmentGrade;
  deltaMs: number;
}

export type ActionType = 'STRIKE_L' | 'STRIKE_R' | 'HOLD_START_L' | 'HOLD_START_R' | 'HOLD_END_L' | 'HOLD_END_R' | 'DODGE' | 'DOUBLE';

export class Judge {
  // Windows in seconds
  public perfectWindow: number = 0.045; // ±45ms
  public greatWindow: number = 0.090;   // ±90ms
  public goodWindow: number = 0.135;    // ±135ms

  private activeNotes: Note[] = [];

  constructor(multiplier: number = 1.0) {
    this.setDifficultyMultiplier(multiplier);
  }

  public setDifficultyMultiplier(mult: number) {
    // mult = 1.5 widens windows for easier play
    this.perfectWindow = 0.045 * mult;
    this.greatWindow = 0.090 * mult;
    this.goodWindow = 0.135 * mult;
  }

  public loadNotes(notes: Note[]) {
    // Clone and reset state
    this.activeNotes = notes.map((n) => ({
      ...n,
      judged: false,
      judgment: undefined,
      hitDeltaMs: undefined,
      holding: false,
      holdCompleted: false
    }));
  }

  public get notes(): Note[] {
    return this.activeNotes;
  }

  /**
   * Evaluates a player action at the given song time.
   */
  public onAction(action: ActionType, songTime: number, conductor: Conductor): JudgmentResult | null {
    // Find unjudged candidate note matching lane/type
    let targetLane: Lane | null = null;
    let isDodgeAction = false;
    let isDoubleAction = false;

    if (action === 'STRIKE_L' || action === 'HOLD_START_L') targetLane = 'L';
    else if (action === 'STRIKE_R' || action === 'HOLD_START_R') targetLane = 'R';
    else if (action === 'DODGE') isDodgeAction = true;
    else if (action === 'DOUBLE') isDoubleAction = true;

    // Release events for hold notes
    if (action === 'HOLD_END_L' || action === 'HOLD_END_R') {
      const releaseLane: Lane = action === 'HOLD_END_L' ? 'L' : 'R';
      this.handleHoldRelease(releaseLane, songTime, conductor);
      return null;
    }

    let candidate: Note | null = null;
    let smallestDelta = Infinity;

    for (const note of this.activeNotes) {
      if (note.judged) continue;

      // Note matching logic
      if (isDodgeAction) {
        if (note.type !== 'dodge') continue;
      } else if (isDoubleAction) {
        if (note.type !== 'double') continue;
      } else {
        if (note.type === 'dodge') continue;
        if (note.lane !== targetLane && note.type !== 'double') continue;
      }

      const noteTime = conductor.beatToSeconds(note.beat);
      const delta = songTime - noteTime; // negative = early, positive = late
      const absDelta = Math.abs(delta);

      // Check if within the good window
      if (absDelta <= this.goodWindow && absDelta < smallestDelta) {
        smallestDelta = absDelta;
        candidate = note;
      }
    }

    if (!candidate) return null;

    const noteTime = conductor.beatToSeconds(candidate.beat);
    const delta = songTime - noteTime;
    const absDelta = Math.abs(delta);
    const deltaMs = Math.round(delta * 1000);

    let grade: JudgmentGrade = 'GOOD';
    if (absDelta <= this.perfectWindow) {
      grade = 'PERFECT';
    } else if (absDelta <= this.greatWindow) {
      grade = 'GREAT';
    }

    candidate.judged = true;
    candidate.judgment = grade;
    candidate.hitDeltaMs = deltaMs;

    if (candidate.type === 'hold') {
      candidate.holding = true;
      candidate.holdStartBeat = candidate.beat;
    }

    return {
      note: candidate,
      grade,
      deltaMs
    };
  }

  private handleHoldRelease(lane: Lane, songTime: number, conductor: Conductor) {
    const songBeat = conductor.secondsToBeat(songTime);
    for (const note of this.activeNotes) {
      if (note.type === 'hold' && note.lane === lane && note.holding && !note.holdCompleted) {
        note.holding = false;
        const targetEndBeat = note.beat + (note.length || 1);
        // If released within 0.25 beat of the end, it counts as a complete hold!
        if (songBeat >= targetEndBeat - 0.25) {
          note.holdCompleted = true;
        } else {
          // Premature release drops the hold
          note.judgment = 'GOOD'; // downgraded for dropping
        }
      }
    }
  }

  /**
   * Called every frame to check for notes that were missed (passed the hit window)
   * and to finalize completed holds.
   */
  public update(songTime: number, conductor: Conductor): JudgmentResult[] {
    const misses: JudgmentResult[] = [];
    const songBeat = conductor.secondsToBeat(songTime);

    for (const note of this.activeNotes) {
      if (note.judged) {
        // Check if active hold has reached its full duration
        if (note.type === 'hold' && note.holding && !note.holdCompleted) {
          const endBeat = note.beat + (note.length || 1);
          if (songBeat >= endBeat) {
            note.holding = false;
            note.holdCompleted = true;
          }
        }
        continue;
      }

      const noteTime = conductor.beatToSeconds(note.beat);
      // If the note has passed the good window into the future without being hit
      if (songTime - noteTime > this.goodWindow) {
        note.judged = true;
        note.judgment = 'MISS';
        note.hitDeltaMs = Math.round((songTime - noteTime) * 1000);
        misses.push({
          note,
          grade: 'MISS',
          deltaMs: note.hitDeltaMs
        });
      }
    }

    return misses;
  }
}
