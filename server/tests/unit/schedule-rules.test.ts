import { describe, expect, it } from "vitest";
import {
  minuteOf,
  reminderStatus,
  scheduleContext,
  scheduleInput,
  timeOf,
  type ScheduleInput,
} from "../../src/features/schedules/rules.js";

const config: ScheduleInput = {
  reminderEnabled: true,
  days: [{ weekday: 2, readingTime: "20:00", reminderTime: "19:45" }],
};
const goal = { status: "ACTIVE", startDate: "2026-11-01" };
describe("F07 Bangkok schedule rules", () => {
  it.each([
    ["2026-11-03T12:44:59Z", "2026-11-03", 2, 1184, "UPCOMING"],
    ["2026-11-03T12:45:00Z", "2026-11-03", 2, 1185, "DUE"],
    ["2026-11-03T16:59:59Z", "2026-11-03", 2, 1439, "DUE"],
    ["2026-11-03T17:00:00Z", "2026-11-04", 3, 0, "NOT_SCHEDULED"],
    ["2026-11-08T17:00:00Z", "2026-11-09", 1, 0, "NOT_SCHEDULED"],
    ["2026-12-31T17:00:00Z", "2027-01-01", 5, 0, "NOT_SCHEDULED"],
    ["2028-02-28T17:00:00Z", "2028-02-29", 2, 0, "UPCOMING"],
  ])(
    "TEST-F07-06/08: %s has one authoritative local context",
    (instant, date, weekday, minute, status) => {
      const context = scheduleContext(new Date(instant));
      expect(context).toEqual({ date, weekday, minute });
      expect(reminderStatus(config, goal, context, false)).toBe(status);
    },
  );
  it("TEST-F07-05/07: precedence preserves config/archive/start/day/toggle/logged distinctions", () => {
    const context = scheduleContext(new Date("2026-11-03T12:00Z"));
    expect(
      reminderStatus(null, { ...goal, status: "ARCHIVED" }, context, true),
    ).toBe("NOT_CONFIGURED");
    expect(
      reminderStatus(config, { ...goal, status: "ARCHIVED" }, context, true),
    ).toBe("GOAL_ARCHIVED");
    expect(
      reminderStatus(
        config,
        { ...goal, startDate: "2026-11-04" },
        context,
        true,
      ),
    ).toBe("GOAL_NOT_STARTED");
    expect(
      reminderStatus(
        { ...config, days: [{ ...config.days[0], weekday: 3 }] },
        goal,
        context,
        true,
      ),
    ).toBe("NOT_SCHEDULED");
    expect(
      reminderStatus(
        {
          reminderEnabled: false,
          days: [{ ...config.days[0], reminderTime: null }],
        },
        goal,
        context,
        true,
      ),
    ).toBe("DISABLED");
    expect(reminderStatus(config, goal, context, true)).toBe("LOGGED");
  });
  it("TEST-F07-04: canonical minute conversion covers midnight, day end and same-time reminder", () => {
    for (const minute of [0, 1, 59, 60, 1185, 1439])
      expect(minuteOf(timeOf(minute))).toBe(minute);
    expect(
      scheduleInput.parse({
        reminderEnabled: true,
        days: [{ weekday: 1, readingTime: "00:00", reminderTime: "00:00" }],
      }).days,
    ).toHaveLength(1);
  });
  it.each([
    "0:00",
    "24:00",
    "23:60",
    " 20:00",
    "20:00 ",
    "20:00:00",
    "๒๐:๐๐",
    "2e:00",
  ])("TEST-F07-04: time %j is never coerced", (readingTime) => {
    expect(
      scheduleInput.safeParse({
        reminderEnabled: false,
        days: [{ weekday: 1, readingTime, reminderTime: null }],
      }).success,
    ).toBe(false);
  });
});
