import { Prisma } from "@prisma/client";
import type { Dependencies } from "../../auth/context.js";
import { dateString } from "../../clock.js";
import { ApiError } from "../../errors.js";
import { requireOwnedGoal } from "../goals/service.js";
import {
  minuteOf,
  reminderStatus,
  scheduleContext,
  timeOf,
  type ScheduleInput,
} from "./rules.js";

type Stored = Prisma.GoalScheduleGetPayload<{ include: { days: true } }>;
const configInput = (schedule: Stored): ScheduleInput => ({
  reminderEnabled: schedule.reminderEnabled,
  days: [...schedule.days]
    .sort((a, b) => a.weekday - b.weekday)
    .map((day) => ({
      weekday: day.weekday,
      readingTime: timeOf(day.readingMinute),
      reminderTime:
        day.reminderMinute === null ? null : timeOf(day.reminderMinute),
    })),
});
async function dto(
  tx: Prisma.TransactionClient,
  goal: { id: string; status: string; startDate: Date },
  stored: Stored | null,
  now: Date,
) {
  const context = scheduleContext(now);
  const config = stored ? configInput(stored) : null;
  const logged = await tx.dailyEntry.findUnique({
    where: {
      goalId_entryDate: {
        goalId: goal.id,
        entryDate: new Date(`${context.date}T00:00:00Z`),
      },
    },
    select: { id: true },
  });
  return {
    goalId: goal.id,
    timeZone: "Asia/Bangkok" as const,
    config:
      stored && config
        ? {
            ...config,
            createdAt: stored.createdAt.toISOString(),
            updatedAt: stored.updatedAt.toISOString(),
          }
        : null,
    evaluation: {
      evaluatedAt: now.toISOString(),
      date: context.date,
      weekday: context.weekday,
      status: reminderStatus(
        config,
        { status: goal.status, startDate: dateString(goal.startDate) },
        context,
        !!logged,
      ),
    },
  };
}
export async function readSchedule(
  deps: Dependencies,
  ownerId: string,
  goalId: string,
) {
  return deps.db.$transaction(
    async (tx) => {
      const goal = await requireOwnedGoal(tx, goalId, ownerId);
      const now = deps.clock.now();
      const stored = await tx.goalSchedule.findUnique({
        where: { goalId },
        include: { days: true },
      });
      return dto(tx, goal, stored, now);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}
export async function replaceSchedule(
  deps: Dependencies,
  ownerId: string,
  goalId: string,
  input: ScheduleInput,
) {
  return deps.db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM goals WHERE id=${goalId}::uuid AND owner_id=${ownerId}::uuid FOR UPDATE`;
      const goal = await requireOwnedGoal(tx, goalId, ownerId);
      const now = deps.clock.now();
      if (goal.status === "ARCHIVED")
        throw new ApiError(
          409,
          "GOAL_ARCHIVED",
          "เป้าหมายนี้สิ้นสุดแล้ว ตารางอ่านยังดูได้แต่แก้ไขไม่ได้",
        );
      const normalized: ScheduleInput = {
        reminderEnabled: input.reminderEnabled,
        days: [...input.days]
          .sort((a, b) => a.weekday - b.weekday)
          .map((day) => ({
            weekday: day.weekday,
            readingTime: day.readingTime,
            reminderTime: day.reminderTime,
          })),
      };
      const current = await tx.goalSchedule.findUnique({
        where: { goalId },
        include: { days: true },
      });
      if (
        current &&
        JSON.stringify(configInput(current)) === JSON.stringify(normalized)
      )
        return dto(tx, goal, current, now);
      const values = normalized.days.map((day) => ({
        weekday: day.weekday,
        readingMinute: minuteOf(day.readingTime),
        reminderMinute:
          day.reminderTime === null ? null : minuteOf(day.reminderTime),
      }));
      let saved: Stored;
      if (current) {
        await tx.goalScheduleDay.deleteMany({
          where: { scheduleId: current.id },
        });
        saved = await tx.goalSchedule.update({
          where: { id: current.id },
          data: {
            reminderEnabled: input.reminderEnabled,
            updatedAt: now,
            days: { create: values },
          },
          include: { days: true },
        });
      } else {
        saved = await tx.goalSchedule.create({
          data: {
            goalId,
            reminderEnabled: input.reminderEnabled,
            createdAt: now,
            updatedAt: now,
            days: { create: values },
          },
          include: { days: true },
        });
      }
      return dto(tx, goal, saved, now);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
