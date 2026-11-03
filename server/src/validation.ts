import { z } from "zod";
import { ApiError } from "./errors.js";

export const uuid = z.string().uuid();
export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "ใช้รูปแบบ YYYY-MM-DD");

export function parseUuid(value: unknown): string {
  const result = uuid.safeParse(value);
  if (!result.success)
    throw new ApiError(400, "INVALID_ID", "รหัสรายการไม่ถูกต้อง");
  return result.data;
}

export function pagination(
  query: Record<string, unknown>,
  additional: Record<string, z.ZodType> = {},
) {
  const integerQuery = z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number);
  return z
    .strictObject({
      page: integerQuery.pipe(z.number().max(1_000_000)).default(1),
      pageSize: integerQuery.pipe(z.number().max(100)).default(20),
      ...additional,
    })
    .parse(query) as { page: number; pageSize: number; [key: string]: unknown };
}
