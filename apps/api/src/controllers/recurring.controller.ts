import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as recurringService from "../services/recurring.service";

/**
 * GET /recurring
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const rules = await recurringService.list(req.userId!);

  res.status(200).json({
    success: true,
    data: rules,
  });
});

/**
 * POST /recurring
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const rule = await recurringService.create(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: rule,
  });
});

/**
 * PATCH /recurring/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const rule = await recurringService.update(req.userId!, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: rule,
  });
});

/**
 * DELETE /recurring/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const rule = await recurringService.remove(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: rule,
    message: "Recurring rule deleted successfully",
  });
});

/**
 * GET /recurring/upcoming
 */
export const getUpcoming = asyncHandler(async (req: Request, res: Response) => {
  const rules = await recurringService.getUpcoming(req.userId!);

  res.status(200).json({
    success: true,
    data: rules,
  });
});

/**
 * POST /recurring/:id/mark-paid
 */
export const markAsPaid = asyncHandler(async (req: Request, res: Response) => {
  const result = await recurringService.markAsPaid(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: result,
    message: "Recurring transaction recorded successfully",
  });
});
