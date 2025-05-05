import type { Card, ScoreLedger } from "./types";

// General purpose card game and/or misc. utils available for use in @ddz/lib

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function countCards(cards: Card[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const card of cards) {
    result[card.rank] = (result[card.rank] ?? 0) + 1;
  }
  return result;
}

export function groupCards(cards: Card[]): Record<number, number[]> {
  const counts = countCards(cards);
  const result: Record<number, number[]> = {};

  // result[i] will be sorted by virtue of the keys of the object returned by countCards()
  // being ordered by JS
  for (const [rank, count] of Object.entries(counts)) {
    if (!(count in result)) {
      result[count] = [];
    }
    result[count].push(Number(rank));
  }

  return result;
}

export function isSequential(arr: number[]): boolean {
  return arr.every((v, i) => i === 0 || v === arr[i - 1] + 1);
}

export function createDeck(): Card[] {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const deck: Card[] = [];

  for (let rank = 3; rank <= 15; rank++) {
    for (const suit of suits) {
      deck.push({ rank, suit });
    }
  }

  deck.push({ rank: 16, suit: "joker" }, { rank: 17, suit: "joker" });

  // shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Removes cards specified in a toRemove array from a hand array in-place
 * based on compare-by-value.
 */
export function removeCards(hand: Card[], toRemove: Card[]): boolean {
  for (const card of toRemove) {
    const idx = hand.findIndex((otherCard) => shallowEqual(card, otherCard));
    if (idx === -1) {
      return false;
    }

    hand.splice(idx, 1);
  }

  return true;
}

export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.hasOwnProperty.call(objB, keysA[i]) ||
      !Object.is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
    }
  }

  return true;
}

export function addTransactionToScoreLedger(
  ledger: ScoreLedger,
  from: number,
  to: number,
  amount: number
): void {
  ledger.payments[from][to] += amount;
  ledger.payments[to][from] -= amount;
  ledger.payments[from][from] -= amount;
  ledger.payments[to][to] += amount;
}
