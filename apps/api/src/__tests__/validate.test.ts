import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validate } from "../middleware/validate";

function mockReq(overrides = {}) {
  return { body: {}, query: {}, params: {}, ...overrides } as any;
}

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as any;
}

const testSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

describe("validate", () => {
  describe("source defaults to body", () => {
    it("should validate req.body by default", () => {
      const middleware = validate(testSchema);
      const req = mockReq({ body: { name: "Alice", email: "alice@test.com" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe("valid input", () => {
    it("should call next on valid input", () => {
      const middleware = validate(testSchema);
      const req = mockReq({ body: { name: "Alice", email: "alice@test.com" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should replace req.body with parsed data", () => {
      const schema = z.object({
        name: z.string().trim(),
        age: z.coerce.number(),
      });
      const middleware = validate(schema);
      const req = mockReq({ body: { name: "  Alice  ", age: "25" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(req.body).toEqual({ name: "Alice", age: 25 });
    });
  });

  describe("invalid input", () => {
    it("should return 400 on invalid input", () => {
      const middleware = validate(testSchema);
      const req = mockReq({ body: { name: "", email: "not-an-email" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return correct error shape", () => {
      const middleware = validate(testSchema);
      const req = mockReq({ body: {} });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: expect.any(Object),
          }),
        })
      );
    });

    it("should include field paths and messages in error details", () => {
      const middleware = validate(testSchema);
      const req = mockReq({ body: { name: "", email: "bad" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      const response = res.json.mock.calls[0][0];
      const details = response.error.details;

      // details is Record<string, string[]> where keys are field paths
      expect(Object.keys(details).length).toBeGreaterThanOrEqual(1);
      for (const [path, messages] of Object.entries(details)) {
        expect(typeof path).toBe("string");
        expect(Array.isArray(messages)).toBe(true);
        (messages as string[]).forEach((msg) => {
          expect(typeof msg).toBe("string");
        });
      }
    });
  });

  describe("nested path errors", () => {
    it("should join nested paths with dot notation", () => {
      const nestedSchema = z.object({
        address: z.object({
          street: z.string().min(1),
        }),
      });
      const middleware = validate(nestedSchema);
      const req = mockReq({ body: { address: { street: "" } } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      const response = res.json.mock.calls[0][0];
      const details = response.error.details;

      // details keys are dot-joined paths like "address.street"
      expect(details).toHaveProperty("address.street");
      expect(details["address.street"].length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("source option", () => {
    it("should validate query when source is query", () => {
      const querySchema = z.object({
        search: z.string().min(1),
      });
      const middleware = validate(querySchema, { source: "query" });
      const req = mockReq({ query: { search: "test" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.query).toEqual({ search: "test" });
    });

    it("should return 400 when query validation fails", () => {
      const querySchema = z.object({
        search: z.string().min(1),
      });
      const middleware = validate(querySchema, { source: "query" });
      const req = mockReq({ query: {} });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("should validate params when source is params", () => {
      const paramsSchema = z.object({
        id: z.string().min(1),
      });
      const middleware = validate(paramsSchema, { source: "params" });
      const req = mockReq({ params: { id: "abc123" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.params).toEqual({ id: "abc123" });
    });

    it("should return 400 when params validation fails", () => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });
      const middleware = validate(paramsSchema, { source: "params" });
      const req = mockReq({ params: { id: "not-a-uuid" } });
      const res = mockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
