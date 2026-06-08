import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as transactionService from "../services/transaction.service";
import * as csvImportService from "../services/csv-import.service";
import { ApiError } from "../utils/api-error";

/**
 * GET /transactions
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await transactionService.list(req.userId!, req.query as any);

  res.status(200).json(result);
});

/**
 * POST /transactions
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.create(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

/**
 * GET /transactions/:id
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.getById(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

/**
 * PATCH /transactions/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.update(req.userId!, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

/**
 * DELETE /transactions/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.remove(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: transaction,
    message: "Transaction deleted successfully",
  });
});

/**
 * POST /transactions/import
 * Accepts a multipart/form-data upload with:
 *   - file: the CSV file
 *   - accountId: target account
 *   - defaultCategoryId: fallback category when the CSV row has no category
 *   - mapping: JSON string mapping CSV headers to field names (from the frontend wizard)
 */
export const importCsv = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("A CSV file is required");
  }

  const { accountId, defaultCategoryId, mapping: mappingRaw } = req.body;

  if (!accountId) {
    throw ApiError.badRequest("accountId is required");
  }
  if (!defaultCategoryId) {
    throw ApiError.badRequest("defaultCategoryId is required");
  }

  let mapping: Record<string, string> = {};
  if (mappingRaw) {
    try {
      mapping = JSON.parse(mappingRaw);
    } catch {
      throw ApiError.badRequest("mapping must be valid JSON");
    }
  }

  const csvContent = req.file.buffer.toString("utf-8");
  const result = await csvImportService.importCsv(
    req.userId!,
    csvContent,
    mapping,
    accountId,
    defaultCategoryId
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /transactions/search?q=...
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";
  if (!query.trim()) {
    throw ApiError.badRequest("Search query (q) is required");
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await transactionService.search(req.userId!, query, page, limit);

  res.status(200).json(result);
});
