"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { sendMail, passwordResetEmail, isMailConfigured } from "@/lib/mailer";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
  createPasswordReset,
  consumePasswordReset,
  destroyUserSessions,
} from "@/lib/auth";
import {
  createUser,
  findUserByEmail,
  findUserById,
  normalizeEmail,
  updateUserPassword,
} from "@/lib/users";
import { UserRole, UserStatus } from "@/lib/user-types";

export interface AuthState {
  error?: string;
  notice?: string;
  /** Dev-only: the reset link, surfaced because no email service is wired up. */
  devResetLink?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

function adminEmail(): string {
  return normalizeEmail(process.env.ADMIN_EMAIL ?? "");
}

// ---------------------------------------------------------------------------
// Sign up — admin email is auto-approved; everyone else awaits approval
// ---------------------------------------------------------------------------
export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const invalid = validateCredentials(email, password);
  if (invalid) return { error: invalid };
  if (password !== confirm) return { error: "Passwords do not match." };

  if (await findUserByEmail(email)) {
    return { error: "An account with that email already exists." };
  }

  const isAdmin = adminEmail() !== "" && email === adminEmail();
  const role: UserRole = isAdmin ? UserRole.Admin : UserRole.User;
  const status: UserStatus = isAdmin ? UserStatus.Active : UserStatus.Pending;

  try {
    const user = await createUser({
      email,
      passwordHash: hashPassword(password),
      role,
      status,
    });

    if (isAdmin) {
      await createSession(user._id.toString());
    }
  } catch (err) {
    console.error("Signup failed:", err);
    return { error: "Could not create the account. Please try again." };
  }

  if (isAdmin) redirect("/admin");
  redirect("/login?pending=1");
}

// ---------------------------------------------------------------------------
// Log in
// ---------------------------------------------------------------------------
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const user = await findUserByEmail(email);
  // Generic message so we don't reveal which emails exist.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }
  if (user.status === UserStatus.Pending) {
    return { error: "Your account is awaiting admin approval." };
  }
  if (user.status === UserStatus.Inactive) {
    return { error: "Your account has been deactivated. Contact the admin." };
  }

  await createSession(user._id.toString());
  redirect(user.role === UserRole.Admin ? "/admin" : "/");
}

// ---------------------------------------------------------------------------
// Log out
// ---------------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Forgot password — always responds generically; surfaces link in dev
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  const notice =
    "If an account exists for that email, a password reset link has been sent.";

  const user = await findUserByEmail(email);
  if (!user) return { notice };

  const token = await createPasswordReset(user._id.toString());

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const link = `${proto}://${host}/reset-password?token=${token}`;

  // Send the reset email after the response is flushed so the request stays fast.
  after(async () => {
    const mail = passwordResetEmail(link);
    await sendMail({ to: email, ...mail });
  });

  // Only surface the link on-page as a fallback when no email can be sent.
  if (process.env.NODE_ENV !== "production" && !isMailConfigured()) {
    return { notice, devResetLink: link };
  }
  return { notice };
}

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------
export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "This reset link is invalid." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const userId = await consumePasswordReset(token);
  if (!userId) {
    return { error: "This reset link is invalid or has expired." };
  }

  const user = await findUserById(userId);
  if (!user) return { error: "This reset link is invalid." };

  await updateUserPassword(userId, hashPassword(password));
  // Force re-login everywhere after a password change.
  await destroyUserSessions(userId);

  redirect("/login?reset=1");
}
