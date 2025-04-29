import { describe, expect, it } from "vitest";
import { DdzServer } from "./server";

describe("DdzServer", () => {
  it("creates a server with an initial game state", () => {
    const server = new DdzServer(["a", "b", "c"]);
    expect(server).toBeInstanceOf(DdzServer);
    expect(server.gameState).toBeDefined();

    // basic sanity checks
    expect(server.gameState.players.length).toBe(3);
    expect(server.gameState.players[0].name).toBe("a");
    expect(server.gameState.phase).toBe("auction");
    expect(server.gameState.currentPlayerIndex)
      .greaterThanOrEqual(0)
      .lessThanOrEqual(3);
  });

  // TODO - event firing/event listeners (on, off, once)
});
