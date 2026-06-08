import mongoose from "mongoose";
import { Budget, IBudget } from "../models/budget.model";
import { Transaction } from "../models/transaction.model";
import { ApiError } from "../utils/api-error";

function formatBudget(budget: IBudget) {
  return {
    id: budget._id.toString(),
    userId: budget.userId.toString(),
    categoryId: budget.categoryId.toString(),
    amount: budget.amount,
    period: budget.period,
    alertThreshold: budget.alertThreshold,
    isActive: budget.isActive,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

/**
 * Get the start date for the current budget period.
 */
function getPeriodStartDate(period: "monthly" | "weekly"): Date {
  const now = new Date();
  if (period === "monthly") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  // Weekly: start from most recent Monday
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * List all budgets for a user.
 */
export async function list(userId: string) {
  const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });
  return budgets.map(formatBudget);
}

/**
 * Create a new budget.
 */
export async function create(
  userId: string,
  data: {
    categoryId: string;
    amount: number;
    period: string;
    alertThreshold?: number;
  }
) {
  const budget = await Budget.create({
    userId,
    ...data,
  });
  return formatBudget(budget);
}

/**
 * Update a budget. Verifies ownership.
 */
export async function update(
  userId: string,
  budgetId: string,
  data: {
    categoryId?: string;
    amount?: number;
    period?: string;
    alertThreshold?: number;
  }
) {
  const budget = await Budget.findOneAndUpdate(
    { _id: budgetId, userId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!budget) {
    throw ApiError.notFound("Budget not found");
  }
  return formatBudget(budget);
}

/**
 * Delete a budget. Verifies ownership.
 */
export async function remove(userId: string, budgetId: string) {
  const budget = await Budget.findOneAndDelete({ _id: budgetId, userId });
  if (!budget) {
    throw ApiError.notFound("Budget not found");
  }
  return formatBudget(budget);
}

/**
 * Budget summary: for each active budget, aggregate transactions in the
 * current period to calculate spent amount, percentage, and status.
 */
export async function getSummary(userId: string) {
  const budgets = await Budget.find({ userId, isActive: true });

  const summaries = await Promise.all(
    budgets.map(async (budget) => {
      const periodStart = getPeriodStartDate(budget.period);
      const now = new Date();

      const result = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            categoryId: budget.categoryId,
            type: "expense",
            date: { $gte: periodStart, $lte: now },
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$amount" },
          },
        },
      ]);

      const spent = result.length > 0 ? result[0].totalSpent : 0;
      const percentage = budget.amount > 0 ? spent / budget.amount : 0;

      let status: "under_budget" | "warning" | "over_budget";
      if (percentage >= 1) {
        status = "over_budget";
      } else if (percentage >= budget.alertThreshold) {
        status = "warning";
      } else {
        status = "under_budget";
      }

      return {
        ...formatBudget(budget),
        spent,
        percentage: Math.round(percentage * 10000) / 10000, // 4 decimal precision
        status,
      };
    })
  );

  return summaries;
}
