import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/lib/user-types";
import { getPortfolio } from "@/lib/portfolio";
import { AppHeader } from "./app-header";
import { HoldingsView } from "./dashboard/holdings-view";
import { BarChartIcon } from "./icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === UserRole.Admin) redirect("/admin");

  const { rows, cashBalance } = await getPortfolio(user.id);

  return (
    <>
      <AppHeader user={user} />
      <main className="animate-fade-up mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <header className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <BarChartIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Your portfolio at a glance. Track available cash and edit each
              stock&apos;s live price to keep Current Value and Profit/Loss up to date.
            </p>
          </div>
        </header>

        <HoldingsView rows={rows} cashBalance={cashBalance} />
      </main>
    </>
  );
}
