export interface Card {
  /* Stored in DDZ priority order in the range [3,17] where: 
    - [3, 14] = [3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A]
    - 15 = 2
    - 16 = Black Joker
    - 17 = Red Joker
  */
  rank: number;
  suit: string;
}

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

export interface Player {
  name: string;
  hand: Card[];
  moves: Move[];
  type: "landlord" | "farmer";
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
}

export interface ScoreLedger {
  /**
   * Adjacency matrix of payments to be made between entities:
   * - `ledger.payments[a][b]` -> amount of money `a` owes `b`
   * - `ledger.payments[b][a]` -> amount of money `b` owes `a` (just the inverse of the above but stored for clarity)
   *
   * Also has the special property such that:
   * - `ledger.payments[a][a]` -> total amount owed TO `a` - total amount owed BY `a`
   */
  payments: number[][];
  playerNames: string[];
}

export interface AuctionBidMessage {
  type: "auctionBid";
  bid: Bid;
}

export interface PlayMoveMessage {
  type: "playMove";
  move: Move;
}

export type Message = AuctionBidMessage | PlayMoveMessage;
