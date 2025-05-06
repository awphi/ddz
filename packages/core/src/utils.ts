import type { ScoreLedger } from "./types";

// General purpose card game and/or misc. utils available for use in @ddz/core

/**
 * General-purpose true modulo operation.
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Count the number of instances of each value in array.
 * @param values the array of values to count
 * @returns a record mapping value -> count
 */
export function countValues(values: number[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const val of values) {
    result[val] = (result[val] ?? 0) + 1;
  }
  return result;
}

/**
 * Count the number of instances of each value in array and then invert the map it produces.
 * @param values the array of values to count
 * @returns a record mapping count -> array of unique values that had that many instances in the source array
 */
export function groupCountedValues(values: number[]): Record<number, number[]> {
  const counts = countValues(values);
  const result: Record<number, number[]> = {};

  // result[i] will be sorted by virtue of the keys of the object returned by countItems() being ordered by JS
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

export function shuffleArray(arr: any[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Removes items specified in a toRemove array from an array in-place
 * using compare-by-value.
 * @param arr array to attempt to mutate in place
 * @param toRemove items to remove from `arr`
 */
export function popSubarray<T>(arr: T[], toRemove: T[]): boolean {
  for (const v of toRemove) {
    const idx = arr.findIndex((otherCard) => shallowEqual(v, otherCard));
    if (idx === -1) {
      return false;
    }

    arr.splice(idx, 1);
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
