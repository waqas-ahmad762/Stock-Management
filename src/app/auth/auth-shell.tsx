import type { ReactNode } from "react";
import { Logo } from "../logo";
import { ThemeToggle } from "../theme-toggle";
import { AuthHero } from "./auth-hero";

/** Split-screen layout shared by all auth pages: brand hero + form card. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex flex-1">
      {/* Brand hero — desktop only */}
      <div className="hidden w-1/2 lg:block xl:w-3/5">
        <AuthHero />
      </div>

      {/* Form column */}
      <div className="relative flex w-full flex-col lg:w-1/2 xl:w-2/5">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="animate-fade-up w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2.5">
              <Logo className="h-10 w-10" />
              <span className="text-lg font-semibold tracking-tight">
                Stocks Manager
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
            <div className={subtitle ? "" : "mt-6"}>{children}</div>

            {footer && (
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
