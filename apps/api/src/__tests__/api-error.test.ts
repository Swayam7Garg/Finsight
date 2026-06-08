import { describe, it, expect } from "vitest";
import { ApiError } from "../utils/api-error";

describe("ApiError", () => {
  describe("constructor", () => {
    it("should set all properties correctly", () => {
      const details = { field: "email" };
      const error = new ApiError(422, "CUSTOM_CODE", "Custom message", details);

      expect(error.statusCode).toBe(422);
      expect(error.code).toBe("CUSTOM_CODE");
      expect(error.message).toBe("Custom message");
      expect(error.details).toEqual({ field: "email" });
    });

    it("should extend Error", () => {
      const error = new ApiError(400, "TEST", "test");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });

    it("should leave details undefined when not provided", () => {
      const error = new ApiError(400, "TEST", "test");

      expect(error.details).toBeUndefined();
    });
  });

  describe("badRequest", () => {
    it("should create a 400 error with BAD_REQUEST code", () => {
      const error = ApiError.badRequest("Invalid input");

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.message).toBe("Invalid input");
    });

    it("should pass through details", () => {
      const details = { field: "name", reason: "too short" };
      const error = ApiError.badRequest("Invalid input", details);

      expect(error.details).toEqual(details);
    });

    it("should leave details undefined when not provided", () => {
      const error = ApiError.badRequest("Invalid input");

      expect(error.details).toBeUndefined();
    });
  });

  describe("unauthorized", () => {
    it("should create a 401 error with UNAUTHORIZED code", () => {
      const error = ApiError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("should use default message when none provided", () => {
      const error = ApiError.unauthorized();

      expect(error.message).toBe("Unauthorized");
    });

    it("should use custom message when provided", () => {
      const error = ApiError.unauthorized("Token expired");

      expect(error.message).toBe("Token expired");
    });
  });

  describe("forbidden", () => {
    it("should create a 403 error with FORBIDDEN code", () => {
      const error = ApiError.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
    });

    it("should use default message when none provided", () => {
      const error = ApiError.forbidden();

      expect(error.message).toBe("Forbidden");
    });

    it("should use custom message when provided", () => {
      const error = ApiError.forbidden("Insufficient permissions");

      expect(error.message).toBe("Insufficient permissions");
    });
  });

  describe("notFound", () => {
    it("should create a 404 error with NOT_FOUND code", () => {
      const error = ApiError.notFound();

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("should use default message when none provided", () => {
      const error = ApiError.notFound();

      expect(error.message).toBe("Resource not found");
    });

    it("should use custom message when provided", () => {
      const error = ApiError.notFound("User not found");

      expect(error.message).toBe("User not found");
    });
  });

  describe("conflict", () => {
    it("should create a 409 error with CONFLICT code", () => {
      const error = ApiError.conflict("Email already exists");

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error.message).toBe("Email already exists");
    });

    it("should pass through details", () => {
      const details = { field: "email" };
      const error = ApiError.conflict("Already exists", details);

      expect(error.details).toEqual(details);
    });

    it("should leave details undefined when not provided", () => {
      const error = ApiError.conflict("Already exists");

      expect(error.details).toBeUndefined();
    });
  });

  describe("internal", () => {
    it("should create a 500 error with INTERNAL_ERROR code", () => {
      const error = ApiError.internal();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_ERROR");
    });

    it("should use default message when none provided", () => {
      const error = ApiError.internal();

      expect(error.message).toBe("Internal server error");
    });

    it("should use custom message when provided", () => {
      const error = ApiError.internal("Database connection failed");

      expect(error.message).toBe("Database connection failed");
    });
  });
});
