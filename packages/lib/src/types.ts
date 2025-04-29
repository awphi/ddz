export interface Card {
  /* Stored in DDZ priority order in the range [3,16] where: 
    - [3, 14] = [3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A]
    - 15 = 2
    - 16 = Joker
  */
  rank: number;
  suit: string;
}

// based on https://www.pagat.com/climbing/doudizhu.html#play, listed in order of strength
export type HandType =
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

export type Bid = number | "pass";

export type Move = Card[] | "pass";

export interface Player {
  name: string;
  hand: Card[];
  moves: Move[];
  type: "landlord" | "farmer";
  auction: {
    lastBid: Bid;
    maxBid: number;
  };
}

export interface GameState {
  id: string; // unique game id created when deck is dealt
  turn: number;
  phase: "auction" | "play";
  deck: Card[];
  players: Player[];
  currentPlayerIndex: number;
  currentHand: Card[] | null; // current hand in play to beat
}

export interface AuctionBidMessage {
  type: "auctionBid";
  bid: Bid;
}

export interface PlayMoveMessage {
  type: "playMove";
  move: Card[] | "pass";
}

export type Message = AuctionBidMessage | PlayMoveMessage;
