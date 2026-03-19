# WealthWise - Smart Personal Finance Manager

## Vision

A full-stack personal finance application that helps users take control of their money through intelligent transaction tracking, budget management, financial goal setting, and rich analytics. Not a toy app - a genuinely useful tool with real-world complexity: multi-account support, recurring transaction detection, CSV bank statement imports, spending trend analysis, and budget alerts.

---

## Tech Stack

| Layer            | Technology                                                 |
| ---------------- | ---------------------------------------------------------- |
| **Frontend**     | Next.js 14 (App Router) + TypeScript                       |
| **UI**           | Tailwind CSS + shadcn/ui component library                 |
| **Charts**       | Recharts                                                   |
| **Server State** | TanStack Query (React Query) v5                            |
| **Forms**        | React Hook Form + Zod validation                           |
| **Backend**      | Node.js + Express + TypeScript                             |
| **Database**     | MongoDB + Mongoose ODM                                     |
| **Auth**         | NextAuth.js (Credentials + Google OAuth) with JWT sessions |
| **File Parsing** | PapaParse (CSV parsing)                                    |
| **Monorepo**     | Turborepo with shared packages                             |
| **Testing**      | Vitest (unit) + Playwright (E2E)                           |
| **API Docs**     | Swagger / OpenAPI via swagger-jsdoc                        |

---

## Architecture Overview

```
personal-finance-app/
├── apps/
│   ├── web/                    # Next.js 14 frontend (App Router)
│   └── api/                    # Express.js REST API server
├── packages/
│   ├── shared-types/           # Shared TypeScript types & Zod schemas
│   ├── ui/                     # Shared UI components (optional)
│   └── config/                 # Shared ESLint, Tailwind, TS configs
├── turbo.json
├── package.json
├── docker-compose.yml          # MongoDB + API + Web
├── .env.example
└── PLAN.md
```

### Why a Monorepo?

- **Shared types**: Zod schemas defined once, used for API validation AND frontend form validation - zero drift between client and server.
- **Atomic changes**: A single PR can update the API contract, backend handler, and frontend consumer together.
- **Independent deployment**: `apps/web` and `apps/api` are separate packages with independent build/deploy steps.

---

## Data Models (MongoDB / Mongoose)

### User

```typescript
{
  _id: ObjectId,
  email: string,              // unique, indexed
  name: string,
  passwordHash?: string,      // null for OAuth-only users
  avatarUrl?: string,
  currency: string,           // default "USD"
  createdAt: Date,
  updatedAt: Date
}
```

