import { addDays, dateString } from "../../clock.js";
import { ApiError } from "../../errors.js";
import { parseLocalDate } from "../goals/rules.js";

const DAY_MS = 86_400_000;

function parseBound(value: string, field: "from" | "to") {
  try {
    return parseLocalDate(value);
  } catch (error) {
    if (error instanceof ApiError)
      throw new ApiError(error.status, error.code, error.message, {
        [field]: error.message,
      });
    throw error;
  }
}

export function summaryRange(today: string, from?: string, to?: string) {
  if (from === undefined && to === undefined) {
    const weekday = new Date(today).getUTCDay();
    from = addDays(today, -((weekday + 6) % 7));
    to = today;
  }
  if (from === undefined || to === undefined)
    throw new ApiError(422, "VALIDATION_ERROR", "ระบุช่วงวันที่ให้ครบ", {
      [from === undefined ? "from" : "to"]: "กรุณาระบุวันที่",
    });
  const first = parseBound(from, "from");
  const last = parseBound(to, "to");
  const calendarDays = (last.getTime() - first.getTime()) / DAY_MS + 1;
  if (calendarDays < 1 || calendarDays > 366 || to > today)
    throw new ApiError(422, "VALIDATION_ERROR", "ช่วงวันที่ไม่ถูกต้อง", {
      to: "วันสิ้นสุดต้องอยู่ในช่วงไม่เกิน 366 วันและไม่เกินวันนี้",
    });
  const dates = Array.from({ length: calendarDays }, (_, index) =>
    dateString(new Date(first.getTime() + index * DAY_MS)),
  );
  return { from, to, calendarDays, dates, first, last };
}

export function weightedProgress(totalMinutes: number, targetMinutes: number) {
  if (targetMinutes === 0) return null;
  if (
    !Number.isSafeInteger(totalMinutes) ||
    !Number.isSafeInteger(targetMinutes)
  )
    throw new Error("Summary totals exceed the supported integer range");
  const target = BigInt(targetMinutes);
  const hundredths = (BigInt(totalMinutes) * 10_000n + target / 2n) / target;
  return Number(hundredths) / 100;
}
