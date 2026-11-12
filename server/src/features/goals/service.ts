import { Prisma, type PrismaClient } from "@prisma/client";
import { addDays, dateString, todayBangkok } from "../../clock.js";
import type { Dependencies } from "../../auth/context.js";
import { ApiError } from "../../errors.js";
import { parseUuid } from "../../validation.js";
import { parseLocalDate, validateGoalRules } from "./rules.js";

type GoalWithTargets = Prisma.GoalGetPayload<{ include: { targets: true } }>;

export function goalDTO(goal: GoalWithTargets, today: string) {
  const startDate = dateString(goal.startDate);
  const lastDate = goal.endDate ? dateString(goal.endDate) : null;
  const displayDate = lastDate && lastDate < today ? lastDate : today;
  const effectiveOn = displayDate < startDate ? startDate : displayDate;
  const target = goal.targets
    .filter((v) => dateString(v.effectiveFrom) <= effectiveOn)
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
  if (!target)
    throw new ApiError(500, "INTERNAL_ERROR", "ไม่สามารถอ่านเป้าหมายได้");
  return {
    id: goal.id,
    templateId: goal.templateId,
    templateTitle: goal.templateTitleSnapshot,
    unit: goal.unit,
    minMinutes: goal.minMinutesSnapshot,
    maxMinutes: goal.maxMinutesSnapshot,
    startDate,
    endDate: goal.endDate ? dateString(goal.endDate) : null,
    status: goal.status,
    targetMinutes: target.targetMinutes,
    targetEffectiveFrom: dateString(target.effectiveFrom),
    pendingTarget:
      goal.status === "ACTIVE" && startDate <= today
        ? (() => {
            const pending = goal.targets.find(
              (v) => dateString(v.effectiveFrom) === addDays(today, 1),
            );
            return pending
              ? {
                  effectiveFrom: dateString(pending.effectiveFrom),
                  targetMinutes: pending.targetMinutes,
                }
              : null;
          })()
        : null,
    createdAt: goal.createdAt.toISOString(),
  };
}

export async function requireOwnedGoal(
  db: Pick<PrismaClient, "goal">,
  goalId: string,
  userId: string,
) {
  const goal = await db.goal.findFirst({
    where: { id: parseUuid(goalId), ownerId: userId },
    include: { targets: true },
  });
  if (!goal) throw new ApiError(404, "NOT_FOUND", "ไม่พบรายการที่ต้องการ");
  return goal;
}

// Call only after the feature has authorized access to the goal.
export async function targetForDate(
  db: Pick<PrismaClient, "goalTargetVersion">,
  goalId: string,
  date: string,
) {
  const target = await db.goalTargetVersion.findFirst({
    where: { goalId, effectiveFrom: { lte: parseLocalDate(date) } },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!target)
    throw new ApiError(422, "VALIDATION_ERROR", "วันที่อยู่นอกช่วงเป้าหมาย");
  return target.targetMinutes;
}

export async function createGoal(
  deps: Dependencies,
  ownerId: string,
  input: { templateId: string; dailyTargetMinutes: number; startDate: string },
) {
  try {
    return await deps.db.$transaction(async (tx) => {
      // Shared lock is compatible with competing creates; later template deactivation takes an exclusive row lock.
      await tx.$queryRaw`SELECT id FROM activity_templates WHERE id = ${input.templateId}::uuid FOR SHARE`;
      const template = await tx.activityTemplate.findUnique({
        where: { id: input.templateId },
      });
      if (!template)
        throw new ApiError(404, "NOT_FOUND", "ไม่พบรายการที่ต้องการ");
      if (!template.isActive)
        throw new ApiError(
          422,
          "TEMPLATE_INACTIVE",
          "กิจกรรมนี้ไม่เปิดรับเป้าหมายใหม่ กรุณาเลือกกิจกรรมอื่น",
        );
      validateGoalRules(input, template, todayBangkok(deps.clock));
      const goal = await tx.goal.create({
        data: {
          ownerId,
          templateId: template.id,
          templateTitleSnapshot: template.title,
          unit: template.unit,
          minMinutesSnapshot: template.minMinutes,
          maxMinutesSnapshot: template.maxMinutes,
          startDate: parseLocalDate(input.startDate),
          createdAt: deps.clock.now(),
          targets: {
            create: {
              effectiveFrom: parseLocalDate(input.startDate),
              targetMinutes: input.dailyTargetMinutes,
              createdAt: deps.clock.now(),
            },
          },
        },
        include: { targets: true },
      });
      return goalDTO(goal, todayBangkok(deps.clock));
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "ACTIVE_GOAL_EXISTS",
        "คุณมีเป้าหมายที่กำลังทำสำหรับกิจกรรมนี้แล้ว",
      );
    }
    throw error;
  }
}
