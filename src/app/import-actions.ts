"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createManyStocks, parseStockInput, type StockInput } from "@/lib/stocks";

export interface ImportState {
  ok: boolean;
  added?: number;
  failed?: number;
  errors?: string[]; // first few row errors
  message?: string;
}

// --- minimal CSV parsing (handles quoted fields with commas/quotes) ---------
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const normHeader = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

/** Resolve the column index for each field from a header row. */
function resolveColumns(header: string[]): Record<string, number> | null {
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    const n = normHeader(h);
    if (n === "date") idx.date = i;
    else if (n === "name" || n === "stock" || n === "symbol") idx.name = i;
    else if (n === "type") idx.type = i;
    else if (n === "quantity" || n === "qty") idx.quantity = i;
    else if (n === "unitprice" || n === "price") idx.unitPrice = i;
    else if (n === "commission" || n === "commissiontax" || n === "tax")
      idx.commission = i;
  });
  // name, type, quantity, unitPrice are required columns
  if (["name", "type", "quantity", "unitPrice"].every((k) => k in idx))
    return idx;
  return null;
}

/** Normalise a date cell to YYYY-MM-DD (accepts "April 1, 2026" etc.). */
function toDateStr(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  // Use local components — toISOString() would shift the day in +UTC timezones.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function importStocksAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV file to import." };
  }
  if (file.size > 1_000_000) {
    return { ok: false, message: "File is too large (max 1 MB)." };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, message: "Could not read the file." };
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { ok: false, message: "The file has no data rows." };
  }

  const cols = resolveColumns(parseLine(lines[0]));
  if (!cols) {
    return {
      ok: false,
      message:
        "Missing required columns. Expected: Date, Name, Type, Quantity, Unit Price, Commission.",
    };
  }

  const valid: StockInput[] = [];
  const errors: string[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = parseLine(lines[r]);
    const at = (k: string) => (cols[k] != null ? cells[cols[k]] : undefined);
    const parsed = parseStockInput({
      name: at("name"),
      type: at("type"),
      date: toDateStr(at("date") ?? ""),
      quantity: at("quantity"),
      unitPrice: at("unitPrice"),
      commission: at("commission"),
    });
    if ("errors" in parsed) {
      const msg = Object.values(parsed.errors)[0] ?? "Invalid row";
      if (errors.length < 8) errors.push(`Row ${r + 1}: ${msg}`);
    } else {
      valid.push(parsed.data);
    }
  }

  if (valid.length === 0) {
    return {
      ok: false,
      failed: lines.length - 1,
      errors,
      message: "No valid rows to import.",
    };
  }

  try {
    const added = await createManyStocks(user.id, valid);
    revalidatePath("/"); // dashboard
    revalidatePath("/transactions");
    return { ok: true, added, failed: errors.length, errors };
  } catch (err) {
    console.error("CSV import failed:", err);
    return { ok: false, message: "Could not save the imported rows." };
  }
}
