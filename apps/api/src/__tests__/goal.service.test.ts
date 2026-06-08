import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Goal } from "../models/goal.model";
import { ApiError } from "../utils/api-error";
import { list, create, update, remove, addFunds } from "../services/goal.service";

function userId() {
  return new mongoose.Types.ObjectId();
}

async function createTestGoal(
  userIdVal: mongoose.Types.ObjectId,
  overrides: Record<string, unknown> = {}
) {
  return Goal.create({
    userId: userIdVal,
    name: "Vacation Fund",
    targetAmount: 5000,
    ...overrides,
  });
}

describe("goal.service", () => {
  describe("list", () => {
    it("should return goals for the user", async () => {
      const uid = userId();
      await createTestGoal(uid, { name: "Goal A" });
      await createTestGoal(uid, { name: "Goal B" });

      const result = await list(uid.toString());

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no goals exist", async () => {
      const result = await list(userId().toString());
      expect(result).toEqual([]);
    });

    it("should exclude other users goals", async () => {
      const uid1 = userId();
      const uid2 = userId();
      await createTestGoal(uid1, { name: "User1 Goal" });
      await createTestGoal(uid2, { name: "User2 Goal" });

      const result = await list(uid1.toString());

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("User1 Goal");
    });

    it("should sort by createdAt descending", async () => {
      const uid = userId();
      await createTestGoal(uid, { name: "First" });
      await new Promise((r) => setTimeout(r, 10));
      await createTestGoal(uid, { name: "Second" });

      const result = await list(uid.toString());

      expect(result[0].name).toBe("Second");
      expect(result[1].name).toBe("First");
    });
  });

  describe("create", () => {
    it("should create a goal with defaults", async () => {
      const uid = userId();
      const result = await create(uid.toString(), {
        name: "New Car",
        targetAmount: 20000,
      });

      expect(result).toMatchObject({
        userId: uid.toString(),
        name: "New Car",
        targetAmount: 20000,
        currentAmount: 0,
        color: "#10b981",
        icon: "\uD83C\uDFAF",
        isCompleted: false,
      });
      expect(result.deadline).toBeNull();
      expect(result.id).toBeDefined();
    });

    it("should store deadline as a Date (ISO string in response)", async () => {
      const uid = userId();
      const deadline = "2026-12-31T00:00:00.000Z";
      const result = await create(uid.toString(), {
        name: "Timed Goal",
        targetAmount: 1000,
        deadline,
      });

      expect(result.deadline).toBe(deadline);
    });

    it("should accept custom color and icon", async () => {
      const uid = userId();
      const result = await create(uid.toString(), {
        name: "Custom",
        targetAmount: 500,
        color: "#ff0000",
        icon: "\uD83D\uDE80",
      });

      expect(result.color).toBe("#ff0000");
      expect(result.icon).toBe("\uD83D\uDE80");
    });
  });

  describe("update", () => {
    it("should update fields and return updated goal", async () => {
      const uid = userId();
      const goal = await createTestGoal(uid);

      const result = await update(uid.toString(), goal._id.toString(), {
        name: "Updated Name",
        targetAmount: 10000,
      });

      expect(result.name).toBe("Updated Name");
      expect(result.targetAmount).toBe(10000);
    });

    it("should clear deadline when set to null", async () => {
      const uid = userId();
      const goal = await createTestGoal(uid, {
        deadline: new Date("2026-06-01"),
      });

      const result = await update(uid.toString(), goal._id.toString(), {
        deadline: null,
      });

      expect(result.deadline).toBeNull();
    });

    it("should throw 404 for non-existent goal", async () => {
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

    it("should throw 404 when updating another users goal", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const goal = await createTestGoal(uid1);

      try {
        await update(uid2.toString(), goal._id.toString(), { name: "Nope" });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("remove", () => {
    it("should delete the goal and return it", async () => {
      const uid = userId();
      const goal = await createTestGoal(uid);

      const result = await remove(uid.toString(), goal._id.toString());

      expect(result.id).toBe(goal._id.toString());
      expect(await Goal.findById(goal._id)).toBeNull();
    });

    it("should throw 404 for wrong user", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const goal = await createTestGoal(uid1);

      try {
        await remove(uid2.toString(), goal._id.toString());
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw 404 for non-existent goal", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await remove(userId().toString(), fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("addFunds", () => {
    it("should increment currentAmount", async () => {
      const uid = userId();
      const goal = await createTestGoal(uid, { targetAmount: 1000 });

      const result = await addFunds(uid.toString(), goal._id.toString(), 250);

      expect(result.currentAmount).toBe(250);
      expect(result.isCompleted).toBe(false);
    });

    it("should accumulate across multiple calls", async () => {
      const uid = userId();
      const goal = await createTestGoal(uid, { targetAmount: 1000 });

      await addFunds(uid.toString(), goal._id.toString(), 300);
      const result = await addFunds(uid.toString(), goal._id.toString(), 200);

      expect(result.currentAmount).toBe(500);
      expect(result.isCompleted).toBe(false);
    });

    it("should mark isCompleted when currentAmount reaches targetAmount", async () => {
      const uid = userId();
      const goal = await createTestGoal(uid, { targetAmount: 500 });

      const result = await addFunds(uid.toString(), goal._id.toString(), 500);

      expect(result.currentAmount).toBe(500);
      expect(result.isCompleted).toBe(true);
    });

    it("should mark isCompleted when currentAmount exceeds targetAmount", async () => {
      const uid = userId();
      const goal = await createTestGoal(uid, { targetAmount: 500 });

      const result = await addFunds(uid.toString(), goal._id.toString(), 600);

      expect(result.currentAmount).toBe(600);
      expect(result.isCompleted).toBe(true);
    });

    it("should throw 404 for non-existent goal", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await addFunds(userId().toString(), fakeId, 100);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw badRequest when goal is already completed", async () => {
      const uid = userId();
      const goal = await createTestGoal(uid, {
        targetAmount: 500,
        currentAmount: 500,
        isCompleted: true,
      });

      try {
        await addFunds(uid.toString(), goal._id.toString(), 100);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(400);
      }
    });
  });
});
