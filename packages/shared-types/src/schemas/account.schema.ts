import { z } from "zod";

/**
 * Supported financial account types.
 */
export const accountTypeEnum = z.enum(["checking", "savings", "credit_card", "cash", "investment"]);

/**
 * Reusable hex color validator (e.g. "#6366f1" or "#fff").
 */
const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Schema for creating a new financial account.
 */
export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(50, "Account name must be at most 50 characters"),
  type: accountTypeEnum,
  balance: z.number().finite("Balance must be a finite number").default(0),
  currency: z
    .string()
    .length(3, "Currency must be a 3-character ISO code")
    .toUpperCase()
    .default("USD"),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color (e.g. #6366f1)")
    .default("#6366f1"),
});

/**
 * Schema for updating an existing account. All fields are optional.
 */
export const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(50, "Account name must be at most 50 characters")
    .optional(),
  type: accountTypeEnum.optional(),
  balance: z.number().finite("Balance must be a finite number").optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-character ISO code")
    .toUpperCase()
    .optional(),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color (e.g. #6366f1)")
    .optional(),
});

/**
 * Schema representing the account object returned from the API.
 */
export const accountResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  type: accountTypeEnum,
  balance: z.number(),
  currency: z.string().length(3),
  color: z.string(),
  isArchived: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
