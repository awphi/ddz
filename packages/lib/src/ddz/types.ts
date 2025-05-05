import type { Card } from "../types";

export interface Hand {
  // based on https://www.pagat.com/climbing/doudizhu.html#play, listed in order of strength
  type:
    | "single"
    | "pair"
    | "triplet"
    | "tripletWithSingle"
    | "tripletWithPair"
    | "straight"
    | "straightOfPairs"
    | "straightOfTriplets"
    | "straightOfTripletsWithSingles"
    | "straightOfTripletsWithPairs"
    | "quadplexSet"
    | "bomb"
    | "rocket";
  value: number;
}

export type Bid = number | "pass";

export type Move = Card[] | "pass";

export interface AuctionBidMessage {
  type: "auctionBid";
  bid: Bid;
}

export interface PlayMoveMessage {
  type: "playMove";
  move: Move;
}

export type Message = AuctionBidMessage | PlayMoveMessage;

export interface Player {
  name: string;
  hand: Card[];
  moves: Move[];
  auction: {
    lastBid: Bid | null;
  };
}

export interface GameState {
  id: string; // unique game id created when deck is dealt
  phase: "auction" | "play";
  deck: Card[];
  players: Player[];
  currentPlayerIndex: number;
  currentHand: Card[]; // current hand in play to beat - empty array = nothing to beat
  bid: number;
  landlordIndex: number;
}
