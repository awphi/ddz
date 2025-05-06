import { canBeatBid, canBeatHand } from "./utils";
import type {
  AuctionBidMessage,
  GameState,
  Message,
  Player,
  PlayMoveMessage,
} from "./types";
import { popSubarray } from "../utils";

// Public DDZ client API

export function isValidBidMessage(
  message: Message | null,
  gameState: GameState
): message is AuctionBidMessage {
  if (message === null || message.type !== "auctionBid") {
    return false;
  }

  const { bid } = message;
  if (bid === "pass") {
    return true;
  }

  return canBeatBid(bid, gameState.bid);
}

export function isValidMoveMessage(
  message: Message | null,
  gameState: GameState
): message is PlayMoveMessage {
  if (message === null || message.type !== "playMove") {
    return false;
  }

  const { move: newHand } = message;
  if (newHand === "pass") {
    return true;
  }

  const { currentHand } = gameState;

  // take a shallow clone we can mutate to test the player has these cards
  const playerHand = [...gameState.players[gameState.currentPlayerIndex].hand];
  if (!popSubarray(playerHand, newHand)) {
    return false;
  }

  return canBeatHand(newHand, currentHand);
}

export function getWinner(players: Pick<Player, "hand">[]): number | null {
  const idx = players.findIndex((v) => v.hand.length === 0);
  return idx === -1 ? null : idx;
}
