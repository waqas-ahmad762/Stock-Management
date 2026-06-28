"use client";

import { useState, useTransition } from "react";
import { updateCashBalanceAction } from "../dashboard-actions";
import { CoinsIcon } from "../icons";

/**
 * Summary card for the user's available (uninvested) cash, with the amount
 * editable inline. Commits on blur/Enter when changed, then revalidates so the
 * Total Portfolio Value recomputes.
 */
export function CashCard({ amount, delay }: { amount: number; delay: string }) {
  const [val, setVal] = useState(String(amount));
  const [pending, startTransition] = useTransition();

  function commit() {
    const n = Number(val);
    if (Number.isNaN(n) || n < 0) {
      setVal(String(amount));
      return;
    }
    if (n !== amount) startTransition(() => updateCashBalanceAction(n));
  }

  return (
    <div
      className="animate-fade-up flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
      style={{ animationDelay: delay }}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
        <CoinsIcon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Available Cash
        </p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Rs</span>
          <input
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={val}
            disabled={pending}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            aria-label="Available cash amount"
            title="Edit your available cash"
            className="w-28 border-b border-dashed border-gray-300 bg-transparent text-2xl font-bold tabular-nums text-gray-900 outline-none transition focus:border-solid focus:border-indigo-500 disabled:opacity-50 dark:border-gray-600 dark:text-gray-100 dark:focus:border-indigo-400"
          />
        </div>
      </div>
    </div>
  );
}
