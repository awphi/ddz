import { canBeatHand, identifyHand, canBeatBid } from "./utils";
import type { Card } from "../types";
import { describe, expect, it } from "vitest";
import { Hand } from "./types";

function createTestCards(
  ranks: number[],
  suits: string[] = ["hearts"]
): Card[] {
  return ranks.map((rank, i) => ({ rank, suit: suits[i % suits.length] }));
}

describe(identifyHand, () => {
  it("should identify a single card", () => {
    const cards = createTestCards([3]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "single",
      value: 3,
    });
  });

  it("should identify a pair", () => {
    const cards = createTestCards([4, 4]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({ type: "pair", value: 4 });
  });

  it("should identify a triplet", () => {
    const cards = createTestCards([5, 5, 5]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "triplet",
      value: 5,
    });
  });

  it("should identify a triplet with a single", () => {
    const cards = createTestCards([6, 6, 6, 7]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "tripletWithSingle",
      value: 6,
    });
  });

  it("should identify a triplet with a pair", () => {
    const cards = createTestCards([8, 8, 8, 9, 9]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "tripletWithPair",
      value: 8,
    });
  });

  it("should identify a straight", () => {
    const cards = createTestCards([3, 4, 5, 6, 7]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straight",
      value: 3,
    });
  });

  it("straight cannot include twos or jokers", () => {
    const cards = createTestCards([10, 11, 12, 13, 14, 15, 16]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("straight must have minimum length 5", () => {
    const cards = createTestCards([3, 4, 5, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should identify a straight of pairs", () => {
    const cards = createTestCards([3, 3, 4, 4, 5, 5]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straightOfPairs",
      value: 3,
    });
  });

  it("straight of pairs cannot include twos or jokers", () => {
    const cards = createTestCards([14, 14, 15, 15, 16, 16]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("straight of pairs must have minimum length 6 (3 unique pairs)", () => {
    const cards = createTestCards([3, 3, 4, 4]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should identify a straight of triplets", () => {
    const cards = createTestCards([3, 3, 3, 4, 4, 4]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straightOfTriplets",
      value: 3,
    });
  });

  it("should identify a straight of triplets with singles", () => {
    const cards = createTestCards([3, 3, 3, 4, 4, 4, 5, 6]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straightOfTripletsWithSingles",
      value: 3,
    });
  });

  it("should not allow non-unique singles attached to triplet straight", () => {
    const cards = createTestCards([3, 3, 3, 4, 4, 4, 6, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should identify a straight of triplets with pairs", () => {
    const cards = createTestCards([3, 3, 3, 4, 4, 4, 5, 5, 6, 6]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straightOfTripletsWithPairs",
      value: 3,
    });
  });

  it("should not count non-sequential triplet straight", () => {
    const cards = createTestCards([3, 3, 3, 7, 7, 7, 5, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should not allow mixed singles/pairs with triplet straight", () => {
    const cards = createTestCards([3, 3, 3, 4, 4, 4, 5, 6, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should not allow extra pairs in triplet straight", () => {
    const cards = createTestCards([3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 7]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should not allow non-unique pairs attached to triplet straight", () => {
    const cards = createTestCards([3, 3, 3, 4, 4, 4, 6, 6, 6, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should identify a bomb", () => {
    const cards = createTestCards([10, 10, 10, 10]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "bomb",
      value: 10,
    });
  });

  it("should identify a rocket", () => {
    const cards = createTestCards([16, 17]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "rocket",
      value: 17,
    });
  });

  it("should identify a quadplex set with singles", () => {
    const cards = createTestCards([11, 11, 11, 11, 12, 13]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "quadplexSet",
      value: 11,
    });
  });

  it("quadplex set with singles must contain exactly two singles", () => {
    const cards1 = createTestCards([11, 11, 11, 11, 12]); // 1 single
    const cards2 = createTestCards([11, 11, 11, 11, 12, 13, 14]); // 3 singles
    expect(identifyHand(cards1)).toStrictEqual(null);
    expect(identifyHand(cards2)).toStrictEqual(null);
  });

  it("should identify a quadplex set with pairs", () => {
    const cards = createTestCards([11, 11, 11, 11, 12, 12, 13, 13]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "quadplexSet",
      value: 11,
    });
  });

  it("quadplex set with pairs must contain exactly two pairs", () => {
    const cards1 = createTestCards([11, 11, 11, 11, 12, 12]); // 1 pair
    const cards2 = createTestCards([11, 11, 11, 11, 12, 12, 13, 13, 14, 14]); // 3 pairs
    expect(identifyHand(cards1)).toStrictEqual(null);
    expect(identifyHand(cards2)).toStrictEqual(null);
  });

  it("should throw an error for an invalid hand", () => {
    const cards = createTestCards([3, 4, 5]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });
});

describe(canBeatBid, () => {
  type TestCase = {
    bid: number;
    currentBid: number;
    result: boolean;
    name: string;
  };

  const testCases: TestCase[] = [
    {
      bid: 3,
      currentBid: 2,
      result: true,
      name: "basically works",
    },
    {
      bid: 4,
      currentBid: 2,
      result: false,
      name: "cannot bid > 3",
    },
    {
      bid: 1,
      currentBid: 2,
      result: false,
      name: "smaller number does not beat a bigger number",
    },
    {
      bid: 1,
      currentBid: 0,
      result: true,
      name: "any number beats passes",
    },
    {
      bid: 1,
      currentBid: 0,
      result: true,
      name: "0-length other bid array",
    },
  ];

  it.each(testCases)("$name", ({ bid, currentBid, result }) => {
    expect(canBeatBid(bid, currentBid)).toBe(result);
  });
});

describe(canBeatHand, () => {
  type TestCase = {
    newHand: number[];
    previousHand: number[];
    result: boolean;
    name: string;
  };

  const testCases: TestCase[] = [
    {
      newHand: [16, 17],
      previousHand: [15, 15, 15, 15],
      result: true,
      name: "rocket beats all",
    },
    {
      newHand: [15, 15, 15, 15],
      previousHand: [14, 14, 14, 14],
      result: true,
      name: "bigger bomb beats smaller bomb",
    },
    {
      newHand: [15, 15, 15, 15],
      previousHand: [15, 15, 15, 15],
      result: false,
      name: "equal bomb (not possible in play) doesn't win",
    },
    {
      newHand: [3, 3, 3, 3],
      previousHand: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      result: true,
      name: "bomb beats regular hands",
    },
    {
      newHand: [4, 4, 5, 5, 6, 6],
      previousHand: [3, 3, 4, 4, 5, 5],
      result: true,
      name: "regular hand with higher base value wins",
    },
    {
      newHand: [4],
      previousHand: [5],
      result: false,
      name: "regular hand with lower base value loses",
    },
    {
      newHand: [4, 4, 5, 5, 6, 6, 7, 7],
      previousHand: [3, 3, 4, 4, 5, 5],
      result: false,
      name: "non-matching size for arbitrarily sized hands loses",
    },
  ];

  it.each(testCases)("$name", ({ newHand, previousHand, result }) => {
    const newCards = createTestCards(newHand);
    const prevCards = createTestCards(previousHand);
    expect(canBeatHand(newCards, prevCards)).toBe(result);
  });
});
