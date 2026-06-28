import { NextResponse, type NextRequest } from "next/server";
import { createStock, listStocks, parseStockInput } from "@/lib/stocks";
import { getCurrentUser } from "@/lib/auth";

// Stocks change on write; never statically cache this endpoint.
export const dynamic = "force-dynamic";

/** GET /api/stocks — list the signed-in user's transactions. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const stocks = await listStocks(user.id);
    return NextResponse.json({ stocks });
  } catch (err) {
    console.error("GET /api/stocks failed:", err);
    return NextResponse.json(
      { error: "Failed to load stocks." },
      { status: 500 },
    );
  }
}

/** POST /api/stocks — create a transaction for the signed-in user. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      raw = await request.json();
    } else {
      const form = await request.formData();
      raw = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseStockInput(raw);
  if ("errors" in parsed) {
    return NextResponse.json({ errors: parsed.errors }, { status: 422 });
  }

  try {
    const stock = await createStock(user.id, parsed.data);
    return NextResponse.json({ stock }, { status: 201 });
  } catch (err) {
    console.error("POST /api/stocks failed:", err);
    return NextResponse.json({ error: "Failed to save stock." }, { status: 500 });
  }
}
