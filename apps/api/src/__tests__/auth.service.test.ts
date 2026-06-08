import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { Account } from "../models/account.model";
import { Transaction } from "../models/transaction.model";
import { Budget } from "../models/budget.model";
import { Goal } from "../models/goal.model";
import { RecurringRule } from "../models/recurring-rule.model";
import { ApiError } from "../utils/api-error";
import {
  register,
  login,
  generateTokens,
  refreshToken,
  getProfile,
  updateProfile,
  deleteAccount,
} from "../services/auth.service";

const PASSWORD = "TestPass1";
const FAST_ROUNDS = 2;

async function createTestUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    email: "test@example.com",
    name: "Test User",
    passwordHash: await bcrypt.hash(PASSWORD, FAST_ROUNDS),
    ...overrides,
  });
}

describe("auth.service", () => {
  describe("register", () => {
    it("should create a user and return sanitized user with tokens", async () => {
      const result = await register("new@example.com", "New User", PASSWORD);

      expect(result.user).toMatchObject({
        email: "new@example.com",
        name: "New User",
        currency: "USD",
      });
      expect(result.user.id).toBeDefined();
      expect(result.user.createdAt).toBeDefined();
      expect(result.user.avatarUrl).toBeNull();
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      // Password hash must not leak through sanitized user
      expect((result.user as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it("should lowercase the email", async () => {
      const result = await register("UPPER@Example.COM", "User", PASSWORD);

      expect(result.user.email).toBe("upper@example.com");
    });

    it("should hash the password (not store plain text)", async () => {
      await register("hash@example.com", "Hash User", PASSWORD);

      const user = await User.findOne({ email: "hash@example.com" });
      expect(user).not.toBeNull();
      expect(user!.passwordHash).not.toBe(PASSWORD);
      const matches = await bcrypt.compare(PASSWORD, user!.passwordHash);
      expect(matches).toBe(true);
    });

    it("should throw conflict when email already exists", async () => {
      await createTestUser({ email: "dup@example.com" });

      await expect(register("dup@example.com", "Dup", PASSWORD)).rejects.toThrow(ApiError);

      try {
        await register("dup@example.com", "Dup", PASSWORD);
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(409);
      }
    });

    it("should return valid JWT tokens", async () => {
      const result = await register("jwt@example.com", "JWT User", PASSWORD);

      const accessPayload = jwt.verify(result.accessToken, process.env.JWT_SECRET!) as Record<
        string,
        unknown
      >;
      const refreshPayload = jwt.verify(
        result.refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as Record<string, unknown>;

      expect(accessPayload.userId).toBe(result.user.id);
      expect(refreshPayload.userId).toBe(result.user.id);
    });
  });

  describe("login", () => {
    it("should return user and tokens for valid credentials", async () => {
      const user = await createTestUser();
      const result = await login("test@example.com", PASSWORD);

      expect(result.user.id).toBe(user._id.toString());
      expect(result.user.email).toBe("test@example.com");
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
    });

    it("should throw unauthorized for non-existent email", async () => {
      try {
        await login("noone@example.com", PASSWORD);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(401);
      }
    });

    it("should throw unauthorized for wrong password", async () => {
      await createTestUser();

      try {
        await login("test@example.com", "WrongPassword1");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(401);
      }
    });

    it("should be case-insensitive on email", async () => {
      await createTestUser({ email: "case@example.com" });
      const result = await login("CASE@Example.COM", PASSWORD);

      expect(result.user.email).toBe("case@example.com");
    });
  });

  describe("generateTokens", () => {
    it("should return accessToken and refreshToken strings", () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const tokens = generateTokens(userId);

      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it("should produce tokens that decode to contain userId", () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const tokens = generateTokens(userId);

      const accessPayload = jwt.verify(tokens.accessToken, process.env.JWT_SECRET!) as Record<
        string,
        unknown
      >;
      const refreshPayload = jwt.verify(
        tokens.refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as Record<string, unknown>;

      expect(accessPayload.userId).toBe(userId);
      expect(refreshPayload.userId).toBe(userId);
    });
  });

  describe("refreshToken", () => {
    it("should return a new token pair for a valid refresh token", () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const original = generateTokens(userId);
      const refreshed = refreshToken(original.refreshToken);

      expect(refreshed.accessToken).toEqual(expect.any(String));
      expect(refreshed.refreshToken).toEqual(expect.any(String));

      const payload = jwt.verify(refreshed.accessToken, process.env.JWT_SECRET!) as Record<
        string,
        unknown
      >;
      expect(payload.userId).toBe(userId);
    });

    it("should throw unauthorized for an invalid token", () => {
      try {
        refreshToken("not.a.valid.token");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(401);
      }
    });

    it("should throw unauthorized for an expired token", () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const expired = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: "0s",
      });

      try {
        refreshToken(expired);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(401);
      }
    });
  });

  describe("getProfile", () => {
    it("should return user profile for valid userId", async () => {
      const user = await createTestUser();
      const profile = await getProfile(user._id.toString());

      expect(profile).toMatchObject({
        id: user._id.toString(),
        email: "test@example.com",
        name: "Test User",
        currency: "USD",
      });
      expect(profile.createdAt).toBeDefined();
    });

    it("should throw notFound for non-existent userId", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await getProfile(fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("updateProfile", () => {
    it("should update name and return updated user", async () => {
      const user = await createTestUser();
      const updated = await updateProfile(user._id.toString(), {
        name: "New Name",
      });

      expect(updated.name).toBe("New Name");
      expect(updated.email).toBe("test@example.com");
    });

    it("should update currency and return updated user", async () => {
      const user = await createTestUser();
      const updated = await updateProfile(user._id.toString(), {
        currency: "EUR",
      });

      expect(updated.currency).toBe("EUR");
    });

    it("should throw notFound for non-existent userId", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await updateProfile(fakeId, { name: "Ghost" });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("deleteAccount", () => {
    it("should delete user and all related data", async () => {
      const user = await createTestUser();
      const userId = user._id;
      const categoryId = new mongoose.Types.ObjectId();

      const account = await Account.create({
        userId,
        name: "Checking",
        type: "checking",
      });

      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 50,
        currency: "USD",
        categoryId,
        description: "Groceries",
        date: new Date(),
      });

      await Budget.create({
        userId,
        categoryId,
        amount: 500,
        period: "monthly",
      });

      await Goal.create({
        userId,
        name: "Vacation",
        targetAmount: 1000,
      });

      await RecurringRule.create({
        userId,
        accountId: account._id,
        categoryId,
        type: "expense",
        amount: 100,
        description: "Rent",
        frequency: "monthly",
        startDate: new Date(),
        nextDueDate: new Date(),
      });

      await deleteAccount(userId.toString());

      expect(await User.findById(userId)).toBeNull();
      expect(await Account.countDocuments({ userId })).toBe(0);
      expect(await Transaction.countDocuments({ userId })).toBe(0);
      expect(await Budget.countDocuments({ userId })).toBe(0);
      expect(await Goal.countDocuments({ userId })).toBe(0);
      expect(await RecurringRule.countDocuments({ userId })).toBe(0);
    });

    it("should throw notFound for non-existent userId", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await deleteAccount(fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });
});
