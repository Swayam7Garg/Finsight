import { z } from "zod";

/**
 * Hex color validator.
 */
const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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
 * Schema for creating a new savings goal.
 */
export const createGoalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Goal name is required")
    .max(50, "Goal name must be at most 50 characters"),
  targetAmount: z
    .number()
    .positive("Target amount must be a positive number")
    .finite("Target amount must be a finite number"),
  currentAmount: z
    .number()
    .nonnegative("Current amount cannot be negative")
    .finite("Current amount must be a finite number")
    .default(0),
  deadline: isoDateString.optional(),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color (e.g. #10b981)")
    .default("#10b981"),
  icon: z
    .string()
    .trim()
    .min(1, "Icon is required")
    .max(10, "Icon must be at most 10 characters")
    .default("\uD83C\uDFAF"),
});

/**
 * Schema for updating an existing goal. All fields are optional.
 */
export const updateGoalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Goal name is required")
    .max(50, "Goal name must be at most 50 characters")
    .optional(),
  targetAmount: z
    .number()
    .positive("Target amount must be a positive number")
    .finite("Target amount must be a finite number")
    .optional(),
  currentAmount: z
    .number()
    .nonnegative("Current amount cannot be negative")
    .finite("Current amount must be a finite number")
    .optional(),
  deadline: isoDateString.nullable().optional(),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color (e.g. #10b981)")
    .optional(),
  icon: z
    .string()
    .trim()
    .min(1, "Icon is required")
    .max(10, "Icon must be at most 10 characters")
    .optional(),
});

/**
 * Schema for adding funds to an existing goal.
 */
export const addFundsSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .finite("Amount must be a finite number"),
});

/**
 * Schema representing the goal object returned from the API.
 */
export const goalResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  deadline: z.string().nullable(),
  color: z.string(),
  icon: z.string(),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
