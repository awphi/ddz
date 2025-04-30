import { createGame, identifyHand } from "./utils";
import type { Card, GameState, Hand, Player } from "./types";
import { describe, expect, it } from "vitest";

function makeTestPlayer(name: string, props?: Partial<Player>): Player {
  return expect.objectContaining<Player>({
    name,
    auction: {
      lastBid: 0,
      maxBid: 0,
    },
    hand: expect.any(Array),
    moves: [],
    type: "farmer",
    ...props,
  });
}

// TODO update to deal with new return types (object with value)
describe("identifyHand", () => {
  const createCards = (ranks: number[], suits: string[] = ["hearts"]): Card[] =>
    ranks.map((rank, i) => ({ rank, suit: suits[i % suits.length] }));

  it("should identify a single card", () => {
    const cards = createCards([3]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "single",
      value: 3,
    });
  });

  it("should identify a pair", () => {
    const cards = createCards([4, 4]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({ type: "pair", value: 4 });
  });

  it("should identify a triplet", () => {
    const cards = createCards([5, 5, 5]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "triplet",
      value: 5,
    });
  });

  it("should identify a triplet with a single", () => {
    const cards = createCards([6, 6, 6, 7]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "tripletWithSingle",
      value: 6,
    });
  });

  it("should identify a triplet with a pair", () => {
    const cards = createCards([8, 8, 8, 9, 9]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "tripletWithPair",
      value: 8,
    });
  });

  it("should identify a straight", () => {
    const cards = createCards([3, 4, 5, 6, 7]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straight",
      value: 3,
    });
  });

  it("straight cannot include twos or jokers", () => {
    const cards = createCards([10, 11, 12, 13, 14, 15, 16]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("straight must have minimum length 5", () => {
    const cards = createCards([3, 4, 5, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should identify a straight of pairs", () => {
    const cards = createCards([3, 3, 4, 4, 5, 5]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straightOfPairs",
      value: 3,
    });
  });

  it("straight of pairs cannot include twos or jokers", () => {
    const cards = createCards([14, 14, 15, 15, 16, 16]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("straight of pairs must have minimum length 6 (3 unique pairs)", () => {
    const cards = createCards([3, 3, 4, 4]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should identify a straight of triplets", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straightOfTriplets",
      value: 3,
    });
  });

  it("should identify a straight of triplets with singles", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 5, 6]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straightOfTripletsWithSingles",
      value: 3,
    });
  });

  it("should not allow non-unique singles attached to triplet straight", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 6, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should identify a straight of triplets with pairs", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 5, 5, 6, 6]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "straightOfTripletsWithPairs",
      value: 3,
    });
  });

  it("should not count non-sequential triplet straight", () => {
    const cards = createCards([3, 3, 3, 7, 7, 7, 5, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should not allow mixed singles/pairs with triplet straight", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 5, 6, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should not allow extra pairs in triplet straight", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 7]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should not allow non-unique pairs attached to triplet straight", () => {
    const cards = createCards([3, 3, 3, 4, 4, 4, 6, 6, 6, 6]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });

  it("should identify a bomb", () => {
    const cards = createCards([10, 10, 10, 10]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "bomb",
      value: 10,
    });
  });

  it("should identify a rocket", () => {
    const cards = createCards([16, 17]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "rocket",
      value: 17,
    });
  });

  it("should identify a quadplex set with singles", () => {
    const cards = createCards([11, 11, 11, 11, 12, 13]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "quadplexSet",
      value: 11,
    });
  });

  it("quadplex set with singles must contain exactly two singles", () => {
    const cards1 = createCards([11, 11, 11, 11, 12]); // 1 single
    const cards2 = createCards([11, 11, 11, 11, 12, 13, 14]); // 3 singles
    expect(identifyHand(cards1)).toStrictEqual(null);
    expect(identifyHand(cards2)).toStrictEqual(null);
  });

  it("should identify a quadplex set with pairs", () => {
    const cards = createCards([11, 11, 11, 11, 12, 12, 13, 13]);
    expect(identifyHand(cards)).toStrictEqual<Hand>({
      type: "quadplexSet",
      value: 11,
    });
  });

  it("quadplex set with pairs must contain exactly two pairs", () => {
    const cards1 = createCards([11, 11, 11, 11, 12, 12]); // 1 pair
    const cards2 = createCards([11, 11, 11, 11, 12, 12, 13, 13, 14, 14]); // 3 pairs
    expect(identifyHand(cards1)).toStrictEqual(null);
    expect(identifyHand(cards2)).toStrictEqual(null);
  });

  it("should throw an error for an invalid hand", () => {
    const cards = createCards([3, 4, 5]);
    expect(identifyHand(cards)).toStrictEqual(null);
  });
});

describe("createGame", () => {
  it("creates a game state properly", () => {
    const names = ["a", "b", "c"];
    const gameState = createGame(names);
    const expectedGameState: GameState = {
      currentHand: null,
      currentPlayerIndex: expect.any(Number),
      deck: expect.any(Array),
      id: expect.any(String),
      phase: "auction",
      players: names.map((name) => makeTestPlayer(name)),
      turn: 0,
    };

    expect(gameState).toStrictEqual(expectedGameState);
    expect(gameState.players[0].hand).toHaveLength(17);
    expect(gameState.players[1].hand).toHaveLength(17);
    expect(gameState.players[2].hand).toHaveLength(17);
    expect(gameState.deck).toHaveLength(3);
  });
});
