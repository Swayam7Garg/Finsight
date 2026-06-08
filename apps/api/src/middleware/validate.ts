import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type ValidationSource = "body" | "query" | "params";

interface ValidateOptions {
  source?: ValidationSource;
}

/**
 * Returns Express middleware that validates the specified request property
 * (body, query, or params) against the provided Zod schema.
 *
 * On success the validated (and transformed) data replaces the original
 * request property so downstream handlers work with clean data.
 *
 * On failure a 400 JSON response is returned with structured error details.
 */
export function validate(schema: ZodSchema, options: ValidateOptions = {}) {
  const source: ValidationSource = options.source ?? "body";

  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const zodError: ZodError = result.error;
      const details: Record<string, string[]> = {};

      for (const issue of zodError.issues) {
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
        },
      });
      return;
    }

    // Replace the raw input with the parsed & transformed data
    (req as any)[source] = result.data;
    next();
  };
}
