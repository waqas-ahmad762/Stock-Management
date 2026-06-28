import { listStocks } from "@/lib/stocks";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET /api/stocks/export — download the signed-in user's transactions as CSV. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stocks = await listStocks(user.id);
  const header = [
    "Date",
    "Name",
    "Type",
    "Quantity",
    "Unit Price",
    "Commission",
    "Total Price",
    "Cash Flow",
  ];
  const lines = [header.join(",")];
  for (const s of stocks) {
    lines.push(
      [
        s.date.slice(0, 10), // YYYY-MM-DD
        s.name,
        s.type,
        s.quantity,
        s.unitPrice,
        s.commission,
        s.totalPrice,
        s.cashFlow,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  const csv = lines.join("\n");
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${today}.csv"`,
    },
  });
}
