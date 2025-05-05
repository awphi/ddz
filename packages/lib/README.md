# @ddz/core

TS-based library for card games. Currently supports:

- Dou Di Zhu (斗地主) - a popular, easy-to-learn Chinese card game.

Key features:

- No dependencies - light bundle weight and minimal maitenance overhead
- Platform-indepedent - will happily run in the browser or on serverside JS runtimes
- Simple serializable interface - only requires the transfer of simple JSON objects between the client and server
- Cross-game score tracking - play multiple games and keep a running tally of who owes what to who

## Structure

`@ddz/core` has two key exports:

- `DdzServer` - a host-agnostic class that orchestrates games of DDZ via manipulating a `GameState` object and informing its consumer. This is intended to be wrapped in your prefered network interface (e.g. RTC, WebSockets, basic HTTP API)
- `client` - a collection of functions that allow your clients to perform identical logic as the server, usually for validation purposes (e.g. checking a proposed hand beats the hand in play, checking if an auction bid is valid or asserting win/loss state)

TODO - a simple example of a server and client
