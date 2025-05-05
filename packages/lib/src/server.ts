import { EventBus } from "./core/event-bus";
import type { GameState, Message, ScoreLedger } from "./types";
import * as client from "./client";
import {
  addTransactionToScoreLedger,
  countMovesOfType,
  createGame,
  createScoreLedger,
  mod,
  removeCards,
} from "./core/utils";

// Public server API

/**
 * Dou Dizhu server class.
 * - Responsible for managing the game state primitive and provides methods to interact with it.
 */
export class DdzServer {
  private _gameState: GameState | null = null; // gets mutated in place
  private _scoreLedger: ScoreLedger;
  private _eventBus: EventBus<{
    gameStateChanged: () => void;
    gameOver: () => void;
    gameStart: () => void;
  }> = new EventBus();

  public get gameState(): GameState {
    if (this._gameState === null) {
      throw new Error("Cannot access game state before a game has started!");
    }

    return this._gameState;
  }

  public get scoreLedger(): ScoreLedger {
    return this._scoreLedger;
  }

  /**
   * Start a new game and emit the "gameStart" event
   */
  start(): void {
    this._gameState = createGame(this._playerNames);
    this._eventBus.fire("gameStart");
  }

  /**
   * Ends the current game and emits a "gameOver" event
   */
  end(): void {
    this._gameState = null;
    this._eventBus.fire("gameOver");
  }

  /**
   * @param _playerNames Player names
   * @param _turnTime Max amount of time (in ms) a player has to play their turn
   */
  constructor(private _playerNames: string[]) {
    this._scoreLedger = createScoreLedger(this._playerNames);
  }

  private playAuction(message: Message | null): void {
    const state = this.gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const prevPlayer =
      state.players[mod(state.currentPlayerIndex - 1, state.players.length)];
    const nextPlayerIndex = mod(
      state.currentPlayerIndex + 1,
      state.players.length
    );

    if (client.isValidBidMessage(message, state)) {
      currentPlayer.auction.lastBid = message.bid;
      if (message.bid !== "pass") {
        state.bid = message.bid;
      }
    } else {
      // interpret any invalid bid as a pass
      currentPlayer.auction.lastBid = "pass";
    }

    // if no one bid anything then end the game
    if (
      state.bid === 0 &&
      state.players.every((v) => v.auction.lastBid === "pass")
    ) {
      return this.end();
    }

    // if (this player bid a 3) or (this player and the last player passed) then assign the landlord
    let landlordIdx = -1;
    if (currentPlayer.auction.lastBid === 3) {
      landlordIdx = state.currentPlayerIndex;
    } else if (
      currentPlayer.auction.lastBid === "pass" &&
      prevPlayer.auction.lastBid === "pass" &&
      state.players[nextPlayerIndex].auction.lastBid !== null
    ) {
      landlordIdx = mod(state.currentPlayerIndex + 1, state.players.length);
    }

    if (landlordIdx !== -1) {
      // assign landlord, deal the remaining cards in the deck, and advance the phase
      state.players[landlordIdx].type = "landlord";
      state.players[landlordIdx].hand.push(...state.deck);
      state.deck = [];
      state.phase = "play";
    } else {
      state.currentPlayerIndex = nextPlayerIndex;
    }
  }

  private playMove(message: Message | null): void {
    const state = this.gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const previousPlayer =
      state.players[mod(state.currentPlayerIndex - 1, state.players.length)];

    if (client.isValidMoveMessage(message, state) && message.move !== "pass") {
      currentPlayer.moves.push(message.move);
      state.currentHand = message.move;
      removeCards(currentPlayer.hand, message.move);
    } else {
      // interpret any invalid move as a pass
      currentPlayer.moves.push("pass");

      // reset the current hand if the previous player passed too
      if (previousPlayer.moves[previousPlayer.moves.length - 1] === "pass") {
        state.currentHand = [];
      }
    }

    const winner = client.getWinner(state.players);
    if (winner !== null) {
      // update the score ledger with the result
      let totalBombsAndRockets = 0;
      for (const player of state.players) {
        totalBombsAndRockets += countMovesOfType(player.moves, [
          "bomb",
          "rocket",
        ]);
      }

      const stake = state.bid * Math.pow(2, totalBombsAndRockets);

      for (let p = 0; p < state.players.length; p++) {
        if (state.players[p].type === state.players[winner].type) {
          continue;
        }

        addTransactionToScoreLedger(this._scoreLedger, p, winner, stake);
      }

      return this.end();
    }

    // don't skip passed players - they may have passed tactically
    state.currentPlayerIndex = mod(
      state.currentPlayerIndex + 1,
      state.players.length
    );
  }

  /**
   * Perform an action on behalf of the current player. It is the server host's responsbility
   * to determine if the action was received from the correct player.
   * @param message The action to perform. `null` means the player has done nothing this turn and is currently equivalent to passing in all cases.
   */
  play(message: Message | null): void {
    const state = this._gameState;
    if (state === null || client.getWinner(state.players) !== null) {
      return;
    }

    if (state.phase === "auction") {
      this.playAuction(message);
    } else if (state.phase === "play") {
      this.playMove(message);
    }

    // we can assume if the game didn't end then some part(s) of the game state were mutated
    if (this._gameState !== null) {
      this._eventBus.fire("gameStateChanged");
    }
  }

  on = this._eventBus.on.bind(this._eventBus);
  off = this._eventBus.off.bind(this._eventBus);
  once = this._eventBus.once.bind(this._eventBus);
}
