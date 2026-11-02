import './styles.css';
import { AudioEngine } from './core/AudioEngine';
import { Conductor } from './core/Conductor';
import { InputManager, ActionEvent } from './core/InputManager';
import { GameStateMachine, GameState } from './core/GameStateMachine';
import { Judge } from './gameplay/Judge';
import { ScoreSystem } from './gameplay/ScoreSystem';
import { Sequencer } from './music/Sequencer';
import { PatternGenerator } from './gameplay/PatternGenerator';
import { LevelData } from './gameplay/Note';
import { Renderer } from './render/Renderer';
import { StorageService } from './storage/Storage';

class RhythmWarriorGame {
  private audio: AudioEngine;
  private conductor: Conductor;
  private input: InputManager;
  private stateMachine: GameStateMachine;
  private judge: Judge;
  private scoreSystem: ScoreSystem;
  private sequencer: Sequencer;
  private renderer: Renderer;
  private levels: LevelData[] = [];
  private currentLevelIndex: number = 0;

  // Calibration state
  private calibTaps: number[] = [];
  private calibTimer: number | null = null;
  private calibBeat: number = 0;
  private wakeLock: WakeLockSentinel | null = null;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.renderer = new Renderer(canvas);

    this.audio = AudioEngine.get();
    this.conductor = new Conductor(120);
    this.judge = new Judge();
    this.scoreSystem = new ScoreSystem();
    this.sequencer = new Sequencer(this.conductor);
    this.stateMachine = new GameStateMachine();
    this.levels = PatternGenerator.getAllLevels();

    const appEl = document.getElementById('app')!;
    this.input = new InputManager(appEl);
    this.input.setActionListener(this.handleAction.bind(this));

    this.setupUI();
    this.setupStateListeners();
    this.setupVisibilityWatcher();

