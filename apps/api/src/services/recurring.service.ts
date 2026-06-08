import { RecurringRule, IRecurringRule } from "../models/recurring-rule.model";
import { Transaction } from "../models/transaction.model";
import { Account } from "../models/account.model";
import { ApiError } from "../utils/api-error";

function formatRule(rule: IRecurringRule) {
  return {
    id: rule._id.toString(),
    userId: rule.userId.toString(),
    accountId: rule.accountId.toString(),
    categoryId: rule.categoryId.toString(),
    type: rule.type,
    amount: rule.amount,
    description: rule.description,
    frequency: rule.frequency,
    startDate: rule.startDate.toISOString(),
    nextDueDate: rule.nextDueDate.toISOString(),
    endDate: rule.endDate ? rule.endDate.toISOString() : null,
    isActive: rule.isActive,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

/**
 * Advance the nextDueDate based on the frequency.
 */
function advanceDate(current: Date, frequency: string): Date {
  const next = new Date(current);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }

  return next;
}

/**
 * List all recurring rules for a user.
 */
export async function list(userId: string) {
  const rules = await RecurringRule.find({ userId }).sort({ nextDueDate: 1 });
  return rules.map(formatRule);
}

/**
 * Create a new recurring rule.
 */
export async function create(
  userId: string,
  data: {
    accountId: string;
    categoryId: string;
    type: string;
    amount: number;
    description: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }
) {
  // Verify account ownership
  const account = await Account.findOne({ _id: data.accountId, userId });
  if (!account) {
    throw ApiError.notFound("Account not found");
  }

  const rule = await RecurringRule.create({
    userId,
    accountId: data.accountId,
    categoryId: data.categoryId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    frequency: data.frequency,
    startDate: new Date(data.startDate),
    nextDueDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
  });

  return formatRule(rule);
}

/**
 * Update a recurring rule. Verifies ownership.
 */
export async function update(
  userId: string,
  ruleId: string,
  data: {
    accountId?: string;
    categoryId?: string;
    type?: string;
    amount?: number;
    description?: string;
    frequency?: string;
    startDate?: string;
    endDate?: string | null;
  }
) {
  if (data.accountId) {
    const account = await Account.findOne({ _id: data.accountId, userId });
    if (!account) {
      throw ApiError.notFound("Account not found");
    }
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.startDate) {
    updateData.startDate = new Date(data.startDate);
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  }

  const rule = await RecurringRule.findOneAndUpdate(
    { _id: ruleId, userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!rule) {
    throw ApiError.notFound("Recurring rule not found");
  }
  return formatRule(rule);
}

/**
 * Delete a recurring rule. Verifies ownership.
 */
export async function remove(userId: string, ruleId: string) {
  const rule = await RecurringRule.findOneAndDelete({ _id: ruleId, userId });
  if (!rule) {
    throw ApiError.notFound("Recurring rule not found");
  }
  return formatRule(rule);
}

/**
 * Get upcoming recurring rules (nextDueDate within the next 30 days).
 */
export async function getUpcoming(userId: string) {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const rules = await RecurringRule.find({
    userId,
    isActive: true,
    nextDueDate: { $gte: now, $lte: thirtyDaysFromNow },
  }).sort({ nextDueDate: 1 });

  return rules.map(formatRule);
}

/**
 * Mark a recurring rule as "paid" for its current cycle:
 *  1. Create a real transaction from the rule details.
 *  2. Advance nextDueDate based on frequency.
 *  3. If the new nextDueDate passes endDate, deactivate the rule.
 */
export async function markAsPaid(userId: string, ruleId: string) {
  const rule = await RecurringRule.findOne({ _id: ruleId, userId });
  if (!rule) {
    throw ApiError.notFound("Recurring rule not found");
  }

  if (!rule.isActive) {
    throw ApiError.badRequest("This recurring rule is no longer active");
  }

  // Verify account still exists and belongs to user
  const account = await Account.findOne({ _id: rule.accountId, userId });
  if (!account) {
    throw ApiError.notFound("The account associated with this rule was not found");
  }

  // Create a real transaction
  const transaction = await Transaction.create({
    userId: rule.userId,
    accountId: rule.accountId,
    type: rule.type,
    amount: rule.amount,
    currency: account.currency,
    categoryId: rule.categoryId,
    description: rule.description,
    date: rule.nextDueDate,
    isRecurring: true,
    recurringRuleId: rule._id,
    tags: [],
  });

  // Adjust account balance
  const balanceDelta = rule.type === "income" ? rule.amount : -rule.amount;
  await Account.findByIdAndUpdate(rule.accountId, {
    $inc: { balance: balanceDelta },
  });

  // Advance the next due date
  const newNextDueDate = advanceDate(rule.nextDueDate, rule.frequency);

  // Check if rule should be deactivated
  if (rule.endDate && newNextDueDate > rule.endDate) {
    rule.isActive = false;
  }

  rule.nextDueDate = newNextDueDate;
  await rule.save();

  return {
    rule: formatRule(rule),
    transaction: {
      id: transaction._id.toString(),
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date.toISOString(),
    },
  };
}
