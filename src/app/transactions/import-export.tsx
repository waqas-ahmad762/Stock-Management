"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { importStocksAction, type ImportState } from "../import-actions";

const initial: ImportState = { ok: false };

const btn =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800";

export function ImportExport() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(importStocksAction, initial);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      <a href="/api/stocks/export" className={btn}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export CSV
      </a>
      <button type="button" onClick={() => setOpen(true)} className={btn}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 9l5-5 5 5M12 4v12" />
        </svg>
        Import CSV
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
          >
            <div
              className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="animate-fade-up relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
              <h3 id="import-title" className="mb-1 text-lg font-semibold">
                Import transactions from CSV
              </h3>
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                Columns:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Date, Name, Type, Quantity, Unit Price, Commission
                </span>
                . Dates like 2026-04-01 or &ldquo;April 1, 2026&rdquo; both work.
              </p>
              <a
                href="/sample-transactions.csv"
                download
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download sample CSV
              </a>

              <form action={action} className="flex flex-col gap-4">
                <input
                  type="file"
                  name="file"
                  accept=".csv,text/csv"
                  required
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-700 dark:text-gray-400 dark:file:bg-white dark:file:text-gray-900"
                />

                {state.message && (
                  <p
                    className={`rounded-md px-3 py-2 text-sm ${
                      state.ok
                        ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    }`}
                  >
                    {state.message}
                  </p>
                )}

                {state.ok && (
                  <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-300">
                    Imported {state.added} transaction(s)
                    {state.failed ? `, ${state.failed} skipped` : ""}.
                  </div>
                )}

                {state.errors && state.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    {state.errors.map((e, i) => (
                      <p key={i}>{e}</p>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? "Importing…" : "Import"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
