import { ObjectId, type Collection } from "mongodb";
import { getDb } from "./mongodb";
import { TRANSACTION_TYPES, TransactionType } from "./transaction-types";

const COLLECTION = "stocks";

// Re-export so server-side callers can keep importing from "@/lib/stocks".
export { TRANSACTION_TYPES, TransactionType };

/** A stock transaction as stored in MongoDB. */
export interface StockDoc {
  _id: ObjectId;
  userId: ObjectId; // owner — transactions are private to this user
  name: string;
  type: TransactionType;
  date: Date; // trade date, stored as a BSON Date (ISO) at UTC midnight
  quantity: number;
  unitPrice: number;
  commission: number; // commission / tax on the trade
  createdAt: Date;
}

/** A stock transaction as exposed to the app (plain, serializable). */
export interface Stock {
  id: string;
  name: string;
  type: TransactionType;
  date: string; // ISO string; format in the UI before display
  quantity: number;
  unitPrice: number;
  commission: number;
  totalPrice: number; // gross +/- commission, depending on type
  cashFlow: number; // negative for Buy, positive for Sell/Dividends
  createdAt: string;
}

/** Fields accepted when creating a transaction. */
export interface StockInput {
  name: string;
  type: TransactionType;
  date: Date;
  quantity: number;
  unitPrice: number;
  commission: number;
}

async function collection(): Promise<Collection<StockDoc>> {
  const db = await getDb();
  const col = db.collection<StockDoc>(COLLECTION);
  await col.createIndex({ userId: 1, date: -1 });
  return col;
}

/** Narrows a user id string to an ObjectId (returns null when malformed). */
function toUserId(userId: string): ObjectId | null {
  return ObjectId.isValid(userId) ? new ObjectId(userId) : null;
}

const round2 = (n: number) => Number(n.toFixed(2));

/**
 * Derives Total Price and Cash Flow from the stored fields.
 * - Buy: you pay quantity*price PLUS commission → cash out (negative).
 * - Sell / Dividends: you receive quantity*price MINUS commission/tax → cash in
 *   (positive). Fees reduce what you actually get.
 */
function derive(input: {
  type: TransactionType;
  quantity: number;
  unitPrice: number;
  commission: number;
}): { totalPrice: number; cashFlow: number } {
  const gross = input.quantity * input.unitPrice;
  if (input.type === TransactionType.Buy) {
    const totalPrice = round2(gross + input.commission);
    return { totalPrice, cashFlow: round2(-totalPrice) };
  }
  const totalPrice = round2(gross - input.commission);
  return { totalPrice, cashFlow: round2(totalPrice) };
}

function toStock(doc: StockDoc): Stock {
  const { totalPrice, cashFlow } = derive(doc);
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    date: doc.date.toISOString(),
    quantity: doc.quantity,
    unitPrice: doc.unitPrice,
    commission: doc.commission,
    totalPrice,
    cashFlow,
    createdAt: doc.createdAt.toISOString(),
  };
}

/** Today's date as YYYY-MM-DD in the server's local time. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isTransactionType(v: string): v is TransactionType {
  return (TRANSACTION_TYPES as readonly string[]).includes(v);
}

/**
 * Validates and normalizes raw input into a {@link StockInput}.
 * Returns either the clean value or a map of field errors.
 */
export function parseStockInput(raw: {
  name?: unknown;
  type?: unknown;
  date?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  commission?: unknown;
}): { data: StockInput } | { errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const name = String(raw.name ?? "")
    .trim()
    .toUpperCase();
  if (!name) errors.name = "Name is required.";
  else if (!/^[A-Z0-9.\-]{1,20}$/.test(name))
    errors.name = "Use 1–20 letters, numbers, dots or hyphens.";

  const typeRaw = String(raw.type ?? "").trim();
  const type: TransactionType = isTransactionType(typeRaw)
    ? typeRaw
    : TransactionType.Buy;
  if (!isTransactionType(typeRaw)) errors.type = "Choose Buy, Sell or Dividends.";

  // Date is optional: default to today when omitted. Validated as a calendar
  // string, then stored as a Date (UTC midnight) so it round-trips cleanly.
  const rawDate = String(raw.date ?? "").trim();
  let dateStr = today();
  if (rawDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || Number.isNaN(Date.parse(rawDate)))
      errors.date = "Enter a valid date.";
    else if (rawDate > today()) errors.date = "Date cannot be in the future.";
    else dateStr = rawDate;
  }
  const date = new Date(`${dateStr}T00:00:00.000Z`);

  const quantity = Number(raw.quantity);
  if (raw.quantity === "" || raw.quantity == null || Number.isNaN(quantity))
    errors.quantity = "Quantity is required.";
  else if (quantity <= 0) errors.quantity = "Quantity must be greater than 0.";

  const unitPrice = Number(raw.unitPrice);
  if (raw.unitPrice === "" || raw.unitPrice == null || Number.isNaN(unitPrice))
    errors.unitPrice = "Unit price is required.";
  else if (unitPrice < 0) errors.unitPrice = "Unit price cannot be negative.";

  // Commission / tax is optional, defaults to 0.
  const commissionRaw = raw.commission;
  const commission =
    commissionRaw === "" || commissionRaw == null ? 0 : Number(commissionRaw);
  if (Number.isNaN(commission)) errors.commission = "Enter a valid amount.";
  else if (commission < 0) errors.commission = "Commission cannot be negative.";

  if (Object.keys(errors).length > 0) return { errors };
  return { data: { name, type, date, quantity, unitPrice, commission } };
}

