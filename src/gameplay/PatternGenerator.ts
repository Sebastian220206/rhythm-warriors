import { LevelData, Note } from './Note';

export class PatternGenerator {
  public static getAllLevels(): LevelData[] {
    return [
      this.generateWorld1(),
      this.generateWorld2(),
      this.generateWorld3(),
      this.generateWorld4(),
      this.generateWorld5(),
      this.generateWorld6(),
      this.generateEndlessLevel(64)
    ];
  }

  /**
   * World 1: Training Grounds
   * Concept: Steady quarter notes (1 2 3 4). Alternating left/right strikes.
   */
  public static generateWorld1(): LevelData {
    const bpm = 92;
    const totalBeats = 48;
    const notes: Note[] = [];
    let id = 1;

    // Lead-in 4 beats are empty for countdown
    for (let b = 4; b < totalBeats; b += 2) {
      if (b < 16) {
        // Quarter notes on downbeats
        notes.push({ id: `w1-${id++}`, type: 'strike', lane: 'L', beat: b });
        notes.push({ id: `w1-${id++}`, type: 'strike', lane: 'R', beat: b + 1 });
      } else if (b < 32) {
        // Call & response patterns
        notes.push({ id: `w1-${id++}`, type: 'strike', lane: 'L', beat: b });
        notes.push({ id: `w1-${id++}`, type: 'strike', lane: 'L', beat: b + 0.5 });
        notes.push({ id: `w1-${id++}`, type: 'strike', lane: 'R', beat: b + 1.5 });
      } else {
        // Fun steady groove
        notes.push({ id: `w1-${id++}`, type: 'strike', lane: 'L', beat: b });
        notes.push({ id: `w1-${id++}`, type: 'strike', lane: 'R', beat: b + 0.5 });
        notes.push({ id: `w1-${id++}`, type: 'strike', lane: 'R', beat: b + 1 });
      }
    }

    return {
      id: 'world-1',
      world: 1,
      worldName: 'Training Grounds',
      title: 'Pulse of the Blade',
      bpm,
      totalBeats,
      concept: 'Quarter Notes & Alternating Strikes',
      notes
    };
  }

  /**
   * World 2: The March
   * Concept: Eighth notes (1 & 2 & 3 & 4 &) and Hold attacks.
   */
  public static generateWorld2(): LevelData {
    const bpm = 105;
    const totalBeats = 60;
    const notes: Note[] = [];
    let id = 1;

    for (let b = 4; b < totalBeats; b += 4) {
      // Bar pattern: 8th note run followed by a hold note
      notes.push({ id: `w2-${id++}`, type: 'strike', lane: 'L', beat: b });
      notes.push({ id: `w2-${id++}`, type: 'strike', lane: 'R', beat: b + 0.5 });
      notes.push({ id: `w2-${id++}`, type: 'strike', lane: 'L', beat: b + 1.0 });
      notes.push({ id: `w2-${id++}`, type: 'strike', lane: 'R', beat: b + 1.5 });

      // Hold note on beat 2
      notes.push({ id: `w2-${id++}`, type: 'hold', lane: 'L', beat: b + 2.0, length: 1.5 });

      // Counter-strike on beat 3.5
      notes.push({ id: `w2-${id++}`, type: 'strike', lane: 'R', beat: b + 3.5 });
    }

    return {
      id: 'world-2',
      world: 2,
      worldName: 'The March',
      title: 'Iron Cadence',
      bpm,
      totalBeats,
      concept: 'Eighth Notes & Sustained Holds',
      notes
    };
  }

