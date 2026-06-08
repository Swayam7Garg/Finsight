import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as accountService from "../services/account.service";

/**
 * GET /accounts
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const accounts = await accountService.list(req.userId!);

  res.status(200).json({
    success: true,
    data: accounts,
  });
});

/**
 * POST /accounts
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountService.create(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: account,
  });
});

/**
 * GET /accounts/:id
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountService.getById(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: account,
  });
});

/**
 * PATCH /accounts/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountService.update(req.userId!, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: account,
  });
});

/**
 * DELETE /accounts/:id  (soft-delete / archive)
 */
export const archive = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountService.archive(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: account,
    message: "Account archived successfully",
  });
});

/**
 * GET /accounts/:id/balance-history
 */
export const getBalanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await accountService.getBalanceHistory(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: history,
  });
});
