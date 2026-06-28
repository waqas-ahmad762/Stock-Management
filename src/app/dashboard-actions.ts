"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  setCashBalance,
  setLivePrice,
  setLivePrices,
  getNextRefreshAllowedAt,
  recordPriceRefresh,
  PRICE_REFRESH_COOLDOWN_MS,
} from "@/lib/portfolio";
import { listStockNames } from "@/lib/stocks";
import { fetchPsxPrices } from "@/lib/psx";

/** Outcome of a "refresh live prices" run, surfaced to the user. */
export interface RefreshPricesResult {
  ok: boolean;
  updated: number; // holdings whose price was fetched and saved
  missing: string[]; // holdings not found on PSX (kept their old price)
  nextAllowedAt: string | null; // ISO time the button re-enables (null = now)
  error?: string;
}

/**
 * Fetches live PSX prices for the signed-in user's holdings and saves them to
 * the `livePrices` collection. Throttled to once per 24h per user (enforced
 * here, not just in the UI). One PSX request covers every symbol; names that
 * aren't on PSX (e.g. a custom/typo ticker) are reported back as `missing` and
 * keep whatever price they had. A failed fetch does NOT consume the daily
 * allowance, so the user can retry.
 */
export async function refreshLivePricesAction(): Promise<RefreshPricesResult> {
  const user = await getCurrentUser();
  if (!user)
    return { ok: false, updated: 0, missing: [], nextAllowedAt: null, error: "Not signed in." };

  // Enforce the once-a-day cooldown server-side.
  const blockedUntil = await getNextRefreshAllowedAt(user.id);
  if (blockedUntil) {
    return {
      ok: false,
      updated: 0,
      missing: [],
      nextAllowedAt: blockedUntil.toISOString(),
      error: "Live prices can only be refreshed once a day.",
    };
  }

  const names = await listStockNames(user.id);
  if (names.length === 0)
    return { ok: true, updated: 0, missing: [], nextAllowedAt: null };

  let market: Map<string, number>;
  try {
    market = await fetchPsxPrices();
  } catch {
    return {
      ok: false,
      updated: 0,
      missing: [],
      nextAllowedAt: null, // fetch failed → cooldown not started, retry allowed
      error: "Couldn't reach PSX right now. Please try again.",
    };
  }

  const matched = new Map<string, number>();
  const missing: string[] = [];
  for (const name of names) {
    const price = market.get(name.toUpperCase());
    if (price !== undefined) matched.set(name, price);
    else missing.push(name);
  }

  const updated = await setLivePrices(user.id, matched);
  await recordPriceRefresh(user.id); // start the 24h cooldown
  revalidatePath("/");
  return {
    ok: true,
    updated,
    missing,
    nextAllowedAt: new Date(Date.now() + PRICE_REFRESH_COOLDOWN_MS).toISOString(),
  };
}

/** Updates the live (current market) price for one of the user's stocks. */
export async function updateLivePriceAction(
  name: string,
  price: number,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  if (!name || Number.isNaN(price) || price < 0) return;
  await setLivePrice(user.id, name, price);
  revalidatePath("/");
}

/** Updates the user's available (uninvested) cash. */
export async function updateCashBalanceAction(amount: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  if (Number.isNaN(amount) || amount < 0) return;
  await setCashBalance(user.id, amount);
  revalidatePath("/");
}
