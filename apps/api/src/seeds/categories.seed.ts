import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { env } from "../config/env";
import { Category } from "../models/category.model";

interface SeedCategory {
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
}

const expenseCategories: SeedCategory[] = [
  { name: "Groceries", icon: "\uD83D\uDED2", color: "#22c55e", type: "expense" },
  { name: "Rent/Housing", icon: "\uD83C\uDFE0", color: "#3b82f6", type: "expense" },
  { name: "Transportation", icon: "\uD83D\uDE97", color: "#f59e0b", type: "expense" },
  { name: "Utilities", icon: "\uD83D\uDCA1", color: "#8b5cf6", type: "expense" },
  { name: "Entertainment", icon: "\uD83C\uDFAC", color: "#ec4899", type: "expense" },
  { name: "Dining Out", icon: "\uD83C\uDF7D\uFE0F", color: "#f97316", type: "expense" },
  { name: "Healthcare", icon: "\uD83C\uDFE5", color: "#ef4444", type: "expense" },
  { name: "Shopping", icon: "\uD83D\uDECD\uFE0F", color: "#06b6d4", type: "expense" },
  { name: "Education", icon: "\uD83D\uDCDA", color: "#6366f1", type: "expense" },
  { name: "Insurance", icon: "\uD83D\uDEE1\uFE0F", color: "#64748b", type: "expense" },
  { name: "Subscriptions", icon: "\uD83D\uDCF1", color: "#a855f7", type: "expense" },
  { name: "Travel", icon: "\u2708\uFE0F", color: "#0ea5e9", type: "expense" },
  { name: "Personal Care", icon: "\uD83D\uDC87", color: "#d946ef", type: "expense" },
  { name: "Gifts", icon: "\uD83C\uDF81", color: "#f43f5e", type: "expense" },
  { name: "Other Expense", icon: "\uD83D\uDCE6", color: "#94a3b8", type: "expense" },
];

const incomeCategories: SeedCategory[] = [
  { name: "Salary", icon: "\uD83D\uDCB0", color: "#22c55e", type: "income" },
  { name: "Freelance", icon: "\uD83D\uDCBB", color: "#3b82f6", type: "income" },
  { name: "Investment Returns", icon: "\uD83D\uDCC8", color: "#8b5cf6", type: "income" },
  { name: "Rental Income", icon: "\uD83C\uDFD8\uFE0F", color: "#f59e0b", type: "income" },
  { name: "Other Income", icon: "\uD83D\uDCB5", color: "#64748b", type: "income" },
];

/**
 * Idempotent: seeds default categories only if none exist.
 * Can be called at server startup using the existing Mongoose connection.
 */
export async function seedDefaultCategories(): Promise<void> {
  const existing = await Category.countDocuments({ isDefault: true });
  if (existing > 0) return;

  const allCategories = [...expenseCategories, ...incomeCategories];
  const docs = allCategories.map((cat) => ({
    userId: null,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    type: cat.type,
    isDefault: true,
  }));

  await Category.insertMany(docs);
  console.log(`✅ Seeded ${docs.length} default categories`);
}

// Allow running as a standalone script: npx tsx src/seeds/categories.seed.ts
if (require.main === module) {
  (async () => {
    try {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(env.MONGODB_URI);
      console.log("Connected to MongoDB");
      await Category.deleteMany({ userId: null, isDefault: true });
      await seedDefaultCategories();
      console.log("Seed completed successfully!");
    } catch (error) {
      console.error("Seed failed:", error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
    }
  })();
}
