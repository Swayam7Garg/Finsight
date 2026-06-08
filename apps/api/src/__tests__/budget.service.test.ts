import { describe, it, expect, vi, afterEach } from "vitest";
import mongoose from "mongoose";
import { Budget } from "../models/budget.model";
import { Category } from "../models/category.model";
import { Account } from "../models/account.model";
import { Transaction } from "../models/transaction.model";
import { ApiError } from "../utils/api-error";
import { list, create, update, remove, getSummary } from "../services/budget.service";

function userId() {
  return new mongoose.Types.ObjectId();
}

function categoryId() {
  return new mongoose.Types.ObjectId();
}

async function createTestBudget(
  userIdVal: mongoose.Types.ObjectId,
  overrides: Record<string, unknown> = {}
) {
  return Budget.create({
    userId: userIdVal,
    categoryId: categoryId(),
    amount: 500,
    period: "monthly",
    ...overrides,
  });
}

describe("budget.service", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("list", () => {
    it("should return budgets for the user", async () => {
      const uid = userId();
      await createTestBudget(uid);
      await createTestBudget(uid);

      const result = await list(uid.toString());

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no budgets exist", async () => {
      const result = await list(userId().toString());
      expect(result).toEqual([]);
    });

    it("should exclude other users budgets", async () => {
      const uid1 = userId();
      const uid2 = userId();
      await createTestBudget(uid1);
      await createTestBudget(uid2);

      const result = await list(uid1.toString());

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(uid1.toString());
    });

    it("should sort by createdAt descending", async () => {
      const uid = userId();
      await createTestBudget(uid, { amount: 100 });
      await new Promise((r) => setTimeout(r, 10));
      await createTestBudget(uid, { amount: 200 });

      const result = await list(uid.toString());

      expect(result[0].amount).toBe(200);
      expect(result[1].amount).toBe(100);
    });
  });

  describe("create", () => {
    it("should create a budget with defaults", async () => {
      const uid = userId();
      const catId = categoryId();

      const result = await create(uid.toString(), {
        categoryId: catId.toString(),
        amount: 1000,
        period: "monthly",
      });

      expect(result).toMatchObject({
        userId: uid.toString(),
        categoryId: catId.toString(),
        amount: 1000,
        period: "monthly",
        alertThreshold: 0.8,
        isActive: true,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it("should accept custom alertThreshold", async () => {
      const uid = userId();

      const result = await create(uid.toString(), {
        categoryId: categoryId().toString(),
        amount: 500,
        period: "weekly",
        alertThreshold: 0.9,
      });

      expect(result.alertThreshold).toBe(0.9);
      expect(result.period).toBe("weekly");
    });
  });

  describe("update", () => {
    it("should update fields and return updated budget", async () => {
      const uid = userId();
      const budget = await createTestBudget(uid);

      const result = await update(uid.toString(), budget._id.toString(), {
        amount: 750,
        alertThreshold: 0.9,
      });

      expect(result.amount).toBe(750);
      expect(result.alertThreshold).toBe(0.9);
    });

    it("should throw 404 for non-existent budget", async () => {
      const uid = userId();
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await update(uid.toString(), fakeId, { amount: 999 });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw 404 when updating another users budget", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const budget = await createTestBudget(uid1);

      try {
        await update(uid2.toString(), budget._id.toString(), { amount: 1 });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("remove", () => {
    it("should delete the budget and return it", async () => {
      const uid = userId();
      const budget = await createTestBudget(uid);

      const result = await remove(uid.toString(), budget._id.toString());

      expect(result.id).toBe(budget._id.toString());
      expect(await Budget.findById(budget._id)).toBeNull();
    });

    it("should throw 404 for non-existent budget", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await remove(userId().toString(), fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw 404 when deleting another users budget", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const budget = await createTestBudget(uid1);

      try {
        await remove(uid2.toString(), budget._id.toString());
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("getSummary", () => {
    it("should return empty array when no active budgets exist", async () => {
      const uid = userId();
      const result = await getSummary(uid.toString());
      expect(result).toEqual([]);
    });

    it("should calculate spent from expense transactions in current period", async () => {
      const uid = userId();
      const catId = categoryId();
      const account = await Account.create({
        userId: uid,
        name: "Checking",
        type: "checking",
      });

      await Category.create({
        _id: catId,
        name: "Food",
        icon: "\uD83C\uDF54",
        color: "#ff0000",
        type: "expense",
      });

      await Budget.create({
        userId: uid,
        categoryId: catId,
        amount: 500,
        period: "monthly",
      });

      // Create expense transactions within the current month
      const now = new Date();
      const dayInMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12);

      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 100,
        currency: "USD",
        categoryId: catId,
        description: "Lunch",
        date: dayInMonth,
      });

      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 150,
        currency: "USD",
        categoryId: catId,
        description: "Dinner",
        date: dayInMonth,
      });

      const result = await getSummary(uid.toString());

      expect(result).toHaveLength(1);
      expect(result[0].spent).toBe(250);
      expect(result[0].percentage).toBe(0.5);
      expect(result[0].amount).toBe(500);
    });

    it("should return status under_budget when spending is low", async () => {
      const uid = userId();
      const catId = categoryId();
      const account = await Account.create({
        userId: uid,
        name: "Checking",
        type: "checking",
      });

      await Budget.create({
        userId: uid,
        categoryId: catId,
        amount: 1000,
        period: "monthly",
        alertThreshold: 0.8,
      });

      const now = new Date();
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 100,
        currency: "USD",
        categoryId: catId,
        description: "Small purchase",
        date: new Date(now.getFullYear(), now.getMonth(), 2),
      });

      const result = await getSummary(uid.toString());

      expect(result[0].status).toBe("under_budget");
      expect(result[0].spent).toBe(100);
    });

    it("should return status warning when approaching threshold", async () => {
      const uid = userId();
      const catId = categoryId();
      const account = await Account.create({
        userId: uid,
        name: "Checking",
        type: "checking",
      });

      await Budget.create({
        userId: uid,
        categoryId: catId,
        amount: 1000,
        period: "monthly",
        alertThreshold: 0.8,
      });

      const now = new Date();
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 850,
        currency: "USD",
        categoryId: catId,
        description: "Big purchase",
        date: new Date(now.getFullYear(), now.getMonth(), 2),
      });

      const result = await getSummary(uid.toString());

      expect(result[0].status).toBe("warning");
      expect(result[0].spent).toBe(850);
    });

    it("should return status over_budget when exceeding amount", async () => {
      const uid = userId();
      const catId = categoryId();
      const account = await Account.create({
        userId: uid,
        name: "Checking",
        type: "checking",
      });

      await Budget.create({
        userId: uid,
        categoryId: catId,
        amount: 500,
        period: "monthly",
        alertThreshold: 0.8,
      });

      const now = new Date();
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 600,
        currency: "USD",
        categoryId: catId,
        description: "Over spend",
        date: new Date(now.getFullYear(), now.getMonth(), 2),
      });

      const result = await getSummary(uid.toString());

      expect(result[0].status).toBe("over_budget");
      expect(result[0].spent).toBe(600);
    });

    it("should only count current period transactions", async () => {
      const uid = userId();
      const catId = categoryId();
      const account = await Account.create({
        userId: uid,
        name: "Checking",
        type: "checking",
      });

      await Budget.create({
        userId: uid,
        categoryId: catId,
        amount: 1000,
        period: "monthly",
        alertThreshold: 0.8,
      });

      const now = new Date();

      // Transaction in the current month
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 200,
        currency: "USD",
        categoryId: catId,
        description: "This month",
        date: new Date(now.getFullYear(), now.getMonth(), 2),
      });

      // Transaction from last month (should be excluded)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 999,
        currency: "USD",
        categoryId: catId,
        description: "Last month",
        date: lastMonth,
      });

      const result = await getSummary(uid.toString());

      expect(result).toHaveLength(1);
      expect(result[0].spent).toBe(200);
    });

    it("should not count income transactions toward budget spent", async () => {
      const uid = userId();
      const catId = categoryId();
      const account = await Account.create({
        userId: uid,
        name: "Checking",
        type: "checking",
      });

      await Budget.create({
        userId: uid,
        categoryId: catId,
        amount: 1000,
        period: "monthly",
      });

      const now = new Date();
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "income",
        amount: 5000,
        currency: "USD",
        categoryId: catId,
        description: "Salary",
        date: new Date(now.getFullYear(), now.getMonth(), 1),
      });

      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 100,
        currency: "USD",
        categoryId: catId,
        description: "Small expense",
        date: new Date(now.getFullYear(), now.getMonth(), 2),
      });

      const result = await getSummary(uid.toString());

      expect(result[0].spent).toBe(100);
    });

    it("should skip inactive budgets", async () => {
      const uid = userId();

      await Budget.create({
        userId: uid,
        categoryId: categoryId(),
        amount: 500,
        period: "monthly",
        isActive: false,
      });

      const result = await getSummary(uid.toString());

      expect(result).toEqual([]);
    });
  });
});