    // Start render loop
    requestAnimationFrame(this.gameLoop);
  }

  private setupVisibilityWatcher() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.stateMachine.getState() === 'PLAYING') {
        this.pauseGame();
      }
    });
  }

  private async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) {
        console.warn('Wake Lock error:', e);
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  private setupUI() {
    // 1. Boot Start
    const btnBoot = document.getElementById('btn-boot-start')!;
    btnBoot.addEventListener('click', async () => {
      await this.audio.unlock();
      this.stateMachine.setState('MENU');
    });

    // 2. Menu Buttons
    document.getElementById('btn-menu-play')!.addEventListener('click', () => {
      this.startLevel(0);
    });

    document.getElementById('btn-menu-select')!.addEventListener('click', () => {
      this.populateLevelSelect();
      this.stateMachine.setState('LEVEL_SELECT');
    });

    document.getElementById('btn-menu-calibrate')!.addEventListener('click', () => {
      this.startCalibration();
    });

    document.getElementById('btn-menu-settings')!.addEventListener('click', () => {
      this.openSettings();
    });

    // 3. Level Select
    document.getElementById('btn-levels-back')!.addEventListener('click', () => {
      this.stateMachine.setState('MENU');
    });

    document.getElementById('btn-levels-start')!.addEventListener('click', () => {
      this.startLevel(this.currentLevelIndex);
    });

    // 4. Calibration
    const calibBox = document.getElementById('calib-box')!;
    calibBox.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.handleCalibrationTap();
    });

    document.getElementById('btn-calib-reset')!.addEventListener('click', () => {
      StorageService.get().saveSettings({ calibrationOffsetMs: 0 });
      document.getElementById('calib-offset-val')!.textContent = '0';
      this.calibTaps = [];
      document.getElementById('calib-taps')!.textContent = '0';
    });

    document.getElementById('btn-calib-done')!.addEventListener('click', () => {
      this.stopCalibration();
      this.stateMachine.setState('MENU');
    });

    // 5. Settings
    const speedInput = document.getElementById('setting-speed') as HTMLInputElement;
    const volMusicInput = document.getElementById('setting-vol-music') as HTMLInputElement;
    const volSfxInput = document.getElementById('setting-vol-sfx') as HTMLInputElement;
    const hapticsCheck = document.getElementById('setting-haptics') as HTMLInputElement;
    const reducedMotionCheck = document.getElementById('setting-reduced-motion') as HTMLInputElement;

    const saveSettingsFromUI = () => {
      StorageService.get().saveSettings({
        noteSpeed: parseFloat(speedInput.value),
        volumeMusic: parseFloat(volMusicInput.value),
        volumeSfx: parseFloat(volSfxInput.value),
        haptics: hapticsCheck.checked,
        reducedMotion: reducedMotionCheck.checked
      });
      this.audio.applySavedVolumes();
    };

    speedInput.addEventListener('input', saveSettingsFromUI);
    volMusicInput.addEventListener('input', saveSettingsFromUI);
    volSfxInput.addEventListener('input', saveSettingsFromUI);
    hapticsCheck.addEventListener('change', saveSettingsFromUI);
    reducedMotionCheck.addEventListener('change', saveSettingsFromUI);

    document.getElementById('btn-settings-close')!.addEventListener('click', () => {
      this.stateMachine.setState('MENU');
    });

    // 6. HUD Pause
    document.getElementById('btn-pause')!.addEventListener('click', () => {
      this.pauseGame();
    });

    // 7. Pause Menu
    document.getElementById('btn-pause-resume')!.addEventListener('click', () => {
      this.resumeGame();
    });
    document.getElementById('btn-pause-restart')!.addEventListener('click', () => {
      this.startLevel(this.currentLevelIndex);
    });
    document.getElementById('btn-pause-quit')!.addEventListener('click', () => {
      this.conductor.stop();
      this.sequencer.stop();
      this.releaseWakeLock();
      this.stateMachine.setState('MENU');
    });

    // 8. Game Over
    document.getElementById('btn-gameover-retry')!.addEventListener('click', () => {
      this.startLevel(this.currentLevelIndex);
    });
    document.getElementById('btn-gameover-menu')!.addEventListener('click', () => {
      this.populateLevelSelect();
      this.stateMachine.setState('LEVEL_SELECT');
    });

    // 9. Results
    document.getElementById('btn-results-menu')!.addEventListener('click', () => {
      this.populateLevelSelect();
      this.stateMachine.setState('LEVEL_SELECT');
    });
    document.getElementById('btn-results-next')!.addEventListener('click', () => {
      const nextIndex = (this.currentLevelIndex + 1) % this.levels.length;
      this.startLevel(nextIndex);
    });
  }

  private setupStateListeners() {
    const screens: Record<GameState, HTMLElement | null> = {
      BOOT: document.getElementById('screen-boot'),
      MENU: document.getElementById('screen-menu'),
      LEVEL_SELECT: document.getElementById('screen-levels'),
      PLAYING: null,
      PAUSED: document.getElementById('screen-paused'),
      GAME_OVER: document.getElementById('screen-gameover'),
      RESULTS: document.getElementById('screen-results'),
      CALIBRATION: document.getElementById('screen-calibrate'),
      SETTINGS: document.getElementById('screen-settings')
    };

    const hud = document.getElementById('hud')!;
    const touchOverlay = document.getElementById('touch-overlay')!;

    this.stateMachine.onStateChange((next) => {
      // Hide all modal overlays
      Object.values(screens).forEach((screen) => {
        if (screen) screen.style.display = 'none';
      });

      // Show the active modal
      if (screens[next]) {
        screens[next]!.style.display = 'flex';
      }

      // HUD and touch hints visible only during gameplay
      const isPlay = next === 'PLAYING';
      hud.style.display = isPlay ? 'flex' : 'none';
      touchOverlay.style.display = isPlay ? 'flex' : 'none';
    });
  }

  private populateLevelSelect() {
    const list = document.getElementById('level-list')!;
    list.innerHTML = '';

    this.levels.forEach((lvl, idx) => {
      const item = document.createElement('div');
      item.className = `level-item ${idx === this.currentLevelIndex ? 'active' : ''}`;

      const record = StorageService.get().getRecord(lvl.id);
      const gradeStr = record ? ` [Grade: ${record.grade}]` : '';

      item.innerHTML = `
        <div>
          <div class="level-title">
            <span>${lvl.world === 99 ? '★' : `W${lvl.world}:`} ${lvl.title}</span>
            <span class="level-badge ${lvl.world <= 2 ? 'badge-novice' : lvl.world <= 4 ? 'badge-sync' : 'badge-poly'}">
              ${lvl.bpm} BPM
            </span>
          </div>
          <div class="level-meta">${lvl.concept}${gradeStr}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        this.currentLevelIndex = idx;
        const all = list.querySelectorAll('.level-item');
        all.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      });

      list.appendChild(item);
    });
  }

  private openSettings() {
    const s = StorageService.get().getSettings();
    (document.getElementById('setting-speed') as HTMLInputElement).value = s.noteSpeed.toString();
    (document.getElementById('setting-vol-music') as HTMLInputElement).value = s.volumeMusic.toString();
    (document.getElementById('setting-vol-sfx') as HTMLInputElement).value = s.volumeSfx.toString();
    (document.getElementById('setting-haptics') as HTMLInputElement).checked = s.haptics;
    (document.getElementById('setting-reduced-motion') as HTMLInputElement).checked = s.reducedMotion;

    this.stateMachine.setState('SETTINGS');
  }

  // --- CALIBRATION ---

  private startCalibration() {
    this.calibTaps = [];
    this.calibBeat = 0;
    const curOffset = StorageService.get().getSettings().calibrationOffsetMs;
    document.getElementById('calib-offset-val')!.textContent = Math.round(curOffset).toString();
    document.getElementById('calib-taps')!.textContent = '0';
    this.stateMachine.setState('CALIBRATION');

    // Run calibration metronome at 120 BPM
    const bpm = 120;
    const intervalMs = (60 / bpm) * 1000;

    const tick = () => {
      if (this.stateMachine.getState() !== 'CALIBRATION') return;
      this.calibBeat++;
      this.audio.synth.playClick(this.calibBeat % 4 === 1, this.audio.metronomeBus);

      // Visual flash indicator
      const ind = document.getElementById('calib-indicator');
      if (ind) {
        ind.style.transform = 'scale(1.5)';
        setTimeout(() => { if (ind) ind.style.transform = 'scale(1.0)'; }, 80);
      }

      this.calibTimer = window.setTimeout(tick, intervalMs);
    };

    tick();
  }

  private handleCalibrationTap() {
    const now = performance.now();
    const bpm = 120;
    const beatMs = (60 / bpm) * 1000;

    // Relative to the nearest beat
    const remainder = now % beatMs;
    const error = remainder > beatMs / 2 ? remainder - beatMs : remainder;

    this.calibTaps.push(error);
    document.getElementById('calib-taps')!.textContent = this.calibTaps.length.toString();

    // Average the taps
    const avg = this.calibTaps.reduce((acc, v) => acc + v, 0) / this.calibTaps.length;
    const rounded = Math.round(avg);
    document.getElementById('calib-offset-val')!.textContent = (rounded > 0 ? `+${rounded}` : `${rounded}`);

    StorageService.get().saveSettings({ calibrationOffsetMs: rounded });
  }

  private stopCalibration() {
    if (this.calibTimer !== null) {
      window.clearTimeout(this.calibTimer);
      this.calibTimer = null;
    }
  }

  // --- GAMEPLAY FLOW ---

  private startLevel(index: number) {
    this.currentLevelIndex = index;
    const level = this.levels[index];

    this.conductor.setBpm(level.bpm);
    this.judge.loadNotes(level.notes);
    this.scoreSystem.reset();
    this.sequencer.combo = 0;

    this.stateMachine.setState('PLAYING');
    this.requestWakeLock();

    // Start with 4-beat lead in countdown
    this.conductor.start(4);
    this.sequencer.start();

    this.updateHUD();
  }

  private pauseGame() {
    if (this.stateMachine.getState() !== 'PLAYING') return;
    this.conductor.pause();
    this.sequencer.stop();
    this.stateMachine.setState('PAUSED');
  }

  private resumeGame() {
    this.conductor.resume();
    this.sequencer.start();
    this.stateMachine.setState('PLAYING');
  }

  private handleAction(event: ActionEvent) {
    if (this.stateMachine.getState() !== 'PLAYING') return;

    // Trigger visual warrior action
    if (event.action === 'STRIKE_L' || event.action === 'HOLD_START_L') {
      this.renderer.warrior.triggerAction('SLASH_L');
    } else if (event.action === 'STRIKE_R' || event.action === 'HOLD_START_R') {
      this.renderer.warrior.triggerAction('SLASH_R');
    } else if (event.action === 'DODGE') {
      this.renderer.warrior.triggerAction('DODGE');
      this.audio.synth.playDodgeSfx(this.audio.sfxBus);
    } else if (event.action === 'DOUBLE') {
      this.renderer.warrior.triggerAction('PARRY');
    }

    // Evaluate judgment
    const res = this.judge.onAction(event.action, this.conductor.songTime, this.conductor);
    if (res) {
      this.processJudgment(res.grade, res.note.lane);
    }
  }

  private processJudgment(grade: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS', lane: 'L' | 'R' | 'both') {
    const stats = this.scoreSystem.recordJudgment(grade);
    this.sequencer.combo = stats.combo;

    // Audio SFX
    this.audio.synth.playHitSfx(grade, this.audio.sfxBus);

    // Visual Spark effect at lane position
    const targetX = lane === 'L' ? this.renderer.warrior.x - 45 : lane === 'R' ? this.renderer.warrior.x + 45 : this.renderer.warrior.x;
    const targetY = this.renderer.warrior.y;
    this.renderer.effects.triggerHit(targetX, targetY, grade);

    this.updateHUD();

    // Check Fail condition
    if (!stats.isAlive) {
      this.onGameOver();
    }
  }

  private onGameOver() {
    this.conductor.stop();
    this.sequencer.stop();
    this.releaseWakeLock();
    this.stateMachine.setState('GAME_OVER');
  }

  private onLevelComplete() {
    this.conductor.stop();
    this.sequencer.stop();
    this.releaseWakeLock();

    const stats = this.scoreSystem.getStats();
    const lvl = this.levels[this.currentLevelIndex];

    // Save Record
    StorageService.get().saveRecord(lvl.id, {
      score: stats.score,
      accuracy: stats.accuracy,
      maxCombo: stats.maxCombo,
      grade: stats.grade,
      cleared: true
    });

    // Populate Results Screen
    const gradeEl = document.getElementById('results-grade')!;
    gradeEl.textContent = stats.grade;
    gradeEl.className = `grade-badge grade-${stats.grade}`;

    document.getElementById('res-score')!.textContent = stats.score.toLocaleString();
    document.getElementById('res-accuracy')!.textContent = `${stats.accuracy}%`;
    document.getElementById('res-combo')!.textContent = stats.maxCombo.toString();
    document.getElementById('res-perfect')!.textContent = stats.counts.PERFECT.toString();
    document.getElementById('res-great')!.textContent = stats.counts.GREAT.toString();
    document.getElementById('res-miss')!.textContent = stats.counts.MISS.toString();

    this.stateMachine.setState('RESULTS');
  }

  private updateHUD() {
    const stats = this.scoreSystem.getStats();
    const fill = document.getElementById('health-fill')!;
    fill.style.width = `${stats.health}%`;
    if (stats.health < 30) {
      fill.classList.add('danger');
    } else {
      fill.classList.remove('danger');
    }

    document.getElementById('score-val')!.textContent = stats.score.toString().padStart(6, '0');
    const comboPill = document.getElementById('combo-pill')!;
    comboPill.textContent = `COMBO ${stats.combo} (x${stats.multiplier})`;
  }

  private lastTime: number = 0;
  private gameLoop = (time: number) => {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.stateMachine.getState() === 'PLAYING') {
      // 1. Process auto-misses
      const misses = this.judge.update(this.conductor.songTime, this.conductor);
      for (const m of misses) {
        this.processJudgment('MISS', m.note.lane);
      }

      // 2. Check if song has finished
      const lvl = this.levels[this.currentLevelIndex];
      if (this.conductor.songBeat > lvl.totalBeats + 2) {
        this.onLevelComplete();
      }
    }

    // Update animations
    this.renderer.warrior.update(dt);
    this.renderer.effects.update(dt);

    // Render Canvas frame
    const stats = this.scoreSystem.getStats();
    this.renderer.render(
      this.conductor,
      this.judge.notes,
      stats.combo,
      stats.health
    );

    requestAnimationFrame(this.gameLoop);
  };
}

// Bootstrap when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new RhythmWarriorGame();
});
