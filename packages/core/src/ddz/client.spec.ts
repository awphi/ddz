import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";
import * as client from "./client";
import { GameState } from "./types";

// isValidBidMessage and isValidMoveMessage are implicitly tested by the server unit tests

describe(client.getWinner, () => {
  it("basically works", () => {
    const state = mock<GameState>({
      players: [
        {
          hand: [],
        },
      ],
    });
    expect(client.getWinner(state)).toBe(0);
  });

  it("favours first winner when there's multiple (impossible in play)", () => {
    const state = mock<GameState>({
      players: [
        {
          hand: [],
        },
        {
          hand: [],
        },
      ],
    });
    expect(client.getWinner(state)).toBe(0);
  });

  it("returns null if there's no winner", () => {
    const state = mock<GameState>({
      players: [
        { hand: [{ rank: 1, suit: "hearts" }] },
        { hand: [{ rank: 1, suit: "hearts" }] },
      ],
    });
    expect(client.getWinner(state)).toBe(null);
  });

  it("returns null when there's no players", () => {
    const state = mock<GameState>({
      players: [],
    });
    expect(client.getWinner(state)).toBe(null);
  });
});
