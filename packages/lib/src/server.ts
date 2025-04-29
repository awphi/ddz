import { GameState, Message } from "./types";
import { createGame, isValidBid } from "./utils";

class EventBus<T extends Record<string, (...args: any[]) => void>> {
  private listeners: { [K in keyof T]?: T[K][] } = {};

  on<K extends keyof T>(event: K, callback: T[K]) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  off<K extends keyof T>(event: K, callback: T[K]) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]!.filter(
        (cb) => cb !== callback
      );
    }
  }

  once<K extends keyof T>(event: K, callback: T[K]) {
    const wrappedCallback = ((...args) => {
      callback(...args);
      this.off(event, wrappedCallback);
    }) as T[K];

    this.on(event, wrappedCallback);
  }

  fire<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]!) {
        callback(...args);
      }
    }
  }
}

/**
 * Dou Dizhu server class.
 * - Responsible for managing the game state primitive and provides methods to interact with it.
 */
export class DdzServer {
  private _gameState: GameState = undefined!; // gets mutated in place
  private _eventBus: EventBus<{
    gameStateChanged: (gameState: GameState) => void;
  }> = new EventBus();

  /**
   * Fires the `gameStateChanged` event with the current game state. Should be called internally
   * whenever the server host needs to know about state changes (e.g. to notify clients).
   */
  private gameStateChanged(): void {
    this._eventBus.fire("gameStateChanged", this._gameState);
  }

  private deal(): void {
    this._gameState = createGame(this._playerNames);
    this.gameStateChanged();
  }

  /**
   * @param _playerNames Player names
   * @param _turnTime Max amount of time (in ms) a player has to play their turn
   */
  constructor(private _playerNames: string[]) {
    this.deal();
  }

  /**
   * Perform an action on behalf of the current player. It is the server host's responsbility
   * to determine if the action was received from the correct player.
   * @param message The action to perform. `null` means the player has done nothing this turn and is currently equivalent to passing in all cases.
   */
  play(message: Message | null): void {
    const state = this._gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (state.phase === "auction") {
      if (
        message !== null &&
        message.type === "auctionBid" &&
        isValidBid(
          message.bid,
          state.players.map((v) => v.auction.lastBid)
        )
      ) {
        currentPlayer.auction.lastBid = message.bid;
        if (message.bid !== "pass") {
          currentPlayer.auction.maxBid = message.bid;
        }
      } else {
        // interpret any invalid bid as a pass
        currentPlayer.auction.lastBid = "pass";
      }
    } else if (state.phase === "play") {
      // TODO - play phase
    }

    state.turn++;

    // deal with advancing to the play phase or re-dealing
    if (state.phase === "auction") {
      const numericBids = state.players
        .map((v) => v.auction.lastBid)
        .filter((v) => v !== "pass");

      // re-deal if everyone has passed
      if (numericBids.length === 0) {
        this.deal();
        return;
      }

      // assign landlord to anyone who bids 3, or the last remaining non-passed bidder
      const landlordIdx: number = state.players.findIndex(
        (v) =>
          v.auction.lastBid === 3 ||
          (numericBids.length === 1 && v.auction.lastBid !== "pass")
      );

      if (landlordIdx !== -1) {
        // assign landlord, deal the remaining cards in the deck, and advance the phase
        state.players[landlordIdx].type = "landlord";
        state.players[landlordIdx].hand.push(...state.deck);
        state.deck = [];
        state.phase = "play";
        state.turn = 0;
      } else {
        // otherwise advance play to the next non-passed bidder
        do {
          state.currentPlayerIndex =
            (state.currentPlayerIndex + 1) % state.players.length;
        } while (
          state.players[state.currentPlayerIndex].auction.lastBid !== "pass"
        );
      }
    }

    this.gameStateChanged();
  }

  on = this._eventBus.on;
  off = this._eventBus.on;
  once = this._eventBus.on;
}