### Account

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // ref: User, indexed
  name: string,               // "Chase Checking", "Amex Platinum"
  type: "checking" | "savings" | "credit_card" | "cash" | "investment",
  balance: number,            // current balance (derived or manually set)
  currency: string,
  color: string,              // hex color for UI
  isArchived: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // indexed
  accountId: ObjectId,        // ref: Account, indexed
  type: "income" | "expense" | "transfer",
  amount: number,             // always positive; type determines sign
  currency: string,
  categoryId: ObjectId,       // ref: Category
  subcategory?: string,
  description: string,
  notes?: string,
  date: Date,                 // indexed
  isRecurring: boolean,
  recurringRuleId?: ObjectId, // ref: RecurringRule
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}
// Compound index: { userId: 1, date: -1 }
// Compound index: { userId: 1, categoryId: 1, date: -1 }
```

### Category

```typescript
{
  _id: ObjectId,
  userId: ObjectId | null,    // null = system default, ObjectId = user custom
  name: string,               // "Groceries", "Rent", "Salary"
  icon: string,               // emoji or icon name
  color: string,
  type: "income" | "expense",
  isDefault: boolean,
  createdAt: Date
}
```

### Budget

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  categoryId: ObjectId,       // ref: Category
  amount: number,             // monthly budget limit
  period: "monthly" | "weekly",
  alertThreshold: number,     // 0.0 - 1.0 (e.g., 0.8 = alert at 80%)
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### FinancialGoal

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,               // "Emergency Fund", "Vacation"
  targetAmount: number,
  currentAmount: number,
  deadline?: Date,
  color: string,
  icon: string,
  isCompleted: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### RecurringRule

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  accountId: ObjectId,
  categoryId: ObjectId,
  type: "income" | "expense",
  amount: number,
  description: string,        // "Netflix", "Rent", "Salary"
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly",
  startDate: Date,
  nextDueDate: Date,
  endDate?: Date,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Design (RESTful)

Base URL: `/api/v1`

### Auth

| Method | Endpoint         | Description                     |
| ------ | ---------------- | ------------------------------- |
| POST   | `/auth/register` | Register with email/password    |
| POST   | `/auth/login`    | Login, returns JWT              |
| POST   | `/auth/refresh`  | Refresh access token            |
| GET    | `/auth/me`       | Get current user profile        |
| PATCH  | `/auth/me`       | Update profile (name, currency) |

### Accounts

| Method | Endpoint                        | Description                   |
| ------ | ------------------------------- | ----------------------------- |
| GET    | `/accounts`                     | List all accounts for user    |
| POST   | `/accounts`                     | Create account                |
| GET    | `/accounts/:id`                 | Get account details           |
| PATCH  | `/accounts/:id`                 | Update account                |
| DELETE | `/accounts/:id`                 | Archive account (soft delete) |
| GET    | `/accounts/:id/balance-history` | Balance over time             |

### Transactions

| Method | Endpoint               | Description                                                |
| ------ | ---------------------- | ---------------------------------------------------------- |
| GET    | `/transactions`        | List (paginated, filterable by account/category/date/type) |
| POST   | `/transactions`        | Create transaction                                         |
| GET    | `/transactions/:id`    | Get transaction                                            |
| PATCH  | `/transactions/:id`    | Update transaction                                         |
| DELETE | `/transactions/:id`    | Delete transaction                                         |
| POST   | `/transactions/import` | Import CSV bank statement                                  |
| GET    | `/transactions/search` | Full-text search on description/notes                      |

### Categories

| Method | Endpoint          | Description                   |
| ------ | ----------------- | ----------------------------- |
| GET    | `/categories`     | List system + user categories |
| POST   | `/categories`     | Create custom category        |
| PATCH  | `/categories/:id` | Update category               |
| DELETE | `/categories/:id` | Delete custom category        |

### Budgets

| Method | Endpoint           | Description                            |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/budgets`         | List all budgets with current spending |
| POST   | `/budgets`         | Create budget                          |
| PATCH  | `/budgets/:id`     | Update budget                          |
| DELETE | `/budgets/:id`     | Delete budget                          |
| GET    | `/budgets/summary` | Budget vs. actual for current period   |

### Financial Goals

| Method | Endpoint     | Description                          |
| ------ | ------------ | ------------------------------------ |
| GET    | `/goals`     | List all goals                       |
| POST   | `/goals`     | Create goal                          |
| PATCH  | `/goals/:id` | Update goal (including adding funds) |
| DELETE | `/goals/:id` | Delete goal                          |

### Recurring Rules

| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| GET    | `/recurring`     | List recurring rules |
| POST   | `/recurring`     | Create rule          |
| PATCH  | `/recurring/:id` | Update rule          |
| DELETE | `/recurring/:id` | Delete rule          |

### Analytics

| Method | Endpoint                          | Description                        |
| ------ | --------------------------------- | ---------------------------------- |
| GET    | `/analytics/spending-by-category` | Breakdown by category (date range) |
| GET    | `/analytics/income-vs-expense`    | Monthly income vs expense trend    |
| GET    | `/analytics/monthly-summary`      | Totals for a given month           |
| GET    | `/analytics/trends`               | Spending trends over N months      |
| GET    | `/analytics/net-worth`            | Net worth over time (all accounts) |

---

## Frontend Pages & Layout

### Layout Structure

```
┌──────────────────────────────────────────────────┐
│  Top Nav: Logo | Search | Notifications | Avatar │
├────────┬─────────────────────────────────────────┤
│        │                                         │
│  Side  │           Main Content Area             │
│  Nav   │                                         │
│        │                                         │
│  ----  │                                         │
│  Home  │                                         │
│  Trans │                                         │
│  Budget│                                         │
│  Goals │                                         │
│  Accts │                                         │
│  Recur │                                         │
│  Anlys │                                         │
│  Sett  │                                         │
│        │                                         │
└────────┴─────────────────────────────────────────┘
```

### Pages

