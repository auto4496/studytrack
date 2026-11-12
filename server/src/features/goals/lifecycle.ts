import type { Dependencies } from "../../auth/context.js";
import { addDays, dateString, todayBangkok } from "../../clock.js";
import { ApiError } from "../../errors.js";
import { parseLocalDate } from "./rules.js";
import { goalDTO, requireOwnedGoal } from "./service.js";

export async function changeTarget(
  deps: Dependencies,
  ownerId: string,
  goalId: string,
  minutes: number,
) {
  return deps.db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM goals WHERE id=${goalId}::uuid AND owner_id=${ownerId}::uuid FOR UPDATE`;
    const goal = await requireOwnedGoal(tx, goalId, ownerId);
    const now = deps.clock.now();
    const today = todayBangkok({ now: () => now });
    if (goal.status === "ARCHIVED")
      throw new ApiError(
        409,
        "GOAL_ARCHIVED",
        "เป้าหมายนี้สิ้นสุดแล้ว เปลี่ยนเป้าหมายรายวันไม่ได้",
      );
    if (dateString(goal.startDate) > today)
      throw new ApiError(
        409,
        "GOAL_NOT_STARTED",
        "เปลี่ยนเป้าหมายได้ตั้งแต่วันที่เริ่มอ่าน",
      );
    if (
      !Number.isInteger(minutes) ||
      minutes < goal.minMinutesSnapshot ||
      minutes > goal.maxMinutesSnapshot
    )
      throw new ApiError(422, "VALIDATION_ERROR", "กรุณาตรวจเป้าหมายรายวัน", {
        dailyTargetMinutes: `ระบุจำนวนเต็ม ${goal.minMinutesSnapshot}–${goal.maxMinutesSnapshot} นาที`,
      });
    const effectiveFrom = parseLocalDate(addDays(today, 1));
    await tx.goalTargetVersion.upsert({
      where: { goalId_effectiveFrom: { goalId, effectiveFrom } },
      create: { goalId, effectiveFrom, targetMinutes: minutes, createdAt: now },
      update: { targetMinutes: minutes },
    });
    return goalDTO(await requireOwnedGoal(tx, goalId, ownerId), today);
  });
}

export async function stopGoal(
  deps: Dependencies,
  ownerId: string,
  goalId: string,
) {
  return deps.db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM goals WHERE id=${goalId}::uuid AND owner_id=${ownerId}::uuid FOR UPDATE`;
    const goal = await requireOwnedGoal(tx, goalId, ownerId);
    const now = deps.clock.now();
    const today = todayBangkok({ now: () => now });
    if (goal.status === "ARCHIVED") return goalDTO(goal, today);
    if (dateString(goal.startDate) > today)
      throw new ApiError(
        409,
        "GOAL_NOT_STARTED",
        "หยุดเป้าหมายได้ตั้งแต่วันที่เริ่มอ่าน",
      );
    const stopped = await tx.goal.update({
      where: { id: goalId },
      data: { status: "ARCHIVED", endDate: parseLocalDate(today) },
      include: { targets: true },
    });
    return goalDTO(stopped, today);
  });
}
