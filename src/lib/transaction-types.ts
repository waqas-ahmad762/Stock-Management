// Client-safe constants shared between server code (the MongoDB repository)
// and Client Components (the add form). Keep this file free of any server-only
// imports such as `mongodb` so it can be bundled for the browser.

/** The kind of transaction. Both a value (named constants) and a type. */
export const TransactionType = {
  Buy: "Buy",
  Sell: "Sell",
  Dividends: "Dividends",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

/** Ordered list of all transaction types (for iteration, e.g. dropdowns). */
export const TRANSACTION_TYPES = [
  TransactionType.Buy,
  TransactionType.Sell,
  TransactionType.Dividends,
] as const;
