import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as budgetService from "../services/budget.service";

/**
 * GET /budgets
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const budgets = await budgetService.list(req.userId!);

  res.status(200).json({
    success: true,
    data: budgets,
  });
});

/**
 * POST /budgets
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetService.create(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: budget,
  });
});

/**
 * PATCH /budgets/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetService.update(req.userId!, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: budget,
  });
});

/**
 * DELETE /budgets/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetService.remove(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: budget,
    message: "Budget deleted successfully",
  });
});

/**
 * GET /budgets/summary
 */
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await budgetService.getSummary(req.userId!);

  res.status(200).json({
    success: true,
    data: summary,
  });
});
