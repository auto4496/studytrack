import { z } from "zod";
import { todayBangkok } from "../../clock.js";

const time = z
  .string()
  .regex(
    /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/,
    "ใช้เวลา HH:mm ตั้งแต่ 00:00 ถึง 23:59",
  );
export const scheduleInput = z
  .strictObject({
    reminderEnabled: z.boolean(),
    days: z
      .array(
        z.strictObject({
          weekday: z.number().int().min(1).max(7),
          readingTime: time,
          reminderTime: time.nullable(),
        }),
      )
      .min(1, "เลือกวันอ่านอย่างน้อยหนึ่งวัน")
      .max(7),
  })
  .superRefine((input, ctx) => {
    const seen = new Set<number>();
    input.days.forEach((day, index) => {
      if (seen.has(day.weekday))
        ctx.addIssue({
          code: "custom",
          path: ["days", index, "weekday"],
          message: "เลือกแต่ละวันได้ครั้งเดียว",
        });
      seen.add(day.weekday);
      if (
        input.reminderEnabled &&
        (day.reminderTime === null || day.reminderTime > day.readingTime)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["days", index, "reminderTime"],
          message: "ตั้งเวลาเตือนให้ไม่เกินเวลาอ่านของวันเดียวกัน",
        });
      }
      if (!input.reminderEnabled && day.reminderTime !== null)
        ctx.addIssue({
          code: "custom",
          path: ["days", index, "reminderTime"],
          message: "เมื่อปิดการเตือน เวลาเตือนต้องเป็น null",
        });
    });
  });
export type ScheduleInput = z.infer<typeof scheduleInput>;
export type ReminderStatus =
  | "NOT_CONFIGURED"
  | "GOAL_ARCHIVED"
  | "GOAL_NOT_STARTED"
  | "NOT_SCHEDULED"
  | "DISABLED"
  | "LOGGED"
  | "UPCOMING"
  | "DUE";
export const minuteOf = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const timeOf = (minute: number) =>
  `${Math.floor(minute / 60)
    .toString()
    .padStart(2, "0")}:${(minute % 60).toString().padStart(2, "0")}`;
const localTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});
export function scheduleContext(now: Date) {
  const date = todayBangkok({ now: () => now });
  const parts = localTime.formatToParts(now);
  const part = (name: string) =>
    Number(parts.find((p) => p.type === name)!.value);
  return {
    date,
    weekday: new Date(`${date}T00:00:00Z`).getUTCDay() || 7,
    minute: part("hour") * 60 + part("minute"),
  };
}
export function reminderStatus(
  config: ScheduleInput | null,
  goal: { status: string; startDate: string },
  context: ReturnType<typeof scheduleContext>,
  logged: boolean,
): ReminderStatus {
  if (!config) return "NOT_CONFIGURED";
  if (goal.status === "ARCHIVED") return "GOAL_ARCHIVED";
  if (context.date < goal.startDate) return "GOAL_NOT_STARTED";
  const slot = config.days.find((d) => d.weekday === context.weekday);
  if (!slot) return "NOT_SCHEDULED";
  if (!config.reminderEnabled) return "DISABLED";
  if (logged) return "LOGGED";
  return context.minute < minuteOf(slot.reminderTime!) ? "UPCOMING" : "DUE";
}
