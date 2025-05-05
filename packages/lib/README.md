# @ddz/core

**@ddz/core** is a lightweight, TypeScript-based library for building online card games. It currently focuses on support for **Dou Di Zhu (斗地主)** - a fast-paced and widely played Chinese trick-taking game. Howevever, the library is built to be extensible and work to add more games is ongoing!

## ✨ Features

- **Zero dependencies**
  Keeps your bundle lean and free from external overhead.

- **Platform-agnostic**
  Can run seamlessly in any JavaScript environment—whether in the browser, a Node.js server, or an edge runtime.

- **Serializable interface**
  Designed for multiplayer networked environments: state and commands are passed as plain JSON objects.

- **Cross-game score tracking**
  Built-in support for tracking cumulative player scores across multiple matches within a single play session.

- **Tree-shakable**
  Only include the code for the games you need by importing them directly.

## 📦 Installation

```bash
npm install @ddz/core
```

## 🧩 Core Structure

Each game in the library exposes two primary modules - a `Server` and `client`. The server relies on the client for validation and other utilities but the client is exposed to you to perform client-side validation before sending messages to the server.

> **Tree-shaking tip**
>
> To reduce bundle size, you can import games separately directly instead of importing all of `@ddz/core`. For example:
>
> ```ts
> import { Server, client } from "@ddz/core/ddz";
> ```
>
> This ensures only the DDZ-specific code is included in your build, making it easier to scale if/when additional games are added to `@ddz/core`.

## Dou Di Zhu (斗地主)

If you're not familiar with Dou Di Zhu (斗地主) then check out [this excellent write-up of how to play by John McLeod over at pagat.com](https://www.pagat.com/climbing/doudizhu.html)!

### `Server`

A host-agnostic game engine for Dou Di Zhu (斗地主).

- Manages the full lifecycle of a game: shuffling, dealing, bidding, playing, scoring.
- Operates on a simple `GameState` object, which is designed to be safely serialized and synced between environments.
- Stateless logic makes it easy to plug into any communication layer: WebSockets, WebRTC, REST APIs, etc.

> ⚠️ `DdzServer` does **not** handle networking — that responsbility are delegated to your app.

### `client`

A collection of pure utility functions designed for client-side use.

- Run the same validations as the server to ensure fair play and consistent UX.
- Functions include:

  - `isValidMoveMessage(message, lastReceivedGameState)`
  - `isValidBidMessage(message, lastReceivedGameState)`
  - `getWinner(gameState.players)`, and others.

Use these helpers to avoid unnecessary round-trips to the server and to prevent invalid actions before they're submitted.

## 🧪 Example Usage

Here's a quick example of creating a game of Dou Di Zhu (斗地主):

```ts
// server.ts
import { Server, client } from "@ddz/core/ddz";

const server = new DdzServer();

server.on("gameStateChanged", () => {
  console.log("Game state changed:", server.gameState);
  // Broadcast updated state to all connected players
});

server.on("gameStart", () => {
  console.log("Game started:", server.gameState);
  // Broadcast fresh game state to all connected players
});

server.on("gameOver", () => {
  console.log("Game ended:", server.scoreLedger);
  // Broadcast updated score ledger
});

server.start();
```

```ts
// client.ts
import { client } from "@ddz/core/ddz";

const canPlay = client.isValidMoveMessage({ type: 'playMove', move: [...] }, lastReceivedGameState);
if (!canPlay) {
  alert("Invalid move!");
}
```

## 🧵 Contributing

PRs are welcome! Open an issue to discuss major changes before submitting. I'm especially interested in:

- Additional card game modules like Guan Dan (掼蛋)
- Documentation - either cleaner auto-generated docs or better handwritten examples
- Any general clean up or sensible refactoring!
