import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model";
import { Account } from "../models/account.model";

/**
 * Spending breakdown by category for a date range.
 */
export async function spendingByCategory(userId: string, startDate: string, endDate: string) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: "expense",
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $project: {
        _id: 0,
        categoryId: { $toString: "$_id" },
        categoryName: "$category.name",
        categoryIcon: "$category.icon",
        categoryColor: "$category.color",
        total: 1,
        count: 1,
      },
    },
    {
      $sort: { total: -1 as const },
    },
  ];

  const results = await Transaction.aggregate(pipeline);

  // Compute grand total for percentage calculation
  const grandTotal = results.reduce((sum: number, r: { total: number }) => sum + r.total, 0);

  return results.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    categoryIcon: r.categoryIcon,
    categoryColor: r.categoryColor,
    amount: r.total,
    transactionCount: r.count,
    percentage: grandTotal > 0 ? Math.round((r.total / grandTotal) * 10000) / 100 : 0,
  }));
}

/**
 * Income vs. expense comparison per month for the last N months.
 */
export async function incomeVsExpense(userId: string, months: number) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: { $in: ["income", "expense"] },
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $sort: { "_id.year": 1 as const, "_id.month": 1 as const },
    },
  ];

  const raw = await Transaction.aggregate(pipeline);

  // Reshape into monthly entries with income and expense
  const monthlyMap = new Map<
    string,
    { year: number; month: number; income: number; expense: number }
  >();

  for (const entry of raw) {
    const key = `${entry._id.year}-${entry._id.month}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        year: entry._id.year,
        month: entry._id.month,
        income: 0,
        expense: 0,
      });
    }
    const record = monthlyMap.get(key)!;
    if (entry._id.type === "income") {
      record.income = entry.total;
    } else {
      record.expense = entry.total;
    }
  }

  return Array.from(monthlyMap.values())
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .map((entry) => ({
      month: `${entry.year}-${String(entry.month).padStart(2, "0")}`,
      income: entry.income,
      expense: entry.expense,
      net: entry.income - entry.expense,
    }));
}

/**
 * Monthly summary: total income, total expenses, and savings for a given month.
 */
export async function monthlySummary(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last moment of the month

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: { $in: ["income", "expense"] },
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ];

  const results = await Transaction.aggregate(pipeline);

  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const r of results) {
    if (r._id === "income") {
      income = r.total;
      incomeCount = r.count;
    } else if (r._id === "expense") {
      expense = r.total;
      expenseCount = r.count;
    }
  }

  const savings = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 10000) / 100 : 0;

  return {
    totalIncome: income,
    totalExpenses: expense,
    netSavings: savings,
    savingsRate,
    transactionCount: incomeCount + expenseCount,
    topCategories: [],
  };
}

/**
 * Monthly trends: income, expense, savings rate, and net worth over N months.
 */
export async function trends(userId: string, months: number) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: { $in: ["income", "expense"] },
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $sort: { "_id.year": 1 as const, "_id.month": 1 as const },
    },
  ];

  const raw = await Transaction.aggregate(pipeline);

  // Reshape into monthly entries with income and expense
  const monthlyMap = new Map<
    string,
    { year: number; month: number; income: number; expense: number }
  >();

  for (const entry of raw) {
    const key = `${entry._id.year}-${entry._id.month}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        year: entry._id.year,
        month: entry._id.month,
        income: 0,
        expense: 0,
      });
    }
    const record = monthlyMap.get(key)!;
    if (entry._id.type === "income") {
      record.income = entry.total;
    } else {
      record.expense = entry.total;
    }
  }

  const sorted = Array.from(monthlyMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  let runningNetWorth = 0;
  return sorted.map((entry) => {
    const net = entry.income - entry.expense;
    runningNetWorth += net;
    const savingsRate = entry.income > 0 ? Math.round((net / entry.income) * 10000) / 100 : 0;

    return {
      month: `${entry.year}-${String(entry.month).padStart(2, "0")}`,
      income: entry.income,
      expense: entry.expense,
      savingsRate,
      netWorth: runningNetWorth,
    };
  });
}

/**
 * Average spending by day of week for a date range.
 */
export async function spendingByDayOfWeek(userId: string, startDate: string, endDate: string) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: "expense",
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: "$date" }, // 1=Sun, 7=Sat
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 as const },
    },
  ];

  const results = await Transaction.aggregate(pipeline);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Fill all 7 days (some may have no transactions)
  return dayNames.map((name, index) => {
    const found = results.find(
      (r: { _id: number; total: number; count: number }) => r._id === index + 1
    );
    return {
      day: name,
      total: found ? found.total : 0,
      count: found ? found.count : 0,
      average: found && found.count > 0 ? Math.round((found.total / found.count) * 100) / 100 : 0,
    };
  });
}

/**
 * Expense breakdown by top categories per month over N months.
 */
export async function categoryMonthlyBreakdown(userId: string, months: number) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: "expense",
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          categoryId: "$categoryId",
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id.categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $sort: { "_id.year": 1 as const, "_id.month": 1 as const, total: -1 as const },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        categoryName: "$category.name",
        categoryColor: "$category.color",
        total: 1,
      },
    },
  ];

  const results = await Transaction.aggregate(pipeline);

  // Identify top categories by overall total
  const categoryTotals = new Map<string, number>();
  for (const r of results) {
    categoryTotals.set(r.categoryName, (categoryTotals.get(r.categoryName) ?? 0) + r.total);
  }
  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  // Build color map
  const colorMap = new Map<string, string>();
  for (const r of results) {
    if (!colorMap.has(r.categoryName)) {
      colorMap.set(r.categoryName, r.categoryColor);
    }
  }

  // Reshape into monthly entries with category keys
  const monthlyMap = new Map<string, Record<string, number | string>>();
  for (const r of results) {
    const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { month: key });
    }
    const record = monthlyMap.get(key)!;
    if (topCategories.includes(r.categoryName)) {
      record[r.categoryName] = ((record[r.categoryName] as number) ?? 0) + r.total;
    } else {
      record["Other"] = ((record["Other"] as number) ?? 0) + r.total;
    }
  }

  return {
    months: Array.from(monthlyMap.values()).sort((a, b) =>
      (a.month as string).localeCompare(b.month as string)
    ),
    categories: topCategories,
    colors: Object.fromEntries(
      topCategories.map((name) => [name, colorMap.get(name) ?? "#94a3b8"])
    ),
  };
}

/**
 * Net worth over time: aggregate all account balances monthly.
 * Builds a monthly running total from all transactions grouped by account.
 */
export async function netWorth(userId: string) {
  // Get all accounts (including archived for historical completeness)
  const accounts = await Account.find({ userId });

  if (accounts.length === 0) {
    return [];
  }

  const pipeline = [
    {
      $match: {
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

  const monthly = await Transaction.aggregate(pipeline);

  // Build running total (net worth progression)
  let runningTotal = 0;
  return monthly.map((entry) => {
    runningTotal += entry.net;
    return {
      date: `${entry.year}-${String(entry.month).padStart(2, "0")}`,
      amount: runningTotal,
    };
  });
}
