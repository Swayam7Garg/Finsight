import { describe, it, expect } from "vitest";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

describe("parsePagination", () => {
  it("should return defaults when no params provided", () => {
    const result = parsePagination({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it("should parse string numbers correctly", () => {
    const result = parsePagination({ page: "3", limit: "15" });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(15);
    expect(result.skip).toBe(30);
  });

  it("should parse number types correctly", () => {
    const result = parsePagination({ page: 2, limit: 10 });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(10);
  });

  it("should clamp page < 1 to default", () => {
    const result = parsePagination({ page: "0" });

    expect(result.page).toBe(1);
  });

  it("should clamp negative page to default", () => {
    const result = parsePagination({ page: "-5" });

    expect(result.page).toBe(1);
  });

  it("should clamp limit < 1 to default", () => {
    const result = parsePagination({ limit: "0" });

    expect(result.limit).toBe(20);
  });

  it("should clamp negative limit to default", () => {
    const result = parsePagination({ limit: "-10" });

    expect(result.limit).toBe(20);
  });

  it("should clamp limit > 100 to 100", () => {
    const result = parsePagination({ limit: "200" });

    expect(result.limit).toBe(100);
  });

  it("should calculate skip as (page - 1) * limit", () => {
    const result = parsePagination({ page: "4", limit: "25" });

    expect(result.skip).toBe(75);
  });

  it("should calculate skip correctly for page 1", () => {
    const result = parsePagination({ page: "1", limit: "20" });

    expect(result.skip).toBe(0);
  });

  it("should treat NaN string as default for page", () => {
    const result = parsePagination({ page: "abc" });

    expect(result.page).toBe(1);
  });

  it("should treat NaN string as default for limit", () => {
    const result = parsePagination({ limit: "xyz" });

    expect(result.limit).toBe(20);
  });

  it("should handle undefined values", () => {
    const result = parsePagination({ page: undefined, limit: undefined });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });
});

describe("buildPaginatedResponse", () => {
  it("should return correct structure with success true", () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = buildPaginatedResponse(data, 50, 1, 20);

    expect(result).toEqual({
      success: true,
      data,
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      },
    });
  });

  it("should calculate totalPages as ceil of total / limit", () => {
    const result = buildPaginatedResponse([], 51, 1, 20);

    expect(result.pagination.totalPages).toBe(3);
  });

  it("should return totalPages 1 when total equals limit", () => {
    const result = buildPaginatedResponse([], 20, 1, 20);

    expect(result.pagination.totalPages).toBe(1);
  });

  it("should return totalPages 1 when total is less than limit", () => {
    const result = buildPaginatedResponse([], 5, 1, 20);

    expect(result.pagination.totalPages).toBe(1);
  });

  it("should handle empty data array", () => {
    const result = buildPaginatedResponse([], 0, 1, 20);

    expect(result.data).toEqual([]);
    expect(result.success).toBe(true);
  });

  it("should return totalPages 0 when total is 0", () => {
    const result = buildPaginatedResponse([], 0, 1, 20);

    expect(result.pagination.totalPages).toBe(0);
  });

  it("should preserve the data array reference", () => {
    const data = [{ name: "Alice" }, { name: "Bob" }];
    const result = buildPaginatedResponse(data, 2, 1, 20);

    expect(result.data).toBe(data);
  });
});
