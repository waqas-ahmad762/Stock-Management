"use server";

import { revalidatePath } from "next/cache";
import { parseStockInput, updateStock } from "@/lib/stocks";
import { getCurrentUser } from "@/lib/auth";

export interface EditStockState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
}

/** Server Action to edit a transaction (designed for `useActionState`). */
export async function updateStockAction(
  _prev: EditStockState,
  formData: FormData,
): Promise<EditStockState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing transaction id." };

  const parsed = parseStockInput({
    name: formData.get("name"),
    type: formData.get("type"),
    date: formData.get("date"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    commission: formData.get("commission"),
  });
  if ("errors" in parsed) return { ok: false, errors: parsed.errors };

  try {
    const ok = await updateStock(user.id, id, parsed.data);
    if (!ok) return { ok: false, message: "Transaction not found." };
    revalidatePath("/"); // dashboard
    revalidatePath("/transactions");
    return { ok: true, message: "Transaction updated." };
  } catch (err) {
    console.error("Failed to update stock:", err);
    return { ok: false, message: "Could not update the transaction." };
  }
}
