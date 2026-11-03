import { z } from "zod";

const lengthAtMost = (limit: number) => (value: string) =>
  [...value].length <= limit;
export const templateInput = z
  .strictObject({
    title: z
      .string()
      .trim()
      .min(1, "กรุณาระบุชื่อกิจกรรม")
      .refine(lengthAtMost(100), "ชื่อกิจกรรมยาวได้ไม่เกิน 100 ตัวอักษร"),
    description: z
      .string()
      .trim()
      .refine(lengthAtMost(500), "คำอธิบายยาวได้ไม่เกิน 500 ตัวอักษร")
      .default(""),
    minMinutes: z.number().int().min(1).max(1440),
    maxMinutes: z.number().int().min(1).max(1440),
  })
  .refine((value) => value.minMinutes <= value.maxMinutes, {
    path: ["maxMinutes"],
    message: "ค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด",
  });
