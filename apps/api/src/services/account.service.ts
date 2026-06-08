import mongoose from "mongoose";
import { Account, IAccount } from "../models/account.model";
import { Transaction } from "../models/transaction.model";
import { ApiError } from "../utils/api-error";

function formatAccount(account: IAccount) {
  return {
    id: account._id.toString(),
    userId: account.userId.toString(),
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
    color: account.color,
    isArchived: account.isArchived,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

/**
 * List all non-archived accounts for a user.
 */
export async function list(userId: string) {
  const accounts = await Account.find({
    userId,
    isArchived: false,
  }).sort({ createdAt: -1 });

  return accounts.map(formatAccount);
}

/**
 * Create a new account.
 */
export async function create(
  userId: string,
  data: {
    name: string;
    type: string;
    balance?: number;
    currency?: string;
    color?: string;
  }
) {
  const account = await Account.create({
    userId,
    ...data,
  });
  return formatAccount(account);
}

/**
 * Get a single account by ID. Verifies ownership.
 */
export async function getById(userId: string, accountId: string) {
  const account = await Account.findOne({
    _id: accountId,
    userId,
  });
  if (!account) {
    throw ApiError.notFound("Account not found");
  }
  return formatAccount(account);
}

/**
 * Update an account. Verifies ownership.
 */
export async function update(
  userId: string,
  accountId: string,
  data: {
    name?: string;
    type?: string;
    balance?: number;
    currency?: string;
    color?: string;
  }
) {
  const account = await Account.findOneAndUpdate(
    { _id: accountId, userId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!account) {
    throw ApiError.notFound("Account not found");
  }
  return formatAccount(account);
}

/**
 * Archive (soft-delete) an account. Verifies ownership.
 */
export async function archive(userId: string, accountId: string) {
  const account = await Account.findOneAndUpdate(
    { _id: accountId, userId },
    { $set: { isArchived: true } },
    { new: true }
  );
  if (!account) {
    throw ApiError.notFound("Account not found");
  }
  return formatAccount(account);
}

/**
 * Get balance history for an account based on transaction aggregation.
 * Returns monthly balance snapshots.
 */
export async function getBalanceHistory(userId: string, accountId: string) {
  // First verify the account exists and is owned by the user
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw ApiError.notFound("Account not found");
  }

  const pipeline = [
    {
      $match: {
        accountId: new mongoose.Types.ObjectId(accountId),
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $sort: { "_id.year": 1 as const, "_id.month": 1 as const },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        income: 1,
        expense: 1,
        net: { $subtract: ["$income", "$expense"] },
      },
    },
  ];

  const history = await Transaction.aggregate(pipeline);

  // Build a running balance from the account creation
  let runningBalance = 0;
  const balanceHistory = history.map((entry) => {
    runningBalance += entry.net;
    return {
      year: entry.year,
      month: entry.month,
      balance: runningBalance,
      income: entry.income,
      expense: entry.expense,
    };
  });

  return balanceHistory;
}
