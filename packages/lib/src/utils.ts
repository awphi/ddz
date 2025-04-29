import type { Bid, Card, GameState, HandType, Player } from "./types";

function createDeck(): Card[] {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const deck: Card[] = [];

  for (let rank = 1; rank <= 13; rank++) {
    for (const suit of suits) {
      deck.push({ rank, suit });
    }
  }

  // shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function isValidBid(bid: Bid, otherBids: Bid[]): boolean {
  if (bid === "pass") {
    return true;
  }

  const maxBid = Math.max(...otherBids.filter((v) => v !== "pass").concat(0));
  return Number.isInteger(bid) && bid >= 1 && bid <= 3 && bid > maxBid;
}

export function getHandType(cards: Card[]): HandType {
  if (cards.length === 0) {
    throw new Error("Hand cannot be empty");
  }

  const rankCounts: Record<number, number> = {};
  for (const card of cards) {
    rankCounts[card.rank] = (rankCounts[card.rank] ?? 0) + 1;
  }
  const counts = Object.values(rankCounts);
  const ranks = Object.keys(rankCounts).map(Number);

  // some shorthand
  const maxRank = Math.max(...ranks);
  const nRanks = ranks.length;
  const nCards = cards.length;

  // only a rocket can use both jokers
  if (rankCounts[16] === 2) {
    if (nCards === 2) {
      return "rocket";
    }

    throw new Error("Invalid hand type");
  }

  if (nRanks === 1) {
    switch (nCards) {
      case 1:
        return "single";
      case 2:
        return "pair";
      case 3:
        return "triplet";
      case 4:
        return "bomb";
    }
  }

  if (nRanks === 2 && counts.includes(3)) {
    if (nCards === 5) {
      return "tripletWithPair";
    }

    if (nCards == 4) {
      return "tripletWithSingle";
    }
  }

  if (ranks.every((rank, i) => i === 0 || rank === ranks[i - 1] + 1)) {
    // twos and jokers cannot be used in a straight or straight of pairs
    if (maxRank <= 14) {
      if (nCards >= 5 && nRanks === nCards) {
        return "straight";
      }

      if (nCards >= 6 && counts.every((v) => v === 2)) {
        return "straightOfPairs";
      }
    }

    if (nCards >= 6 && counts.every((v) => v === 3)) {
      return "straightOfTriplets";
    }
  }

  const triplets = ranks.filter((_, i) => counts[i] === 3);
  if (
    triplets.length >= 2 &&
    nRanks === triplets.length * 2 &&
    triplets.every((rank, i) => i === 0 || rank === triplets[i - 1] + 1)
  ) {
    if (nCards === triplets.length * 3 + triplets.length) {
      return "straightOfTripletsWithSingles";
    }

    if (nCards === triplets.length * 3 + triplets.length * 2) {
      return "straightOfTripletsWithPairs";
    }
  }

  if (
    nRanks === 3 &&
    counts.includes(4) &&
    (nCards === 6 || (nCards === 8 && counts.includes(2)))
  ) {
    return "quadplexSet";
  }

  throw new Error("Invalid hand type");
}

export function createGame(playerNames: string[]): GameState {
  if (playerNames.length !== 3) {
    throw new Error("Number of players must be 3");
  }

  const players: Player[] = [];
  const deck = createDeck();

  for (let i = 0; i < playerNames.length; i++) {
    players.push({
      name: playerNames[i],
      hand: deck.splice(i * 17, 17), // 17 cards each, 3 left in the deck for the landlord
      balance: 1000,
      moves: [],
      type: "farmer", // default type - someone will be set as the landlord after the auction
      auction: {
        lastBid: 0,
        maxBid: 0,
      },
    });
  }

  // select a first bidder randomly (effectively the same as drawing the face up card)
  const currentPlayerIndex = Math.floor(Math.random() * playerNames.length);

  return {
    id: crypto.randomUUID(),
    phase: "auction",
    players,
    deck,
    currentPlayerIndex,
    currentHand: null,
    turn: 0,
  };
}
