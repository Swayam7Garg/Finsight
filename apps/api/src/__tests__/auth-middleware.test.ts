import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { authenticate } from "../middleware/auth";
import { ApiError } from "../utils/api-error";

const SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";

function createToken(
  payload: Record<string, unknown>,
  secret = SECRET,
  options: jwt.SignOptions = { expiresIn: "1h" }
): string {
  return jwt.sign(payload, secret, options);
}

function mockReq(overrides = {}) {
  return {
    headers: {},
    ...overrides,
  } as any;
}

function mockRes() {
  return {} as any;
}

describe("authenticate", () => {
  describe("missing or malformed authorization header", () => {
    it("should throw unauthorized when no authorization header", async () => {
      const req = mockReq();
      const next = vi.fn();

      try {
        await authenticate(req, mockRes(), next);
        expect.fail("Expected authenticate to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
      }

      expect(next).not.toHaveBeenCalled();
    });

    it("should throw unauthorized when header does not start with Bearer", async () => {
      const req = mockReq({
        headers: { authorization: "Basic abc123" },
      });
      const next = vi.fn();

      try {
        await authenticate(req, mockRes(), next);
        expect.fail("Expected authenticate to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
      }

      expect(next).not.toHaveBeenCalled();
    });

    it("should throw unauthorized when token is empty after Bearer", async () => {
      const req = mockReq({
        headers: { authorization: "Bearer " },
      });
      const next = vi.fn();

      try {
        await authenticate(req, mockRes(), next);
        expect.fail("Expected authenticate to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
      }

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("valid token", () => {
    it("should set req.userId and call next for a valid token", async () => {
      const token = createToken({ userId: "user123" });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const next = vi.fn();

      await authenticate(req, mockRes(), next);

      expect(req.userId).toBe("user123");
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe("expired token", () => {
    it("should throw with expired message for expired tokens", async () => {
      const token = createToken({ userId: "user123" }, SECRET, {
        expiresIn: "-1s",
      });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const next = vi.fn();

      try {
        await authenticate(req, mockRes(), next);
        expect.fail("Expected authenticate to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
        expect((error as ApiError).message.toLowerCase()).toContain("expired");
      }

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("invalid token", () => {
    it("should throw for malformed tokens", async () => {
      const req = mockReq({
        headers: { authorization: "Bearer not.a.valid.jwt.token" },
      });
      const next = vi.fn();

      try {
        await authenticate(req, mockRes(), next);
        expect.fail("Expected authenticate to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
        expect((error as ApiError).message.toLowerCase()).toContain("invalid");
      }

      expect(next).not.toHaveBeenCalled();
    });

    it("should throw for tokens signed with wrong secret", async () => {
      const token = createToken({ userId: "user123" }, "wrong-secret-that-is-long-enough-32-chars");
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const next = vi.fn();

      try {
        await authenticate(req, mockRes(), next);
        expect.fail("Expected authenticate to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
        expect((error as ApiError).message.toLowerCase()).toContain("invalid");
      }

      expect(next).not.toHaveBeenCalled();
    });
  });
});
