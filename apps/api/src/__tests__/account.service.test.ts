import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Account } from "../models/account.model";
import { Transaction } from "../models/transaction.model";
import { ApiError } from "../utils/api-error";
import {
  list,
  create,
  getById,
  update,
  archive,
  getBalanceHistory,
} from "../services/account.service";

function userId() {
  return new mongoose.Types.ObjectId();
}

async function createTestAccount(
  userIdVal: mongoose.Types.ObjectId,
  overrides: Record<string, unknown> = {}
) {
  return Account.create({
    userId: userIdVal,
    name: "Checking",
    type: "checking",
    ...overrides,
  });
}

describe("account.service", () => {
  describe("list", () => {
    it("should return empty array when no accounts exist", async () => {
      const result = await list(userId().toString());
      expect(result).toEqual([]);
    });

    it("should return only non-archived accounts", async () => {
      const uid = userId();
      await createTestAccount(uid, { name: "Active" });
      await createTestAccount(uid, { name: "Archived", isArchived: true });

      const result = await list(uid.toString());

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Active");
    });

    it("should sort by createdAt descending", async () => {
      const uid = userId();
      const first = await createTestAccount(uid, { name: "First" });
      // Ensure distinct timestamps
      await new Promise((r) => setTimeout(r, 10));
      const second = await createTestAccount(uid, { name: "Second" });

      const result = await list(uid.toString());

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Second");
      expect(result[1].name).toBe("First");
    });

    it("should not return other users accounts", async () => {
      const uid1 = userId();
      const uid2 = userId();
      await createTestAccount(uid1, { name: "User1 Account" });
      await createTestAccount(uid2, { name: "User2 Account" });

      const result = await list(uid1.toString());

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("User1 Account");
    });
  });

  describe("create", () => {
    it("should create and return formatted account", async () => {
      const uid = userId();
      const result = await create(uid.toString(), {
        name: "Savings",
        type: "savings",
        balance: 1000,
        currency: "EUR",
        color: "#ff0000",
      });

      expect(result).toMatchObject({
        userId: uid.toString(),
        name: "Savings",
        type: "savings",
        balance: 1000,
        currency: "EUR",
        color: "#ff0000",
        isArchived: false,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should use defaults for optional fields", async () => {
      const uid = userId();
      const result = await create(uid.toString(), {
        name: "Basic",
        type: "checking",
      });

      expect(result.balance).toBe(0);
      expect(result.currency).toBe("USD");
      expect(result.color).toBe("#6366f1");
      expect(result.isArchived).toBe(false);
    });
  });

  describe("getById", () => {
    it("should return account for valid id and userId", async () => {
      const uid = userId();
      const account = await createTestAccount(uid);

      const result = await getById(uid.toString(), account._id.toString());

      expect(result.id).toBe(account._id.toString());
      expect(result.name).toBe("Checking");
    });

    it("should throw 404 for non-existent account id", async () => {
      const uid = userId();
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await getById(uid.toString(), fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw 404 when account belongs to a different user", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const account = await createTestAccount(uid1);

      try {
        await getById(uid2.toString(), account._id.toString());
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("update", () => {
    it("should update fields and return updated account", async () => {
      const uid = userId();
      const account = await createTestAccount(uid);

      const result = await update(uid.toString(), account._id.toString(), {
        name: "Updated",
        balance: 500,
      });

      expect(result.name).toBe("Updated");
      expect(result.balance).toBe(500);
    });

    it("should throw 404 for non-existent account", async () => {
      const uid = userId();
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await update(uid.toString(), fakeId, { name: "Ghost" });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw 404 when updating another users account", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const account = await createTestAccount(uid1);

      try {
        await update(uid2.toString(), account._id.toString(), {
          name: "Hijack",
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("archive", () => {
    it("should set isArchived to true", async () => {
      const uid = userId();
      const account = await createTestAccount(uid);

      const result = await archive(uid.toString(), account._id.toString());

      expect(result.isArchived).toBe(true);
    });

    it("should exclude archived accounts from list", async () => {
      const uid = userId();
      const account = await createTestAccount(uid);

      await archive(uid.toString(), account._id.toString());

      const accounts = await list(uid.toString());
      expect(accounts).toHaveLength(0);
    });

    it("should throw 404 for non-existent account", async () => {
      const uid = userId();
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await archive(uid.toString(), fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("getBalanceHistory", () => {
    it("should return empty array when no transactions exist", async () => {
      const uid = userId();
      const account = await createTestAccount(uid);

      const result = await getBalanceHistory(uid.toString(), account._id.toString());

      expect(result).toEqual([]);
    });

    it("should calculate running balance correctly", async () => {
      const uid = userId();
      const categoryId = new mongoose.Types.ObjectId();
      const account = await createTestAccount(uid);

      // January income
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "income",
        amount: 3000,
        currency: "USD",
        categoryId,
        description: "Salary",
        date: new Date(2025, 0, 15),
      });

      // January expense
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 1000,
        currency: "USD",
        categoryId,
        description: "Rent",
        date: new Date(2025, 0, 20),
      });

      // February income
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "income",
        amount: 3000,
        currency: "USD",
        categoryId,
        description: "Salary",
        date: new Date(2025, 1, 15),
      });

      // February expense
      await Transaction.create({
        userId: uid,
        accountId: account._id,
        type: "expense",
        amount: 1500,
        currency: "USD",
        categoryId,
        description: "Rent + Bills",
        date: new Date(2025, 1, 20),
      });

      const result = await getBalanceHistory(uid.toString(), account._id.toString());

      expect(result).toHaveLength(2);

      // January: 3000 income - 1000 expense = 2000 net, running = 2000
      expect(result[0]).toMatchObject({
        year: 2025,
        month: 1,
        income: 3000,
        expense: 1000,
        balance: 2000,
      });

      // February: 3000 income - 1500 expense = 1500 net, running = 3500
      expect(result[1]).toMatchObject({
        year: 2025,
        month: 2,
        income: 3000,
        expense: 1500,
        balance: 3500,
      });
    });

    it("should throw 404 for non-existent account", async () => {
      const uid = userId();
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await getBalanceHistory(uid.toString(), fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });
});
