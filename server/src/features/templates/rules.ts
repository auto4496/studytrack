import { z } from "zod";

const lengthAtMost = (limit: number) => (value: string) =>
  [...value].length <= limit;
const title = z
  .string()
  .trim()
  .refine(
    (value) => [...value].length >= 3,
    "ระบุชื่อกิจกรรมอย่างน้อย 3 ตัวอักษร",
  )
  .refine(lengthAtMost(100), "ชื่อกิจกรรมยาวได้ไม่เกิน 100 ตัวอักษร");
const description = z
  .string()
  .trim()
  .refine(lengthAtMost(500), "คำอธิบายยาวได้ไม่เกิน 500 ตัวอักษร");
export const templateMetadataInput = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "ระบุข้อมูลที่ต้องการแก้ไข",
  );
export const templateInput = z
  .strictObject({
    title,
    description: description.default(""),
    minMinutes: z.number().int().min(1).max(1440),
    maxMinutes: z.number().int().min(1).max(1440),
  })
  .refine((value) => value.minMinutes <= value.maxMinutes, {
    path: ["maxMinutes"],
    message: "ค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด",
  });
