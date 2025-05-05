import type { Bid, Card, GameState, Hand, Player } from "../types";

// Core DDZ utils consumed by either the client or the server. Exported for testability and not part of the public API.

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function countCards(cards: Card[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const card of cards) {
    result[card.rank] = (result[card.rank] ?? 0) + 1;
  }
  return result;
}

export function groupCards(cards: Card[]): Record<number, number[]> {
  const counts = countCards(cards);
  const result: Record<number, number[]> = {};

  // result[i] will be sorted by virtue of the keys of the object returned by countCards()
  // being ordered by JS
  for (const [rank, count] of Object.entries(counts)) {
    if (!(count in result)) {
      result[count] = [];
    }
    result[count].push(Number(rank));
  }

  return result;
}

export function isSequential(arr: number[]): boolean {
  return arr.every((v, i) => i === 0 || v === arr[i - 1] + 1);
}

export function createDeck(): Card[] {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const deck: Card[] = [];

  for (let rank = 3; rank <= 15; rank++) {
    for (const suit of suits) {
      deck.push({ rank, suit });
    }
  }

  deck.push({ rank: 16, suit: "joker" }, { rank: 17, suit: "joker" });

  // shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
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
      hand: deck.splice(0, 17), // 17 cards each, 3 left in the deck for the landlord
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
    currentHand: [],
  };
}

export function identifyHand(cards: Card[]): Hand | null {
  if (cards.length === 0) {
    return null;
  }

  const ranks = countCards(cards); // rank -> # of cards of that rank
  const uniqueRanks = Object.keys(ranks).map(Number);
  const groups = groupCards(cards); // # of cards -> list of unique ranks with that group size
  const uniqueGroups = Object.keys(groups).map(Number);
  const maxRank = Math.max(...uniqueRanks);
  const nRanks = Object.keys(ranks).length;
  const nCards = cards.length;

  // only a rocket can use both jokers
  if (ranks[16] === 1 && ranks[17] === 1) {
    if (nCards === 2) {
      return { type: "rocket", value: maxRank };
    }

    return null;
  }

  if (nRanks === 1) {
    switch (nCards) {
      case 1:
        return { type: "single", value: maxRank };
      case 2:
        return { type: "pair", value: maxRank };
      case 3:
        return { type: "triplet", value: maxRank };
      case 4:
        return { type: "bomb", value: maxRank };
    }
  }

  if (nRanks === 2 && groups[3]?.length === 1) {
    if (nCards === 5) {
      return { type: "tripletWithPair", value: groups[3][0] };
    }

    if (nCards == 4) {
      return { type: "tripletWithSingle", value: groups[3][0] };
    }
  }

  if (isSequential(uniqueRanks)) {
    const minRank = Math.min(...uniqueRanks);
    // twos and jokers cannot be used in a straight or straight of pairs
    if (maxRank <= 14) {
      if (nCards >= 5 && nRanks === nCards) {
        return { type: "straight", value: minRank };
      }

      if (nCards >= 6 && uniqueGroups.length === 1 && uniqueGroups[0] === 2) {
        return { type: "straightOfPairs", value: minRank };
      }
    }

    if (nCards >= 6 && uniqueGroups.length === 1 && uniqueGroups[0] === 3) {
      return { type: "straightOfTriplets", value: minRank };
    }
  }

  const nTriplets = groups[3]?.length ?? 0;
  if (nTriplets >= 2 && nRanks === nTriplets * 2 && isSequential(groups[3])) {
    const value = Math.min(...groups[3]);
    if (nCards === nTriplets * 3 + nTriplets) {
      return {
        type: "straightOfTripletsWithSingles",
        value,
      };
    }

    if (nCards === nTriplets * 3 + nTriplets * 2) {
      return { type: "straightOfTripletsWithPairs", value };
    }
  }

  if (
    nRanks === 3 &&
    groups[4]?.length === 1 &&
    (groups[1]?.length === 2 || groups[2]?.length === 2) // either two singles or two pairs
  ) {
    return { type: "quadplexSet", value: groups[4][0] };
  }

  return null;
}

export function canBeatHand(newHand: Card[], currentHand: Card[]): boolean {
  const newType = identifyHand(newHand);
  const previousType = identifyHand(currentHand);

  // if the new hand is invalid it beats nothing
  if (newType === null) {
    return false;
  }

  // if the previous hand was invalid then allow valid hands to beat it
  if (previousType === null) {
    return newType !== null;
  }

  // rocket beats all
  if (newType.type === "rocket") {
    return true;
  }

  // bomb beats everything except rocket or a higher bomb
  if (newType.type === "bomb") {
    if (previousType.type === "rocket") {
      return false;
    }

    if (previousType.type === "bomb") {
      return newType.value > previousType.value;
    }

    return true;
  }

  if (
    newType.type === previousType.type &&
    newHand.length === currentHand.length
  ) {
    return newType.value > previousType.value;
  }

  return false;
}

export function canBeatBid(bid: number, otherBids: Bid[]): boolean {
  const maxBid = Math.max(...otherBids.filter((v) => v !== "pass").concat(0));
  return Number.isInteger(bid) && bid >= 1 && bid <= 3 && bid > maxBid;
}

/**
 * Removes cards specified in a toRemove array from a hand array in-place
 * based on compare-by-value.
 */
export function removeCards(hand: Card[], toRemove: Card[]): boolean {
  for (const card of toRemove) {
    const idx = hand.findIndex((otherCard) => shallowEqual(card, otherCard));
    if (idx === -1) {
      return false;
    }

    hand.splice(idx, 1);
  }

  return true;
}

export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.hasOwnProperty.call(objB, keysA[i]) ||
      !Object.is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
    }
  }

  return true;
}
