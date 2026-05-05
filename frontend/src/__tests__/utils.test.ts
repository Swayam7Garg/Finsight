import { describe, it, expect, vi } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeDate,
  getInitials,
  getCategoryColor,
  percentageChange,
  clamp,
  generateId,
} from "@/lib/utils";

describe("cn", () => {
  it("merges multiple class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "flex")).toBe("base flex");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null)).toBe("base");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats positive amounts", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-50.1)).toBe("-$50.10");
  });

  it("formats other currencies", () => {
    expect(formatCurrency(100, "EUR")).toBe("€100.00");
  });

  it("formats large numbers", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });
});

describe("formatDate", () => {
  it("formats a Date object with default format", () => {
    expect(formatDate(new Date(2024, 0, 15))).toBe("Jan 15, 2024");
  });

  it("formats an ISO string", () => {
    // Use midday UTC to avoid timezone-boundary shifts
    const result = formatDate("2024-06-15T12:00:00.000Z");
    expect(result).toContain("Jun");
    expect(result).toContain("2024");
  });

  it("accepts a custom format string", () => {
    expect(formatDate(new Date(2024, 11, 25), "yyyy-MM-dd")).toBe("2024-12-25");
  });
});

describe("formatRelativeDate", () => {
  it("returns relative time for today's date", () => {
    const now = new Date();
    const result = formatRelativeDate(now);
    expect(
      result.includes("ago") || result.includes("less than") || result.includes("second")
    ).toBe(true);
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDate(yesterday)).toBe("Yesterday");
  });

  it("returns formatted date for older dates", () => {
    const oldDate = new Date(2023, 0, 1);
    const result = formatRelativeDate(oldDate);
    expect(result).toContain("Jan");
    expect(result).toContain("2023");
  });
});

describe("getInitials", () => {
  it("returns single initial for one name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("returns two initials for two names", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns first and last initials for multiple names", () => {
    expect(getInitials("John Michael Doe")).toBe("JD");
  });

  it('returns "?" for empty string', () => {
    expect(getInitials("")).toBe("?");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  John   Doe  ")).toBe("JD");
  });

  it("uppercases lowercased input", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});

describe("getCategoryColor", () => {
  it("returns the color when present", () => {
    expect(getCategoryColor({ color: "#ef4444" })).toBe("#ef4444");
  });

  it("returns fallback for null", () => {
    expect(getCategoryColor(null)).toBe("#6366f1");
  });

  it("returns fallback for undefined", () => {
    expect(getCategoryColor(undefined)).toBe("#6366f1");
  });

  it("returns fallback when color property is missing", () => {
    expect(getCategoryColor({})).toBe("#6366f1");
  });
});

describe("percentageChange", () => {
  it("calculates a 50% increase", () => {
    expect(percentageChange(150, 100)).toBe(50);
  });

  it("calculates a 50% decrease", () => {
    expect(percentageChange(50, 100)).toBe(-50);
  });

  it("returns 0 for no change", () => {
    expect(percentageChange(100, 100)).toBe(0);
  });

  it("returns 0 when both values are 0", () => {
    expect(percentageChange(0, 0)).toBe(0);
  });

  it("returns 100 when previous is 0 and current is positive", () => {
    expect(percentageChange(50, 0)).toBe(100);
  });

  it("handles negative previous values using Math.abs", () => {
    expect(percentageChange(-50, -100)).toBe(50);
  });
});

describe("clamp", () => {
  it("returns value when in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when value is below", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max when value is above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("returns a string of at most 13 characters", () => {
    expect(generateId().length).toBeLessThanOrEqual(13);
  });

  it("returns different values on successive calls", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("contains only alphanumeric characters", () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
