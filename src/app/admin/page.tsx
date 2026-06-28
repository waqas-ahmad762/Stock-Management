import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import { UserRole, UserStatus } from "@/lib/user-types";
import { netCashFlowByUser } from "@/lib/stocks";
import { profitLossByUser } from "@/lib/portfolio";
import { money } from "@/lib/format";
import { AppHeader } from "../app-header";
import { UserRowActions } from "./user-row-actions";

export const dynamic = "force-dynamic";

const statusBadge: Record<UserStatus, string> = {
  [UserStatus.Pending]: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  [UserStatus.Active]: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  [UserStatus.Inactive]: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [users, netByUser] = await Promise.all([
    listUsers(),
    netCashFlowByUser(),
  ]);

  // Profit/loss only makes sense for non-admins who actually have transactions
  // (same set the "Net cash flow" column has data for).
  const plUserIds = users
    .filter((u) => u.role !== UserRole.Admin && netByUser.get(u.id) !== undefined)
    .map((u) => u.id);
  const plByUser = await profitLossByUser(plUserIds);

  const pendingCount = users.filter((u) => u.status === UserStatus.Pending).length;

  return (
    <>
      <AppHeader user={admin} />
      <main className="animate-fade-up mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin · Users</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Approve, deactivate or remove accounts. You can see each user&apos;s
            net cash flow and total profit/loss only — not their individual
            transactions.
            {pendingCount > 0 && (
              <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">
                {pendingCount} awaiting approval.
              </span>
            )}
          </p>
        </header>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Net cash flow</th>
                <th className="px-4 py-3 text-right font-medium">Total P/L</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => {
                const net = netByUser.get(u.id);
                const pl = plByUser.get(u.id);
                const isSelf = u.id === admin.id;
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {u.email}
                      {isSelf && (
                        <span className="ml-1 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-500 dark:text-gray-400">
                      {u.role}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[u.status]}`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {u.role === UserRole.Admin ? (
                        <span className="text-gray-400">—</span>
                      ) : net === undefined ? (
                        <span className="text-gray-400">No data</span>
                      ) : (
                        <span
                          className={
                            net < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }
                        >
                          {money(net)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {u.role === UserRole.Admin ? (
                        <span className="text-gray-400">—</span>
                      ) : pl === undefined ? (
                        <span className="text-gray-400">No data</span>
                      ) : (
                        <span
                          className={
                            pl < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }
                        >
                          {money(pl)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <UserRowActions
                        userId={u.id}
                        email={u.email}
                        status={u.status}
                        isSelf={isSelf}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
