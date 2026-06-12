import { z } from "zod";

/**
 * Budget period - how often the budget resets.
 */
export const budgetPeriodEnum = z.enum(["monthly", "weekly"]);

/**
 * Budget health status derived from spending vs. allocated amount.
 */
export const budgetStatusEnum = z.enum(["under_budget", "warning", "over_budget"]);

/**
 * Schema for creating a new budget.
 */
export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  amount: z
    .number()
    .positive("Budget amount must be a positive number")
    .finite("Budget amount must be a finite number"),
  period: budgetPeriodEnum,
  alertThreshold: z
    .number()
    .min(0, "Alert threshold must be between 0 and 1")
    .max(1, "Alert threshold must be between 0 and 1")
    .default(0.8),
});

/**
 * Schema for updating an existing budget. All fields are optional.
 */
export const updateBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required").optional(),
  amount: z
    .number()
    .positive("Budget amount must be a positive number")
    .finite("Budget amount must be a finite number")
    .optional(),
  period: budgetPeriodEnum.optional(),
  alertThreshold: z
    .number()
    .min(0, "Alert threshold must be between 0 and 1")
    .max(1, "Alert threshold must be between 0 and 1")
    .optional(),
});

/**
 * Schema representing the budget object returned from the API.
 */
export const budgetResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  categoryId: z.string(),
  amount: z.number(),
  period: budgetPeriodEnum,
  alertThreshold: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schema for a budget summary that includes current spending information.
 * Extends the budget response with computed spending metrics.
 */
export const budgetSummarySchema = budgetResponseSchema.extend({
  spent: z.number().nonnegative(),
  percentage: z.number().nonnegative(),
  status: budgetStatusEnum,
});