| Route           | Page             | Description                                                     |
| --------------- | ---------------- | --------------------------------------------------------------- |
| `/`             | Landing Page     | Marketing page with features, CTA to sign up                    |
| `/login`        | Login            | Email/password + Google OAuth                                   |
| `/register`     | Register         | Sign-up form                                                    |
| `/dashboard`    | Dashboard (Home) | Net worth, recent transactions, budget overview, quick stats    |
| `/transactions` | Transactions     | Filterable/searchable table, add/edit modal, CSV import         |
| `/budgets`      | Budgets          | Budget cards with progress bars, create/edit                    |
| `/goals`        | Goals            | Goal cards with progress, add funds, create/edit                |
| `/accounts`     | Accounts         | Account list with balances, create/edit                         |
| `/recurring`    | Recurring        | Recurring transaction rules, upcoming bills                     |
| `/analytics`    | Analytics        | Full-page charts: trends, category breakdown, income vs expense |
| `/settings`     | Settings         | Profile, currency, categories management, data export           |

### Dashboard Widgets

1. **Net Worth Card** - Total across all accounts with trend arrow
2. **Monthly Snapshot** - Income / Expenses / Savings for current month
3. **Recent Transactions** - Last 5 transactions with quick-add button
4. **Budget Health** - Top 3 budgets with progress bars (green/yellow/red)
5. **Spending by Category** - Donut chart for current month
6. **Upcoming Bills** - Next 5 recurring transactions due
7. **Goal Progress** - Top goal with progress bar

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Goal**: Get the monorepo running with auth and basic CRUD.

1. **Initialize Turborepo monorepo**
   - Set up `apps/web` (Next.js 14 with App Router)
   - Set up `apps/api` (Express + TypeScript)
   - Set up `packages/shared-types` (Zod schemas + TS types)
   - Configure Tailwind CSS + shadcn/ui in web app
   - Add `docker-compose.yml` for MongoDB

2. **Authentication system**
   - Implement User model + password hashing (bcrypt)
   - Register / Login / Refresh token endpoints
   - NextAuth.js integration on frontend (Credentials provider)
   - Protected route middleware (backend + frontend)
   - Login & Register pages with form validation

3. **Account management**
   - Account Mongoose model with indexes
   - Full CRUD API endpoints
   - Accounts list page with create/edit modal
   - Account type icons and color coding

4. **Seed data & system categories**
   - Seed script for default categories (Groceries, Rent, Salary, etc.)
   - Category model and list endpoint

**Deliverable**: User can register, log in, create financial accounts, and see default categories.

---

### Phase 2: Transaction Engine

**Goal**: Full transaction management - the heart of the app.

5. **Transaction CRUD**
   - Transaction model with compound indexes
   - Create/Read/Update/Delete endpoints
   - Pagination with cursor-based pagination
   - Filter by: account, category, type, date range, amount range
   - Search by description (text index)

6. **Transactions page (frontend)**
   - Data table with sorting, filtering, pagination (shadcn DataTable)
   - Add/Edit transaction modal with category picker, date picker
   - Inline quick-actions (edit, delete, duplicate)
   - Filter sidebar: date range, account, category, type

7. **CSV Import**
   - Upload endpoint with multer
   - PapaParse for CSV parsing
   - Column mapping UI (map CSV columns to transaction fields)
   - Preview imported transactions before saving
   - Duplicate detection (same date + amount + description)

8. **Account balance computation**
   - Aggregation pipeline to compute account balances from transactions
   - Update balance on transaction create/update/delete
   - Balance history tracking

**Deliverable**: User can add transactions manually or import from bank CSV, filter/search them, and see accurate account balances.

---

### Phase 3: Budgets & Goals

**Goal**: Budget tracking and financial goal management.

9. **Budget system**
   - Budget model and CRUD endpoints
   - Aggregation: actual spending per category for current period
   - Budget summary endpoint (budget vs actual with percentage)
   - Alert threshold logic

10. **Budgets page (frontend)**
    - Budget cards with circular progress indicators
    - Color coding: green (<70%), yellow (70-90%), red (>90%), overflow
    - Create/edit budget modal
    - Monthly budget overview bar chart

11. **Financial goals**
    - Goal model and CRUD endpoints
    - "Add funds" action (updates currentAmount)
    - Progress calculation and deadline tracking

12. **Goals page (frontend)**
    - Goal cards with progress bars and target date
    - "Add funds" quick action
    - Completion celebration animation (confetti)

**Deliverable**: User can set monthly budgets per category with alerts, and create savings goals with progress tracking.

---

### Phase 4: Recurring Transactions & Smart Features

**Goal**: Automate recurring tracking and add intelligence.

