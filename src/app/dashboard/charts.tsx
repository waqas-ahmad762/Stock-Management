import type { PortfolioRow } from "@/lib/portfolio";
import { money } from "@/lib/format";

const pct = (n: number) => `${Math.min(100, n * 100)}%`;

/** Grouped horizontal bars: Total Investment vs Total Return per stock. */
export function InvestmentVsReturnsChart({ rows }: { rows: PortfolioRow[] }) {
  const max = Math.max(
    1,
    ...rows.map((r) => Math.max(r.totalInvestment, Math.abs(r.profitLoss))),
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <h3 className="mb-1 text-sm font-semibold">Investment vs Returns</h3>
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" /> Total Investment
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> Total Return
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <div key={r.name} className="grid grid-cols-[4rem_1fr] items-center gap-2">
            <span className="truncate text-xs font-medium" title={r.name}>
              {r.name}
            </span>
            <div className="flex flex-col gap-1">
              <div className="h-2.5 overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                <div
                  className="animate-grow-x h-full rounded-sm bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{
                    width: pct(r.totalInvestment / max),
                    transformOrigin: "left",
                    animationDelay: `${i * 0.06}s`,
                  }}
                  title={`Investment: ${money(r.totalInvestment)}`}
                />
              </div>
              <div className="h-2.5 overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                <div
                  className={`animate-grow-x h-full rounded-sm ${r.profitLoss < 0 ? "bg-red-500" : "bg-green-500"}`}
                  style={{
                    width: pct(Math.abs(r.profitLoss) / max),
                    transformOrigin: "left",
                    animationDelay: `${i * 0.06 + 0.1}s`,
                  }}
                  title={`Return: ${money(r.profitLoss)}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Diverging horizontal bars: Profit/Loss per stock (red left, green right). */
export function ProfitLossChart({ rows }: { rows: PortfolioRow[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.profitLoss)));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <h3 className="mb-4 text-sm font-semibold">Profit / Loss</h3>
      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={r.name} className="grid grid-cols-[4rem_1fr_6rem] items-center gap-2">
            <span className="truncate text-xs font-medium" title={r.name}>
              {r.name}
            </span>
            <div className="relative h-3">
              <div className="absolute inset-y-0 left-1/2 z-10 w-px bg-gray-300 dark:bg-gray-700" />
              {r.profitLoss >= 0 ? (
                <div
                  className="animate-grow-x absolute inset-y-0 left-1/2 rounded-r-sm bg-gradient-to-r from-green-400 to-emerald-500"
                  style={{
                    width: pct(r.profitLoss / max / 2),
                    transformOrigin: "left",
                    animationDelay: `${i * 0.06}s`,
                  }}
                />
              ) : (
                <div
                  className="animate-grow-x absolute inset-y-0 right-1/2 rounded-l-sm bg-gradient-to-l from-red-400 to-rose-500"
                  style={{
                    width: pct(Math.abs(r.profitLoss) / max / 2),
                    transformOrigin: "right",
                    animationDelay: `${i * 0.06}s`,
                  }}
                />
              )}
            </div>
            <span
              className={`text-right text-xs tabular-nums ${
                r.profitLoss < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {money(r.profitLoss)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
