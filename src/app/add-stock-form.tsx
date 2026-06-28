"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStockAction, type AddStockState } from "./actions";
import { TRANSACTION_TYPES, TransactionType } from "@/lib/transaction-types";

const initialState: AddStockState = { ok: false };

const fieldClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-100 dark:focus:ring-gray-100";
const labelClass = "mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function AddStockForm({
  names,
  today,
}: {
  names: string[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(addStockAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the inputs after a successful save.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="name">
            Name{" "}
            <span className="text-gray-400">
              {names.length > 0 ? "(pick or type new)" : ""}
            </span>
          </label>
          <input
            id="name"
            name="name"
            list="stock-names"
            placeholder="AAPL"
            autoComplete="off"
            required
            pattern="[A-Za-z0-9.\-]{1,20}"
            title="1–20 letters, numbers, dots or hyphens"
            style={{ textTransform: "uppercase" }}
            className={fieldClass}
          />
          {names.length > 0 && (
            <datalist id="stock-names">
              {names.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          )}
          {state.errors?.name && <p className={errorClass}>{state.errors.name}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="type">
            Type
          </label>
          <select id="type" name="type" defaultValue={TransactionType.Buy} className={fieldClass}>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {state.errors?.type && <p className={errorClass}>{state.errors.type}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="date">
            Date <span className="text-gray-400">(defaults to today)</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            max={today}
            className={fieldClass}
          />
          {state.errors?.date && <p className={errorClass}>{state.errors.date}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="quantity">
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="any"
            min="0"
            placeholder="500"
            className={fieldClass}
          />
          {state.errors?.quantity && <p className={errorClass}>{state.errors.quantity}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="unitPrice">
            Unit price
          </label>
          <input
            id="unitPrice"
            name="unitPrice"
            type="number"
            step="any"
            min="0"
            placeholder="17.68"
            className={fieldClass}
          />
          {state.errors?.unitPrice && (
            <p className={errorClass}>{state.errors.unitPrice}</p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="commission">
            Commission / tax <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="commission"
            name="commission"
            type="number"
            step="any"
            min="0"
            placeholder="25.42"
            className={fieldClass}
          />
          {state.errors?.commission && (
            <p className={errorClass}>{state.errors.commission}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add transaction"}
        </button>
        {state.message && (
          <p
            className={
              state.ok
                ? "text-sm text-green-600 dark:text-green-400"
                : "text-sm text-red-600 dark:text-red-400"
            }
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
