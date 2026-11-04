import { dateString } from "../../clock.js";
import { ApiError } from "../../errors.js";
import { parseLocalDate } from "../goals/rules.js";

export function validateEntryDate(
  value: string,
  goal: { startDate: Date; endDate: Date | null },
  today: string,
  field = "entryDate",
) {
  let parsed: Date;
  try {
    parsed = parseLocalDate(value);
  } catch (error) {
    if (error instanceof ApiError)
      throw new ApiError(error.status, error.code, error.message, {
        [field]: error.message,
      });
    throw error;
  }
  const end = goal.endDate ? dateString(goal.endDate) : today;
  if (value < dateString(goal.startDate) || value > today || value > end)
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "วันที่อยู่นอกช่วงที่บันทึกได้",
      {
        [field]:
          "เลือกวันตั้งแต่เริ่มเป้าหมายจนถึงวันสิ้นสุดหรือวันนี้ ตามเวลาไทย",
      },
    );
  return parsed;
}

export function validateEntryMinutes(
  value: unknown,
  bounds: { minMinutesSnapshot: number; maxMinutesSnapshot: number },
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < bounds.minMinutesSnapshot ||
    value > bounds.maxMinutesSnapshot
  )
    throw new ApiError(422, "VALIDATION_ERROR", "กรุณาตรวจเวลาที่บันทึก", {
      minutes: `ระบุจำนวนเต็ม ${bounds.minMinutesSnapshot}–${bounds.maxMinutesSnapshot} นาที`,
    });
  return value;
}

export function progressFor(actualMinutes: number, targetMinutes: number) {
  if (
    !Number.isInteger(targetMinutes) ||
    targetMinutes <= 0 ||
    targetMinutes > 1440 ||
    !Number.isInteger(actualMinutes) ||
    actualMinutes < 0 ||
    actualMinutes > 1440
  )
    throw new ApiError(500, "INTERNAL_ERROR", "ไม่สามารถคำนวณความคืบหน้าได้");
  // Round hundredths of a percent HALF_UP using a bounded integer ratio, including exact ties.
  const progressPercent =
    Math.floor((actualMinutes * 20_000 + targetMinutes) / (2 * targetMinutes)) /
    100;
  return { progressPercent, achieved: actualMinutes >= targetMinutes };
}
