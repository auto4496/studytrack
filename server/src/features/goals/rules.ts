import { ApiError } from '../../errors.js';
import { addDays, dateString } from '../../clock.js';

export function parseLocalDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApiError(400, 'INVALID_DATE', 'ใช้วันที่รูปแบบ YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || dateString(date) !== value) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'วันที่ไม่มีอยู่จริง', { startDate: 'กรุณาเลือกวันที่ที่ถูกต้อง' });
  }
  return date;
}

export function validateGoalRules(input: { dailyTargetMinutes: number; startDate: string }, template: { minMinutes: number; maxMinutes: number }, today: string): void {
  parseLocalDate(input.startDate);
  const fields: Record<string, string> = {};
  if (!Number.isInteger(input.dailyTargetMinutes) || input.dailyTargetMinutes < template.minMinutes || input.dailyTargetMinutes > template.maxMinutes) {
    fields.dailyTargetMinutes = `ระบุจำนวนเต็ม ${template.minMinutes}–${template.maxMinutes} นาที`;
  }
  if (input.startDate !== today && input.startDate !== addDays(today, 1)) fields.startDate = 'เริ่มได้วันนี้หรือพรุ่งนี้ ตามเวลาไทย';
  if (Object.keys(fields).length) throw new ApiError(422, 'VALIDATION_ERROR', 'กรุณาตรวจข้อมูลเป้าหมาย', fields);
}
