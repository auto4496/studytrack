import { describe, expect, it } from "vitest";
import {
  historicalTargets,
  streakFor,
} from "../../src/features/entries/history-rules.js";

describe("F06 calendar streak rules", () => {
  it.each([
    [[], "2026-11-09", 0, 0, null, null],
    [
      ["2026-11-08", "2026-11-09"],
      "2026-11-09",
      2,
      2,
      "2026-11-08",
      "2026-11-09",
    ],
    [
      ["2026-11-06", "2026-11-07", "2026-11-08"],
      "2026-11-09",
      3,
      3,
      "2026-11-06",
      "2026-11-08",
    ],
    [["2026-11-06", "2026-11-07"], "2026-11-09", 0, 2, null, null],
    [
      ["2028-02-28", "2028-02-29", "2028-03-01"],
      "2028-03-01",
      3,
      3,
      "2028-02-28",
      "2028-03-01",
    ],
    [
      ["2026-12-31", "2027-01-01"],
      "2027-01-02",
      2,
      2,
      "2026-12-31",
      "2027-01-01",
    ],
  ])("TEST-F06-09/10/13: %j at %s", (dates, today, current, best, from, to) => {
    expect(streakFor(dates as string[], today as string)).toMatchObject({
      current,
      best,
      currentStartDate: from,
      currentEndDate: to,
    });
  });
  it("TEST-F06-11: earliest tied run, unsorted duplicates and sparse centuries", () => {
    expect(
      streakFor(
        ["2026-11-07", "2026-11-06", "1600-01-01", "1600-01-02", "1600-01-02"],
        "2026-11-09",
      ),
    ).toEqual({
      current: 0,
      best: 2,
      currentStartDate: null,
      currentEndDate: null,
      bestStartDate: "1600-01-01",
      bestEndDate: "1600-01-02",
    });
  });
  it("TEST-F06-04: target lookup respects exact effective dates and refuses a missing baseline", () => {
    const target = historicalTargets([
      { effectiveFrom: new Date("2026-11-06"), targetMinutes: 60 },
      { effectiveFrom: new Date("2026-11-01"), targetMinutes: 30 },
    ]);
    expect(target("2026-11-05")).toBe(30);
    expect(target("2026-11-06")).toBe(60);
    expect(() => target("2026-10-31")).toThrow();
    expect(() => historicalTargets([])("2026-11-01")).toThrow();
  });
});
