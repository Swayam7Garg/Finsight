import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as goalService from "../services/goal.service";

/**
 * GET /goals
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const goals = await goalService.list(req.userId!);

  res.status(200).json({
    success: true,
    data: goals,
  });
});

/**
 * POST /goals
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const goal = await goalService.create(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: goal,
  });
});

/**
 * PATCH /goals/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const goal = await goalService.update(req.userId!, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: goal,
  });
});

/**
 * DELETE /goals/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const goal = await goalService.remove(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: goal,
    message: "Goal deleted successfully",
  });
});

/**
 * POST /goals/:id/add-funds
 */
export const addFunds = asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.body;
  const goal = await goalService.addFunds(req.userId!, req.params.id, amount);

  res.status(200).json({
    success: true,
    data: goal,
  });
});
