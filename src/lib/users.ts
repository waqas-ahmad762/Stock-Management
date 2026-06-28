import { ObjectId, type Collection } from "mongodb";
import { getDb } from "./mongodb";
import { UserRole, UserStatus } from "./user-types";

// Re-export so existing "@/lib/users" imports keep working (value + type).
export { UserRole, UserStatus };

/** A user account as stored in MongoDB. */
export interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  name?: string;
  phone?: string;
  createdAt: Date;
  approvedAt?: Date;
}

/** A user account as exposed to the app (never includes the password hash). */
export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  name: string;
  phone: string;
  createdAt: string;
}

async function collection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  const col = db.collection<UserDoc>("users");
  // Enforce one account per email. Safe to call repeatedly.
  await col.createIndex({ email: 1 }, { unique: true });
  return col;
}

export function toSafeUser(doc: UserDoc): SafeUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    role: doc.role,
    status: doc.status,
    name: doc.name ?? "",
    phone: doc.phone ?? "",
    createdAt: doc.createdAt?.toISOString(),
  };
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const col = await collection();
  return col.findOne({ email: normalizeEmail(email) });
}

export async function findUserById(id: string): Promise<UserDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await collection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function countUsers(): Promise<number> {
  const col = await collection();
  return col.countDocuments();
}

interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
}

/** Inserts a new user. Throws on duplicate email (unique index). */
export async function createUser(input: CreateUserInput): Promise<UserDoc> {
  const col = await collection();
  const doc: UserDoc = {
    _id: new ObjectId(),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    role: input.role,
    status: input.status,
    createdAt: new Date(),
    ...(input.status === UserStatus.Active ? { approvedAt: new Date() } : {}),
  };
  await col.insertOne(doc);
  return doc;
}

export async function setUserStatus(
  id: string,
  status: UserStatus,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        ...(status === UserStatus.Active ? { approvedAt: new Date() } : {}),
      },
    },
  );
  return res.matchedCount === 1;
}

/** Updates editable profile fields. Email is intentionally not updatable. */
export async function updateUserProfile(
  id: string,
  fields: { name: string; phone: string },
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name: fields.name, phone: fields.phone } },
  );
  return res.matchedCount === 1;
}

export async function updateUserPassword(
  id: string,
  passwordHash: string,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await collection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { passwordHash } },
  );
  return res.matchedCount === 1;
}

/** Lists all users, newest first. */
export async function listUsers(): Promise<SafeUser[]> {
  const col = await collection();
  const docs = await col.find().sort({ createdAt: -1 }).toArray();
  return docs.map(toSafeUser);
}

/** Deletes a user and all of their owned data. */
export async function deleteUserCascade(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const oid = new ObjectId(id);
  const res = await db.collection("users").deleteOne({ _id: oid });
  if (res.deletedCount !== 1) return false;
  await Promise.all([
    db.collection("stocks").deleteMany({ userId: oid }),
    db.collection("livePrices").deleteMany({ userId: oid }),
    db.collection("cashBalances").deleteMany({ userId: oid }),
    db.collection("sessions").deleteMany({ userId: oid }),
    db.collection("passwordResets").deleteMany({ userId: oid }),
  ]);
  return true;
}