13. **Recurring transaction rules**
    - RecurringRule model and CRUD
    - Endpoint to list upcoming due transactions
    - Manual "mark as paid" action that creates a real transaction

14. **Recurring page (frontend)**
    - List of recurring rules with next due date
    - Calendar-style upcoming view
    - Quick "record payment" action

15. **Smart categorization**
    - Rule-based auto-categorization for imported transactions
    - Pattern matching on description (e.g., "NETFLIX" -> Entertainment)
    - User can create custom rules (if description contains X, assign category Y)
    - Remember user corrections for future imports

**Deliverable**: Recurring bills/income are tracked, upcoming payments shown, and imported transactions are auto-categorized.

---

### Phase 5: Analytics & Dashboard

**Goal**: Rich visualizations and the main dashboard.

16. **Analytics API endpoints**
    - Spending by category aggregation (with date range)
    - Income vs. expense monthly trend (12-month)
    - Monthly summary (total income, expense, savings rate)
    - Net worth over time (monthly snapshots across all accounts)
    - Top merchants/descriptions by spending

17. **Dashboard page**
    - Responsive grid layout with all 7 widgets
    - Real-time data via TanStack Query with smart refetching
    - Period selector (this month / last month / custom)
    - Trend indicators (up/down arrows with percentages)

18. **Analytics page**
    - Spending by category: donut chart + breakdown table
    - Monthly trend: bar chart (income vs expense stacked)
    - Net worth: area chart over time
    - Savings rate: line chart over time
    - Date range picker for all charts
    - Export chart data as CSV

**Deliverable**: Beautiful dashboard with at-a-glance financial health, and deep-dive analytics page.

---

### Phase 6: Polish & Production Readiness

**Goal**: Production-quality app.

19. **UI/UX polish**
    - Dark mode / light mode toggle (next-themes)
    - Responsive design: fully functional on mobile
    - Loading skeletons for all data-fetching states
    - Empty states with helpful illustrations
    - Toast notifications for all actions
    - Keyboard shortcuts (Cmd+K for search, N for new transaction)

20. **Settings page**
    - Profile editing (name, avatar, default currency)
    - Category management (create, edit, reorder, delete custom)
    - Data export (all transactions as CSV/JSON)
    - Danger zone: delete account

21. **Error handling & validation**
    - Global error boundary (frontend)
    - Consistent API error responses with error codes
    - Zod validation on every endpoint (shared schemas)
    - Rate limiting on auth endpoints
    - Request logging with correlation IDs

22. **Testing**
    - Unit tests: Zod schemas, utility functions, aggregation logic (Vitest)
    - API integration tests: auth flow, CRUD operations, edge cases (Vitest + supertest)
    - E2E tests: critical user flows (Playwright)
      - Register -> Create Account -> Add Transaction -> View Dashboard
      - CSV Import flow
      - Budget creation and alert trigger

23. **Docker & deployment config**
    - Multi-stage Dockerfiles for API and Web
    - `docker-compose.yml` (MongoDB + API + Web) for local dev
    - `docker-compose.prod.yml` with nginx reverse proxy
    - Environment variable documentation

**Deliverable**: Polished, tested, deployable application.

---

## Key Technical Decisions

### Why Express instead of Next.js API Routes for the backend?

- **Separation of concerns**: Dedicated API server is independently scalable and testable.
- **Middleware ecosystem**: Express has mature middleware for rate limiting, file uploads, CORS, etc.
- **Swagger/OpenAPI**: Easier to auto-generate API docs from a standalone Express server.
- **Real-world pattern**: Most production apps separate frontend and backend deployments.

### Why MongoDB for a finance app?

- **Flexible schema**: Easy to iterate on transaction metadata, custom fields, tags.
- **Aggregation framework**: MongoDB's aggregation pipelines are powerful for financial analytics (group by category, sum by month, etc.).
- **User's choice**: Respecting the stated preference while noting that for strict financial auditing, a relational DB would be more traditional.

### Why Turborepo?

- **Shared types**: Single source of truth for data shapes - Zod schemas shared between API validation and form validation eliminate an entire class of bugs.
- **Incremental builds**: Only rebuilds what changed.
- **Simple**: Less complex than Nx for a two-app monorepo.

### Authentication Strategy

