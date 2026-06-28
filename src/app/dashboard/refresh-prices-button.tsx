"use client";

import { useEffect, useState, useTransition } from "react";
import {
  refreshLivePricesAction,
  type RefreshPricesResult,
} from "../dashboard-actions";
import { RefreshIcon } from "../icons";

/** Human-readable time-left: "23h 11m", "4m 09s", "12s". */
function formatLeft(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/**
 * Pulls live PSX prices for every holding — but only once a day. After a
 * refresh the button disables and shows a live countdown until the next one is
 * allowed. The 24h gate is also enforced on the server; this is the UI side.
 */
export function RefreshPricesButton({
  nextAllowedAt: initialNextAllowedAt,
}: {
  nextAllowedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RefreshPricesResult | null>(null);
  const [nextAllowedAt, setNextAllowedAt] = useState<string | null>(
    initialNextAllowedAt,
  );
  // `null` until mounted — keeps SSR and the first client render in agreement
  // (the client clock isn't known during SSR).
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  // Auto-dismiss the result toast so it never lingers over the UI.
  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => setResult(null), 8000);
    return () => clearTimeout(id);
  }, [result]);

  useEffect(() => {
    // No cooldown: clear any leftover countdown (async, so we never call
    // setState synchronously inside the effect body).
    if (!nextAllowedAt) {
      const reset = setTimeout(() => setRemainingMs(0), 0);
      return () => clearTimeout(reset);
    }
    const target = new Date(nextAllowedAt).getTime();
    const tick = () => setRemainingMs(Math.max(0, target - Date.now()));
    const first = setTimeout(tick, 0); // paint the real value right away
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [nextAllowedAt]);

  const coolingDown =
    remainingMs === null ? nextAllowedAt !== null : remainingMs > 0;
  const disabled = pending || coolingDown;

  function refresh() {
    setResult(null);
    startTransition(async () => {
      const r = await refreshLivePricesAction();
      setResult(r);
      setNextAllowedAt(r.nextAllowedAt);
    });
  }

  const label = pending
    ? "Fetching from PSX…"
    : remainingMs !== null && remainingMs > 0
      ? `Next refresh in ${formatLeft(remainingMs)}`
      : coolingDown
        ? "Next refresh later" // brief, until the countdown mounts
        : "Refresh live prices";

  return (
    <>
      <button
        type="button"
        onClick={refresh}
        disabled={disabled}
        title={
          coolingDown
            ? "Live prices can be refreshed once a day"
            : "Fetch the latest prices from PSX"
        }
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-gray-300 disabled:hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-indigo-500 dark:hover:text-indigo-400 dark:disabled:hover:border-gray-700 dark:disabled:hover:text-gray-200"
      >
        <RefreshIcon className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {label}
      </button>

      {result && <ResultToast result={result} onClose={() => setResult(null)} />}
    </>
  );
}

/**
 * Floating, auto-dismissing toast — fixed to the viewport so it never shifts
 * the dashboard layout. Click anywhere on it to dismiss early.
 */
function ResultToast({
  result,
  onClose,
}: {
  result: RefreshPricesResult;
  onClose: () => void;
}) {
  const missing = result.ok ? result.missing : [];
  return (
    <div
      role="status"
      onClick={onClose}
      className="animate-fade-up fixed bottom-4 right-4 z-50 max-w-xs cursor-pointer rounded-xl border bg-white p-4 text-sm shadow-lg dark:bg-gray-900 dark:shadow-black/40"
    >
      {!result.ok ? (
        <p className="font-medium text-red-600 dark:text-red-400">
          {result.error ?? "Something went wrong."}
        </p>
      ) : (
        <>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Updated {result.updated} {result.updated === 1 ? "price" : "prices"} from
            PSX.
          </p>
          {missing.length > 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Not on PSX: {missing.join(", ")}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
