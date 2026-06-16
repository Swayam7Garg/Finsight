import { z } from "zod";

/**
 * Recurring transaction type - income or expense only (transfers are not recurring).
 */
export const recurringTypeEnum = z.enum(["income", "expense"]);

/**
 * How often the recurring transaction repeats.
 */
export const frequencyEnum = z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]);

/**
 * ISO date string validator.
 */
const isoDateString = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: "Must be a valid ISO date string" }
);

/**
 * Schema for creating a new recurring transaction rule.
 */
export const createRecurringSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  type: recurringTypeEnum,
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .finite("Amount must be a finite number"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be at most 200 characters"),
  frequency: frequencyEnum,
  startDate: isoDateString,
  endDate: isoDateString.optional(),
});

/**
 * Schema for updating an existing recurring rule. All fields are optional.
 */
export const updateRecurringSchema = z.object({
  accountId: z.string().min(1, "Account ID is required").optional(),
  categoryId: z.string().min(1, "Category ID is required").optional(),
  type: recurringTypeEnum.optional(),
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .finite("Amount must be a finite number")
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be at most 200 characters")
    .optional(),
  frequency: frequencyEnum.optional(),
  startDate: isoDateString.optional(),
  endDate: isoDateString.nullable().optional(),
});

/**
 * Schema representing the recurring rule object returned from the API.
 */
export const recurringResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  accountId: z.string(),
  categoryId: z.string(),
  type: recurringTypeEnum,
  amount: z.number(),
  description: z.string(),
  frequency: frequencyEnum,
  startDate: z.string(),
  nextDueDate: z.string(),
  endDate: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
