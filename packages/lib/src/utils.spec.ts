import { getHandType } from "./utils";
import type { Card, HandType } from "./types";
import { describe, expect, it } from "vitest";

describe("getHandType", () => {
  const createCards = (ranks: number[], suits: string[] = ["hearts"]): Card[] =>
    ranks.map((rank, i) => ({ rank, suit: suits[i % suits.length] }));

  it("should identify a single card", () => {
    const cards = createCards([3]);
    expect(getHandType(cards)).toBe<HandType>("single");
  });

  it("should identify a pair", () => {
    const cards = createCards([4, 4]);
    expect(getHandType(cards)).toBe<HandType>("pair");
  });

  it("should identify a triplet", () => {
    const cards = createCards([5, 5, 5]);
    expect(getHandType(cards)).toBe<HandType>("triplet");
  });

  it("should identify a triplet with a single", () => {
    const cards = createCards([6, 6, 6, 7]);
    expect(getHandType(cards)).toBe<HandType>("tripletWithSingle");
  });

  it("should identify a triplet with a pair", () => {
    const cards = createCards([8, 8, 8, 9, 9]);
    expect(getHandType(cards)).toBe<HandType>("tripletWithPair");
  });

  it("should identify a straight", () => {
    const cards = createCards([3, 4, 5, 6, 7]);
    expect(getHandType(cards)).toBe<HandType>("straight");
  });

  it("straight cannot include twos or jokers", () => {
    const cards = createCards([10, 11, 12, 13, 14, 15, 16]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("straight must have minimum length 5", () => {
    const cards = createCards([3, 4, 5, 6]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("should identify a straight of pairs", () => {
    const cards = createCards([3, 3, 4, 4, 5, 5]);
    expect(getHandType(cards)).toBe<HandType>("straightOfPairs");
  });

  it("straight of pairs cannot include twos or jokers", () => {
    const cards = createCards([14, 14, 15, 15, 16, 16]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("straight of pairs must have minimum length 6 (3 unique pairs)", () => {
    const cards = createCards([3, 3, 4, 4]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("should identify a straight of triplets", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4]);
    expect(getHandType(cards)).toBe<HandType>("straightOfTriplets");
  });

  it("should identify a straight of triplets with singles", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 5, 6]);
    expect(getHandType(cards)).toBe<HandType>("straightOfTripletsWithSingles");
  });

  it("should not allow non-unique singles attached to triplet straight", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 6, 6]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("should identify a straight of triplets with pairs", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 5, 5, 6, 6]);
    expect(getHandType(cards)).toBe<HandType>("straightOfTripletsWithPairs");
  });

  it("should not count non-sequential triplet straight", () => {
    const cards = createCards([3, 3, 3, 7, 7, 7, 5, 6]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("should not allow mixed singles/pairs with triplet straight", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 5, 6, 6]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("should not allow extra pairs in triplet straight", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 7]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("should not allow non-unique pairs attached to triplet straight", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 6, 6, 6, 6]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });

  it("should identify a bomb", () => {
    const cards = createCards([10, 10, 10, 10]);
    expect(getHandType(cards)).toBe<HandType>("bomb");
  });

  it("should identify a rocket", () => {
    const cards = createCards([16, 16]);
    expect(getHandType(cards)).toBe<HandType>("rocket");
  });

  it("should identify a quadplex set with singles", () => {
    const cards = createCards([11, 11, 11, 11, 12, 13]);
    expect(getHandType(cards)).toBe<HandType>("quadplexSet");
  });

  it("quadplex set with singles must contain exactly two singles", () => {
    const cards1 = createCards([11, 11, 11, 11, 12]); // 1 single
    const cards2 = createCards([11, 11, 11, 11, 12, 13, 14]); // 3 singles
    expect(() => getHandType(cards1)).toThrow("Invalid hand type");
    expect(() => getHandType(cards2)).toThrow("Invalid hand type");
  });

  it("should identify a quadplex set with pairs", () => {
    const cards = createCards([11, 11, 11, 11, 12, 12, 13, 13]);
    expect(getHandType(cards)).toBe<HandType>("quadplexSet");
  });

  it("quadplex set with pairs must contain exactly two pairs", () => {
    const cards1 = createCards([11, 11, 11, 11, 12, 12]); // 1 pair
    const cards2 = createCards([11, 11, 11, 11, 12, 12, 13, 13, 14, 14]); // 3 pairs
    expect(() => getHandType(cards1)).toThrow("Invalid hand type");
    expect(() => getHandType(cards2)).toThrow("Invalid hand type");
  });

  it("should throw an error for an invalid hand", () => {
    const cards = createCards([3, 4, 5]);
    expect(() => getHandType(cards)).toThrow("Invalid hand type");
  });
});
