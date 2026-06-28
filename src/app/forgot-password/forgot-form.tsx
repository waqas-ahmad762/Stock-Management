"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type AuthState } from "../auth-actions";
import {
  buttonClass,
  errorBoxClass,
  inputClass,
  labelClass,
  linkClass,
  noticeBoxClass,
} from "../auth/auth-ui";

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    forgotPasswordAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <p className={errorBoxClass}>{state.error}</p>}
      {state.notice && <p className={noticeBoxClass}>{state.notice}</p>}

      {state.devResetLink && (
        <p className="break-all rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          Dev mode (no email configured) — use this link:{" "}
          <a className={linkClass} href={state.devResetLink}>
            {state.devResetLink}
          </a>
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
