import { redirect } from "next/navigation";
import { listStocks, listStockNames } from "@/lib/stocks";
import { getPortfolio } from "@/lib/portfolio";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/lib/user-types";
import { AddStockForm } from "../add-stock-form";
import { AppHeader } from "../app-header";
import { TransactionsTable } from "./transactions-table";
import { ImportExport } from "./import-export";
import { CashFlowSummaryCard } from "./cash-flow-summary";
import { ReceiptIcon, PlusIcon, EmptyPortfolioArt } from "../icons";

// Transactions are read from the database on every request.
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const user = await requireUser();
  // The admin manages users only and has no personal portfolio.
  if (user.role === UserRole.Admin) redirect("/admin");

  const [stocks, names, { flows }] = await Promise.all([
    listStocks(user.id),
    listStockNames(user.id),
    getPortfolio(user.id),
  ]);
  // Same UTC "today" the server uses to validate, so the picker's max matches.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <AppHeader user={user} />
      <main className="animate-fade-up mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <header className="mb-10 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <ReceiptIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Record your buys, sells and dividends. Only you can see them.
            </p>
          </div>
        </header>

        <section className="mb-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <PlusIcon className="h-4 w-4" />
            </span>
            Add a transaction
          </h2>
          <AddStockForm names={names} today={today} />
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              History{" "}
              <span className="text-sm font-normal text-gray-500">
                ({stocks.length})
              </span>
            </h2>
            <ImportExport />
          </div>

          {stocks.length > 0 && <CashFlowSummaryCard flows={flows} />}

          {stocks.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center dark:border-gray-700">
              <EmptyPortfolioArt className="mb-3 w-44" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No transactions yet. Add your first one above.
              </p>
            </div>
          ) : (
            <TransactionsTable stocks={stocks} today={today} />
          )}
        </section>
      </main>
    </>
  );
}
