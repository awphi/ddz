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

  describe("auction phase", () => {
    it("handles bids correctly", () => {
      const server = new DdzServer(["a", "b", "c"]);
      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 });
      expect(server.gameState.players[firstPlayer].auction.lastBid).toBe(1);
    });

    it("invalid bids are interpreted as passes", () => {
      const server = new DdzServer(["a", "b", "c"]);
      server.play({ type: "auctionBid", bid: 2 });
      const secondPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 }); // cannot bid a lower number
      expect(server.gameState.players[secondPlayer].auction.lastBid).toBe(
        "pass"
      );
    });

    it("non-bid messages are interpreted as a pass", () => {
      const server = new DdzServer(["a", "b", "c"]);

      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play(null); // null (e.g. message not received in time)
      expect(server.gameState.players[firstPlayer].auction.lastBid).toBe(
        "pass"
      );

      const secondPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "playMove", move: [] }); // invalid message type
      expect(server.gameState.players[secondPlayer].auction.lastBid).toBe(
        "pass"
      );
    });

    it("bidding a 3 ends the auction phase", () => {
      const server = new DdzServer(["a", "b", "c"]);
      const firstPlayer = server.gameState.currentPlayerIndex;
      expect(server.gameState.deck).toHaveLength(3);
      server.play({ type: "auctionBid", bid: 3 });
      expect(server.gameState.phase).toBe("play");
      expect(server.gameState.deck).toHaveLength(0);
      expect(server.gameState.deck).toHaveLength(0);
      expect(server.gameState.players[firstPlayer].auction.lastBid).toBe(3);
      expect(server.gameState.players[firstPlayer].auction.maxBid).toBe(3);
      expect(server.gameState.players[firstPlayer].type).toBe("landlord");
    });

    it("last non-passed bidder is assigned landlord", () => {
      const server = new DdzServer(["a", "b", "c"]);
      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 });
      server.play({ type: "auctionBid", bid: "pass" });
      server.play({ type: "auctionBid", bid: "pass" });
      expect(server.gameState.phase).toBe("play");
      expect(server.gameState.players[firstPlayer].auction.lastBid).toBe(1);
      expect(server.gameState.players[firstPlayer].auction.maxBid).toBe(1);
      expect(server.gameState.players[firstPlayer].type).toBe("landlord");
      expect(server.gameState.players[firstPlayer].hand).toHaveLength(20);
    });

    it("re-deals if all players pass", () => {
      const server = new DdzServer(["a", "b", "c"]);
      const initialGameState = server.gameState;
      server.play({ type: "auctionBid", bid: "pass" });
      server.play({ type: "auctionBid", bid: "pass" });
      server.play({ type: "auctionBid", bid: "pass" });

      // game state is both referentially and compare-by-value different
      expect(server.gameState).not.toBe(initialGameState);
      expect(server.gameState).not.toEqual(initialGameState);
    });

    it("re-dealing fires a single gameStateChanged event", () => {
      const server = new DdzServer(["a", "b", "c"]);
      server.play({ type: "auctionBid", bid: "pass" });
      server.play({ type: "auctionBid", bid: "pass" });
      const onSpy = vi.fn();
      server.on("gameStateChanged", onSpy);
      server.play({ type: "auctionBid", bid: "pass" });
      expect(onSpy).toHaveBeenCalledTimes(1);
    });

    it("max bid is stored correctly when a player later passes", () => {
      const server = new DdzServer(["a", "b", "c"]);
      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 }); // p1
      server.play({ type: "auctionBid", bid: 2 }); // p2
      server.play({ type: "auctionBid", bid: "pass" }); // p3
      server.play({ type: "auctionBid", bid: "pass" }); // p1
      expect(server.gameState.players[firstPlayer].auction.lastBid).toBe(
        "pass"
      );
      expect(server.gameState.players[firstPlayer].auction.maxBid).toBe(1);
    });

    it("max bid is stored correctly when a player later outbids themselves", () => {
      const server = new DdzServer(["a", "b", "c"]);
      server.play({ type: "auctionBid", bid: "pass" }); // p1
      const secondPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 }); // p2
      server.play({ type: "auctionBid", bid: 2 }); // p3
      expect(server.gameState.currentPlayerIndex).toBe(secondPlayer);
      server.play({ type: "auctionBid", bid: 3 }); // p2
      expect(server.gameState.players[secondPlayer].auction.lastBid).toBe(3);
      expect(server.gameState.players[secondPlayer].auction.maxBid).toBe(3);
    });
  });
});
