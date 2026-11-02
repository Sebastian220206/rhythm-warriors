import { Conductor } from '../core/Conductor';
import { Note } from '../gameplay/Note';
import { Warrior } from './Warrior';
import { EffectsManager } from './Effects';
import { StorageService } from '../storage/Storage';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public warrior: Warrior;
  public effects: EffectsManager;
  private dpr: number = 1;
  public width: number = 0;
  public height: number = 0;
  public isPortrait: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.warrior = new Warrior();
    this.effects = new EffectsManager();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isPortrait = this.height > this.width;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);

    // Position warrior at target
    if (this.isPortrait) {
      this.warrior.x = this.width / 2;
      this.warrior.y = this.height * 0.76;
    } else {
      this.warrior.x = this.width / 2;
      this.warrior.y = this.height * 0.58;
    }
  }

  public render(conductor: Conductor, notes: Note[], combo: number, health: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Clear & Screen Shake
    ctx.save();
    if (!StorageService.get().getSettings().reducedMotion && this.effects.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.effects.screenShake * 2;
      const shakeY = (Math.random() - 0.5) * this.effects.screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = '#080812';
    ctx.fillRect(0, 0, w, h);

    // 2. Cyber grid background with beat pulse
    this.drawBackground(ctx, conductor);

    // 3. Rhythm tracks and hit zone
    this.drawTracks(ctx, conductor);

    // 4. Notes approaching the hit zone
    this.drawNotes(ctx, conductor, notes);

    // 5. Center Warrior
    this.warrior.draw(ctx, conductor, combo);

    // 6. Particles & Floating Judgments
    this.effects.draw(ctx);

    // 7. Low health vignette
    if (health < 30) {
      this.drawLowHealthVignette(ctx, health);
    }

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D, conductor: Conductor) {
    const w = this.width;
    const h = this.height;
    const pulse = Math.sin(conductor.beatFraction * Math.PI * 2) * 0.5 + 0.5;

    ctx.save();
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.03 + pulse * 0.04})`;
    ctx.lineWidth = 1;

    // Horizon line
    const horizonY = this.isPortrait ? h * 0.25 : h * 0.35;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();

    // Perspective lines
    const numLines = 14;
    const centerX = w / 2;
    for (let i = -numLines / 2; i <= numLines / 2; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX, horizonY);
      ctx.lineTo(centerX + i * (w / (numLines / 2)), h);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawTracks(ctx: CanvasRenderingContext2D, conductor: Conductor) {
    const pulse = Math.sin(conductor.beatFraction * Math.PI * 2) * 0.5 + 0.5;
    const targetX = this.warrior.x;
    const targetY = this.warrior.y;

    ctx.save();

    if (this.isPortrait) {
      // Two vertical approach lanes
      const laneOffset = 65;

      // Left Track
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(targetX - laneOffset, 40);
      ctx.lineTo(targetX - laneOffset, targetY);
      ctx.stroke();

      // Right Track
      ctx.strokeStyle = 'rgba(255, 0, 102, 0.2)';
      ctx.beginPath();
      ctx.moveTo(targetX + laneOffset, 40);
      ctx.lineTo(targetX + laneOffset, targetY);
      ctx.stroke();

      // Hit Reticles
      this.drawHitRing(ctx, targetX - laneOffset, targetY, '#00f0ff', pulse);
      this.drawHitRing(ctx, targetX + laneOffset, targetY, '#ff0066', pulse);
    } else {
      // Horizontal Inward approach lanes
      // Left lane
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(targetX - 40, targetY);
      ctx.stroke();

      // Right lane
      ctx.strokeStyle = 'rgba(255, 0, 102, 0.2)';
      ctx.beginPath();
      ctx.moveTo(targetX + 40, targetY);
      ctx.lineTo(this.width, targetY);
      ctx.stroke();

      // Hit Reticles
      this.drawHitRing(ctx, targetX - 45, targetY, '#00f0ff', pulse);
      this.drawHitRing(ctx, targetX + 45, targetY, '#ff0066', pulse);
    }

    ctx.restore();
  }

  private drawHitRing(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, pulse: number) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 + pulse * 6;
    ctx.beginPath();
    ctx.arc(x, y, 22 + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawNotes(ctx: CanvasRenderingContext2D, conductor: Conductor, notes: Note[]) {
    const currentBeat = conductor.songBeat;
    const noteSpeed = StorageService.get().getSettings().noteSpeed;
    const beatsAhead = 4.0 / noteSpeed; // notes become visible 4 beats in advance
    const targetX = this.warrior.x;
    const targetY = this.warrior.y;

    for (const note of notes) {
      if (note.judged && note.judgment && !note.holding) continue;

      const beatDiff = note.beat - currentBeat;
      // Note is too far in future
      if (beatDiff > beatsAhead) continue;
      // Note has passed target too far
      if (beatDiff < -0.4 && !note.holding) continue;

      const progress = 1.0 - (beatDiff / beatsAhead); // 0 at spawn, 1.0 at target hit zone

      if (this.isPortrait) {
        this.drawNotePortrait(ctx, note, progress, targetX, targetY);
      } else {
        this.drawNoteLandscape(ctx, note, progress, targetX, targetY);
      }
    }
  }

  private drawNoteLandscape(
    ctx: CanvasRenderingContext2D,
    note: Note,
    progress: number,
    targetX: number,
    targetY: number
  ) {
    const hitZoneL = targetX - 45;
    const hitZoneR = targetX + 45;

    if (note.type === 'dodge') {
      // Sweeping vertical laser wall sweeping from left or right towards center
      const currentX = (progress * (targetX - 20));
      ctx.save();
      ctx.strokeStyle = '#9d4edd';
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(currentX, targetY - 60);
      ctx.lineTo(currentX, targetY + 60);
      ctx.stroke();

      // Dodge label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DODGE', currentX - 20, targetY - 65);
      ctx.restore();
      return;
    }

    if (note.type === 'double') {
      // Dual orbs on both sides
      const xL = progress * hitZoneL;
      const xR = this.width - progress * (this.width - hitZoneR);
      this.drawOrb(ctx, xL, targetY, '#00f0ff', 16, true);
      this.drawOrb(ctx, xR, targetY, '#ff0066', 16, true);
      return;
    }

    // Single Strike or Hold note
    const isLeft = note.lane === 'L';
    const hitZoneX = isLeft ? hitZoneL : hitZoneR;
    const startX = isLeft ? 0 : this.width;
    const noteX = startX + progress * (hitZoneX - startX);
    const color = isLeft ? '#00f0ff' : '#ff0066';

    if (note.type === 'hold') {
      const beatsAhead = 4.0;
      const holdLengthProgress = (note.length || 1) / beatsAhead;
      const holdWidth = Math.abs(hitZoneX - startX) * holdLengthProgress;
      const tailX = isLeft ? noteX - holdWidth : noteX + holdWidth;

      // Draw Hold glowing beam
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 14;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(tailX, targetY);
      ctx.lineTo(noteX, targetY);
      ctx.stroke();
      ctx.restore();

      this.drawOrb(ctx, noteX, targetY, color, 16, false);
      this.drawOrb(ctx, tailX, targetY, '#ffffff', 8, false);
    } else {
      this.drawOrb(ctx, noteX, targetY, color, 16, false);
    }
  }

  private drawNotePortrait(
    ctx: CanvasRenderingContext2D,
    note: Note,
    progress: number,
    targetX: number,
    targetY: number
  ) {
    const laneOffset = 65;
    const startY = 40;
    const noteY = startY + progress * (targetY - startY);

    if (note.type === 'dodge') {
      ctx.save();
      ctx.strokeStyle = '#9d4edd';
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(targetX - 120, noteY);
      ctx.lineTo(targetX + 120, noteY);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (note.type === 'double') {
      this.drawOrb(ctx, targetX - laneOffset, noteY, '#00f0ff', 16, true);
      this.drawOrb(ctx, targetX + laneOffset, noteY, '#ff0066', 16, true);
      return;
    }

    const isLeft = note.lane === 'L';
    const noteX = isLeft ? targetX - laneOffset : targetX + laneOffset;
    const color = isLeft ? '#00f0ff' : '#ff0066';

    if (note.type === 'hold') {
      const beatsAhead = 4.0;
      const holdLengthProgress = (note.length || 1) / beatsAhead;
      const holdHeight = (targetY - startY) * holdLengthProgress;
      const tailY = noteY - holdHeight;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 14;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(noteX, tailY);
      ctx.lineTo(noteX, noteY);
      ctx.stroke();
      ctx.restore();

      this.drawOrb(ctx, noteX, noteY, color, 16, false);
      this.drawOrb(ctx, noteX, tailY, '#ffffff', 8, false);
    } else {
      this.drawOrb(ctx, noteX, noteY, color, 16, false);
    }
  }

  private drawOrb(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number, isDouble: boolean) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    if (isDouble) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawLowHealthVignette(ctx: CanvasRenderingContext2D, health: number) {
    const intensity = (30 - health) / 30;
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.3,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
    );
    grad.addColorStop(0, 'rgba(255, 0, 68, 0)');
    grad.addColorStop(1, `rgba(255, 0, 68, ${0.45 * intensity})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
