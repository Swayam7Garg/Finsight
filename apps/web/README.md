# @wealthwise/web

Next.js 14 frontend for WealthWise -- the authenticated dashboard where users manage accounts, transactions, budgets, goals, recurring payments, and analytics. Part of the [WealthWise monorepo](../../README.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, Tailwind CSS 3.4, shadcn/ui (Radix primitives) |
| Data fetching | TanStack Query 5, TanStack Table 8 |
| Forms | React Hook Form 7 + `@hookform/resolvers` + Zod |
| Auth | NextAuth.js 4 (CredentialsProvider, JWT strategy) |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Theming | next-themes (dark mode via `.dark` class) |
| Notifications | Sonner (toast) |
| Date handling | date-fns 3 |
| CSV import | PapaParse |
| Shared schemas | `@wealthwise/shared-types` (Zod schemas + inferred types) |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- The API server (`@wealthwise/api`) running on port 4000 (or set `NEXT_PUBLIC_API_URL`)
- `@wealthwise/shared-types` built (`npx turbo build --filter=@wealthwise/shared-types`)

### Environment Variables

Copy `.env.example` at the monorepo root and fill in the web-specific values:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_SECRET` | Yes | -- | Random string, min 32 chars. Used to encrypt the JWT cookie. |
| `NEXTAUTH_URL` | Yes | -- | Base URL of this app (e.g. `http://localhost:3000`). |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api/v1` | Full base URL of the Express API including `/api/v1`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | -- | Google OAuth client ID (if Google login is enabled). |

### Running Standalone

```bash
# From monorepo root
npm run dev              # starts all packages (recommended)

# Or just the web app (shared-types must be built first)
npx turbo dev --filter=@wealthwise/web
```

The app starts on [http://localhost:3000](http://localhost:3000).

---

## App Router Structure

Next.js App Router with three route groups:

```
src/app/
  layout.tsx              # Root layout (providers, fonts, Toaster)
  page.tsx                # Landing / redirect
  not-found.tsx           # 404 page

  (auth)/
    layout.tsx            # Centered card layout, unauthenticated
    login/page.tsx        # Email + password login
    register/page.tsx     # Registration form

  (dashboard)/
    layout.tsx            # Sidebar + TopNav, requires auth session
    dashboard/page.tsx    # Overview widgets
    accounts/page.tsx     # Bank & credit card accounts
    transactions/page.tsx # Transaction list, filters, CSV import
    budgets/page.tsx      # Budget cards with progress bars
    goals/page.tsx        # Savings goals with fund tracking
    recurring/page.tsx    # Recurring bills & subscriptions
    analytics/page.tsx    # Charts: spending, income vs expense, trends, net worth
    settings/page.tsx     # Profile, currency, theme preferences

  (legal)/
    layout.tsx            # Minimal layout, no sidebar
    terms/page.tsx        # Terms of Service
    privacy/page.tsx      # Privacy Policy

  api/auth/[...nextauth]/
    route.ts              # NextAuth.js catch-all API route
```

> Do not add other files under `app/api/` -- the only API route is the NextAuth catch-all.

---

## Components

Organized by feature area under `src/components/`:

### `analytics/`
- **SpendingChart** -- Donut/bar chart of spending by category
- **SavingsRateChart** -- Savings rate over time
- **NetWorthChart** -- Net worth line chart
- **TrendChart** -- Income, expense, and savings rate trends

### `budgets/`
- **BudgetCard** -- Single budget with progress bar and remaining amount
- **BudgetForm** -- Create/edit budget dialog (React Hook Form + Zod)

### `dashboard/`
Seven widgets composing the dashboard overview:
- **NetWorthCard** -- Total net worth across all accounts
- **MonthlySnapshot** -- Income, expenses, and net for the current month
- **RecentTransactions** -- Last 5 transactions
- **BudgetHealth** -- Budget utilization summary
- **SpendingDonut** -- Donut chart of top spending categories
- **UpcomingBills** -- Next recurring payments due
- **GoalProgress** -- Savings goal progress bars

### `goals/`
- **GoalCard** -- Goal with progress, target amount, and add-funds action
- **GoalForm** -- Create/edit goal dialog

### `layout/`
- **Sidebar** -- Desktop sidebar navigation (collapsible)
- **TopNav** -- Top bar with search, theme toggle, user menu
- **MobileNav** -- Bottom tab navigation for mobile
- **SearchCommand** -- Command palette (Cmd+K) powered by cmdk

### `shared/`
- **AccountPicker** -- Account select dropdown
- **CategoryPicker** -- Category select with color indicators
- **CurrencyDisplay** -- Formatted currency output
- **DateRangePicker** -- Date range selector using react-day-picker
- **EmptyState** -- Placeholder for lists with no data

### `transactions/`
- **TransactionTable** -- Sortable, paginated table (TanStack Table)
- **TransactionForm** -- Create/edit transaction dialog
- **CsvImportWizard** -- Multi-step CSV import with column mapping (PapaParse)
- **FilterSidebar** -- Transaction filters (date, type, category, account, amount)

### `ui/`
23 shadcn/ui primitives built on Radix:
`alert-dialog` `avatar` `badge` `button` `calendar` `card` `command` `dialog` `dropdown-menu` `input` `label` `popover` `progress` `scroll-area` `select` `separator` `sheet` `skeleton` `switch` `table` `tabs` `toaster` `tooltip`

> These are generated components. Do not modify their core behavior.

---

## Custom Hooks

All data-fetching hooks live in `src/hooks/` and follow the same pattern: TanStack Query wrappers around `apiClient` calls. Each hook file exports a query-key factory plus individual hooks.

### `use-accounts.ts`
| Hook | Type | Description |
|------|------|-------------|
| `useAccounts` | query | List all accounts |
| `useAccount(id)` | query | Single account by ID |
| `useCreateAccount` | mutation | Create account |
| `useUpdateAccount` | mutation | Update account |
| `useDeleteAccount` | mutation | Delete account |

### `use-transactions.ts`
| Hook | Type | Description |
|------|------|-------------|
| `useTransactions(filters?)` | query | Paginated transaction list with filters |
| `useTransaction(id)` | query | Single transaction by ID |
| `useCreateTransaction` | mutation | Create transaction |
| `useUpdateTransaction` | mutation | Update transaction |
| `useDeleteTransaction` | mutation | Delete transaction |
| `useImportTransactions` | mutation | CSV import via FormData |
| `useSearchTransactions(query)` | query | Full-text search (enabled when query >= 2 chars) |

### `use-categories.ts`
| Hook | Type | Description |
|------|------|-------------|
| `useCategories` | query | List all categories |
| `useCreateCategory` | mutation | Create category |
| `useUpdateCategory` | mutation | Update category |
| `useDeleteCategory` | mutation | Delete category |

### `use-budgets.ts`
| Hook | Type | Description |
|------|------|-------------|
| `useBudgets` | query | List all budgets |
| `useBudgetSummary` | query | Budget summary with spent/remaining |
| `useCreateBudget` | mutation | Create budget |
| `useUpdateBudget` | mutation | Update budget |
| `useDeleteBudget` | mutation | Delete budget |

### `use-goals.ts`
| Hook | Type | Description |
|------|------|-------------|
| `useGoals` | query | List all goals |
| `useCreateGoal` | mutation | Create goal |
| `useUpdateGoal` | mutation | Update goal |
| `useDeleteGoal` | mutation | Delete goal |
| `useAddFunds` | mutation | Add funds to a goal |

### `use-recurring.ts`
| Hook | Type | Description |
|------|------|-------------|
| `useRecurringRules` | query | List all recurring rules |
| `useUpcomingBills` | query | Upcoming recurring payments |
| `useCreateRecurring` | mutation | Create recurring rule |
| `useUpdateRecurring` | mutation | Update recurring rule |
| `useDeleteRecurring` | mutation | Delete recurring rule |
| `useMarkAsPaid` | mutation | Record a payment (creates transaction, updates account) |

### `use-analytics.ts`
| Hook | Type | Description |
|------|------|-------------|
| `useSpendingByCategory(startDate?, endDate?)` | query | Spending breakdown by category |
| `useIncomeVsExpense(months?)` | query | Monthly income vs expense comparison |
| `useMonthlySummary(year?, month?)` | query | Summary for a specific month |
| `useTrends(months?)` | query | Income, expense, savings rate, net worth trends |
| `useNetWorth` | query | Net worth history data points |

---

## API Client

`src/lib/api-client.ts` provides a typed fetch wrapper:

- **Auto-injects Bearer token** from the NextAuth session on every request
- **Methods**: `get<T>`, `post<T>`, `patch<T>`, `delete<T>`
- **Error handling**: Non-OK responses are parsed and thrown as `ApiClientError` with `status`, `code`, `message`, and optional `details`
- **FormData support**: `post` detects `FormData` and omits `Content-Type` so the browser sets the multipart boundary
- **204 handling**: Returns `undefined` for No Content responses

```typescript
import { apiClient } from "@/lib/api-client";

// GET with query params
const accounts = await apiClient.get<ApiResponse<AccountResponse[]>>("/accounts");

// POST
const created = await apiClient.post<ApiResponse<AccountResponse>>("/accounts", { name: "Checking", type: "checking" });

// Error handling
try {
  await apiClient.delete(`/accounts/${id}`);
} catch (err) {
  if (err instanceof ApiClientError) {
    console.error(err.status, err.code, err.message);
  }
}
```

---

## Authentication

### Setup

NextAuth.js 4 with a single `CredentialsProvider` that authenticates against the Express API (`POST /auth/login`). Configuration lives in `src/lib/auth.ts`.

### Flow

1. User submits email + password on `/login`
2. NextAuth calls the Express API `/auth/login` endpoint
3. On success, the API returns `{ user, accessToken, refreshToken }`
4. NextAuth stores `accessToken`, `refreshToken`, and user info in an encrypted JWT cookie
5. The `session` callback exposes `session.accessToken` and `session.user` to client components
6. `apiClient` calls `getSession()` and injects the `Authorization: Bearer <token>` header

### Session Access

```typescript
// Server-side (in API routes or server components)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const session = await getServerSession(authOptions);

// Client-side (in "use client" components)
import { useSession } from "next-auth/react";
const { data: session } = useSession();
```

### Custom Pages

- Sign-in: `/login`
- Error: `/login` (with error query param)
- Session max age: 7 days

---

## Theming

### Dark Mode

Implemented with `next-themes`:
- Uses `class` strategy (`.dark` class on `<html>`)
- Default theme: `system` (follows OS preference)
- Toggle in TopNav switches between light/dark/system

### CSS Variables

All theme colors are defined as HSL values (without the `hsl()` wrapper) in `src/app/globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 222 47% 31%;
  /* ... */
}

.dark {
  --background: 222 47% 5%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

Tailwind references these via the custom color config in `tailwind.config.ts`:

```typescript
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  // ...
}
```

> When adding colors, use the format `220 13% 91%` (space-separated HSL), not `hsl(220, 13%, 91%)`. Tailwind wraps them in `hsl()` automatically.

---

## State Management

- **Server state**: TanStack Query. Default stale time is 5 minutes, GC time is 10 minutes.
- **Form state**: React Hook Form with `zodResolver` and schemas from `@wealthwise/shared-types`.
- **No global client state library** (no Redux, Zustand, etc.). URL params handle filter/page state.

---

## Testing

### Setup

- **Runner**: Vitest with `jsdom` environment
- **Assertions**: `@testing-library/jest-dom` matchers
- **Config**: `vitest.config.ts` at package root

### Current Coverage

41 tests covering utility functions in `src/lib/utils.ts`:
- `cn` (class merging)
- `formatCurrency` (currency formatting)
- `formatDate` / `formatRelativeDate` (date formatting)
- `getInitials` (avatar initials)
- `getCategoryColor` (category color fallback)
- `percentageChange` (percentage calculations)
- `clamp` (number clamping)
- `generateId` (random ID generation)

### Running Tests

```bash
# From monorepo root
npx turbo test --filter=@wealthwise/web

# Watch mode
cd apps/web && npx vitest --watch
```

> The web vitest config does not use `@vitejs/plugin-react` -- it causes ESM errors. The `jsdom` environment is sufficient for utility tests.

---

## Project Structure

```
apps/web/
  src/
    __tests__/
      setup.ts                  # Jest-DOM matcher registration
      utils.test.ts             # Utility function tests (41 tests)
    app/
      layout.tsx                # Root layout with providers
      page.tsx                  # Landing page / redirect
      not-found.tsx             # 404 page
      (auth)/                   # Unauthenticated pages
      (dashboard)/              # Authenticated pages (8 routes)
      (legal)/                  # Terms & privacy
      api/auth/[...nextauth]/   # NextAuth catch-all
    components/
      analytics/                # Chart components (4)
      budgets/                  # Budget card + form (2)
      dashboard/                # Dashboard widgets (7)
      goals/                    # Goal card + form (2)
      layout/                   # Sidebar, TopNav, MobileNav, SearchCommand (4)
      shared/                   # Reusable pickers + displays (5)
      transactions/             # Table, form, CSV import, filters (4)
      ui/                       # shadcn/ui primitives (23)
    hooks/
      use-accounts.ts           # Account CRUD hooks
      use-analytics.ts          # Analytics query hooks
      use-budgets.ts            # Budget CRUD + summary hooks
      use-categories.ts         # Category CRUD hooks
      use-goals.ts              # Goal CRUD + add-funds hooks
      use-recurring.ts          # Recurring CRUD + mark-paid hooks
      use-transactions.ts       # Transaction CRUD + import + search hooks
    lib/
      api-client.ts             # Typed fetch wrapper with auth injection
      auth.ts                   # NextAuth configuration
      constants.ts              # Nav items, account types, currencies, colors
      utils.ts                  # cn, formatCurrency, formatDate, etc.
    providers/
      auth-provider.tsx         # NextAuth SessionProvider
      query-provider.tsx        # TanStack QueryClientProvider
      theme-provider.tsx        # next-themes ThemeProvider
  public/                       # Static assets
  tailwind.config.ts            # Tailwind theme + custom colors
  next.config.js                # Next.js config (standalone output, transpilePackages)
  vitest.config.ts              # Test configuration
  Dockerfile                    # Development Docker image
  Dockerfile.prod               # Production Docker image (standalone)
```

---

## Adding a New Page

1. **Create the route** -- Add `src/app/(dashboard)/<route>/page.tsx`. Use `"use client"` if the page has interactive state.

2. **Add sidebar link** -- Add an entry to `NAV_ITEMS` in `src/lib/constants.ts`:
   ```typescript
   { label: "Reports", href: "/reports", icon: FileText },
   ```

3. **Create hooks** -- Add `src/hooks/use-<entity>.ts` following the existing pattern: export a key factory and hooks wrapping `apiClient` calls.

4. **Create components** -- Add `src/components/<entity>/` with feature-specific components. Use shadcn/ui primitives, React Hook Form for forms, and Sonner toasts on mutations.

5. **Types** -- Add Zod schemas in `@wealthwise/shared-types` first. Import inferred types in your hooks and components.

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev --port 3000` | Start dev server with hot reload |
| `build` | `next build` | Production build (standalone output) |
| `start` | `next start` | Start production server |
| `test` | `vitest` | Run tests (watch mode by default) |
| `lint` | `next lint` | TypeScript type checking + ESLint |
| `clean` | `rm -rf .next` | Remove build artifacts |
