import { EventBus } from "./event-bus";
import type { ScoreLedger } from "./types";

/**
 * Generic game server class.
 */
export abstract class GameServer<
  TGameState extends object,
  TMessage extends object
> {
  protected _gameState: TGameState | null = null; // gets mutated in place
  protected _scoreLedger: ScoreLedger;
  protected _eventBus: EventBus<{
    gameStateChanged: () => void;
    gameOver: () => void;
    gameStart: () => void;
  }> = new EventBus();

  /**
   * Access the current game state. Will throw if a game is not in progress.
   * In almost all cases, this should not be mutated outside the game server.
   */
  public get gameState(): TGameState {
    if (this._gameState === null) {
      throw new Error("Cannot access game state before a game has started!");
    }

    return this._gameState;
  }

  /**
   * Access the current score ledger.
   */
  public get scoreLedger(): ScoreLedger {
    return this._scoreLedger;
  }

  /**
   * Start a new game and emit the "gameStart" event.
   */
  start(): void {
    this._gameState = this.createGame();
    this._eventBus.fire("gameStart");
  }

  /**
   * Ends the current game and emits a "gameOver" event.
   */
  end(): void {
    this._gameState = null;
    this._eventBus.fire("gameOver");
  }

  /**
   * Instantiate an instance of the game server.
   * @param _playerNames Player names
   */
  constructor(protected _playerNames: string[]) {
    const N = _playerNames.length;
    this._scoreLedger = {
      payments: Array.from({ length: N }, () => new Array(N).fill(0)),
      playerNames: _playerNames,
    };
  }

  /**
   * Create a new instance of the game state.
   */
  protected abstract createGame(): TGameState;

  /**
   * Perform an action on behalf of the current player. It is the server host's responsbility
   * to determine if the action was received from the correct player.
   * @param message The action to perform. `null` means the player has done nothing this turn and is currently equivalent to passing in all cases.
   */
  abstract play(message: TMessage | null): void;

  /**
   * Add an event listener for a given event.
   */
  on = this._eventBus.on.bind(this._eventBus);

  /**
   * Remove a registered event listener.
   */
  off = this._eventBus.off.bind(this._eventBus);

  /**
   * Add a one-time event listener for a given event.
   */
  once = this._eventBus.once.bind(this._eventBus);
}
