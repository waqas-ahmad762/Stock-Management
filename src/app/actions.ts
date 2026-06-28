"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createStock, deleteStock, parseStockInput } from "@/lib/stocks";
import { getCurrentUser } from "@/lib/auth";
import { sendMail, stockAddedEmail } from "@/lib/mailer";

export interface AddStockState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
}

/**
 * Server Action for the add-stock form. Designed for `useActionState`:
 * receives the previous state and the submitted FormData.
 */
export async function addStockAction(
  _prev: AddStockState,
  formData: FormData,
): Promise<AddStockState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const parsed = parseStockInput({
    name: formData.get("name"),
    type: formData.get("type"),
    date: formData.get("date"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    commission: formData.get("commission"),
  });

  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors };
  }

  try {
    const stock = await createStock(user.id, parsed.data);
    revalidatePath("/"); // dashboard
    revalidatePath("/transactions");

    // Notify the owner by email after the response is sent (best-effort).
    const { email } = user;
    after(async () => {
      const mail = stockAddedEmail({
        type: stock.type,
        quantity: stock.quantity,
        name: stock.name,
        unitPrice: stock.unitPrice,
        totalPrice: stock.totalPrice,
      });
      await sendMail({ to: email, ...mail });
    });

    return {
      ok: true,
      message: `Recorded ${stock.type} of ${stock.quantity} ${stock.name}.`,
    };
  } catch (err) {
    console.error("Failed to add stock:", err);
    return { ok: false, message: "Could not save the stock. Is the database running?" };
  }
}

/** Server Action to remove one of the current user's stocks. */
export async function deleteStockAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteStock(user.id, id);
    revalidatePath("/"); // dashboard
    revalidatePath("/transactions");
  }
}
