"use client";

import { useEffect, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { deleteStockAction } from "../actions";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

/** Trigger + confirmation modal for deleting a transaction. */
export function DeleteStockButton({ id, label }: { id: string; label: string }) {
  const [open, setOpen] = useState(false);

  // Close on Escape while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${label}`}
        className="text-xs font-medium text-gray-400 transition hover:text-red-600 dark:hover:text-red-400"
      >
        Delete
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-stock-title"
          >
            <div
              className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="animate-fade-up relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </span>
                <h3 id="delete-stock-title" className="text-lg font-semibold">
                  Delete transaction?
                </h3>
              </div>

              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </span>{" "}
                will be permanently removed. This can&apos;t be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <form action={deleteStockAction}>
                  <input type="hidden" name="id" value={id} />
                  <ConfirmButton />
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
