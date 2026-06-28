/**
 * Live PSX (Pakistan Stock Exchange) prices from the public PSX Data Portal.
 *
 * The portal at https://dps.psx.com.pk powers psx.com.pk's market watch. Its
 * `/market-watch` route returns the **entire** market as one HTML table, so a
 * single request gives us a price for every holding — no per-symbol calls and
 * no API key. It is unofficial/undocumented (the markup could change without
 * notice) and not for commercial redistribution, which is fine for a personal
 * portfolio tracker.
 */

const MARKET_WATCH_URL = "https://dps.psx.com.pk/market-watch";

// Fixed column layout of each market-watch row (0-based). The portal renders:
// symbol | sector | listedIn | LDCP | open | high | low | CURRENT | change |
// change% | volume. We want CURRENT (the last traded price).
const SYMBOL_COLUMN = 0;
const CURRENT_PRICE_COLUMN = 7;

/** Removes HTML tags and decodes the few entities the table uses. */
function stripTags(cell: string): string {
  return cell
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Parses a market-watch HTML table into a map of `SYMBOL → last traded price`.
 * Defensive: rows it can't read (the header row, malformed cells) are skipped
 * rather than throwing, so one odd row never loses the whole batch.
 */
export function parseMarketWatch(html: string): Map<string, number> {
  const prices = new Map<string, number>();

  // Data rows carry a `data-search="SYMBOL"` on their first cell; the header
  // row (which uses <th>) has none, so it falls out naturally.
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      stripTags(c[1]),
    );
    if (cells.length <= CURRENT_PRICE_COLUMN) continue;

    const symbol = cells[SYMBOL_COLUMN].toUpperCase();
    if (!symbol) continue;

    const price = Number(cells[CURRENT_PRICE_COLUMN].replace(/,/g, ""));
    if (Number.isFinite(price) && price > 0) prices.set(symbol, price);
  }

  return prices;
}

/**
 * Fetches the full PSX market in one request and returns a map of
 * `SYMBOL → last traded price`. Throws if the portal is unreachable or returns
 * nothing parseable (so a markup change surfaces as an error instead of
 * silently wiping prices).
 */
export async function fetchPsxPrices(): Promise<Map<string, number>> {
  const res = await fetch(MARKET_WATCH_URL, {
    // A browser-like UA; the portal returns an error page to the default
    // Node fetch agent. Not cached — we always want the latest snapshot.
    headers: { "User-Agent": "Mozilla/5.0 (compatible; stocks-manager)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PSX market-watch responded ${res.status}`);
  }

  const prices = parseMarketWatch(await res.text());
  if (prices.size === 0) {
    throw new Error("PSX market-watch returned no rows (markup may have changed)");
  }
  return prices;
}
