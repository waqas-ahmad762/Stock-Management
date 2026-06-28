"use client";

import { useState, useTransition } from "react";
import { updateLivePriceAction } from "../dashboard-actions";

/**
 * Inline editable live price. Commits on blur or Enter (only if changed),
 * then the server action revalidates the dashboard so the dependent columns
 * (Current Value, Profit/Loss) recompute.
 */
export function LivePriceInput({
  name,
  value,
  isDefault,
}: {
  name: string;
  value: number;
  isDefault: boolean;
}) {
  const [val, setVal] = useState(String(value));
  const [pending, startTransition] = useTransition();

  function commit() {
    const n = Number(val);
    if (Number.isNaN(n) || n < 0) {
      setVal(String(value)); // revert invalid input
      return;
    }
    if (n !== value) {
      startTransition(() => updateLivePriceAction(name, n));
    }
  }

  return (
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
      title={isDefault ? "Defaulted to last transaction price — edit to set the live price" : "Live price"}
      aria-label={`Live price for ${name}`}
      className={`w-24 rounded-md border bg-white px-2 py-1 text-right text-sm tabular-nums outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 dark:bg-gray-900 dark:focus:border-gray-100 dark:focus:ring-gray-100 ${
        isDefault
          ? "border-dashed border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"
          : "border-gray-300 text-gray-900 dark:border-gray-700 dark:text-gray-100"
      }`}
    />
  );
}
