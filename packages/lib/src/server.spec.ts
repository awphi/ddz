import { describe, expect, it, vi } from "vitest";
import { DdzServer } from "./server";

describe("DdzServer", () => {
  describe("basic functionality", () => {
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

    it(".on() & .off() work", () => {
      const server = new DdzServer(["a", "b", "c"]);
      const onSpy = vi.fn();

      server.on("gameStateChanged", onSpy);
      server.play(null);

      expect(onSpy).toHaveBeenCalledTimes(1);

      server.off("gameStateChanged", onSpy);
      server.play(null);

      expect(onSpy).toHaveBeenCalledTimes(1);
    });

    it(".once() works", () => {
      const server = new DdzServer(["a", "b", "c"]);
      const onceSpy = vi.fn();

      server.once("gameStateChanged", onceSpy);
      server.play(null);

      expect(onceSpy).toHaveBeenCalledTimes(1);

      server.play(null);

      expect(onceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("auction phase", () => {});
});
