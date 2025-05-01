import { isValidBid, isValidHand } from "./core/utils";
import type {
  AuctionBidMessage,
  Bid,
  Card,
  Message,
  Player,
  PlayMoveMessage,
} from "./types";

// Public client API

// TODO unit tests for this file - maybe mock the core utils as they're already tested?

export function isValidBidMessage(
  message: Message | null,
  otherBids: Bid[]
): message is AuctionBidMessage {
  if (message === null || message.type !== "auctionBid") {
    return false;
  }

  const { bid } = message;
  if (bid === "pass") {
    return true;
  }

  return isValidBid(bid, otherBids);
}

export function isValidMoveMessage(
  message: Message | null,
  currentHand: Card[]
): message is PlayMoveMessage {
  if (message === null || message.type !== "playMove") {
    return false;
  }

  const { move: newHand } = message;
  if (newHand === "pass") {
    return true;
  }

  return isValidHand(newHand, currentHand);
}

export function getWinner(players: Player[]): number | null {
  const idx = players.findIndex((v) => v.hand.length === 0);
  return idx === -1 ? null : idx;
}
