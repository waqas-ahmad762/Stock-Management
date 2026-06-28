import { ObjectId, type Collection } from "mongodb";
import { getDb } from "./mongodb";
import { listStocks } from "./stocks";
import { TransactionType } from "./transaction-types";

const round2 = (n: number) => Number(n.toFixed(2));
const round4 = (n: number) => Number(n.toFixed(4));

interface LivePriceDoc {
  userId: ObjectId;
  name: string;
  price: number;
  updatedAt: Date;
}

async function livePricesCol(): Promise<Collection<LivePriceDoc>> {
  const db = await getDb();
  const col = db.collection<LivePriceDoc>("livePrices");
  await col.createIndex({ userId: 1, name: 1 }, { unique: true });
  return col;
}

/** Map of stock name → user-set live price. */
async function getLivePrices(userId: string): Promise<Map<string, number>> {
  if (!ObjectId.isValid(userId)) return new Map();
  const col = await livePricesCol();
  const docs = await col.find({ userId: new ObjectId(userId) }).toArray();
  return new Map(docs.map((d) => [d.name, d.price]));
}

/** Upserts the user's live (current market) price for a stock. */
export async function setLivePrice(
  userId: string,
  name: string,
  price: number,
): Promise<void> {
  if (!ObjectId.isValid(userId)) return;
  const col = await livePricesCol();
  await col.updateOne(
    { userId: new ObjectId(userId), name: name.trim().toUpperCase() },
    { $set: { price, updatedAt: new Date() } },
    { upsert: true },
  );
}

// --- Available cash (uninvested money set aside to invest) ------------------

interface CashBalanceDoc {
  userId: ObjectId;
  amount: number;
  updatedAt: Date;
}

async function cashCol(): Promise<Collection<CashBalanceDoc>> {
  const db = await getDb();
  const col = db.collection<CashBalanceDoc>("cashBalances");
  await col.createIndex({ userId: 1 }, { unique: true });
  return col;
}

/** The user's available (uninvested) cash. 0 if never set. */
export async function getCashBalance(userId: string): Promise<number> {
  if (!ObjectId.isValid(userId)) return 0;
  const col = await cashCol();
  const doc = await col.findOne({ userId: new ObjectId(userId) });
  return doc?.amount ?? 0;
}

/** Sets the user's available cash. */
export async function setCashBalance(userId: string, amount: number): Promise<void> {
  if (!ObjectId.isValid(userId) || Number.isNaN(amount) || amount < 0) return;
  const col = await cashCol();
  await col.updateOne(
    { userId: new ObjectId(userId) },
    { $set: { amount: round2(amount), updatedAt: new Date() } },
    { upsert: true },
  );
}

/** One row of the portfolio dashboard, aggregated per stock. */
export interface PortfolioRow {
  name: string;
  quantityHold: number;
  totalInvestment: number; // money in − money out (= −net cash flow)
  liveValue: number; // current market price per share
  currentValue: number; // quantityHold × liveValue
  profitLoss: number; // currentValue − totalInvestment (a.k.a. total return)
  returnPct: number; // profitLoss as a % of money invested
  hasLivePrice: boolean; // true if the user set it, false if defaulted
}

export interface Portfolio {
  rows: PortfolioRow[];
  cashBalance: number; // uninvested cash set aside to invest
  totals: {
    totalInvestment: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
    returnPct: number;
  };
}

const pctOf = (profit: number, invested: number) =>
  invested === 0 ? 0 : Number(((profit / Math.abs(invested)) * 100).toFixed(2));

/**
 * Builds the per-stock dashboard for a user from their transactions.
 *
 * Buy = money invested (cash out), Sell & Dividends = money received (cash in),
 * which is exactly the sign of each transaction's `cashFlow`. So:
 *   totalInvestment = −Σ cashFlow   (net cash put in)
 *   quantityHold    = Σ Buy qty − Σ Sell qty   (dividends don't change shares)
 * Live value defaults to the most recent transaction price until the user sets
 * one explicitly.
 */
export async function getPortfolio(userId: string): Promise<Portfolio> {
  // listStocks returns newest-first, so the first row seen per name is latest.
  const [stocks, livePrices, cashBalance] = await Promise.all([
    listStocks(userId),
    getLivePrices(userId),
    getCashBalance(userId),
  ]);

  interface Group {
    name: string;
    buyQty: number;
    sellQty: number;
    netInvested: number;
    lastPrice: number;
    seen: boolean;
  }
  const groups = new Map<string, Group>();

  for (const s of stocks) {
    let g = groups.get(s.name);
    if (!g) {
      g = { name: s.name, buyQty: 0, sellQty: 0, netInvested: 0, lastPrice: 0, seen: false };
      groups.set(s.name, g);
    }
    if (s.type === TransactionType.Buy) g.buyQty += s.quantity;
    else if (s.type === TransactionType.Sell) g.sellQty += s.quantity;
    g.netInvested += -s.cashFlow; // Buy adds, Sell/Dividends subtract
    if (!g.seen) {
      g.lastPrice = s.unitPrice; // first occurrence = most recent transaction
      g.seen = true;
    }
  }

  const rows: PortfolioRow[] = [...groups.values()].map((g) => {
    const quantityHold = round4(g.buyQty - g.sellQty);
    const totalInvestment = round2(g.netInvested);
    const hasLivePrice = livePrices.has(g.name);
    const liveValue = hasLivePrice ? livePrices.get(g.name)! : g.lastPrice;
    const currentValue = round2(quantityHold * liveValue);
    const profitLoss = round2(currentValue - totalInvestment);
    return {
      name: g.name,
      quantityHold,
      totalInvestment,
      liveValue,
      currentValue,
      profitLoss,
      returnPct: pctOf(profitLoss, totalInvestment),
      hasLivePrice,
    };
  });

  rows.sort((a, b) => b.totalInvestment - a.totalInvestment);

  const totalInvestment = round2(rows.reduce((s, r) => s + r.totalInvestment, 0));
  const totalProfitLoss = round2(rows.reduce((s, r) => s + r.profitLoss, 0));
  const totals = {
    totalInvestment,
    totalCurrentValue: round2(rows.reduce((s, r) => s + r.currentValue, 0)),
    totalProfitLoss,
    returnPct: pctOf(totalProfitLoss, totalInvestment),
  };

  return { rows, totals, cashBalance };
}
