"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { setCashBalance, setLivePrice } from "@/lib/portfolio";

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
