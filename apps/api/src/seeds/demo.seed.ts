import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { Account } from "../models/account.model";
import { Transaction, type ITransaction } from "../models/transaction.model";
import { Category } from "../models/category.model";
import { Budget } from "../models/budget.model";
import { Goal } from "../models/goal.model";
import { RecurringRule } from "../models/recurring-rule.model";
import { seedDefaultCategories } from "./categories.seed";

// ── Demo credentials ────────────────────────────────────────────────────────
const DEMO_EMAIL = "demo@finsight.app";
const DEMO_PASSWORD = "Demo1234!";
const DEMO_NAME = "Alex Morgan";

// ── Helpers ─────────────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

function monthsAgo(n: number, day = 1): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n, day);
  d.setHours(12, 0, 0, 0);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Core seed function (uses existing Mongoose connection) ──────────────────
export async function seedDemoData(): Promise<{ email: string; password: string }> {
  // 1. Ensure default categories exist
  await seedDefaultCategories();

  // 2. Remove previous demo user + all their data
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    const uid = existing._id;
    await Promise.all([
      Transaction.deleteMany({ userId: uid }),
      Account.deleteMany({ userId: uid }),
      Budget.deleteMany({ userId: uid }),
      Goal.deleteMany({ userId: uid }),
      RecurringRule.deleteMany({ userId: uid }),
    ]);
    await User.deleteOne({ _id: uid });
  }

  // 3. Create demo user
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await User.create({
    email: DEMO_EMAIL,
    name: DEMO_NAME,
    passwordHash,
    currency: "USD",
  });
  const userId = user._id;

  // 4. Create accounts
  const [checking, savings, creditCard, cash, investment] = await Account.insertMany([
    {
      userId,
      name: "Main Checking",
      type: "checking",
      balance: 4_820.5,
      currency: "USD",
      color: "#3b82f6",
    },
    {
      userId,
      name: "High-Yield Savings",
      type: "savings",
      balance: 12_350.0,
      currency: "USD",
      color: "#22c55e",
    },
    {
      userId,
      name: "Chase Sapphire",
      type: "credit_card",
      balance: 1_245.8,
      currency: "USD",
      color: "#8b5cf6",
    },
    {
      userId,
      name: "Cash Wallet",
      type: "cash",
      balance: 340.0,
      currency: "USD",
      color: "#f59e0b",
    },
    {
      userId,
      name: "Vanguard Portfolio",
      type: "investment",
      balance: 28_500.0,
      currency: "USD",
      color: "#6366f1",
    },
  ]);

  // 5. Load default categories into a lookup map
  const categories = await Category.find({ isDefault: true });
  const catMap = new Map(categories.map((c) => [c.name, c._id]));

  function catId(name: string): mongoose.Types.ObjectId {
    const id = catMap.get(name);
    if (!id) throw new Error(`Category "${name}" not found - run category seed first`);
    return id;
  }

  // 6. Build transactions spanning 6 months
  const txns: Array<Partial<ITransaction>> = [];

  for (let m = 5; m >= 0; m--) {
    const monthDate = (day: number) => monthsAgo(m, day);

    // ── Salary (1st and 15th) ───────────────────────────────────────────
    txns.push(
      {
        userId,
        accountId: checking._id,
        type: "income",
        amount: 4_500,
        categoryId: catId("Salary"),
        description: "Bi-monthly salary",
        date: monthDate(1),
        isRecurring: true,
      },
      {
        userId,
        accountId: checking._id,
        type: "income",
        amount: 4_500,
        categoryId: catId("Salary"),
        description: "Bi-monthly salary",
        date: monthDate(15),
        isRecurring: true,
      }
    );

    // ── Freelance (some months) ─────────────────────────────────────────
    if (m % 2 === 0) {
      txns.push({
        userId,
        accountId: checking._id,
        type: "income",
        amount: randomBetween(800, 2_000),
        categoryId: catId("Freelance"),
        description: pick([
          "Website redesign project",
          "Logo design commission",
          "Consulting engagement",
          "Code review contract",
        ]),
        date: monthDate(pick([8, 12, 20])),
      });
    }

    // ── Investment returns (quarterly) ──────────────────────────────────
    if (m % 3 === 0) {
      txns.push({
        userId,
        accountId: investment._id,
        type: "income",
        amount: randomBetween(200, 600),
        categoryId: catId("Investment Returns"),
        description: "Quarterly dividend payout",
        date: monthDate(28),
      });
    }

    // ── Rent ────────────────────────────────────────────────────────────
    txns.push({
      userId,
      accountId: checking._id,
      type: "expense",
      amount: 1_850,
      categoryId: catId("Rent/Housing"),
      description: "Monthly rent",
      date: monthDate(1),
      isRecurring: true,
    });

    // ── Utilities ───────────────────────────────────────────────────────
    txns.push(
      {
        userId,
        accountId: checking._id,
        type: "expense",
        amount: randomBetween(80, 140),
        categoryId: catId("Utilities"),
        description: "Electric bill",
        date: monthDate(5),
        isRecurring: true,
      },
      {
        userId,
        accountId: checking._id,
        type: "expense",
        amount: randomBetween(40, 70),
        categoryId: catId("Utilities"),
        description: "Internet service",
        date: monthDate(8),
        isRecurring: true,
      }
    );

    // ── Groceries (weekly-ish) ──────────────────────────────────────────
    for (const day of [3, 10, 17, 24]) {
      txns.push({
        userId,
        accountId: pick([checking, creditCard])._id,
        type: "expense",
        amount: randomBetween(60, 150),
        categoryId: catId("Groceries"),
        description: pick([
          "Whole Foods Market",
          "Trader Joe's",
          "Costco run",
          "Weekly groceries",
          "Fresh produce & pantry",
        ]),
        date: monthDate(day),
      });
    }

    // ── Dining Out ──────────────────────────────────────────────────────
    const diningCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < diningCount; i++) {
      txns.push({
        userId,
        accountId: creditCard._id,
        type: "expense",
        amount: randomBetween(25, 85),
        categoryId: catId("Dining Out"),
        description: pick([
          "Dinner at Italian place",
          "Sushi takeout",
          "Brunch with friends",
          "Coffee & pastry",
          "Thai restaurant",
          "Pizza delivery",
          "Burger joint",
        ]),
        date: monthDate(pick([4, 7, 11, 14, 18, 22, 26])),
      });
    }

    // ── Transportation ──────────────────────────────────────────────────
    txns.push(
      {
        userId,
        accountId: checking._id,
        type: "expense",
        amount: randomBetween(40, 60),
        categoryId: catId("Transportation"),
        description: "Gas fill-up",
        date: monthDate(6),
      },
      {
        userId,
        accountId: checking._id,
        type: "expense",
        amount: randomBetween(40, 60),
        categoryId: catId("Transportation"),
        description: "Gas fill-up",
        date: monthDate(20),
      }
    );

    // ── Subscriptions ───────────────────────────────────────────────────
    txns.push(
      {
        userId,
        accountId: creditCard._id,
        type: "expense",
        amount: 15.99,
        categoryId: catId("Subscriptions"),
        description: "Netflix",
        date: monthDate(12),
        isRecurring: true,
      },
      {
        userId,
        accountId: creditCard._id,
        type: "expense",
        amount: 10.99,
        categoryId: catId("Subscriptions"),
        description: "Spotify Premium",
        date: monthDate(12),
        isRecurring: true,
      },
      {
        userId,
        accountId: creditCard._id,
        type: "expense",
        amount: 14.99,
        categoryId: catId("Subscriptions"),
        description: "iCloud+ storage",
        date: monthDate(15),
        isRecurring: true,
      }
    );

    // ── Shopping (1-3 per month) ────────────────────────────────────────
    const shoppingCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < shoppingCount; i++) {
      txns.push({
        userId,
        accountId: pick([creditCard, checking])._id,
        type: "expense",
        amount: randomBetween(20, 200),
        categoryId: catId("Shopping"),
        description: pick([
          "Amazon order",
          "New running shoes",
          "Bluetooth headphones",
          "Kitchen supplies",
          "Office chair",
          "Book order",
        ]),
        date: monthDate(pick([9, 16, 23, 27])),
      });
    }

    // ── Entertainment ───────────────────────────────────────────────────
    txns.push({
      userId,
      accountId: creditCard._id,
      type: "expense",
      amount: randomBetween(15, 80),
      categoryId: catId("Entertainment"),
      description: pick([
        "Movie tickets",
        "Concert tickets",
        "Bowling night",
        "Board game café",
        "Streaming rental",
      ]),
      date: monthDate(pick([13, 19, 25])),
    });

    // ── Healthcare (some months) ────────────────────────────────────────
    if (m % 2 === 1) {
      txns.push({
        userId,
        accountId: checking._id,
        type: "expense",
        amount: randomBetween(30, 150),
        categoryId: catId("Healthcare"),
        description: pick([
          "Doctor copay",
          "Prescription medication",
          "Dental cleaning",
          "Eye exam",
        ]),
        date: monthDate(pick([10, 18])),
      });
    }

    // ── Insurance (monthly) ─────────────────────────────────────────────
    txns.push({
      userId,
      accountId: checking._id,
      type: "expense",
      amount: 185,
      categoryId: catId("Insurance"),
      description: "Auto + renter's insurance",
      date: monthDate(1),
      isRecurring: true,
    });

    // ── Personal Care ───────────────────────────────────────────────────
    if (m % 2 === 0) {
      txns.push({
        userId,
        accountId: cash._id,
        type: "expense",
        amount: randomBetween(25, 60),
        categoryId: catId("Personal Care"),
        description: pick(["Haircut", "Skincare products", "Gym supplies"]),
        date: monthDate(pick([7, 21])),
      });
    }

    // ── Education (occasional) ──────────────────────────────────────────
    if (m === 3 || m === 0) {
      txns.push({
        userId,
        accountId: creditCard._id,
        type: "expense",
        amount: randomBetween(30, 120),
        categoryId: catId("Education"),
        description: pick(["Udemy course bundle", "O'Reilly subscription", "Textbook purchase"]),
        date: monthDate(14),
      });
    }

    // ── Travel (one-off, 2 months ago) ──────────────────────────────────
    if (m === 2) {
      txns.push(
        {
          userId,
          accountId: creditCard._id,
          type: "expense",
          amount: 420,
          categoryId: catId("Travel"),
          description: "Round-trip flight to Denver",
          date: monthDate(5),
        },
        {
          userId,
          accountId: creditCard._id,
          type: "expense",
          amount: 320,
          categoryId: catId("Travel"),
          description: "Hotel (3 nights)",
          date: monthDate(6),
        }
      );
    }

    // ── Gifts (holiday month) ───────────────────────────────────────────
    if (m === 4) {
      txns.push({
        userId,
        accountId: creditCard._id,
        type: "expense",
        amount: randomBetween(50, 200),
        categoryId: catId("Gifts"),
        description: "Birthday gift for friend",
        date: monthDate(18),
      });
    }
  }

  // ── A few recent transactions for the "Recent Transactions" widget ────
  txns.push(
    {
      userId,
      accountId: checking._id,
      type: "expense",
      amount: 42.5,
      categoryId: catId("Groceries"),
      description: "Quick grocery run",
      date: daysAgo(1),
    },
    {
      userId,
      accountId: creditCard._id,
      type: "expense",
      amount: 67.0,
      categoryId: catId("Dining Out"),
      description: "Anniversary dinner",
      date: daysAgo(2),
    },
    {
      userId,
      accountId: checking._id,
      type: "expense",
      amount: 35.0,
      categoryId: catId("Transportation"),
      description: "Uber rides",
      date: daysAgo(3),
    }
  );

  await Transaction.insertMany(txns);

  // 7. Budgets for key expense categories
  await Budget.insertMany([
    {
      userId,
      categoryId: catId("Groceries"),
      amount: 600,
      period: "monthly",
      alertThreshold: 0.8,
    },
    {
      userId,
      categoryId: catId("Dining Out"),
      amount: 300,
      period: "monthly",
      alertThreshold: 0.75,
    },
    {
      userId,
      categoryId: catId("Entertainment"),
      amount: 150,
      period: "monthly",
      alertThreshold: 0.8,
    },
    {
      userId,
      categoryId: catId("Shopping"),
      amount: 400,
      period: "monthly",
      alertThreshold: 0.85,
    },
    {
      userId,
      categoryId: catId("Transportation"),
      amount: 200,
      period: "monthly",
      alertThreshold: 0.8,
    },
    {
      userId,
      categoryId: catId("Subscriptions"),
      amount: 60,
      period: "monthly",
      alertThreshold: 0.9,
    },
  ]);

  // 8. Financial goals
  await Goal.insertMany([
    {
      userId,
      name: "Emergency Fund",
      targetAmount: 15_000,
      currentAmount: 12_350,
      deadline: monthsAgo(-6, 1), // 6 months from now
      color: "#22c55e",
      icon: "\uD83D\uDEE1\uFE0F",
    },
    {
      userId,
      name: "Japan Vacation",
      targetAmount: 5_000,
      currentAmount: 2_100,
      deadline: monthsAgo(-9, 1),
      color: "#0ea5e9",
      icon: "\u2708\uFE0F",
    },
    {
      userId,
      name: "New Laptop",
      targetAmount: 2_500,
      currentAmount: 1_800,
      deadline: monthsAgo(-2, 1),
      color: "#8b5cf6",
      icon: "\uD83D\uDCBB",
    },
    {
      userId,
      name: "Wedding Fund",
      targetAmount: 20_000,
      currentAmount: 4_500,
      deadline: monthsAgo(-18, 1),
      color: "#ec4899",
      icon: "\uD83D\uDC8D",
    },
  ]);

  // 9. Recurring rules
  const nextMonth1st = monthsAgo(-1, 1);
  const nextMonth15th = monthsAgo(-1, 15);

  await RecurringRule.insertMany([
    {
      userId,
      accountId: checking._id,
      categoryId: catId("Salary"),
      type: "income",
      amount: 4_500,
      description: "Bi-monthly salary",
      frequency: "biweekly",
      startDate: monthsAgo(12, 1),
      nextDueDate: nextMonth1st,
    },
    {
      userId,
      accountId: checking._id,
      categoryId: catId("Rent/Housing"),
      type: "expense",
      amount: 1_850,
      description: "Monthly rent",
      frequency: "monthly",
      startDate: monthsAgo(12, 1),
      nextDueDate: nextMonth1st,
    },
    {
      userId,
      accountId: checking._id,
      categoryId: catId("Utilities"),
      type: "expense",
      amount: 110,
      description: "Electric bill",
      frequency: "monthly",
      startDate: monthsAgo(6, 5),
      nextDueDate: monthsAgo(-1, 5),
    },
    {
      userId,
      accountId: checking._id,
      categoryId: catId("Utilities"),
      type: "expense",
      amount: 55,
      description: "Internet service",
      frequency: "monthly",
      startDate: monthsAgo(6, 8),
      nextDueDate: monthsAgo(-1, 8),
    },
    {
      userId,
      accountId: creditCard._id,
      categoryId: catId("Subscriptions"),
      type: "expense",
      amount: 15.99,
      description: "Netflix",
      frequency: "monthly",
      startDate: monthsAgo(12, 12),
      nextDueDate: monthsAgo(-1, 12),
    },
    {
      userId,
      accountId: creditCard._id,
      categoryId: catId("Subscriptions"),
      type: "expense",
      amount: 10.99,
      description: "Spotify Premium",
      frequency: "monthly",
      startDate: monthsAgo(12, 12),
      nextDueDate: monthsAgo(-1, 12),
    },
    {
      userId,
      accountId: creditCard._id,
      categoryId: catId("Subscriptions"),
      type: "expense",
      amount: 14.99,
      description: "iCloud+ storage",
      frequency: "monthly",
      startDate: monthsAgo(6, 15),
      nextDueDate: nextMonth15th,
    },
    {
      userId,
      accountId: checking._id,
      categoryId: catId("Insurance"),
      type: "expense",
      amount: 185,
      description: "Auto + renter's insurance",
      frequency: "monthly",
      startDate: monthsAgo(12, 1),
      nextDueDate: nextMonth1st,
    },
  ]);

  const txnCount = txns.length;
  console.log(`\u2705 Demo data seeded successfully!`);
  console.log(`   User:         ${DEMO_EMAIL}`);
  console.log(`   Password:     ${DEMO_PASSWORD}`);
  console.log(`   Accounts:     5`);
  console.log(`   Transactions: ${txnCount}`);
  console.log(`   Budgets:      6`);
  console.log(`   Goals:        4`);
  console.log(`   Recurring:    8`);

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
}

// ── Standalone CLI entry point ──────────────────────────────────────────────
// Usage: npx tsx src/seeds/demo.seed.ts
// Requires MONGODB_URI in .env or environment
if (require.main === module) {
  (async () => {
    const dotenv = await import("dotenv");
    dotenv.config();

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI not set. Add it to .env or set it in your environment.");
      process.exit(1);
    }

    const mongoose = (await import("mongoose")).default;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.");

    try {
      await seedDemoData();
    } catch (err) {
      console.error("Seed failed:", err);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
    }
  })();
}
