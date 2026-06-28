// Shared formatting helpers. Plain module (no server imports) so it is safe to
// use from both Server and Client Components.

/** Formats an amount in Pakistani Rupees, e.g. `Rs 1,234.56` / `Rs -200.36`. */
export function money(n: number): string {
  return `Rs ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Formats a plain number (e.g. share quantity) without a currency symbol. */
export function num(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}
