import Papa from "papaparse";
import { Transaction } from "../models/transaction.model";
import { Category } from "../models/category.model";
import { Account } from "../models/account.model";
import { ApiError } from "../utils/api-error";
import { adjustAccountBalance } from "./transaction.service";

/** Column mapping sent by the frontend wizard: CSV header → field name */
export type ColumnMapping = Record<string, string>;

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Parse an amount string into a signed float.
 * Handles: $1,234.56 | 1.234,56 (European) | (500) | -500 | 500 CR | 500 DR
 */
function parseAmount(raw: string): number | null {
  let s = raw.trim();

  // Credit / debit suffix
  const isCr = /\bCR\b/i.test(s);
  const isDr = /\bDR\b/i.test(s);
  s = s.replace(/\b(CR|DR)\b/gi, "").trim();

  // Strip currency symbols (preserve minus sign)
  s = s.replace(/[£€$¥₹฿₩₪₫]/g, "").trim();

  // Parentheses → negative: (500.00) → -500.00
  const isParens = s.startsWith("(") && s.endsWith(")");
  if (isParens) s = s.slice(1, -1);

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastDot > lastComma) {
      // US format: 1,234.56 — commas are thousands separators
      s = s.replace(/,/g, "");
    } else {
      // European format: 1.234,56 — dots are thousands, comma is decimal
      s = s.replace(/\./g, "").replace(",", ".");
    }
  } else if (hasComma && !hasDot) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely a decimal separator: 1,5 or 99,90
      s = s.replace(",", ".");
    } else {
      // Thousands separator: 1,234 or 1,234,567
      s = s.replace(/,/g, "");
    }
  }
  // hasDot && !hasComma → standard decimal, leave as-is

  const value = parseFloat(s);
  if (isNaN(value)) return null;

  let result = value;
  if (isParens || isDr) result = -Math.abs(result);
  if (isCr) result = Math.abs(result);

  return result;
}

/**
 * Try multiple date parsing strategies. Returns null if unparseable.
 */
function parseDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  // Native Date handles ISO 8601, RFC 2822, "Jan 1 2024", etc.
  const native = new Date(s);
  if (!isNaN(native.getTime())) return native;

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3]);
    const candidate = new Date(year, parseInt(dmy[2]) - 1, parseInt(dmy[1]));
    if (!isNaN(candidate.getTime())) return candidate;
  }

  return null;
}

/**
 * Resolve the value of a logical field from a CSV row.
 * Uses the frontend mapping first, then falls back to common header name heuristics.
 */
function resolveField(
  row: Record<string, string | undefined>,
  fieldName: string,
  mapping: ColumnMapping
): string | undefined {
  // Find the mapping entry whose value equals fieldName, then look up the lowercased key
  const entry = Object.entries(mapping).find(([, v]) => v === fieldName);
  if (entry) {
    return row[entry[0].toLowerCase().trim()];
  }

  // Heuristic fallback: match common bank CSV column names
  switch (fieldName) {
    case "date":
      return (
        row["date"] ??
        row["transaction date"] ??
        row["transaction_date"] ??
        row["posted date"] ??
        row["posted_date"] ??
        row["value date"] ??
        row["valuedate"]
      );
    case "description":
      return (
        row["description"] ??
        row["memo"] ??
        row["name"] ??
        row["payee"] ??
        row["narrative"] ??
        row["details"] ??
        row["reference"]
      );
    case "amount":
      return (
        row["amount"] ??
        row["value"] ??
        row["transaction amount"] ??
        row["debit/credit"] ??
        row["net amount"]
      );
    case "type":
      return row["type"] ?? row["kind"] ?? row["category_type"] ?? row["debit/credit"];
    case "category":
      return row["category"] ?? row["category name"] ?? row["category_name"];
    case "notes":
      return row["notes"] ?? row["note"] ?? row["comment"] ?? row["remarks"] ?? row["memo"];
    case "tags":
      return row["tags"] ?? row["tag"] ?? row["labels"] ?? row["label"];
    default:
      return undefined;
  }
}

/**
 * Build a lowercase category name → ObjectId string cache for this user.
 * Includes both the user's own categories and system defaults.
 */
