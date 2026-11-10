import { describe, expect, it } from "vitest";
import {
  progressFor,
  validateEntryDate,
  validateEntryMinutes,
} from "../../src/features/entries/rules.js";
import { todayBangkok } from "../../src/clock.js";

describe("F-04 daily rules", () => {
  it.each([
    [45, 60, 74, false],
    [75, 60, 125, true],
    [60, 60, 100, true],
    [1, 32, 3.13, false],
    [59, 60, 98.33, false],
    [0, 60, 0, false],
    [1440, 1, 144000, true],
  ])(
    "TEST-F04-03: %s/%s gives %s percent with achieved=%s",
    (actual, target, percent, achieved) => {
      expect(progressFor(actual as number, target as number)).toEqual({
        progressPercent: percent,
        achieved,
      });
    },
  );
  it("TEST-F04-03: corrupt target cannot produce a default percentage", () => {
    expect(() => progressFor(45, 0)).toThrow();
  });
  it.each([29, 121, 0, -1, 1.5, "60", true, null, undefined])(
    "TEST-F04-07: invalid minutes %s reject without coercion",
    (value) => {
      expect(() =>
        validateEntryMinutes(value, {
          minMinutesSnapshot: 30,
          maxMinutesSnapshot: 120,
        }),
      ).toThrow();
    },
  );
  it("TEST-F04-07: exact snapshot endpoints are accepted", () => {
    for (const value of [30, 120])
      expect(
        validateEntryMinutes(value, {
          minMinutesSnapshot: 30,
          maxMinutesSnapshot: 120,
        }),
      ).toBe(value);
  });
  it("TEST-F04-05: calendar validation includes leap/month/year transitions and correct field names", () => {
    const bounds = {
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: null,
    };
    expect(
      validateEntryDate("2024-02-29", bounds, "2026-11-03").toISOString(),
    ).toBe("2024-02-29T00:00:00.000Z");
    for (const date of [
      "2026-02-29",
      "2026-04-31",
      "2026-13-01",
      "2026-11-04",
      "2023-12-31",
      "2026-11-03T00:00:00Z",
    ])
      expect(() => validateEntryDate(date, bounds, "2026-11-03")).toThrow();
    try {
      validateEntryDate("2026-02-30", bounds, "2026-11-03", "date");
    } catch (e) {
      expect(e).toMatchObject({
        status: 422,
        fields: { date: expect.any(String) },
      });
    }
    for (const [instant, expected] of [
      ["2026-11-03T16:59:59Z", "2026-11-03"],
      ["2026-11-03T17:00:00Z", "2026-11-04"],
      ["2026-12-31T17:00:00Z", "2027-01-01"],
      ["2026-11-30T17:00:00Z", "2026-12-01"],
    ]) {
      expect(todayBangkok({ now: () => new Date(instant) })).toBe(expected);
    }
  });
});
