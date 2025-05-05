import type { Card } from "../types";
import { countCards, groupCards, isSequential } from "../utils";
import type { Hand, Move } from "./types";

// Core DDZ utils consumed by either the client and/or the server. Exported for testability and not part of the public API.

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

export function canBeatBid(newBid: number, currentBid: number): boolean {
  return (
    Number.isInteger(newBid) &&
    newBid >= 1 &&
    newBid <= 3 &&
    newBid > currentBid
  );
}

export function countMovesOfType(moves: Move[], types: Hand["type"][]): number {
  let sum = 0;
  for (const move of moves) {
    if (move === "pass") {
      continue;
    }

    const hand = identifyHand(move);
    if (hand !== null && types.includes(hand.type)) {
      sum += 1;
    }
  }

  return sum;
}
