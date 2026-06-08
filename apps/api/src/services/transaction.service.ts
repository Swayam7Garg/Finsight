import mongoose from "mongoose";
import { Transaction, ITransaction } from "../models/transaction.model";
import { Account } from "../models/account.model";
import { ApiError } from "../utils/api-error";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

function formatTransaction(tx: ITransaction) {
  return {
    id: tx._id.toString(),
    userId: tx.userId.toString(),
    accountId: tx.accountId.toString(),
    type: tx.type,
    amount: tx.amount,
    currency: tx.currency,
    categoryId: tx.categoryId.toString(),
    subcategory: tx.subcategory ?? null,
    description: tx.description,
    notes: tx.notes ?? null,
    date: tx.date.toISOString(),
    isRecurring: tx.isRecurring,
    recurringRuleId: tx.recurringRuleId?.toString() ?? null,
    tags: tx.tags,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

/**
 * Adjust the account balance when a transaction is created or deleted.
 */
export async function adjustAccountBalance(
  accountId: string,
  type: string,
  amount: number,
  operation: "add" | "remove"
) {
  let delta = 0;
  if (type === "income") {
    delta = operation === "add" ? amount : -amount;
  } else if (type === "expense") {
    delta = operation === "add" ? -amount : amount;
  }
  // For transfers, balance adjustment is handled outside (not applicable here)

  if (delta !== 0) {
    await Account.findByIdAndUpdate(accountId, {
      $inc: { balance: delta },
    });
  }
}

interface ListFilters {
  page?: string | number;
  limit?: string | number;
  accountId?: string;
  categoryId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * List transactions with filtering, sorting, and pagination.
 */
export async function list(userId: string, filters: ListFilters) {
  const { page, limit, skip } = parsePagination(filters);

  const query: Record<string, unknown> = { userId };

  if (filters.accountId) {
    query.accountId = filters.accountId;
  }
  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }
  if (filters.type) {
    query.type = filters.type;
  }
  if (filters.startDate || filters.endDate) {
    query.date = {} as Record<string, Date>;
    if (filters.startDate) {
      (query.date as Record<string, Date>).$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      (query.date as Record<string, Date>).$lte = new Date(filters.endDate);
    }
  }
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    query.amount = {} as Record<string, number>;
    if (filters.minAmount !== undefined) {
      (query.amount as Record<string, number>).$gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      (query.amount as Record<string, number>).$lte = filters.maxAmount;
    }
  }
  if (filters.search) {
    query.description = { $regex: filters.search, $options: "i" };
  }

  const sortField = filters.sortBy || "date";
  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [transactions, total] = await Promise.all([
    Transaction.find(query).sort(sortObj).skip(skip).limit(limit),
    Transaction.countDocuments(query),
  ]);

  return buildPaginatedResponse(transactions.map(formatTransaction), total, page, limit);
}

/**
 * Create a new transaction and adjust the account balance.
 */
export async function create(
  userId: string,
  data: {
    accountId: string;
    type: string;
    amount: number;
    categoryId: string;
    subcategory?: string;
    description: string;
    notes?: string;
    date: string;
    isRecurring?: boolean;
    tags?: string[];
  }
) {
  // Verify the account belongs to the user
  const account = await Account.findOne({ _id: data.accountId, userId });
  if (!account) {
    throw ApiError.notFound("Account not found");
  }

  const transaction = await Transaction.create({
    userId,
    accountId: data.accountId,
    type: data.type,
    amount: data.amount,
    currency: account.currency,
    categoryId: data.categoryId,
    subcategory: data.subcategory,
    description: data.description,
    notes: data.notes,
    date: new Date(data.date),
    isRecurring: data.isRecurring ?? false,
    tags: data.tags ?? [],
  });

  await adjustAccountBalance(data.accountId, data.type, data.amount, "add");

  return formatTransaction(transaction);
}

/**
 * Get a transaction by ID. Verifies ownership.
 */
export async function getById(userId: string, transactionId: string) {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
  });
  if (!transaction) {
    throw ApiError.notFound("Transaction not found");
  }
  return formatTransaction(transaction);
}

/**
 * Update a transaction. Adjusts account balance for amount/type changes.
 */
export async function update(
  userId: string,
  transactionId: string,
  data: {
    accountId?: string;
    type?: string;
    amount?: number;
    categoryId?: string;
    subcategory?: string | null;
    description?: string;
    notes?: string | null;
    date?: string;
    isRecurring?: boolean;
    tags?: string[];
  }
) {
  const existing = await Transaction.findOne({ _id: transactionId, userId });
  if (!existing) {
    throw ApiError.notFound("Transaction not found");
  }

  // If accountId is changing, verify new account ownership
  if (data.accountId && data.accountId !== existing.accountId.toString()) {
    const newAccount = await Account.findOne({ _id: data.accountId, userId });
    if (!newAccount) {
      throw ApiError.notFound("Account not found");
    }
  }

  // Reverse the old transaction's effect on the account balance
  await adjustAccountBalance(
    existing.accountId.toString(),
    existing.type,
    existing.amount,
    "remove"
  );

  const updateData: Record<string, unknown> = { ...data };
  if (data.date) {
    updateData.date = new Date(data.date);
  }

  const updated = await Transaction.findByIdAndUpdate(
    transactionId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw ApiError.notFound("Transaction not found");
  }

  // Apply the new transaction's effect on the account balance
  await adjustAccountBalance(updated.accountId.toString(), updated.type, updated.amount, "add");

  return formatTransaction(updated);
}

/**
 * Delete a transaction and reverse its effect on the account balance.
 */
export async function remove(userId: string, transactionId: string) {
  const transaction = await Transaction.findOneAndDelete({
    _id: transactionId,
    userId,
  });

  if (!transaction) {
    throw ApiError.notFound("Transaction not found");
  }

  await adjustAccountBalance(
    transaction.accountId.toString(),
    transaction.type,
    transaction.amount,
    "remove"
  );

  return formatTransaction(transaction);
}

/**
 * Import transactions from parsed CSV data.
 */
export async function importTransactions(
  userId: string,
  transactions: Array<{
    accountId: string;
    type: string;
    amount: number;
    categoryId: string;
    description: string;
    date: string;
  }>
) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const tx of transactions) {
    try {
      // Check for duplicates: same date + amount + description for this user
      const duplicate = await Transaction.findOne({
        userId,
        date: new Date(tx.date),
        amount: tx.amount,
        description: tx.description,
      });

      if (duplicate) {
        results.skipped += 1;
        continue;
      }

      // Verify account ownership
      const account = await Account.findOne({ _id: tx.accountId, userId });
      if (!account) {
        results.errors.push(`Row with description "${tx.description}": account not found`);
        continue;
      }

      await Transaction.create({
        userId,
        accountId: tx.accountId,
        type: tx.type,
        amount: tx.amount,
        currency: account.currency,
        categoryId: tx.categoryId,
        description: tx.description,
        date: new Date(tx.date),
        tags: [],
      });

      await adjustAccountBalance(tx.accountId, tx.type, tx.amount, "add");
      results.imported += 1;
    } catch (error) {
      results.errors.push(
        `Row with description "${tx.description}": ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return results;
}

/**
 * Search transactions by description using regex.
 */
export async function search(userId: string, query: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const filter = {
    userId,
    description: { $regex: query, $options: "i" },
  };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);

  return buildPaginatedResponse(transactions.map(formatTransaction), total, page, limit);
}
