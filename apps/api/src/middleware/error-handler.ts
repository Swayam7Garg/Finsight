import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { ApiError } from "../utils/api-error";
import { env } from "../config/env";

/**
 * Global Express error handler.
 * Converts known error types into a consistent JSON response shape.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // ---- ApiError (our custom errors) ----
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
    return;
  }

  // ---- Zod validation errors ----
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "_root";
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    }

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
    return;
  }

  // ---- Mongoose ValidationError ----
  if (err instanceof mongoose.Error.ValidationError) {
    const details: Record<string, string[]> = {};
    for (const [field, validationError] of Object.entries(err.errors)) {
      details[field] = [validationError.message];
    }

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Database validation failed",
        details,
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
    return;
  }

  // ---- Mongoose CastError (e.g. invalid ObjectId) ----
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: `Invalid ${err.path}: ${err.value}`,
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
    return;
  }

  // ---- Mongoose duplicate key error (code 11000) ----
  if ((err as any).code === 11000 && (err as any).keyPattern) {
    const field = Object.keys((err as any).keyPattern)[0];
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_KEY",
        message: `A record with that ${field} already exists`,
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
    return;
  }

  // ---- Generic / unknown errors ----
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message || "Internal server error",
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}