  /**
   * World 3: Offbeat Ambush
   * Concept: Syncopation (accenting the "&" upbeats) + Dodge maneuvers!
   */
  public static generateWorld3(): LevelData {
    const bpm = 115;
    const totalBeats = 64;
    const notes: Note[] = [];
    let id = 1;

    for (let b = 4; b < totalBeats; b += 4) {
      // Syncopated hits: hit on offbeats: 0.5, 1.5, 2.5
      notes.push({ id: `w3-${id++}`, type: 'strike', lane: 'L', beat: b + 0.5 });
      notes.push({ id: `w3-${id++}`, type: 'strike', lane: 'R', beat: b + 1.5 });
      notes.push({ id: `w3-${id++}`, type: 'strike', lane: 'L', beat: b + 2.5 });

      // Dodge wave sweeping across both lanes on beat 3!
      notes.push({ id: `w3-${id++}`, type: 'dodge', lane: 'both', beat: b + 3.0 });
    }

    return {
      id: 'world-3',
      world: 3,
      worldName: 'Offbeat Ambush',
      title: 'Syncopated Shadows',
      bpm,
      totalBeats,
      concept: 'Offbeat Syncopation & Dodging',
      notes
    };
  }

  /**
   * World 4: Triplet Temple
   * Concept: Triplets & Swing feel (3 notes per beat: 0, 0.333, 0.666).
   */
  public static generateWorld4(): LevelData {
    const bpm = 120;
    const totalBeats = 64;
    const notes: Note[] = [];
    let id = 1;

    for (let b = 4; b < totalBeats; b += 4) {
      // Beat 0: 3 triplet strikes (1-trip-let)
      notes.push({ id: `w4-${id++}`, type: 'strike', lane: 'L', beat: b + 0.0 });
      notes.push({ id: `w4-${id++}`, type: 'strike', lane: 'R', beat: b + 0.333 });
      notes.push({ id: `w4-${id++}`, type: 'strike', lane: 'L', beat: b + 0.666 });

      // Beat 1: Quarter note impact
      notes.push({ id: `w4-${id++}`, type: 'strike', lane: 'R', beat: b + 1.0 });

      // Beat 2: Triplet swing run
      notes.push({ id: `w4-${id++}`, type: 'strike', lane: 'R', beat: b + 2.0 });
      notes.push({ id: `w4-${id++}`, type: 'strike', lane: 'L', beat: b + 2.333 });
      notes.push({ id: `w4-${id++}`, type: 'strike', lane: 'R', beat: b + 2.666 });

      // Beat 3: Dodge wave
      notes.push({ id: `w4-${id++}`, type: 'dodge', lane: 'both', beat: b + 3.0 });
    }

    return {
      id: 'world-4',
      world: 4,
      worldName: 'Triplet Temple',
      title: 'Sacred Triplets',
      bpm,
      totalBeats,
      concept: 'Triplet Subdivisions & Flow',
      notes
    };
  }

  /**
   * World 5: Sixteenth Storm
   * Concept: Rapid 16th-note bursts (1 e & a) and Double strikes!
   */
  public static generateWorld5(): LevelData {
    const bpm = 128;
    const totalBeats = 68;
    const notes: Note[] = [];
    let id = 1;

    for (let b = 4; b < totalBeats; b += 4) {
      // Beat 0: Double strike impact on the downbeat!
      notes.push({ id: `w5-${id++}`, type: 'double', lane: 'both', beat: b });

      // Beat 1: 16th-note flurry (0.25, 0.5, 0.75)
      notes.push({ id: `w5-${id++}`, type: 'strike', lane: 'L', beat: b + 1.0 });
      notes.push({ id: `w5-${id++}`, type: 'strike', lane: 'R', beat: b + 1.25 });
      notes.push({ id: `w5-${id++}`, type: 'strike', lane: 'L', beat: b + 1.5 });
      notes.push({ id: `w5-${id++}`, type: 'strike', lane: 'R', beat: b + 1.75 });

      // Beat 2: Hold note
      notes.push({ id: `w5-${id++}`, type: 'hold', lane: 'L', beat: b + 2.0, length: 1.0 });

      // Beat 3: Dodge wave
      notes.push({ id: `w5-${id++}`, type: 'dodge', lane: 'both', beat: b + 3.0 });
    }

    return {
      id: 'world-5',
      world: 5,
      worldName: 'Sixteenth Storm',
      title: 'Tempest of 16ths',
      bpm,
      totalBeats,
      concept: '16th Flurries & Simultaneous Strikes',
      notes
    };
  }

