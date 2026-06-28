"use server";

import { revalidatePath } from "next/cache";
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  findUserById,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/users";

export interface ProfileState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
}

const PHONE_RE = /^[+\d][\d\s\-()]{6,19}$/;

/** Update the user's name and phone. Email is never changed here. */
export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const errors: Record<string, string> = {};
  if (name.length > 80) errors.name = "Name is too long.";
  if (phone && !PHONE_RE.test(phone))
    errors.phone = "Enter a valid phone number.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  try {
    await updateUserProfile(user.id, { name, phone });
    revalidatePath("/profile");
    return { ok: true, message: "Profile updated." };
  } catch (err) {
    console.error("Profile update failed:", err);
    return { ok: false, message: "Could not update your profile." };
  }
}

/** Change the user's password after verifying the current one. */
export async function changePasswordAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errors: Record<string, string> = {};
  if (!current) errors.current = "Enter your current password.";
  if (password.length < 8)
    errors.password = "New password must be at least 8 characters.";
  if (password !== confirm) errors.confirm = "Passwords do not match.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const doc = await findUserById(user.id);
  if (!doc || !verifyPassword(current, doc.passwordHash)) {
    return { ok: false, errors: { current: "Current password is incorrect." } };
  }

  try {
    await updateUserPassword(user.id, hashPassword(password));
    // Keep the current session valid so the user stays signed in.
    return { ok: true, message: "Password changed." };
  } catch (err) {
    console.error("Password change failed:", err);
    return { ok: false, message: "Could not change your password." };
  }
}
