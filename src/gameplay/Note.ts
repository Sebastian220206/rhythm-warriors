export type NoteType = 'strike' | 'hold' | 'dodge' | 'double';
export type Lane = 'L' | 'R' | 'both';
export type JudgmentGrade = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface Note {
  id: string;
  type: NoteType;
  lane: Lane;
  beat: number;
  length?: number; // In beats, for hold notes
  
  // Runtime judging state
  judged?: boolean;
  judgment?: JudgmentGrade;
  hitDeltaMs?: number;
  
  // Hold-specific state
  holding?: boolean;
  holdStartBeat?: number;
  holdCompleted?: boolean;
}

export interface LevelData {
  id: string;
  world: number;
  worldName: string;
  title: string;
  bpm: number;
  totalBeats: number;
  concept: string; // Rhythmic concept (e.g., "Quarter Notes", "Syncopation", "Polyrhythm 3:2")
  notes: Note[];
}
