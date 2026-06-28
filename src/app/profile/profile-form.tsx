"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "../profile-actions";
import {
  buttonClass,
  errorBoxClass,
  inputClass,
  labelClass,
  noticeBoxClass,
} from "../auth/auth-ui";

const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";
const initial: ProfileState = { ok: false };

export function ProfileForm({
  email,
  name,
  phone,
}: {
  email: string;
  name: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.ok && state.message && <p className={noticeBoxClass}>{state.message}</p>}
      {!state.ok && state.message && <p className={errorBoxClass}>{state.message}</p>}

      <div>
        <label className={labelClass} htmlFor="email">
          Email <span className="text-gray-400">(cannot be changed)</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          disabled
          className={`${inputClass} cursor-not-allowed opacity-60`}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          placeholder="Your name"
          autoComplete="name"
          className={inputClass}
        />
        {state.errors?.name && <p className={errorClass}>{state.errors.name}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="phone">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          placeholder="+92 300 1234567"
          autoComplete="tel"
          className={inputClass}
        />
        {state.errors?.phone && <p className={errorClass}>{state.errors.phone}</p>}
      </div>

      <div>
        <button type="submit" disabled={pending} className={`${buttonClass} sm:w-auto sm:px-6`}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
