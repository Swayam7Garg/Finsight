import { Goal, IGoal } from "../models/goal.model";
import { ApiError } from "../utils/api-error";

function formatGoal(goal: IGoal) {
  return {
    id: goal._id.toString(),
    userId: goal.userId.toString(),
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: goal.deadline ? goal.deadline.toISOString() : null,
    color: goal.color,
    icon: goal.icon,
    isCompleted: goal.isCompleted,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

/**
 * List all goals for a user.
 */
export async function list(userId: string) {
  const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
  return goals.map(formatGoal);
}

/**
 * Create a new goal.
 */
export async function create(
  userId: string,
  data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: string;
    color?: string;
    icon?: string;
  }
) {
  const goal = await Goal.create({
    userId,
    name: data.name,
    targetAmount: data.targetAmount,
    currentAmount: data.currentAmount ?? 0,
    deadline: data.deadline ? new Date(data.deadline) : null,
    color: data.color,
    icon: data.icon,
  });
  return formatGoal(goal);
}

/**
 * Update a goal. Verifies ownership.
 */
export async function update(
  userId: string,
  goalId: string,
  data: {
    name?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: string | null;
    color?: string;
    icon?: string;
  }
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.deadline !== undefined) {
    updateData.deadline = data.deadline ? new Date(data.deadline) : null;
  }

  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!goal) {
    throw ApiError.notFound("Goal not found");
  }
  return formatGoal(goal);
}

/**
 * Delete a goal. Verifies ownership.
 */
export async function remove(userId: string, goalId: string) {
  const goal = await Goal.findOneAndDelete({ _id: goalId, userId });
  if (!goal) {
    throw ApiError.notFound("Goal not found");
  }
  return formatGoal(goal);
}

/**
 * Add funds to a goal and mark completed if target is reached.
 */
export async function addFunds(userId: string, goalId: string, amount: number) {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) {
    throw ApiError.notFound("Goal not found");
  }

  if (goal.isCompleted) {
    throw ApiError.badRequest("This goal is already completed");
  }

  goal.currentAmount += amount;

  if (goal.currentAmount >= goal.targetAmount) {
    goal.isCompleted = true;
  }

  await goal.save();
  return formatGoal(goal);
}