/** Returns a user's transactions, newest first. */
export async function listStocks(userId: string): Promise<Stock[]> {
  const owner = toUserId(userId);
  if (!owner) return [];
  const col = await collection();
  const docs = await col
    .find({ userId: owner })
    .sort({ date: -1, createdAt: -1 })
    .toArray();
  return docs.map(toStock);
}

/** Returns the distinct stock names a user has used, sorted A–Z. */
export async function listStockNames(userId: string): Promise<string[]> {
  const owner = toUserId(userId);
  if (!owner) return [];
  const col = await collection();
  const names = await col.distinct("name", { userId: owner });
  return names.filter((n): n is string => typeof n === "string" && n.length > 0).sort();
}

/** Inserts a transaction owned by `userId` and returns the created record. */
export async function createStock(
  userId: string,
  input: StockInput,
): Promise<Stock> {
  const owner = toUserId(userId);
  if (!owner) throw new Error("Invalid user id");
  const col = await collection();
  const doc: StockDoc = {
    _id: new ObjectId(),
    userId: owner,
    name: input.name,
    type: input.type,
    date: input.date,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    commission: input.commission,
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  return toStock(doc);
}

/**
 * Deletes one of the user's transactions. Scoped by userId so a user can only
 * ever delete their own records. Returns true if a record was removed.
 */
export async function deleteStock(userId: string, id: string): Promise<boolean> {
  const owner = toUserId(userId);
  if (!owner || !ObjectId.isValid(id)) return false;
  const col = await collection();
  const res = await col.deleteOne({ _id: new ObjectId(id), userId: owner });
  return res.deletedCount === 1;
}

/** Inserts many transactions for a user in one call (used by CSV import). */
export async function createManyStocks(
  userId: string,
  inputs: StockInput[],
): Promise<number> {
  const owner = toUserId(userId);
  if (!owner || inputs.length === 0) return 0;
  const col = await collection();
  const now = new Date();
  const docs: StockDoc[] = inputs.map((input) => ({
    _id: new ObjectId(),
    userId: owner,
    name: input.name,
    type: input.type,
    date: input.date,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    commission: input.commission,
    createdAt: now,
  }));
  const res = await col.insertMany(docs);
  return res.insertedCount;
}

/**
 * Updates one of the user's transactions. Scoped by userId so a user can only
 * edit their own records. Returns true if a record was updated.
 */
export async function updateStock(
  userId: string,
  id: string,
  input: StockInput,
): Promise<boolean> {
  const owner = toUserId(userId);
  if (!owner || !ObjectId.isValid(id)) return false;
  const col = await collection();
  const res = await col.updateOne(
    { _id: new ObjectId(id), userId: owner },
    {
      $set: {
        name: input.name,
        type: input.type,
        date: input.date,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        commission: input.commission,
      },
    },
  );
  return res.matchedCount === 1;
}

/**
 * Aggregates net cash flow per user. Cash flow is derived in the pipeline the
 * same way {@link derive} computes it: Buy is cash out (negative), Sell and
 * Dividends are cash in (positive). Returns a map of userId → net cash flow.
 * Used by the admin overview, which never sees individual transactions.
 */
export async function netCashFlowByUser(): Promise<Map<string, number>> {
  const col = await collection();
  const rows = await col
    .aggregate<{ _id: ObjectId; net: number }>([
      {
        $group: {
          _id: "$userId",
          net: {
            $sum: {
              $let: {
                vars: { gross: { $multiply: ["$quantity", "$unitPrice"] } },
                in: {
                  $cond: [
                    { $eq: ["$type", TransactionType.Buy] },
                    { $multiply: [-1, { $add: ["$$gross", "$commission"] }] },
                    { $subtract: ["$$gross", "$commission"] },
                  ],
                },
              },
            },
          },
        },
      },
    ])
    .toArray();

  return new Map(rows.map((r) => [r._id.toString(), Number(r.net.toFixed(2))]));
}
