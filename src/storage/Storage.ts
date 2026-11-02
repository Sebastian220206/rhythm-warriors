export interface UserSettings {
  calibrationOffsetMs: number;
  noteSpeed: number; // multiplier e.g. 1.0, 1.2
  volumeMusic: number;
  volumeSfx: number;
  volumeMetronome: number;
  haptics: boolean;
  reducedMotion: boolean;
}

export interface LevelRecord {
  score: number;
  accuracy: number;
  maxCombo: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | '-';
  cleared: boolean;
}

const SETTINGS_KEY = 'rhythm_warriors_settings_v1';
const RECORDS_KEY = 'rhythm_warriors_records_v1';

const DEFAULT_SETTINGS: UserSettings = {
  calibrationOffsetMs: 0,
  noteSpeed: 1.0,
  volumeMusic: 0.8,
  volumeSfx: 0.9,
  volumeMetronome: 0.5,
  haptics: true,
  reducedMotion: false,
};

export class StorageService {
  private static instance: StorageService;
  private settings: UserSettings;
  private records: Record<string, LevelRecord>;

  private constructor() {
    this.settings = this.loadSettings();
    this.records = this.loadRecords();
  }

  public static get(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private loadSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private loadRecords(): Record<string, LevelRecord> {
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
    return {};
  }

  public getSettings(): UserSettings {
    return { ...this.settings };
  }

  public saveSettings(patch: Partial<UserSettings>): void {
    this.settings = { ...this.settings, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  public getRecord(levelId: string): LevelRecord | null {
    return this.records[levelId] || null;
  }

  public saveRecord(levelId: string, record: LevelRecord): void {
    const existing = this.records[levelId];
    if (!existing || record.score > existing.score) {
      this.records[levelId] = record;
      try {
        localStorage.setItem(RECORDS_KEY, JSON.stringify(this.records));
      } catch (e) {
        console.warn('Failed to save record:', e);
      }
    }
  }
}
