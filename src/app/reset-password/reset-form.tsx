"use client";

import { useActionState } from "react";
import { resetPasswordAction, type AuthState } from "../auth-actions";
import { buttonClass, errorBoxClass } from "../auth/auth-ui";
import { PasswordField } from "../auth/password-field";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    resetPasswordAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <p className={errorBoxClass}>{state.error}</p>}
      <input type="hidden" name="token" value={token} />

      <PasswordField
        id="password"
        name="password"
        label="New password"
        hint={<span className="text-gray-400">(min 8 characters)</span>}
        autoComplete="new-password"
        required
        minLength={8}
      />

      <PasswordField
        id="confirm"
        name="confirm"
        label="Confirm new password"
        autoComplete="new-password"
        required
        minLength={8}
      />

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
