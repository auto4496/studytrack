import { Prisma, type DailyEntry } from "@prisma/client";
import type { Dependencies } from "../../auth/context.js";
import { dateString, todayBangkok } from "../../clock.js";
import { ApiError } from "../../errors.js";
import { requireOwnedGoal, targetForDate } from "../goals/service.js";
import {
  progressFor,
  validateEntryDate,
  validateEntryMinutes,
} from "./rules.js";

export function entryDTO(entry: DailyEntry, targetMinutes: number) {
  return {
    id: entry.id,
    goalId: entry.goalId,
    entryDate: dateString(entry.entryDate),
    minutes: entry.minutes,
    targetMinutes,
    ...progressFor(entry.minutes, targetMinutes),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export async function createEntry(
  deps: Dependencies,
  userId: string,
  goalId: string,
  input: { entryDate: string; minutes: number },
) {
  try {
    return await deps.db.$transaction(async (tx) => {
      // Same owner-scoped row/lock order as future goal lifecycle writers. Uniqueness is still enforced by PostgreSQL.
      await tx.$queryRaw`SELECT id FROM goals WHERE id = ${goalId}::uuid AND owner_id = ${userId}::uuid FOR SHARE`;
      const goal = await requireOwnedGoal(tx, goalId, userId);
      const entryDate = validateEntryDate(
        input.entryDate,
        goal,
        todayBangkok(deps.clock),
      );
      const minutes = validateEntryMinutes(input.minutes, goal);
      const target = await targetForDate(tx, goal.id, input.entryDate);
      const entry = await tx.dailyEntry.create({
        data: {
          goalId: goal.id,
          entryDate,
          minutes,
          createdAt: deps.clock.now(),
          updatedAt: deps.clock.now(),
        },
      });
      return entryDTO(entry, target);
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new ApiError(
        409,
        "ENTRY_ALREADY_EXISTS",
        "วันที่เลือกมีบันทึกแล้ว กรุณาตรวจรายการเดิม",
      );
    throw error;
  }
}

export async function dailyProgress(
  deps: Dependencies,
  userId: string,
  goalId: string,
  date: string,
) {
  return deps.db.$transaction(
    async (tx) => {
      const goal = await requireOwnedGoal(tx, goalId, userId);
      const entryDate = validateEntryDate(
        date,
        goal,
        todayBangkok(deps.clock),
        "date",
      );
      const targetMinutes = await targetForDate(tx, goal.id, date);
      const entry = await tx.dailyEntry.findUnique({
        where: { goalId_entryDate: { goalId: goal.id, entryDate } },
      });
      const actualMinutes = entry?.minutes ?? 0;
      return {
        goalId: goal.id,
        date,
        actualMinutes,
        targetMinutes,
        ...progressFor(actualMinutes, targetMinutes),
        entryId: entry?.id ?? null,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export async function listEntries(
  deps: Dependencies,
  userId: string,
  goalId: string,
  page: number,
  pageSize: number,
) {
  return deps.db.$transaction(
    async (tx) => {
      await requireOwnedGoal(tx, goalId, userId);
      const where = { goalId };
      const entries = await tx.dailyEntry.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ entryDate: "desc" }, { id: "asc" }],
      });
      const total = await tx.dailyEntry.count({ where });
      const data = await Promise.all(
        entries.map(async (entry) =>
          entryDTO(
            entry,
            await targetForDate(tx, goalId, dateString(entry.entryDate)),
          ),
        ),
      );
      return { data, meta: { page, pageSize, total } };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}
