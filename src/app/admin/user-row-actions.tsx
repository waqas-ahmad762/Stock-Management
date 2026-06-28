"use client";

import type { MouseEvent } from "react";
import { UserStatus } from "@/lib/user-types";
import {
  approveUserAction,
  deactivateUserAction,
  deleteUserAction,
} from "../admin-actions";

const btn =
  "rounded-md px-2.5 py-1 text-xs font-medium transition disabled:opacity-40";

function confirmSubmit(message: string) {
  return (e: MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(message)) e.preventDefault();
  };
}

export function UserRowActions({
  userId,
  email,
  status,
  isSelf,
}: {
  userId: string;
  email: string;
  status: UserStatus;
  isSelf: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      {status === UserStatus.Pending && (
        <form action={approveUserAction}>
          <input type="hidden" name="id" value={userId} />
          <button
            type="submit"
            className={`${btn} bg-green-600 text-white hover:bg-green-700`}
          >
            Approve
          </button>
        </form>
      )}

      {status === UserStatus.Inactive && (
        <form action={approveUserAction}>
          <input type="hidden" name="id" value={userId} />
          <button
            type="submit"
            className={`${btn} bg-green-600 text-white hover:bg-green-700`}
          >
            Reactivate
          </button>
        </form>
      )}

      {status === UserStatus.Active && (
        <form action={deactivateUserAction}>
          <input type="hidden" name="id" value={userId} />
          <button
            type="submit"
            disabled={isSelf}
            title={isSelf ? "You cannot deactivate yourself" : undefined}
            className={`${btn} border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800`}
          >
            Deactivate
          </button>
        </form>
      )}

      <form action={deleteUserAction}>
        <input type="hidden" name="id" value={userId} />
        <button
          type="submit"
          disabled={isSelf}
          onClick={confirmSubmit(
            `Delete ${email} and all of their transactions? This cannot be undone.`,
          )}
          title={isSelf ? "You cannot delete yourself" : undefined}
          className={`${btn} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`}
        >
          Delete
        </button>
      </form>
    </div>
  );
}
