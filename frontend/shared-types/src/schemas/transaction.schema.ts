import { z } from "zod";

/**
 * Transaction type: money coming in, going out, or moving between accounts.
 */
export const transactionTypeEnum = z.enum(["income", "expense", "transfer"]);

/**
 * Allowed sort fields for transaction queries.
 */
export const transactionSortByEnum = z.enum(["date", "amount", "description", "createdAt"]);

/**
 * Sort direction.
 */
export const sortOrderEnum = z.enum(["asc", "desc"]);

/**
 * ISO date string validator (YYYY-MM-DD or full ISO 8601 datetime).
 */
const isoDateString = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: "Must be a valid ISO date string" }
);

/**
 * Schema for creating a new transaction.
 */
export const createTransactionSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  type: transactionTypeEnum,
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .finite("Amount must be a finite number"),
  categoryId: z.string().min(1, "Category ID is required"),
  subcategory: z.string().trim().max(50, "Subcategory must be at most 50 characters").optional(),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be at most 200 characters"),
  notes: z.string().trim().max(500, "Notes must be at most 500 characters").optional(),
  date: isoDateString,
  isRecurring: z.boolean().default(false),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10, "A transaction can have at most 10 tags")
    .default([]),
});

/**
 * Schema for updating an existing transaction. All fields are optional.
 */
export const updateTransactionSchema = z.object({
  accountId: z.string().min(1, "Account ID is required").optional(),
  type: transactionTypeEnum.optional(),
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .finite("Amount must be a finite number")
    .optional(),
  categoryId: z.string().min(1, "Category ID is required").optional(),
  subcategory: z
    .string()
    .trim()
    .max(50, "Subcategory must be at most 50 characters")
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be at most 200 characters")
    .optional(),
  notes: z.string().trim().max(500, "Notes must be at most 500 characters").nullable().optional(),
  date: isoDateString.optional(),
  isRecurring: z.boolean().optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10, "A transaction can have at most 10 tags")
    .optional(),
});

/**
 * Schema for querying/filtering transactions with pagination.
 */
export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive("Page must be a positive integer").default(1),
  limit: z.coerce
    .number()
    .int()
    .positive("Limit must be a positive integer")
    .max(100, "Limit must be at most 100")
    .default(20),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: transactionTypeEnum.optional(),
  startDate: isoDateString.optional(),
  endDate: isoDateString.optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: transactionSortByEnum.default("date"),
  sortOrder: sortOrderEnum.default("desc"),
});

/**
 * Schema representing the transaction object returned from the API.
 */
export const transactionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  accountId: z.string(),
  type: transactionTypeEnum,
  amount: z.number(),
  currency: z.string().length(3),
  categoryId: z.string(),
  subcategory: z.string().nullable(),
  description: z.string(),
  notes: z.string().nullable(),
  date: z.string(),
  isRecurring: z.boolean(),
  recurringRuleId: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
