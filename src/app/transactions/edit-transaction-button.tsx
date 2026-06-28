"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { updateStockAction } from "../edit-actions";
import { TRANSACTION_TYPES } from "@/lib/transaction-types";

interface EditableStock {
  id: string;
  name: string;
  type: string;
  date: string; // ISO
  quantity: number;
  unitPrice: number;
  commission: number;
}

const fieldClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-indigo-400";
const labelClass = "mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function EditTransactionButton({
  stock,
  today,
}: {
  stock: EditableStock;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function openModal() {
    setErrors({});
    setMessage(undefined);
    setConfirming(false);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setConfirming(false);
  }

  // Escape closes the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function review() {
    if (formRef.current?.reportValidity()) setConfirming(true);
  }

  // Form action: run the server action, then close on success or surface errors.
  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateStockAction({ ok: false }, formData);
      if (result.ok) {
        close();
      } else {
        setErrors(result.errors ?? {});
        setMessage(result.message);
        setConfirming(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label={`Edit ${stock.name} ${stock.type}`}
        className="text-xs font-medium text-gray-400 transition hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        Edit
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-stock-title"
          >
            <div
              className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={close}
            />
            <div className="animate-fade-up relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
              <h3 id="edit-stock-title" className="mb-4 text-lg font-semibold">
                Edit transaction
              </h3>

              <form ref={formRef} action={submit} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={stock.id} />

                {message && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    {message}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass} htmlFor={`name-${stock.id}`}>
                      Name
                    </label>
                    <input
                      id={`name-${stock.id}`}
                      name="name"
                      list="stock-names"
                      defaultValue={stock.name}
                      required
                      pattern="[A-Za-z0-9.\-]{1,20}"
                      style={{ textTransform: "uppercase" }}
                      className={fieldClass}
                    />
                    {errors.name && <p className={errorClass}>{errors.name}</p>}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor={`type-${stock.id}`}>
                      Type
                    </label>
                    <select
                      id={`type-${stock.id}`}
                      name="type"
                      defaultValue={stock.type}
                      className={fieldClass}
                    >
                      {TRANSACTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor={`date-${stock.id}`}>
                      Date
                    </label>
                    <input
                      id={`date-${stock.id}`}
                      name="date"
                      type="date"
                      max={today}
                      defaultValue={stock.date.slice(0, 10)}
                      className={fieldClass}
                    />
                    {errors.date && <p className={errorClass}>{errors.date}</p>}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor={`quantity-${stock.id}`}>
                      Quantity
                    </label>
                    <input
                      id={`quantity-${stock.id}`}
                      name="quantity"
                      type="number"
                      step="any"
                      min="0"
                      defaultValue={stock.quantity}
                      required
                      className={fieldClass}
                    />
                    {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor={`unitPrice-${stock.id}`}>
                      Unit price
                    </label>
                    <input
                      id={`unitPrice-${stock.id}`}
                      name="unitPrice"
                      type="number"
                      step="any"
                      min="0"
                      defaultValue={stock.unitPrice}
                      required
                      className={fieldClass}
                    />
                    {errors.unitPrice && <p className={errorClass}>{errors.unitPrice}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className={labelClass} htmlFor={`commission-${stock.id}`}>
                      Commission / tax
                    </label>
                    <input
                      id={`commission-${stock.id}`}
                      name="commission"
                      type="number"
                      step="any"
                      min="0"
                      defaultValue={stock.commission}
                      className={fieldClass}
                    />
                    {errors.commission && <p className={errorClass}>{errors.commission}</p>}
                  </div>
                </div>

                {/* Footer: edit actions, or the confirmation step before saving. */}
                {!confirming ? (
                  <div className="mt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={review}
                      className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500"
                    >
                      Save changes
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/40">
                    <p className="mb-3 text-sm text-amber-800 dark:text-amber-200">
                      Save these changes to{" "}
                      <span className="font-semibold">{stock.name}</span>?
                    </p>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={pending}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={pending}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pending ? "Saving…" : "Confirm save"}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
