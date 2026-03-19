# @wealthwise/shared-types

Shared Zod schemas and TypeScript types used by both the API (`@wealthwise/api`) and web (`@wealthwise/web`) packages in the WealthWise monorepo.

## Overview

This package is the single source of truth for all data validation and type definitions across the WealthWise stack. Schemas are defined once with [Zod](https://zod.dev/) and TypeScript types are inferred from them -- no hand-written types that can drift out of sync.

## Installation

This is an internal monorepo package. Add it as a dependency in any workspace `package.json`:

```json
{
  "dependencies": {
    "@wealthwise/shared-types": "*"
  }
}
```

Turborepo handles build ordering automatically via `dependsOn: ["^build"]`.

## Usage

```typescript
// Import schemas for validation
import { createAccountSchema, loginSchema } from "@wealthwise/shared-types";

// Import types for type annotations
import type { AccountResponse, CreateAccountInput } from "@wealthwise/shared-types";

// Import enums for dropdowns, selects, etc.
import { accountTypeEnum, budgetPeriodEnum } from "@wealthwise/shared-types";

// Validate input
const result = createAccountSchema.safeParse(userInput);
if (!result.success) {
  // result.error contains Zod validation errors
}
```

## Schemas

### User (`user.schema.ts`)

| Schema | Fields | Notes |
|--------|--------|-------|
| `registerSchema` | `email`, `name` (2-50 chars), `password` (8+ chars, 1 uppercase, 1 lowercase, 1 digit) | Email is trimmed and lowercased |
| `loginSchema` | `email`, `password` | Password only requires min 1 char (non-empty) |
| `updateProfileSchema` | `name?`, `currency?` (3-char ISO code) | All fields optional |
| `userResponseSchema` | `id`, `email`, `name`, `avatarUrl?` (nullable), `currency`, `createdAt` | API response shape |

### Account (`account.schema.ts`)

| Schema | Fields | Notes |
|--------|--------|-------|
| `createAccountSchema` | `name` (1-50 chars), `type`, `balance` (default 0), `currency` (default "USD"), `color` (default "#6366f1") | Balance must be finite; color is hex |
| `updateAccountSchema` | All fields from create, all optional | Same validations apply |
| `accountResponseSchema` | `id`, `userId`, `name`, `type`, `balance`, `currency`, `color`, `isArchived`, `createdAt`, `updatedAt` | API response shape |

**Account types:** `checking`, `savings`, `credit_card`, `cash`, `investment`

### Transaction (`transaction.schema.ts`)

| Schema | Fields | Notes |
|--------|--------|-------|
| `createTransactionSchema` | `accountId`, `type`, `amount` (>0), `categoryId`, `description` (1-200 chars), `date` (ISO string), `subcategory?` (max 50), `notes?` (max 500), `isRecurring` (default false), `tags` (max 10 items, default []) | Tags are strings up to 30 chars each |
| `updateTransactionSchema` | All fields from create, all optional | `subcategory` and `notes` can be set to `null` |
| `transactionQuerySchema` | `page` (default 1), `limit` (default 20, max 100), `accountId?`, `categoryId?`, `type?`, `startDate?`, `endDate?`, `minAmount?`, `maxAmount?`, `search?` (max 100), `sortBy` (default "date"), `sortOrder` (default "desc") | Numeric fields use `z.coerce` for query string parsing |
| `transactionResponseSchema` | `id`, `userId`, `accountId`, `type`, `amount`, `currency`, `categoryId`, `subcategory` (nullable), `description`, `notes` (nullable), `date`, `isRecurring`, `recurringRuleId` (nullable), `tags`, `createdAt`, `updatedAt` | API response shape |

**Transaction types:** `income`, `expense`, `transfer`
**Sort fields:** `date`, `amount`, `description`, `createdAt`
**Sort order:** `asc`, `desc`

### Category (`category.schema.ts`)

| Schema | Fields | Notes |
|--------|--------|-------|
| `createCategorySchema` | `name` (1-30 chars), `icon` (1-10 chars), `color` (hex), `type` | All required |
| `updateCategorySchema` | All fields from create, all optional | Same validations apply |
| `categoryResponseSchema` | `id`, `userId` (nullable for system defaults), `name`, `icon`, `color`, `type`, `isDefault`, `createdAt` | API response shape |

**Category types:** `income`, `expense`

### Budget (`budget.schema.ts`)

| Schema | Fields | Notes |
|--------|--------|-------|
| `createBudgetSchema` | `categoryId`, `amount` (>0), `period`, `alertThreshold` (0-1, default 0.8) | Threshold is a ratio (0.8 = 80%) |
| `updateBudgetSchema` | All fields from create, all optional | Same validations apply |
| `budgetResponseSchema` | `id`, `userId`, `categoryId`, `amount`, `period`, `alertThreshold`, `isActive`, `createdAt`, `updatedAt` | API response shape |
| `budgetSummarySchema` | All fields from response + `spent`, `percentage`, `status` | Extends budgetResponseSchema with computed spending metrics |

**Periods:** `monthly`, `weekly`
**Statuses:** `under_budget`, `warning`, `over_budget`

### Goal (`goal.schema.ts`)

| Schema | Fields | Notes |
|--------|--------|-------|
| `createGoalSchema` | `name` (1-50 chars), `targetAmount` (>0), `currentAmount` (>=0, default 0), `deadline?` (ISO date), `color` (default "#10b981"), `icon` (default target emoji) | |
| `updateGoalSchema` | All fields from create, all optional | `deadline` can be set to `null` |
| `addFundsSchema` | `amount` (>0) | Separate schema for the add-funds endpoint |
| `goalResponseSchema` | `id`, `userId`, `name`, `targetAmount`, `currentAmount`, `deadline` (nullable), `color`, `icon`, `isCompleted`, `createdAt`, `updatedAt` | API response shape |

### Recurring (`recurring.schema.ts`)

| Schema | Fields | Notes |
|--------|--------|-------|
| `createRecurringSchema` | `accountId`, `categoryId`, `type`, `amount` (>0), `description` (1-200 chars), `frequency`, `startDate` (ISO), `endDate?` (ISO) | Transfers are not supported for recurring |
| `updateRecurringSchema` | All fields from create, all optional | `endDate` can be set to `null` |
| `recurringResponseSchema` | `id`, `userId`, `accountId`, `categoryId`, `type`, `amount`, `description`, `frequency`, `startDate`, `nextDueDate`, `endDate` (nullable), `isActive`, `createdAt`, `updatedAt` | API response shape |

**Recurring types:** `income`, `expense`
**Frequencies:** `daily`, `weekly`, `biweekly`, `monthly`, `yearly`

## Types

All TypeScript types are inferred from their corresponding Zod schemas using `z.infer<>`. They are exported from the package root as type-only exports.

### User
- `RegisterInput` -- inferred from `registerSchema`
- `LoginInput` -- inferred from `loginSchema`
- `UpdateProfileInput` -- inferred from `updateProfileSchema`
- `UserResponse` -- inferred from `userResponseSchema`

### Account
- `CreateAccountInput` -- inferred from `createAccountSchema`
- `UpdateAccountInput` -- inferred from `updateAccountSchema`
- `AccountResponse` -- inferred from `accountResponseSchema`

### Transaction
- `CreateTransactionInput` -- inferred from `createTransactionSchema`
- `UpdateTransactionInput` -- inferred from `updateTransactionSchema`
- `TransactionQuery` -- inferred from `transactionQuerySchema`
- `TransactionResponse` -- inferred from `transactionResponseSchema`

### Category
- `CreateCategoryInput` -- inferred from `createCategorySchema`
- `UpdateCategoryInput` -- inferred from `updateCategorySchema`
- `CategoryResponse` -- inferred from `categoryResponseSchema`

### Budget
- `CreateBudgetInput` -- inferred from `createBudgetSchema`
- `UpdateBudgetInput` -- inferred from `updateBudgetSchema`
- `BudgetResponse` -- inferred from `budgetResponseSchema`
- `BudgetSummary` -- inferred from `budgetSummarySchema`

### Goal
- `CreateGoalInput` -- inferred from `createGoalSchema`
- `UpdateGoalInput` -- inferred from `updateGoalSchema`
- `AddFundsInput` -- inferred from `addFundsSchema`
- `GoalResponse` -- inferred from `goalResponseSchema`

### Recurring
- `CreateRecurringInput` -- inferred from `createRecurringSchema`
- `UpdateRecurringInput` -- inferred from `updateRecurringSchema`
- `RecurringResponse` -- inferred from `recurringResponseSchema`

## API Wrapper Types

Three generic interfaces define the standard API response envelopes used across the entire backend:

```typescript
// Standard success response wrapping a single resource
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Paginated success response wrapping a list of resources
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Standard error response returned when a request fails
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>; // field name -> validation messages
  };
}
```

## Enums

All enums are Zod enums exported as runtime values. Use `.options` to get the array of valid values.

| Export | Values |
|--------|--------|
| `accountTypeEnum` | `checking`, `savings`, `credit_card`, `cash`, `investment` |
| `transactionTypeEnum` | `income`, `expense`, `transfer` |
| `transactionSortByEnum` | `date`, `amount`, `description`, `createdAt` |
| `sortOrderEnum` | `asc`, `desc` |
| `categoryTypeEnum` | `income`, `expense` |
| `budgetPeriodEnum` | `monthly`, `weekly` |
| `budgetStatusEnum` | `under_budget`, `warning`, `over_budget` |
| `recurringTypeEnum` | `income`, `expense` |
| `frequencyEnum` | `daily`, `weekly`, `biweekly`, `monthly`, `yearly` |

```typescript
// Example: use enum values for a select dropdown
import { accountTypeEnum } from "@wealthwise/shared-types";

const options = accountTypeEnum.options; // ["checking", "savings", "credit_card", "cash", "investment"]
```

## Testing

151 tests cover all schemas with comprehensive validation of valid inputs, invalid inputs, edge cases, enum boundaries, optional fields, and default values.

```bash
# Run shared-types tests
npx turbo test --filter=@wealthwise/shared-types

# Run directly with vitest
cd packages/shared-types && npx vitest
```

Test file: `src/__tests__/schemas.test.ts`

## Adding a New Schema

1. Create the schema file in `src/schemas/<entity>.schema.ts`
   - Export Zod schemas for create, update, and response
   - Export any enums the schema uses
2. Export schemas and enums from `src/index.ts`
3. Add inferred types in `src/types/index.ts` using `z.infer<typeof schema>`
4. Export types from `src/index.ts`
5. Add tests in `src/__tests__/` covering valid/invalid inputs and edge cases

## Project Structure

```
packages/shared-types/
  src/
    schemas/
      user.schema.ts
      account.schema.ts
      transaction.schema.ts
      category.schema.ts
      budget.schema.ts
      goal.schema.ts
      recurring.schema.ts
    types/
      index.ts            # Inferred types + API wrapper interfaces
    __tests__/
      schemas.test.ts     # 151 tests
    index.ts              # Package entry point (re-exports everything)
  package.json
  tsconfig.json
  vitest.config.ts
```
