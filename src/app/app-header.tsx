import type { SafeUser } from "@/lib/users";
import { UserRole } from "@/lib/user-types";
import { ThemeToggle } from "./theme-toggle";
import { NavLinks } from "./nav-links";
import { Logo } from "./logo";
import { logoutAction } from "./auth-actions";

/** Top bar shown on authenticated pages: identity, nav, logout, theme toggle. */
export function AppHeader({ user }: { user: SafeUser }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-semibold tracking-tight">Stocks Manager</span>
          {user.role === UserRole.Admin && (
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-white">
              Admin
            </span>
          )}
          <NavLinks role={user.role} />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline dark:text-gray-400">
            {user.email}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Log out
            </button>
          </form>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
