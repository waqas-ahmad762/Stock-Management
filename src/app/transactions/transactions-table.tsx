"use client";

import { useMemo, useState } from "react";
import type { Stock } from "@/lib/stocks";
import { TRANSACTION_TYPES, type TransactionType } from "@/lib/transaction-types";
import { money, num } from "@/lib/format";
import { DeleteStockButton } from "./delete-stock-button";
import { EditTransactionButton } from "./edit-transaction-button";

type SortKey =
  | "date"
  | "name"
  | "type"
  | "quantity"
  | "unitPrice"
  | "totalPrice"
  | "cashFlow"
  | "commission";
type Dir = "asc" | "desc";

const COLUMNS: {
  key: SortKey;
  label: string;
  align: "left" | "right";
  defaultDir: Dir;
}[] = [
  { key: "date", label: "Date", align: "left", defaultDir: "desc" },
  { key: "name", label: "Name", align: "left", defaultDir: "asc" },
  { key: "type", label: "Type", align: "left", defaultDir: "asc" },
  { key: "quantity", label: "Quantity", align: "right", defaultDir: "desc" },
  { key: "unitPrice", label: "Unit price", align: "right", defaultDir: "desc" },
  { key: "totalPrice", label: "Total price", align: "right", defaultDir: "desc" },
  { key: "cashFlow", label: "Cash flow", align: "right", defaultDir: "desc" },
  { key: "commission", label: "Comm./Tax", align: "right", defaultDir: "desc" },
];

const PAGE_SIZES = [10, 25, 50];

const typeBadge: Record<TransactionType, string> = {
  Buy: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Sell: "bg-slate-700 text-white dark:bg-slate-600",
  Dividends: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function TransactionsTable({
  stocks,
  today,
}: {
  stocks: Stock[];
  today: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [dir, setDir] = useState<Dir>("desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | TransactionType>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stocks.filter(
      (s) =>
        (typeFilter === "All" || s.type === typeFilter) &&
        (q === "" || s.name.toLowerCase().includes(q)),
    );
  }, [stocks, query, typeFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp: number;
      if (sortKey === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortKey === "name" || sortKey === "type") {
        cmp = a[sortKey].localeCompare(b[sortKey]);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, dir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  function onSort(col: (typeof COLUMNS)[number]) {
    if (col.key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setDir(col.defaultDir);
    }
    setPage(1);
  }

  // Compact, windowed list of page numbers around the current page.
  const pageNumbers = useMemo(() => {
    const out: number[] = [];
    const win = 1;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= current - win && p <= current + win)) {
        out.push(p);
      } else if (out[out.length - 1] !== -1) {
        out.push(-1); // ellipsis marker
      }
    }
    return out;
  }, [totalPages, current]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name…"
          aria-label="Search transactions by name"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:w-64 dark:border-gray-700 dark:bg-gray-900"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as "All" | TransactionType);
            setPage(1);
          }}
          aria-label="Filter by type"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="All">All types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {(query || typeFilter !== "All") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTypeFilter("All");
              setPage(1);
            }}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Clear
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No transactions match your search.
        </p>
      ) : (
        <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
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
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {pageRows.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {formatDate(s.date)}
                </td>
                <td className="px-4 py-3 font-semibold">{s.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[s.type]}`}
                  >
                    {s.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{num(s.quantity)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{money(s.unitPrice)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{money(s.totalPrice)}</td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    s.cashFlow < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {money(s.cashFlow)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500 dark:text-gray-400">
                  {money(s.commission)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <EditTransactionButton
                      stock={{
                        id: s.id,
                        name: s.name,
                        type: s.type,
                        date: s.date,
                        quantity: s.quantity,
                        unitPrice: s.unitPrice,
                        commission: s.commission,
                      }}
                      today={today}
                    />
                    <DeleteStockButton id={s.id} label={`${s.name} ${s.type}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span>
            Showing {sorted.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Rows per page"
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 font-medium transition enabled:hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:enabled:hover:bg-gray-800"
            >
              Prev
            </button>
            {pageNumbers.map((p, i) =>
              p === -1 ? (
                <span key={`e${i}`} className="px-1 text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === current ? "page" : undefined}
                  className={`min-w-[2rem] rounded-md px-2.5 py-1.5 font-medium transition ${
                    p === current
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current === totalPages}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 font-medium transition enabled:hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:enabled:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
