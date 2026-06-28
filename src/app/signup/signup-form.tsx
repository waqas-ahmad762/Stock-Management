"use client";

import { useActionState } from "react";
import { signupAction, type AuthState } from "../auth-actions";
import { buttonClass, errorBoxClass, inputClass, labelClass } from "../auth/auth-ui";
import { PasswordField } from "../auth/password-field";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signupAction,
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
        hint={<span className="text-gray-400">(min 8 characters)</span>}
        autoComplete="new-password"
        required
        minLength={8}
      />

      <PasswordField
        id="confirm"
        name="confirm"
        label="Confirm password"
        autoComplete="new-password"
        required
        minLength={8}
      />

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Creating…" : "Create account"}
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        New accounts require admin approval before first sign-in.
      </p>
    </form>
  );
}