async function buildCategoryCache(userId: string): Promise<Map<string, string>> {
  const categories = await Category.find({
    $or: [{ userId }, { isDefault: true }],
  });
  const cache = new Map<string, string>();
  for (const cat of categories) {
    cache.set(cat.name.toLowerCase().trim(), cat._id.toString());
  }
  return cache;
}

/**
 * Import transactions from a CSV string.
 *
 * - Uses the frontend column mapping to resolve field values.
 * - Falls back to heuristic header matching when mapping is absent or incomplete.
 * - Resolves category names to IDs; falls back to defaultCategoryId.
 * - Skips duplicates (same user + date + amount + description).
 * - Collects per-row errors without aborting the whole import.
 */
export async function importCsv(
  userId: string,
  csvContent: string,
  mapping: ColumnMapping,
  accountId: string,
  defaultCategoryId: string
): Promise<ImportResult> {
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw ApiError.badRequest("Account not found or does not belong to you");
  }

  const parseResult = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase(),
  });

  // Collect non-fatal parse warnings but continue — don't abort on a single bad row
  const results: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: (parseResult.errors ?? [])
      .filter((e) => e.type !== "Delimiter")
      .map((e) => `Parse warning at row ${(e.row ?? 0) + 2}: ${e.message}`),
  };

  if (!parseResult.data.length) {
    results.errors.push("CSV file is empty or has no data rows");
    return results;
  }

  const categoryCache = await buildCategoryCache(userId);

  for (let i = 0; i < parseResult.data.length; i++) {
    const row = parseResult.data[i] as Record<string, string | undefined>;
    const rowNum = i + 2;

    // --- date ---
    const rawDate = resolveField(row, "date", mapping);
    if (!rawDate?.trim()) {
      results.errors.push(`Row ${rowNum}: Missing date`);
      continue;
    }
    const parsedDate = parseDate(rawDate);
    if (!parsedDate) {
      results.errors.push(`Row ${rowNum}: Unrecognized date format "${rawDate}"`);
      continue;
    }

    // --- description ---
    const description = resolveField(row, "description", mapping)?.trim();
    if (!description) {
      results.errors.push(`Row ${rowNum}: Missing description`);
      continue;
    }

    // --- amount ---
    const rawAmount = resolveField(row, "amount", mapping);
    if (!rawAmount?.trim()) {
      results.errors.push(`Row ${rowNum}: Missing amount`);
      continue;
    }
    const parsedAmount = parseAmount(rawAmount);
    if (parsedAmount === null || parsedAmount === 0) {
      results.errors.push(`Row ${rowNum}: Invalid amount "${rawAmount}"`);
      continue;
    }

    const absAmount = Math.abs(parsedAmount);

    // --- type ---
    const rawType = resolveField(row, "type", mapping)?.trim().toLowerCase();
    let type: "income" | "expense";
    if (rawType) {
      type = rawType === "income" || rawType === "credit" ? "income" : "expense";
    } else {
      type = parsedAmount > 0 ? "income" : "expense";
    }

    // --- category: resolve by name, fall back to default ---
    const rawCategory = resolveField(row, "category", mapping)?.trim().toLowerCase();
    const resolvedCategoryId = (rawCategory && categoryCache.get(rawCategory)) || defaultCategoryId;

    // --- optional fields ---
    const notes = resolveField(row, "notes", mapping)?.trim() || null;
    const rawTags = resolveField(row, "tags", mapping)?.trim();
    const tags = rawTags
      ? rawTags
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // --- duplicate check ---
    const duplicate = await Transaction.findOne({
      userId,
      date: parsedDate,
      amount: absAmount,
      description,
    });
    if (duplicate) {
      results.skipped += 1;
      continue;
    }

    try {
      await Transaction.create({
        userId,
        accountId,
        type,
        amount: absAmount,
        currency: account.currency,
        categoryId: resolvedCategoryId,
        description,
        notes,
        date: parsedDate,
        tags,
      });
      await adjustAccountBalance(accountId, type, absAmount, "add");
      results.imported += 1;
    } catch (err) {
      results.errors.push(
        `Row ${rowNum} ("${description}"): ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return results;
}
