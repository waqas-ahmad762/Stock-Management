"use client";

import { useState, type ReactNode } from "react";
import { inputClass, labelClass } from "./auth-ui";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
      <path d="M6.06 6.06A13.2 13.2 0 0 0 2 11s3.5 7 10 7a9.1 9.1 0 0 0 3.94-.94" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  hint?: ReactNode;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}

/** Password input with a show/hide eye toggle. */
export function PasswordField({
  id,
  name,
  label,
  hint,
  autoComplete = "current-password",
  required,
  minLength,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label} {hint}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200"
        >
          {/* Closed eye while hidden (can't see), open eye once revealed. */}
          {show ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
    </div>
  );
}
