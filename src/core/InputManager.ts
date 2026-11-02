import { ActionType } from '../gameplay/Judge';
import { StorageService } from '../storage/Storage';

export interface ActionEvent {
  action: ActionType;
  timeStamp: number; // DOM high-res timestamp
}

export class InputManager {
  private listener: ((event: ActionEvent) => void) | null = null;
  private targetElement: HTMLElement;
  private activeTouchMap: Map<number, { startX: number; startY: number; startTime: number; lane: 'L' | 'R' }> = new Map();
  private lastTouchTimes: { L: number; R: number } = { L: 0, R: 0 };
  private keysDown: Set<string> = new Set();

  constructor(targetElement: HTMLElement) {
    this.targetElement = targetElement;
    this.bindEvents();
  }

  public setActionListener(listener: (event: ActionEvent) => void) {
    this.listener = listener;
  }

  private emit(action: ActionType) {
    if (StorageService.get().getSettings().haptics && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Ignore if forbidden
      }
    }

    if (this.listener) {
      this.listener({
        action,
        timeStamp: performance.now()
      });
    }
  }

  private bindEvents() {
    // 1. Keyboard Events
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.repeat) return;
      const code = e.code;
      this.keysDown.add(code);

      // Check double note shortcut
      const leftKeys = ['KeyF', 'KeyD', 'ArrowLeft', 'KeyA'];
      const rightKeys = ['KeyJ', 'KeyK', 'ArrowRight', 'KeyL'];
      const dodgeKeys = ['Space', 'ArrowUp', 'KeyW'];

      const hasLeft = leftKeys.some(k => this.keysDown.has(k));
      const hasRight = rightKeys.some(k => this.keysDown.has(k));

      if (hasLeft && hasRight && (leftKeys.includes(code) || rightKeys.includes(code))) {
        this.emit('DOUBLE');
        return;
      }

      if (dodgeKeys.includes(code)) {
        e.preventDefault();
        this.emit('DODGE');
      } else if (leftKeys.includes(code)) {
        e.preventDefault();
        this.emit('STRIKE_L');
        this.emit('HOLD_START_L');
      } else if (rightKeys.includes(code)) {
        e.preventDefault();
        this.emit('STRIKE_R');
        this.emit('HOLD_START_R');
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      const code = e.code;
      this.keysDown.delete(code);

      const leftKeys = ['KeyF', 'KeyD', 'ArrowLeft', 'KeyA'];
      const rightKeys = ['KeyJ', 'KeyK', 'ArrowRight', 'KeyL'];

      if (leftKeys.includes(code)) {
        this.emit('HOLD_END_L');
      } else if (rightKeys.includes(code)) {
        this.emit('HOLD_END_R');
      }
    });

    // 2. Touch Events on target element
    this.targetElement.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      const rect = this.targetElement.getBoundingClientRect();
      const now = performance.now();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const clientX = touch.clientX - rect.left;
        const clientY = touch.clientY - rect.top;
        const lane = clientX < rect.width / 2 ? 'L' : 'R';

        this.activeTouchMap.set(touch.identifier, {
          startX: clientX,
          startY: clientY,
          startTime: now,
          lane
        });

        this.lastTouchTimes[lane] = now;
      }

      // Check for simultaneous two-handed tap (within 55ms)
      if (Math.abs(this.lastTouchTimes.L - this.lastTouchTimes.R) < 55 && e.touches.length >= 2) {
        this.emit('DOUBLE');
      } else {
        // Individual lane strikes
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const touchData = this.activeTouchMap.get(touch.identifier);
          if (touchData) {
            if (touchData.lane === 'L') {
              this.emit('STRIKE_L');
              this.emit('HOLD_START_L');
            } else {
              this.emit('STRIKE_R');
              this.emit('HOLD_START_R');
            }
          }
        }
      }
    }, { passive: false });

    this.targetElement.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      const rect = this.targetElement.getBoundingClientRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const data = this.activeTouchMap.get(touch.identifier);
        if (!data) continue;

        const currentY = touch.clientY - rect.top;
        const deltaY = currentY - data.startY;

        // Upward swipe detection (> 35px upwards)
        if (deltaY < -35) {
          this.emit('DODGE');
          // Reset startY so it doesn't repeatedly fire dodge on one swipe
          data.startY = currentY;
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const data = this.activeTouchMap.get(touch.identifier);
        if (data) {
          if (data.lane === 'L') {
            this.emit('HOLD_END_L');
          } else {
            this.emit('HOLD_END_R');
          }
          this.activeTouchMap.delete(touch.identifier);
        }
      }
    };

    this.targetElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.targetElement.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // 3. Mouse fallback for testing on laptop via clicking
    this.targetElement.addEventListener('mousedown', (e: MouseEvent) => {
      const rect = this.targetElement.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const isLeft = clientX < rect.width / 2;
      if (isLeft) {
        this.emit('STRIKE_L');
        this.emit('HOLD_START_L');
      } else {
        this.emit('STRIKE_R');
        this.emit('HOLD_START_R');
      }
    });

    this.targetElement.addEventListener('mouseup', (e: MouseEvent) => {
      const rect = this.targetElement.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const isLeft = clientX < rect.width / 2;
      if (isLeft) {
        this.emit('HOLD_END_L');
      } else {
        this.emit('HOLD_END_R');
      }
    });
  }
}
