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

/**
 * Upserts many live prices for a user in a single round-trip (used when
 * refreshing all holdings from PSX). Returns how many rows were written.
 */
export async function setLivePrices(
  userId: string,
  prices: Map<string, number>,
): Promise<number> {
  if (!ObjectId.isValid(userId) || prices.size === 0) return 0;
  const owner = new ObjectId(userId);
  const now = new Date();
  const ops = [...prices]
    .filter(([, price]) => Number.isFinite(price) && price >= 0)
    .map(([name, price]) => ({
      updateOne: {
        filter: { userId: owner, name: name.trim().toUpperCase() },
        update: { $set: { price, updatedAt: now } },
        upsert: true,
      },
    }));
  if (ops.length === 0) return 0;
  const col = await livePricesCol();
  const res = await col.bulkWrite(ops);
  return res.upsertedCount + res.modifiedCount;
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

// --- Live-price refresh throttle (once per day) ----------------------------

/** Minimum gap between PSX price refreshes for a user. */
export const PRICE_REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;

interface PriceRefreshDoc {
  userId: ObjectId;
  lastRefreshAt: Date;
}

async function priceRefreshCol(): Promise<Collection<PriceRefreshDoc>> {
  const db = await getDb();
  const col = db.collection<PriceRefreshDoc>("priceRefreshes");
  await col.createIndex({ userId: 1 }, { unique: true });
  return col;
}

/**
 * The time the user may next refresh live prices, or `null` if they can do it
 * right now (never refreshed, or the 24h cooldown has elapsed).
 */
export async function getNextRefreshAllowedAt(userId: string): Promise<Date | null> {
  if (!ObjectId.isValid(userId)) return null;
  const col = await priceRefreshCol();
  const doc = await col.findOne({ userId: new ObjectId(userId) });
  if (!doc) return null;
  const next = new Date(doc.lastRefreshAt.getTime() + PRICE_REFRESH_COOLDOWN_MS);
  return next.getTime() > Date.now() ? next : null;
}

/** Stamps "the user just refreshed now", starting a fresh 24h cooldown. */
export async function recordPriceRefresh(userId: string): Promise<void> {
  if (!ObjectId.isValid(userId)) return;
  const col = await priceRefreshCol();
  await col.updateOne(
    { userId: new ObjectId(userId) },
    { $set: { lastRefreshAt: new Date() } },
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

/**
 * Money in and out, split by what actually happened, so a single "net" figure
 * is never left to explain itself.
 *
 * `netPosition` is what the user asks of the portfolio: what I spent minus
 * what I got back — the shares I still hold (at live prices), the cash from
 * anything I sold, and the dividends I was paid. Positive means still down
 * that much; negative means ahead. It is the mirror image of the dashboard's
 * Total Profit / Loss.
 */
export interface CashFlowSummary {
  spent: number; // total paid on Buys, commission included
  soldProceeds: number; // net cash received from Sells
  dividends: number; // net cash received as Dividends
  holdingsValue: number; // market value of shares still held
  netCashFlow: number; // soldProceeds + dividends − spent (cash actually moved)
  netPosition: number; // spent − (holdingsValue + soldProceeds + dividends)
}

export interface Portfolio {
  rows: PortfolioRow[];
  cashBalance: number; // uninvested cash set aside to invest
  flows: CashFlowSummary;
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
  let spent = 0;
  let soldProceeds = 0;
  let dividends = 0;

  for (const s of stocks) {
    if (s.type === TransactionType.Buy) spent += s.totalPrice;
    else if (s.type === TransactionType.Sell) soldProceeds += s.totalPrice;
    else dividends += s.totalPrice;

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
  const totalCurrentValue = round2(rows.reduce((s, r) => s + r.currentValue, 0));
  const totals = {
    totalInvestment,
    totalCurrentValue,
    totalProfitLoss,
    returnPct: pctOf(totalProfitLoss, totalInvestment),
  };

  const flows: CashFlowSummary = {
    spent: round2(spent),
    soldProceeds: round2(soldProceeds),
    dividends: round2(dividends),
    holdingsValue: totalCurrentValue,
    netCashFlow: round2(soldProceeds + dividends - spent),
    netPosition: round2(spent - (totalCurrentValue + soldProceeds + dividends)),
  };

  return { rows, totals, cashBalance, flows };
}

/**
 * Total profit/loss per user — the same figure each user sees as their
 * dashboard total (live prices, with the last-transaction-price fallback). The
 * per-user aggregations run in parallel. Pass only the ids you need (e.g.
 * non-admins who actually have transactions) to keep it cheap.
 */
export async function profitLossByUser(
  userIds: string[],
): Promise<Map<string, number>> {
  const entries = await Promise.all(
    userIds.map(async (id) => {
      const { totals } = await getPortfolio(id);
      return [id, totals.totalProfitLoss] as const;
    }),
  );
  return new Map(entries);
}
