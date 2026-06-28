import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { hashPassword } from "./auth";
import {
  createUser,
  findUserByEmail,
  normalizeEmail,
  type UserDoc,
} from "./users";
import { UserRole, UserStatus } from "./user-types";

/**
 * One-off, idempotent migration of legacy documents to the current schema:
 *  - `userId` was stored as a string → convert to ObjectId (stocks, livePrices,
 *    sessions, passwordResets).
 *  - stock `date` was stored as a "YYYY-MM-DD" string → convert to a BSON Date.
 * Safe to run on every startup: only touches documents still in the old shape.
 */
export async function migrateLegacyData(): Promise<void> {
  const db = await getDb();
  let converted = 0;

  // stocks: userId string → ObjectId, date string → Date
  const stocks = db.collection("stocks");
  const cursor = stocks.find({
    $or: [{ userId: { $type: "string" } }, { date: { $type: "string" } }],
  });
  for await (const doc of cursor) {
    const set: Record<string, unknown> = {};
    if (typeof doc.userId === "string" && ObjectId.isValid(doc.userId)) {
      set.userId = new ObjectId(doc.userId);
    }
    if (typeof doc.date === "string") {
      set.date = /^\d{4}-\d{2}-\d{2}$/.test(doc.date)
        ? new Date(`${doc.date}T00:00:00.000Z`)
        : new Date(doc.date);
    }
    if (Object.keys(set).length > 0) {
      await stocks.updateOne({ _id: doc._id }, { $set: set });
      converted++;
    }
  }

  // userId string → ObjectId for the other per-user collections
  for (const name of ["livePrices", "sessions", "passwordResets"]) {
    const col = db.collection(name);
    const cur = col.find({ userId: { $type: "string" } });
    for await (const doc of cur) {
      if (typeof doc.userId === "string" && ObjectId.isValid(doc.userId)) {
        await col.updateOne(
          { _id: doc._id },
          { $set: { userId: new ObjectId(doc.userId) } },
        );
        converted++;
      }
    }
  }

  if (converted > 0) {
    console.log(`[migrate] converted ${converted} legacy document(s) to ObjectId/Date.`);
  }
}

/**
 * Ensures a master admin account exists. Runs once at server startup (see
 * `src/instrumentation.ts`). No-op if any admin is already present.
 *
 * - No admin + email free  → create an active admin from the env credentials.
 * - No admin + email taken → promote that existing account to active admin.
 */
export async function seedAdmin(): Promise<void> {
  const email = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    console.warn(
      "[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.",
    );
    return;
  }

  const db = await getDb();
  const users = db.collection<UserDoc>("users");

  const existingAdmin = await users.findOne({ role: UserRole.Admin });
  if (existingAdmin) return; // an admin already exists — nothing to do

  const existing = await findUserByEmail(email);
  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          role: UserRole.Admin,
          status: UserStatus.Active,
          approvedAt: new Date(),
        },
      },
    );
    console.log(`[seed] Promoted existing account ${email} to master admin.`);
    return;
  }

  await createUser({
    email,
    passwordHash: hashPassword(password),
    role: UserRole.Admin,
    status: UserStatus.Active,
  });
  console.log(`[seed] Created master admin ${email}.`);
}
