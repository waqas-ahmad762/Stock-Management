import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./mongodb";
import { findUserById, toSafeUser, type SafeUser } from "./users";
import { UserRole, UserStatus } from "./user-types";

const SESSION_COOKIE = "sm_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

// ---------------------------------------------------------------------------
// Passwords (scrypt — no native dependency)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const derived = scryptSync(password, salt, 64);
  return hashBuf.length === derived.length && timingSafeEqual(hashBuf, derived);
}

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

// ---------------------------------------------------------------------------
// Sessions (stored in MongoDB; cookie holds an opaque token)
// ---------------------------------------------------------------------------

interface SessionDoc {
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

/** Creates a session for the user and sets the httpOnly session cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = `${randomUUID()}.${randomBytes(32).toString("hex")}`;
  const db = await getDb();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.collection<SessionDoc>("sessions").insertOne({
    tokenHash: sha256(token),
    userId: new ObjectId(userId),
    createdAt: new Date(),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Clears the current session (DB + cookie). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.collection<SessionDoc>("sessions").deleteOne({
      tokenHash: sha256(token),
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Returns the currently authenticated, active user, or null.
 * Expired sessions and non-active accounts are treated as logged out.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const session = await db
    .collection<SessionDoc>("sessions")
    .findOne({ tokenHash: sha256(token) });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  const user = await findUserById(session.userId.toString());
  if (!user || user.status !== UserStatus.Active) return null;
  return toSafeUser(user);
}

/** Redirects to /login unless an active user is signed in. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects non-admins; returns the admin user otherwise. */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== UserRole.Admin) redirect("/");
  return user;
}

// ---------------------------------------------------------------------------
// Password reset tokens (stored hashed, single use, time-limited)
// ---------------------------------------------------------------------------

interface PasswordResetDoc {
  userId: ObjectId;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
}

/** Creates a reset token for a user and returns the raw token (to email). */
export async function createPasswordReset(userId: string): Promise<string> {
  const token = `${randomUUID()}.${randomBytes(32).toString("hex")}`;
  const db = await getDb();
  await db.collection<PasswordResetDoc>("passwordResets").insertOne({
    userId: new ObjectId(userId),
    tokenHash: sha256(token),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });
  return token;
}

/**
 * Consumes a reset token. Returns the userId if valid and unused, else null.
 * Marks the token used so it cannot be replayed.
 */
export async function consumePasswordReset(token: string): Promise<string | null> {
  const db = await getDb();
  const col = db.collection<PasswordResetDoc>("passwordResets");
  const doc = await col.findOne({ tokenHash: sha256(token) });
  if (!doc || doc.usedAt || doc.expiresAt.getTime() < Date.now()) return null;
  await col.updateOne(
    { tokenHash: doc.tokenHash },
    { $set: { usedAt: new Date() } },
  );
  return doc.userId.toString();
}

/** Invalidates every session for a user (e.g. after a password reset). */
export async function destroyUserSessions(userId: string): Promise<void> {
  if (!ObjectId.isValid(userId)) return;
  const db = await getDb();
  await db
    .collection<SessionDoc>("sessions")
    .deleteMany({ userId: new ObjectId(userId) });
}
