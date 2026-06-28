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
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="truncate font-semibold tracking-tight">Stocks Manager</span>
          {user.role === UserRole.Admin && (
            <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-white">
              Admin
            </span>
          )}
        </div>

        {/* Actions — pushed to the right; share the brand's row */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-[40vw] truncate text-sm text-gray-500 sm:inline dark:text-gray-400">
            {user.email}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="shrink-0 whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Log out
            </button>
          </form>
          <ThemeToggle />
        </div>

        {/* Nav — its own full-width, scrollable row on mobile; inline on desktop */}
        <div className="order-last w-full overflow-x-auto sm:order-none sm:w-auto">
          <NavLinks role={user.role} />
        </div>
      </div>
    </header>
  );
}
