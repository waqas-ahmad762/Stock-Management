import type { CashFlowSummary } from "@/lib/portfolio";
import { money } from "@/lib/format";

function Item({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

/**
 * The money side of the transaction history: what went out, what came back,
 * and where that leaves the user once the shares still held are counted at
 * their live price.
 */
export function CashFlowSummaryCard({ flows }: { flows: CashFlowSummary }) {
  // netPosition is "spent − (holdings + sold + dividends)": above zero means
  // still down that much, below zero means ahead by it.
  const down = flows.netPosition > 0;
  const gap = Math.abs(flows.netPosition);

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Item label="Spent on buys" value={money(flows.spent)} hint="commission included" />
        <Item label="Sold" value={money(flows.soldProceeds)} hint="net of commission" />
        <Item label="Dividends" value={money(flows.dividends)} />
        <Item
          label="Holdings value"
          value={money(flows.holdingsValue)}
          hint="at live prices"
        />
        <Item
          label="Still invested"
          value={money(-flows.netCashFlow)}
          hint="spent − sold − dividends"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Spent − (holdings + sold + dividends):
        </p>
        <p
          className={`text-lg font-bold tabular-nums ${
            down ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
          }`}
        >
          {money(flows.netPosition)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {down ? `you are down ${money(gap)}` : `you are ahead ${money(gap)}`}
        </p>
      </div>
    </section>
  );
}
