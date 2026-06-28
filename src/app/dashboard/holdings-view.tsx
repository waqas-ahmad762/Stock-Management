"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { PortfolioRow } from "@/lib/portfolio";
import { money, num } from "@/lib/format";
import { LivePriceInput } from "./live-price-input";
import { CashCard } from "./cash-card";
import { InvestmentVsReturnsChart, ProfitLossChart } from "./charts";
import {
  WalletIcon,
  BanknoteIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EmptyPortfolioArt,
} from "../icons";

const round2 = (n: number) => Number(n.toFixed(2));
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const pctOf = (profit: number, invested: number) =>
  invested === 0 ? 0 : round2((profit / Math.abs(invested)) * 100);

type SortKey =
  | "name"
  | "quantityHold"
  | "totalInvestment"
  | "liveValue"
  | "currentValue"
  | "profitLoss";
type Dir = "asc" | "desc";

const COLUMNS: {
  key: SortKey;
  label: string;
  align: "left" | "right";
  defaultDir: Dir;
}[] = [
  { key: "name", label: "Stock", align: "left", defaultDir: "asc" },
  { key: "quantityHold", label: "Quantity Hold", align: "right", defaultDir: "desc" },
  { key: "totalInvestment", label: "Total Investment", align: "right", defaultDir: "desc" },
  { key: "liveValue", label: "Live Value", align: "right", defaultDir: "desc" },
  { key: "currentValue", label: "Current Value", align: "right", defaultDir: "desc" },
  { key: "profitLoss", label: "Profit / Loss", align: "right", defaultDir: "desc" },
];

function SummaryCard({
  label,
  value,
  sub,
  icon,
  accent,
  tone = "neutral",
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent: string;
  tone?: "neutral" | "pos" | "neg";
  delay: string;
}) {
  const toneClass =
    tone === "pos"
      ? "text-green-600 dark:text-green-400"
      : tone === "neg"
        ? "text-red-600 dark:text-red-400"
        : "text-gray-900 dark:text-gray-100";
  return (
    <div
      className="animate-fade-up flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
      style={{ animationDelay: delay }}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className={`mt-0.5 truncate text-2xl font-bold tabular-nums ${toneClass}`}>
          {value}
        </p>
        {sub && <p className={`text-xs font-medium tabular-nums ${toneClass}`}>{sub}</p>}
      </div>
    </div>
  );
}

export function HoldingsView({
  rows,
  cashBalance,
}: {
  rows: PortfolioRow[];
  cashBalance: number;
}) {
  const [showSold, setShowSold] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalInvestment");
  const [dir, setDir] = useState<Dir>("desc");

  const soldCount = useMemo(
    () => rows.filter((r) => r.quantityHold === 0).length,
    [rows],
  );

  // Sold-position toggle drives the portfolio set (summary cards + charts).
  const visible = useMemo(
    () => (showSold ? rows : rows.filter((r) => r.quantityHold !== 0)),
    [rows, showSold],
  );

  const totals = useMemo(() => {
    const totalInvestment = round2(visible.reduce((s, r) => s + r.totalInvestment, 0));
    const totalCurrentValue = round2(visible.reduce((s, r) => s + r.currentValue, 0));
    const totalProfitLoss = round2(visible.reduce((s, r) => s + r.profitLoss, 0));
    return {
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
      returnPct: pctOf(totalProfitLoss, totalInvestment),
    };
  }, [visible]);

  // Search + sort apply to the table only.
  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = visible.filter((r) => q === "" || r.name.toLowerCase().includes(q));
    arr.sort((a, b) => {
      const cmp =
        sortKey === "name"
          ? a.name.localeCompare(b.name)
          : a[sortKey] - b[sortKey];
      return dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [visible, query, sortKey, dir]);

  const footTotals = useMemo(
    () => ({
      totalInvestment: round2(tableRows.reduce((s, r) => s + r.totalInvestment, 0)),
      totalCurrentValue: round2(tableRows.reduce((s, r) => s + r.currentValue, 0)),
      totalProfitLoss: round2(tableRows.reduce((s, r) => s + r.profitLoss, 0)),
    }),
    [tableRows],
  );

  function onSort(col: (typeof COLUMNS)[number]) {
    if (col.key === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col.key);
      setDir(col.defaultDir);
    }
  }

  const totalPortfolio = round2(cashBalance + totals.totalCurrentValue);

  return (
    <>
      {/* Total portfolio = uninvested cash + current value of holdings */}
      <div className="animate-fade-up mb-6 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-violet-950/40">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600/80 dark:text-indigo-300/80">
          Total Portfolio Value
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
          {money(totalPortfolio)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {money(cashBalance)} available cash + {money(totals.totalCurrentValue)} in
          holdings
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CashCard amount={cashBalance} delay="0s" />
        <SummaryCard
          label="Total Investment"
          value={money(totals.totalInvestment)}
          icon={<WalletIcon className="h-6 w-6" />}
          accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
          delay="0.08s"
        />
        <SummaryCard
          label="Current Value"
          value={money(totals.totalCurrentValue)}
          icon={<BanknoteIcon className="h-6 w-6" />}
          accent="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
          delay="0.16s"
        />
        <SummaryCard
          label="Total Profit / Loss"
          value={money(totals.totalProfitLoss)}
          sub={`${pct(totals.returnPct)} return`}
          tone={totals.totalProfitLoss < 0 ? "neg" : "pos"}
          icon={
            totals.totalProfitLoss < 0 ? (
              <TrendingDownIcon className="h-6 w-6" />
            ) : (
              <TrendingUpIcon className="h-6 w-6" />
            )
          }
          accent={
            totals.totalProfitLoss < 0
              ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
              : "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
          }
          delay="0.24s"
        />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <EmptyPortfolioArt className="mb-4 w-48" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No holdings yet — your cash is ready to invest.
          </p>
          <Link
            href="/transactions"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 hover:shadow-md"
          >
            Add your first transaction
          </Link>
        </div>
      ) : (
        <HoldingsSection
          visible={visible}
          tableRows={tableRows}
          footTotals={footTotals}
          query={query}
          setQuery={setQuery}
          sortKey={sortKey}
          dir={dir}
          onSort={onSort}
          soldCount={soldCount}
          showSold={showSold}
          setShowSold={setShowSold}
        />
      )}
    </>
  );
}

