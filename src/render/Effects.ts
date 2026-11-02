import { JudgmentGrade } from '../gameplay/Note';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  life: number;
  maxLife: number;
}

export class EffectsManager {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  public screenShake: number = 0;

  public triggerHit(x: number, y: number, grade: JudgmentGrade) {
    let color = '#00f0ff';
    let count = 12;

    if (grade === 'PERFECT') {
      color = '#ffd700'; // Gold
      count = 20;
      this.screenShake = Math.max(this.screenShake, 7);
    } else if (grade === 'GREAT') {
      color = '#00f0ff'; // Cyan
      count = 14;
      this.screenShake = Math.max(this.screenShake, 4);
    } else if (grade === 'GOOD') {
      color = '#06d6a0'; // Emerald
      count = 8;
    } else if (grade === 'MISS') {
      color = '#ff0055'; // Pink/Red
      count = 6;
      this.screenShake = Math.max(this.screenShake, 8);
    }

    // Spawn sparks
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 250 + 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1.0,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.15
      });
    }

    // Spawn floating judgment text
    this.floatingTexts.push({
      text: grade,
      x,
      y: y - 20,
      color,
      alpha: 1.0,
      scale: 1.4,
      life: 0,
      maxLife: 0.6
    });
  }

  public update(dt: number) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94; // damping
      p.vy *= 0.94;
      p.alpha = 1 - (p.life / p.maxLife);
    }

    // Update floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y -= dt * 45; // float upwards
      ft.alpha = 1 - (ft.life / ft.maxLife);
      ft.scale = 1.0 + (1 - ft.life / ft.maxLife) * 0.3;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw floating texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `900 ${Math.round(20 * ft.scale)}px Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
