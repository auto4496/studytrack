import { describe, expect, it } from "vitest";
import {
  summaryRange,
  weightedProgress,
} from "../../src/features/summary/rules.js";

describe("F-08 period calculations", () => {
  it("TEST-F08-06: exact HALF_UP, an uncapped ratio and empty denominator", () => {
    expect(weightedProgress(1, 32)).toBe(3.13);
    expect(weightedProgress(75, 60)).toBe(125);
    expect(weightedProgress(195, 260)).toBe(75);
    expect(weightedProgress(2250, 2600)).toBe(86.54);
    expect(weightedProgress(0, 0)).toBeNull();
  });

  it("TEST-F08-01/21: Monday is the default start across month and year boundaries", () => {
    expect(summaryRange("2027-01-03")).toMatchObject({
      from: "2026-12-28",
      to: "2027-01-03",
      calendarDays: 7,
    });
    expect(summaryRange("2027-01-04").dates).toEqual(["2027-01-04"]);
  });
});
