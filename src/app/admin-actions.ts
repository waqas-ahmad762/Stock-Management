"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deleteUserCascade, setUserStatus } from "@/lib/users";
import { UserStatus } from "@/lib/user-types";

/** Approve a pending account (or reactivate an inactive one). */
export async function approveUserAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await setUserStatus(id, UserStatus.Active);
    revalidatePath("/admin");
  }
}

/** Mark a user inactive. Admins cannot deactivate themselves. */
export async function deactivateUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id && id !== admin.id) {
    await setUserStatus(id, UserStatus.Inactive);
    revalidatePath("/admin");
  }
}

/** Delete a user and all of their data. Admins cannot delete themselves. */
export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id && id !== admin.id) {
    await deleteUserCascade(id);
    revalidatePath("/admin");
  }
}
