export type GameState =
  | 'BOOT'
  | 'MENU'
  | 'LEVEL_SELECT'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'RESULTS'
  | 'CALIBRATION'
  | 'SETTINGS';

export class GameStateMachine {
  private currentState: GameState = 'BOOT';
  private stateChangeListeners: ((state: GameState, prevState: GameState) => void)[] = [];

  public getState(): GameState {
    return this.currentState;
  }

  public setState(next: GameState) {
    if (this.currentState === next) return;
    const prev = this.currentState;
    this.currentState = next;
    for (const listener of this.stateChangeListeners) {
      listener(next, prev);
    }
  }

  public onStateChange(listener: (state: GameState, prevState: GameState) => void) {
    this.stateChangeListeners.push(listener);
  }
}