  /**
   * World 6: Polyrhythm Peak
   * Concept: True 3:2 and 4:3 polyrhythms!
   * Left hand plays 3 evenly spaced pulses while Right hand plays 2 over 2 beats!
   * Left beats: 0, 0.667, 1.333
   * Right beats: 0, 1.0
   */
  public static generateWorld6(): LevelData {
    const bpm = 135;
    const totalBeats = 72;
    const notes: Note[] = [];
    let id = 1;

    for (let b = 4; b < totalBeats; b += 4) {
      // First 2 beats: 3:2 polyrhythm span
      // Left lane: 3 evenly spaced notes across 2 beats (intervals of 2/3 = 0.6667)
      notes.push({ id: `w6-${id++}`, type: 'strike', lane: 'L', beat: b + 0.0 });
      notes.push({ id: `w6-${id++}`, type: 'strike', lane: 'L', beat: b + 0.667 });
      notes.push({ id: `w6-${id++}`, type: 'strike', lane: 'L', beat: b + 1.333 });

      // Right lane: 2 evenly spaced notes across 2 beats (intervals of 1.0)
      notes.push({ id: `w6-${id++}`, type: 'strike', lane: 'R', beat: b + 0.0 });
      notes.push({ id: `w6-${id++}`, type: 'strike', lane: 'R', beat: b + 1.0 });

      // Beat 2: Double strike or hold
      notes.push({ id: `w6-${id++}`, type: 'hold', lane: 'R', beat: b + 2.0, length: 1.0 });

      // Beat 3: Dodge attack
      notes.push({ id: `w6-${id++}`, type: 'dodge', lane: 'both', beat: b + 3.0 });
    }

    return {
      id: 'world-6',
      world: 6,
      worldName: 'Polyrhythm Peak',
      title: 'Apex of Polyrhythm',
      bpm,
      totalBeats,
      concept: 'Polyrhythms & Cross-Rhythms (3:2 & 4:3)',
      notes
    };
  }

  /**
   * Endless Arena: Dynamically generated unending rhythmic onslaught
   */
  public static generateEndlessLevel(numBeats: number = 128): LevelData {
    const notes: Note[] = [];
    let id = 1;
    const bpm = 124;

    for (let b = 4; b < numBeats; b += 2) {
      const roll = Math.random();
      if (roll < 0.25) {
        // Quarter note strikes
        notes.push({ id: `endless-${id++}`, type: 'strike', lane: 'L', beat: b });
        notes.push({ id: `endless-${id++}`, type: 'strike', lane: 'R', beat: b + 1 });
      } else if (roll < 0.5) {
        // Syncopated pair
        notes.push({ id: `endless-${id++}`, type: 'strike', lane: 'L', beat: b + 0.5 });
        notes.push({ id: `endless-${id++}`, type: 'strike', lane: 'R', beat: b + 1.5 });
      } else if (roll < 0.75) {
        // Hold attack
        notes.push({ id: `endless-${id++}`, type: 'hold', lane: 'R', beat: b, length: 1.5 });
      } else if (roll < 0.9) {
        // Dodge wave
        notes.push({ id: `endless-${id++}`, type: 'dodge', lane: 'both', beat: b });
      } else {
        // Double strike
        notes.push({ id: `endless-${id++}`, type: 'double', lane: 'both', beat: b });
      }
    }

    return {
      id: 'world-endless',
      world: 99,
      worldName: 'Endless Arena',
      title: 'Infinite Groove',
      bpm,
      totalBeats: numBeats,
      concept: 'Procedural Endless Challenge',
      notes
    };
  }
}