- **NextAuth.js** on the frontend handles OAuth flows and session management.
- **JWT tokens** are passed to the Express API in Authorization headers.
- **Access + Refresh token** pattern: short-lived access tokens (15min), long-lived refresh tokens (7d).

---

## File Structure (Detailed)

```
personal-finance-app/
├── apps/
│   ├── web/                              # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/                      # App Router
│   │   │   │   ├── (auth)/               # Auth route group
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── register/page.tsx
│   │   │   │   ├── (dashboard)/          # Protected route group
│   │   │   │   │   ├── layout.tsx        # Sidebar + topnav layout
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   ├── transactions/page.tsx
│   │   │   │   │   ├── budgets/page.tsx
│   │   │   │   │   ├── goals/page.tsx
│   │   │   │   │   ├── accounts/page.tsx
│   │   │   │   │   ├── recurring/page.tsx
│   │   │   │   │   ├── analytics/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx              # Landing page
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                   # shadcn/ui components
│   │   │   │   ├── layout/
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── topnav.tsx
│   │   │   │   │   └── mobile-nav.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── net-worth-card.tsx
│   │   │   │   │   ├── monthly-snapshot.tsx
│   │   │   │   │   ├── recent-transactions.tsx
│   │   │   │   │   ├── budget-health.tsx
│   │   │   │   │   ├── spending-donut.tsx
│   │   │   │   │   ├── upcoming-bills.tsx
│   │   │   │   │   └── goal-progress.tsx
│   │   │   │   ├── transactions/
│   │   │   │   │   ├── transaction-table.tsx
│   │   │   │   │   ├── transaction-form.tsx
│   │   │   │   │   ├── csv-import-wizard.tsx
│   │   │   │   │   └── filter-sidebar.tsx
│   │   │   │   ├── budgets/
│   │   │   │   │   ├── budget-card.tsx
│   │   │   │   │   └── budget-form.tsx
│   │   │   │   ├── goals/
│   │   │   │   │   ├── goal-card.tsx
│   │   │   │   │   └── goal-form.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── spending-chart.tsx
│   │   │   │   │   ├── trend-chart.tsx
│   │   │   │   │   ├── net-worth-chart.tsx
│   │   │   │   │   └── savings-rate-chart.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── category-picker.tsx
│   │   │   │       ├── account-picker.tsx
│   │   │   │       ├── date-range-picker.tsx
│   │   │   │       ├── currency-display.tsx
│   │   │   │       └── empty-state.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-transactions.ts
│   │   │   │   ├── use-accounts.ts
│   │   │   │   ├── use-budgets.ts
│   │   │   │   ├── use-goals.ts
│   │   │   │   └── use-analytics.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts         # Axios/fetch wrapper with auth
│   │   │   │   ├── auth.ts               # NextAuth config
│   │   │   │   ├── utils.ts              # Formatting, helpers
│   │   │   │   └── constants.ts
│   │   │   └── providers/
│   │   │       ├── query-provider.tsx     # TanStack Query
│   │   │       ├── auth-provider.tsx
│   │   │       └── theme-provider.tsx
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                              # Express Backend
│       ├── src/
│       │   ├── index.ts                  # Server entry point
│       │   ├── app.ts                    # Express app setup
│       │   ├── config/
│       │   │   ├── database.ts           # Mongoose connection
│       │   │   ├── env.ts               # Environment validation
│       │   │   └── swagger.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts               # JWT verification
│       │   │   ├── validate.ts           # Zod validation middleware
│       │   │   ├── error-handler.ts      # Global error handler
│       │   │   ├── rate-limit.ts
│       │   │   └── cors.ts
│       │   ├── models/
│       │   │   ├── user.model.ts
│       │   │   ├── account.model.ts
│       │   │   ├── transaction.model.ts
│       │   │   ├── category.model.ts
│       │   │   ├── budget.model.ts
│       │   │   ├── goal.model.ts
│       │   │   └── recurring-rule.model.ts
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── account.routes.ts
│       │   │   ├── transaction.routes.ts
│       │   │   ├── category.routes.ts
│       │   │   ├── budget.routes.ts
│       │   │   ├── goal.routes.ts
│       │   │   ├── recurring.routes.ts
│       │   │   └── analytics.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── account.controller.ts
│       │   │   ├── transaction.controller.ts
│       │   │   ├── category.controller.ts
│       │   │   ├── budget.controller.ts
│       │   │   ├── goal.controller.ts
│       │   │   ├── recurring.controller.ts
│       │   │   └── analytics.controller.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── account.service.ts
│       │   │   ├── transaction.service.ts
│       │   │   ├── budget.service.ts
│       │   │   ├── goal.service.ts
│       │   │   ├── recurring.service.ts
│       │   │   ├── analytics.service.ts
│       │   │   └── csv-import.service.ts
│       │   ├── utils/
│       │   │   ├── api-error.ts          # Custom error class
│       │   │   ├── async-handler.ts      # Try/catch wrapper
│       │   │   └── pagination.ts
│       │   └── seeds/
│       │       └── categories.seed.ts
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── setup.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared-types/
│       ├── src/
│       │   ├── schemas/                  # Zod schemas
│       │   │   ├── user.schema.ts
│       │   │   ├── account.schema.ts
│       │   │   ├── transaction.schema.ts
│       │   │   ├── category.schema.ts
│       │   │   ├── budget.schema.ts
│       │   │   ├── goal.schema.ts
│       │   │   └── recurring.schema.ts
│       │   ├── types/                    # Inferred TypeScript types
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── e2e/                                  # Playwright E2E tests
│   ├── tests/
│   │   ├── auth.spec.ts
│   │   ├── transactions.spec.ts
│   │   ├── budgets.spec.ts
│   │   └── dashboard.spec.ts
│   └── playwright.config.ts
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
├── package.json
├── .env.example
├── .gitignore
└── PLAN.md
```

