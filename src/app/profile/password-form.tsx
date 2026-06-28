"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type ProfileState } from "../profile-actions";
import { buttonClass, errorBoxClass, noticeBoxClass } from "../auth/auth-ui";
import { PasswordField } from "../auth/password-field";

const initial: ProfileState = { ok: false };

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful change.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      {state.ok && state.message && <p className={noticeBoxClass}>{state.message}</p>}
      {!state.ok && state.message && <p className={errorBoxClass}>{state.message}</p>}

      <PasswordField
        id="current"
        name="current"
        label="Current password"
        autoComplete="current-password"
        required
      />
      {state.errors?.current && (
        <p className="-mt-2 text-xs text-red-600 dark:text-red-400">
          {state.errors.current}
        </p>
      )}

      <PasswordField
        id="password"
        name="password"
        label="New password"
        hint={<span className="text-gray-400">(min 8 characters)</span>}
        autoComplete="new-password"
        required
        minLength={8}
      />
      {state.errors?.password && (
        <p className="-mt-2 text-xs text-red-600 dark:text-red-400">
          {state.errors.password}
        </p>
      )}

      <PasswordField
        id="confirm"
        name="confirm"
        label="Confirm new password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      {state.errors?.confirm && (
        <p className="-mt-2 text-xs text-red-600 dark:text-red-400">
          {state.errors.confirm}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className={`${buttonClass} sm:w-auto sm:px-6`}>
          {pending ? "Updating…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
