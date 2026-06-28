"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "../auth-actions";
import { buttonClass, errorBoxClass, inputClass, labelClass } from "../auth/auth-ui";
import { PasswordField } from "../auth/password-field";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <p className={errorBoxClass}>{state.error}</p>}

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

      <PasswordField
        id="password"
        name="password"
        label="Password"
        autoComplete="current-password"
        required
      />

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
