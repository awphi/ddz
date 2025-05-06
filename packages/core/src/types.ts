export interface ScoreLedger {
  /**
   * Adjacency matrix of payments to be made between entities:
   * - `ledger.payments[a][b]` -> amount of money `a` owes `b`
   * - `ledger.payments[b][a]` -> amount of money `b` owes `a` (just the inverse of the above but stored for clarity)
   *
   * Also has the special property such that:
   * - `ledger.payments[a][a]` -> total amount owed TO `a` - total amount owed BY `a`
   */
  payments: number[][];
  playerNames: string[];
}
