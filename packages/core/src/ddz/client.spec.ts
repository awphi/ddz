import { describe, expect, it } from "vitest";
import * as client from "./client";

// isValidBidMessage and isValidMoveMessage are implicitly tested by the server unit tests

describe(client.getWinner, () => {
  it("basically works", () => {
    expect(client.getWinner([{ hand: [] }])).toBe(0);
  });

  it("favours first winner when there's multiple (impossible in play)", () => {
    expect(client.getWinner([{ hand: [] }, { hand: [] }])).toBe(0);
  });

  it("returns null if there's no winner", () => {
    expect(
      client.getWinner([
        { hand: [{ rank: 1, suit: "hearts" }] },
        { hand: [{ rank: 1, suit: "hearts" }] },
      ])
    ).toBe(null);
  });

  it("returns null when there's no players", () => {
    expect(client.getWinner([])).toBe(null);
  });
});
