import { describe, expect, it, vi } from "vitest";
import { Server } from "./server";
import { GameState, Move, Player } from "./types";
import { mod } from "../utils";

describe(Server, () => {
  function createTestServer(playerNames: string[] = ["a", "b", "c"]): Server {
    const server = new Server(playerNames);
    server.start();
    return server;
  }

  function createTestPlayer(name: string, props?: Partial<Player>): Player {
    return expect.objectContaining<Player>({
      name,
      auction: {
        lastBid: null,
      },
      hand: expect.any(Array),
      moves: [],
      type: "farmer",
      ...props,
    });
  }

  describe("basic functionality", () => {
    it("creates a server with an initial game state", () => {
      const server = createTestServer();
      expect(server).toBeInstanceOf(Server);
      expect(server.gameState).toBeDefined();

      const names = ["a", "b", "c"];
      const expectedGameState: GameState = {
        currentHand: [],
        currentPlayerIndex: expect.any(Number),
        deck: expect.any(Array),
        id: expect.any(String),
        phase: "auction",
        players: names.map((name) => createTestPlayer(name)),
        bid: 0,
      };

      expect(server.gameState).toStrictEqual(expectedGameState);
      expect(server.gameState.players[0].hand).toHaveLength(17);
      expect(server.gameState.players[1].hand).toHaveLength(17);
      expect(server.gameState.players[2].hand).toHaveLength(17);
      expect(server.gameState.deck).toHaveLength(3);
      expect(server.gameState.players.length).toBe(3);
      expect(server.gameState.players[0].name).toBe("a");
      expect(server.gameState.phase).toBe("auction");
      expect(server.gameState.currentPlayerIndex)
        .greaterThanOrEqual(0)
        .lessThanOrEqual(3);
    });

    it(".on() & .off() work", () => {
      const server = createTestServer();
      const onSpy = vi.fn();

      server.on("gameStateChanged", onSpy);
      server.play(null);

      expect(onSpy).toHaveBeenCalledTimes(1);

      server.off("gameStateChanged", onSpy);
      server.play(null);

      expect(onSpy).toHaveBeenCalledTimes(1);
    });

    it(".once() works", () => {
      const server = createTestServer();
      const onceSpy = vi.fn();

      server.once("gameStateChanged", onceSpy);
      server.play(null);

      expect(onceSpy).toHaveBeenCalledTimes(1);

      server.play(null);

      expect(onceSpy).toHaveBeenCalledTimes(1);
    });

    it("gameStart and gameOver are fired as expected", () => {
      const server = new Server(["a", "b", "c"]);
      const onStart = vi.fn();
      const onEnd = vi.fn();

      server.on("gameStart", onStart);
      server.on("gameOver", onEnd);

      expect(() => server.gameState).toThrow();

      server.start();

      expect(() => server.gameState).not.toThrow();
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(0);

      server.end();

      expect(() => server.gameState).toThrow();
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe("auction phase", () => {
    it("handles bids correctly", () => {
      const server = createTestServer();
      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 });
      expect(server.gameState.players[firstPlayer].auction.lastBid).toBe(1);
    });

    it("invalid bids are interpreted as passes", () => {
      const server = createTestServer();
      server.play({ type: "auctionBid", bid: 2 });
      const secondPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 }); // cannot bid a lower number
      expect(server.gameState.players[secondPlayer].auction.lastBid).toBe(
        "pass"
      );
    });

    it("non-bid messages are interpreted as a pass", () => {
      const server = createTestServer();

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
      const server = createTestServer();
      const firstPlayer = server.gameState.currentPlayerIndex;
      expect(server.gameState.deck).toHaveLength(3);
      server.play({ type: "auctionBid", bid: 3 });
      expect(server.gameState.phase).toBe("play");
      expect(server.gameState.deck).toHaveLength(0);
      expect(server.gameState.deck).toHaveLength(0);
      expect(server.gameState.players[firstPlayer].auction.lastBid).toBe(3);
      expect(server.gameState.players[firstPlayer].type).toBe("landlord");
    });

    it("highest non-passing bidder is assigned landlord", () => {
      const server = createTestServer();
      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: "pass" }); // p1
      server.play({ type: "auctionBid", bid: 1 }); // p2
      server.play({ type: "auctionBid", bid: "pass" }); // p3
      server.play({ type: "auctionBid", bid: 2 }); // p1
      server.play({ type: "auctionBid", bid: "pass" }); // p2
      server.play({ type: "auctionBid", bid: "pass" }); // p3

      expect(server.gameState.bid).toBe(2);
      expect(server.gameState.players[firstPlayer].type).toBe("landlord");
      expect(server.gameState.players[firstPlayer].hand).toHaveLength(20);
    });

    it("ends game if all players pass", () => {
      const server = createTestServer();
      const onEnd = vi.fn();
      const onChange = vi.fn();
      server.on("gameOver", onEnd);
      server.on("gameStateChanged", onChange);

      server.play({ type: "auctionBid", bid: "pass" });
      server.play({ type: "auctionBid", bid: "pass" });
      server.play({ type: "auctionBid", bid: "pass" });
      expect(onEnd).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("bid is updated correctly when a player later outbids themselves", () => {
      const server = createTestServer();
      server.play({ type: "auctionBid", bid: "pass" }); // p1
      const secondPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 }); // p2
      server.play({ type: "auctionBid", bid: 2 }); // p3
      server.play({ type: "auctionBid", bid: "pass" }); // p1
      server.play({ type: "auctionBid", bid: 3 }); // p2
      expect(server.gameState.players[secondPlayer].auction.lastBid).toBe(3);
      expect(server.gameState.bid).toBe(3);
    });

    it("passed players are not skipped", () => {
      const server = createTestServer();
      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: "pass" }); // p1
      server.play({ type: "auctionBid", bid: 1 }); // p2
      server.play({ type: "auctionBid", bid: 2 }); // p3
      expect(server.gameState.currentPlayerIndex).toBe(firstPlayer);
    });
  });

  describe("play phase", () => {
    function createTestPlayServer(
      playerNames: string[] = ["a", "b", "c"]
    ): Server {
      const server = new Server(playerNames);
      server.start();
      server.play({ bid: 1, type: "auctionBid" });
      server.play({ bid: 2, type: "auctionBid" });
      server.play({ bid: 3, type: "auctionBid" });
      return server;
    }

    function playMoves(
      server: Server,
      moves: Move[],
      append: boolean = true
    ): void {
      for (const move of moves) {
        const player = server.gameState.currentPlayerIndex;
        if (move !== "pass" && append) {
          server.gameState.players[player].hand.push(...move);
        }
        server.play({ type: "playMove", move: move });
      }
    }

    function getPrevPlayer(server: Server): Player {
      return server.gameState.players[
        mod(
          server.gameState.currentPlayerIndex - 1,
          server.gameState.players.length
        )
      ];
    }

    it("counts an invalid hand as a pass", () => {
      const server = createTestPlayServer();
      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "playMove", move: [] });
      expect(server.gameState.players[firstPlayer].moves).toHaveLength(1);
      expect(server.gameState.players[firstPlayer].moves[0]).toBe("pass");
    });

    it("counts an invalid message as a pass", () => {
      const server = createTestPlayServer();
      const firstPlayer = server.gameState.currentPlayerIndex;
      server.play({ type: "auctionBid", bid: 1 });
      expect(server.gameState.players[firstPlayer].moves).toHaveLength(1);
      expect(server.gameState.players[firstPlayer].moves[0]).toBe("pass");
    });

    it("counts a player playing a card they don't have as a pass", () => {
      const server = createTestPlayServer();
      const firstPlayer = server.gameState.currentPlayerIndex;

      server.play({ type: "playMove", move: [{ suit: "foo", rank: 19 }] });
      expect(server.gameState.currentPlayerIndex).not.toBe(firstPlayer);
      expect(server.gameState.players[firstPlayer].moves).toHaveLength(1);
      expect(server.gameState.players[firstPlayer].moves[0]).toBe("pass");
    });

    it("allows first player to make any valid move", () => {
      const server = createTestPlayServer();
      const firstPlayer = server.gameState.currentPlayerIndex;
      const move = server.gameState.players[firstPlayer].hand.slice(0, 1); // just play the first card in their hand
      const remainingHand = server.gameState.players[firstPlayer].hand.slice(1);

      server.play({ type: "playMove", move });
      expect(server.gameState.currentPlayerIndex).not.toBe(firstPlayer);
      expect(server.gameState.currentHand).toStrictEqual(move);
      expect(server.gameState.players[firstPlayer].hand).toStrictEqual(
        remainingHand
      ); // ensures played cards are removed from the hand, preserving order
    });

    it("passed players are not skipped", () => {
      const server = createTestPlayServer();
      const firstPlayer = server.gameState.currentPlayerIndex;
      playMoves(server, ["pass", [{ rank: 3, suit: "test-suit" }], "pass"]);
      expect(server.gameState.currentPlayerIndex).toBe(firstPlayer);
    });

    it("non-matching regular hands are counted as a pass", () => {
      const server = createTestPlayServer();
      const firstMove = [{ rank: 3, suit: "test-suit" }];
      playMoves(server, [
        firstMove,
        [
          { rank: 4, suit: "test-suit" },
          { rank: 4, suit: "test-suit" },
        ],
      ]);

      expect(getPrevPlayer(server).moves).toHaveLength(1);
      expect(getPrevPlayer(server).moves[0]).toBe("pass");
      expect(server.gameState.currentHand).toStrictEqual(firstMove);
    });

    it("matching, but lesser, regular hands are counted as a pass", () => {
      const server = createTestPlayServer();

      const firstMove = [
        { rank: 4, suit: "test-suit" },
        { rank: 4, suit: "test-suit" },
      ];
      playMoves(server, [
        firstMove,
        [
          { rank: 3, suit: "test-suit" },
          { rank: 3, suit: "test-suit" },
        ],
      ]);

      expect(getPrevPlayer(server).moves).toHaveLength(1);
      expect(getPrevPlayer(server).moves[0]).toBe("pass");
      expect(server.gameState.currentHand).toStrictEqual(firstMove);
    });

    it("bomb beats any regular hand", () => {
      const server = createTestPlayServer();

      const secondMove = [
        { rank: 3, suit: "test-suit" },
        { rank: 3, suit: "test-suit" },
        { rank: 3, suit: "test-suit" },
        { rank: 3, suit: "test-suit" },
      ];
      playMoves(server, [[{ rank: 17, suit: "test-suit" }], secondMove]);

      expect(getPrevPlayer(server).moves).toHaveLength(1);
      expect(getPrevPlayer(server).moves[0]).toBe(secondMove);
      expect(server.gameState.currentHand).toStrictEqual(secondMove);
    });

    it("bigger bomb beats smaller bomb", () => {
      const server = createTestPlayServer();

      const secondMove = [
        { rank: 4, suit: "test-suit" },
        { rank: 4, suit: "test-suit" },
        { rank: 4, suit: "test-suit" },
        { rank: 4, suit: "test-suit" },
      ];
      playMoves(server, [
        [
          { rank: 3, suit: "test-suit" },
          { rank: 3, suit: "test-suit" },
          { rank: 3, suit: "test-suit" },
          { rank: 3, suit: "test-suit" },
        ],
        secondMove,
      ]);

      expect(getPrevPlayer(server).moves).toHaveLength(1);
      expect(getPrevPlayer(server).moves[0]).toBe(secondMove);
      expect(server.gameState.currentHand).toStrictEqual(secondMove);
    });

    it("rocket beats any regular hand", () => {
      const server = createTestPlayServer();

      const secondMove = [
        { rank: 17, suit: "test-suit" },
        { rank: 16, suit: "test-suit" },
      ];
      playMoves(server, [
        [
          { rank: 15, suit: "test-suit" },
          { rank: 14, suit: "test-suit" },
          { rank: 13, suit: "test-suit" },
          { rank: 12, suit: "test-suit" },
          { rank: 11, suit: "test-suit" },
        ],
        secondMove,
      ]);

      expect(getPrevPlayer(server).moves).toHaveLength(1);
      expect(getPrevPlayer(server).moves[0]).toBe(secondMove);
      expect(server.gameState.currentHand).toStrictEqual(secondMove);
    });

    it("rocket beats any bomb", () => {
      const server = createTestPlayServer();

      const secondMove = [
        { rank: 17, suit: "test-suit" },
        { rank: 16, suit: "test-suit" },
      ];
      playMoves(server, [
        [
          { rank: 15, suit: "test-suit" },
          { rank: 15, suit: "test-suit" },
          { rank: 15, suit: "test-suit" },
          { rank: 15, suit: "test-suit" },
        ],
        secondMove,
      ]);

      expect(getPrevPlayer(server).moves).toHaveLength(1);
      expect(getPrevPlayer(server).moves[0]).toBe(secondMove);
      expect(server.gameState.currentHand).toStrictEqual(secondMove);
    });

    it("current hand in play is reset if 2 players pass in a row", () => {
      const server = createTestPlayServer();

      playMoves(server, [[{ rank: 15, suit: "test-suit" }], "pass", "pass"]);
      expect(server.gameState.currentHand).toStrictEqual([]);
    });

    it("gameOver event is emitted when first player empties hand", () => {
      const server = createTestPlayServer();
      const onEnd = vi.fn();
      server.on("gameOver", onEnd);

      getPrevPlayer(server).hand = [{ rank: 12, suit: "test-suit" }];

      expect(onEnd).toHaveBeenCalledTimes(0);
      playMoves(
        server,
        ["pass", "pass", [{ rank: 12, suit: "test-suit" }]],
        false
      );
      expect(onEnd).toHaveBeenCalledTimes(1);
      expect(() => server.gameState).toThrow(); // game state is disposed
    });
  });

  // TODO score ledger tests once implemented
});