---

## E2E Test Scenarios (Playwright)

### Critical User Flows

1. **Registration & Login**
   - Register with email/password -> redirected to dashboard
   - Login with valid credentials -> see dashboard
   - Login with invalid credentials -> see error
   - Access protected route while unauthenticated -> redirect to login

2. **Full Transaction Lifecycle**
   - Create account -> Add transaction -> See in list -> Edit -> Delete
   - Verify account balance updates after each operation

3. **CSV Import Flow**
   - Upload CSV -> Map columns -> Preview -> Confirm import
   - Verify transactions appear in list with correct data

4. **Budget Alert Flow**
   - Create budget for category -> Add transactions exceeding threshold
   - Verify progress bar shows correct percentage and color

5. **Dashboard Data Integrity**
   - Add various transactions -> Navigate to dashboard
   - Verify net worth, monthly snapshot, and charts reflect correct data

6. **Goal Tracking**
   - Create goal -> Add funds multiple times -> Verify progress
   - Complete goal -> Verify completion state

---

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/wealthwise

# Auth
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# API
API_PORT=4000
API_URL=http://localhost:4000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## Implementation Order (Step-by-Step Build Sequence)

This is the exact order files should be created and features built:

```
 1. Initialize Turborepo + configure workspaces
 2. Set up shared-types package with Zod schemas
 3. Set up Express app skeleton (app.ts, index.ts, env config)
 4. Connect MongoDB (database.ts)
 5. Implement User model + auth service + auth routes
 6. Set up Next.js app with Tailwind + shadcn/ui
 7. Implement login/register pages
 8. Set up NextAuth.js + auth provider
 9. Build dashboard layout (sidebar + topnav)
10. Implement Account model + CRUD API
11. Build accounts page
12. Implement Category model + seed script
13. Implement Transaction model + CRUD API (with pagination/filtering)
14. Build transactions page with data table
15. Implement CSV import (backend + frontend wizard)
16. Implement Budget model + CRUD + spending aggregation
17. Build budgets page
18. Implement Goal model + CRUD
19. Build goals page
20. Implement RecurringRule model + CRUD
21. Build recurring page
22. Implement analytics aggregation endpoints
23. Build analytics page with charts
24. Build dashboard page with all widgets
25. Add dark mode + responsive polish
26. Build settings page
27. Write unit tests
28. Write API integration tests
29. Write E2E tests with Playwright
30. Dockerize everything
```

---

## Non-Functional Requirements

- **Response time**: API endpoints respond in <200ms for CRUD, <500ms for analytics aggregations
- **Pagination**: All list endpoints paginated (default 20, max 100)
- **Validation**: Every input validated with Zod before reaching business logic
- **Error format**: Consistent `{ error: { code, message, details? } }` shape
- **Security**: bcrypt for passwords, JWT with expiry, CORS whitelist, rate limiting on auth
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, sufficient color contrast
- **Mobile**: Fully responsive - sidebar collapses to bottom nav on mobile
