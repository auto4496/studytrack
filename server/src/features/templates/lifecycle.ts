import type { Dependencies } from "../../auth/context.js";
import { ApiError } from "../../errors.js";

export async function updateTemplate(
  deps: Dependencies,
  id: string,
  patch: { title?: string; description?: string } | null,
) {
  return deps.db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM activity_templates WHERE id=${id}::uuid FOR UPDATE`;
    const current = await tx.activityTemplate.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "NOT_FOUND", "ไม่พบรายการที่ต้องการ");
    const data = patch === null ? { isActive: false } : patch;
    if (
      Object.entries(data).every(
        ([key, value]) => current[key as keyof typeof current] === value,
      )
    )
      return current;
    return tx.activityTemplate.update({
      where: { id },
      data: { ...data, updatedAt: deps.clock.now() },
    });
  });
}
