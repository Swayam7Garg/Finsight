import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as analyticsService from "../services/analytics.service";
import { ApiError } from "../utils/api-error";

/**
 * GET /analytics/spending-by-category?startDate=...&endDate=...
 */
export const spendingByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw ApiError.badRequest("startDate and endDate query parameters are required");
  }

  const data = await analyticsService.spendingByCategory(
    req.userId!,
    startDate as string,
    endDate as string
  );

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /analytics/income-vs-expense?months=12
 */
export const incomeVsExpense = asyncHandler(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 12;
  const data = await analyticsService.incomeVsExpense(req.userId!, months);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /analytics/monthly-summary?year=2024&month=6
 */
export const monthlySummary = asyncHandler(async (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string);
  const month = parseInt(req.query.month as string);

  if (!year || !month || month < 1 || month > 12) {
    throw ApiError.badRequest("Valid year and month (1-12) query parameters are required");
  }

  const data = await analyticsService.monthlySummary(req.userId!, year, month);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /analytics/trends?months=6
 */
export const trends = asyncHandler(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 6;
  const data = await analyticsService.trends(req.userId!, months);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /analytics/net-worth
 */
export const netWorth = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.netWorth(req.userId!);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /analytics/spending-by-day-of-week?startDate=...&endDate=...
 */
export const spendingByDayOfWeek = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw ApiError.badRequest("startDate and endDate query parameters are required");
  }

  const data = await analyticsService.spendingByDayOfWeek(
    req.userId!,
    startDate as string,
    endDate as string
  );

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /analytics/category-monthly-breakdown?months=6
 */
export const categoryMonthlyBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 6;
  const data = await analyticsService.categoryMonthlyBreakdown(req.userId!, months);

  res.status(200).json({
    success: true,
    data,
  });
});
