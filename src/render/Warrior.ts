import { Conductor } from '../core/Conductor';

export type WarriorAction = 'IDLE' | 'SLASH_L' | 'SLASH_R' | 'DODGE' | 'PARRY';

export class Warrior {
  public x: number = 0;
  public y: number = 0;
  public action: WarriorAction = 'IDLE';
  private actionTimer: number = 0;
  private actionDuration: number = 0.18;

  public triggerAction(act: WarriorAction) {
    this.action = act;
    this.actionTimer = this.actionDuration;
  }

  public update(dt: number) {
    if (this.actionTimer > 0) {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.action = 'IDLE';
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, conductor: Conductor, combo: number) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Beat pulse bobbing
    const pulse = Math.sin(conductor.beatFraction * Math.PI * 2);
    const bobY = this.action === 'IDLE' ? pulse * 4 : 0;
    const dodgeOffset = this.action === 'DODGE' ? -35 : 0;

    ctx.translate(0, bobY + dodgeOffset);

    // 1. Combo Aura
    let auraColor = 'rgba(0, 240, 255, 0.2)';
    let auraRadius = 32;
    if (combo >= 40) {
      auraColor = 'rgba(255, 0, 102, 0.45)';
      auraRadius = 48 + pulse * 4;
    } else if (combo >= 20) {
      auraColor = 'rgba(255, 190, 11, 0.35)';
      auraRadius = 42 + pulse * 3;
    } else if (combo >= 10) {
      auraColor = 'rgba(157, 78, 221, 0.3)';
      auraRadius = 36 + pulse * 2;
    }

    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadius);
    grad.addColorStop(0, auraColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Warrior Body & Armor (Cyber Blade Master silhouette)
    ctx.fillStyle = '#16162a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;

    // Torso / Cloak
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(18, 15);
    ctx.lineTo(-18, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cyber visor / eyes
    ctx.fillStyle = combo >= 20 ? '#ffd700' : '#00f0ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillRect(-10, -22, 20, 4);
    ctx.shadowBlur = 0;

    // 3. Weapons & Action animations
    if (this.action === 'SLASH_L') {
      // Sweeping left blade
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 42, Math.PI * 0.7, Math.PI * 1.4);
      ctx.stroke();
    } else if (this.action === 'SLASH_R') {
      // Sweeping right blade
      ctx.strokeStyle = '#ff0066';
      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 42, -Math.PI * 0.4, Math.PI * 0.3);
      ctx.stroke();
    } else if (this.action === 'PARRY') {
      // Crossed dual blades
      ctx.strokeStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-25, 20); ctx.lineTo(25, -20);
      ctx.moveTo(25, 20); ctx.lineTo(-25, -20);
      ctx.stroke();
    } else if (this.action === 'DODGE') {
      // Dodge after-image rings
      ctx.strokeStyle = '#9d4edd';
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 30, 24, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Idle blades resting at sides
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, 5); ctx.lineTo(-30, 20);
      ctx.stroke();

      ctx.strokeStyle = '#ff0066';
      ctx.beginPath();
      ctx.moveTo(16, 5); ctx.lineTo(30, 20);
      ctx.stroke();
    }

    ctx.restore();
  }
}