interface HoldingsSectionProps {
  visible: PortfolioRow[];
  tableRows: PortfolioRow[];
  footTotals: { totalInvestment: number; totalCurrentValue: number; totalProfitLoss: number };
  query: string;
  setQuery: (q: string) => void;
  sortKey: SortKey;
  dir: Dir;
  onSort: (col: (typeof COLUMNS)[number]) => void;
  soldCount: number;
  showSold: boolean;
  setShowSold: (v: boolean) => void;
}

function HoldingsSection({
  visible,
  tableRows,
  footTotals,
  query,
  setQuery,
  sortKey,
  dir,
  onSort,
  soldCount,
  showSold,
  setShowSold,
}: HoldingsSectionProps) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Holdings{" "}
          <span className="text-sm font-normal text-gray-500">({visible.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stock…"
            aria-label="Search holdings by stock"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:w-52 dark:border-gray-700 dark:bg-gray-900"
          />
          {soldCount > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={showSold}
                onChange={(e) => setShowSold(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              Show sold ({soldCount})
            </label>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No active holdings — every position has been fully sold.
          {soldCount > 0 && " Tick “Show sold” above to review them."}
        </p>
      ) : tableRows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No holdings match your search.
        </p>
      ) : (
        <>
          <div className="mb-8 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  {COLUMNS.map((col) => {
                    const active = col.key === sortKey;
                    return (
                      <th
                        key={col.key}
                        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
                        className={`px-4 py-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => onSort(col)}
                          className={`inline-flex items-center gap-1 transition hover:text-gray-900 dark:hover:text-gray-100 ${
                            col.align === "right" ? "flex-row-reverse" : ""
                          } ${active ? "text-gray-900 dark:text-gray-100" : ""}`}
                        >
                          {col.label}
                          <span className="text-[10px]">
                            {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {tableRows.map((r) => {
                  const sold = r.quantityHold === 0;
                  return (
                    <tr key={r.name} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3 font-semibold">
                        {r.name}
                        {sold && (
                          <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-normal text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            sold
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{num(r.quantityHold)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(r.totalInvestment)}</td>
                      <td className="px-4 py-3 text-right">
                        {sold ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex justify-end">
                            <LivePriceInput
                              name={r.name}
                              value={r.liveValue}
                              isDefault={!r.hasLivePrice}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(r.currentValue)}</td>
                      <td
                        className={`px-4 py-3 text-right font-medium tabular-nums ${
                          r.profitLoss < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {money(r.profitLoss)}
                        <span className="block text-xs font-normal opacity-80">
                          {pct(r.returnPct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50 text-sm font-semibold dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <td className="px-4 py-3" colSpan={2}>
                    {query.trim() ? "Total (filtered)" : "Total"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(footTotals.totalInvestment)}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(footTotals.totalCurrentValue)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      footTotals.totalProfitLoss < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {money(footTotals.totalProfitLoss)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <InvestmentVsReturnsChart rows={visible} />
            <ProfitLossChart rows={visible} />
          </div>
        </>
      )}
    </>
  );
}
