# @ddz/lib

TS-based library for the game Dou Di Zhu (斗地主) - a popular Chinese card game.

## Structure

`@ddz/lib` has two key exports:

- `DdzServer` - a host-agnostic class that orchestrates games of DDZ via manipulating a `GameState` object and informing its consumer. This is intended to be wrapped in your prefered network interface (e.g. RTC, WebSockets, basic HTTP API)
- `client` - a collection of functions that allow your clients to perform identical logic as the server, usually for validation purposes (e.g. checking a proposed hand beats the hand in play, checking if an auction bid is valid or asserting win/loss state)

TODO - a simple example of a server and client
