import { Prisma } from "@prisma/client";
import type { Dependencies } from "../../auth/context.js";
import { dateString, todayBangkok } from "../../clock.js";
import { ApiError } from "../../errors.js";
import { requireOwnedGoal, targetForDate } from "../goals/service.js";
import { entryDTO } from "./service.js";
import { historicalTargets, streakFor } from "./history-rules.js";
import { validateEntryDate, validateEntryMinutes } from "./rules.js";

export async function readingHistory(
  deps: Dependencies,
  userId: string,
  goalId: string,
  input: { page: number; pageSize: number; from?: string; to?: string },
) {
  return deps.db.$transaction(
    async (tx) => {
      const goal = await requireOwnedGoal(tx, goalId, userId);
      const now = deps.clock.now();
      const today = todayBangkok({ now: () => now });
      const start = dateString(goal.startDate);
      const end =
        goal.endDate && dateString(goal.endDate) < today
          ? dateString(goal.endDate)
          : today;
      if ((input.from === undefined) !== (input.to === undefined))
        throw new ApiError(
          422,
          "VALIDATION_ERROR",
          "เลือกทั้งวันเริ่มและวันสิ้นสุด",
          { from: "ระบุช่วงวันที่ให้ครบ", to: "ระบุช่วงวันที่ให้ครบ" },
        );
      if (input.from !== undefined && input.to !== undefined) {
        validateEntryDate(input.from, goal, today, "from");
        validateEntryDate(input.to, goal, today, "to");
        if (input.from > input.to)
          throw new ApiError(422, "VALIDATION_ERROR", "ช่วงวันที่ไม่ถูกต้อง", {
            from: "วันเริ่มต้องไม่อยู่หลังวันสิ้นสุด",
            to: "ตรวจวันสิ้นสุด",
          });
      }
      const eligibleTo = start <= end ? end : null;
      const from = input.from ?? (eligibleTo ? start : null);
      const to = input.to ?? eligibleTo;
      const target = historicalTargets(goal.targets);
      // One scan of persisted eligible entries; range/page never narrow the streak domain.
      const entries = eligibleTo
        ? await tx.dailyEntry.findMany({
            where: {
              goalId,
              entryDate: {
                gte: goal.startDate,
                lte: new Date(`${eligibleTo}T00:00:00Z`),
              },
            },
            orderBy: [{ entryDate: "desc" }, { id: "asc" }],
          })
        : [];
      const rows = entries.map((e) =>
        entryDTO(e, target(dateString(e.entryDate))),
      );
      const filtered = rows.filter(
        (e) =>
          from !== null &&
          to !== null &&
          e.entryDate >= from &&
          e.entryDate <= to,
      );
      return {
        goalId,
        evaluatedAt: now.toISOString(),
        today,
        eligibleRange: { from: start, to: eligibleTo },
        filter: { from, to },
        entries: filtered.slice(
          (input.page - 1) * input.pageSize,
          input.page * input.pageSize,
        ),
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: filtered.length,
        },
        streak: streakFor(
          rows.filter((e) => e.achieved).map((e) => e.entryDate),
          today,
        ),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export async function correctEntry(
  deps: Dependencies,
  userId: string,
  goalId: string,
  entryId: string,
  minutes: number,
) {
  return deps.db.$transaction(
    async (tx) => {
      // Same Goal -> entry order as lifecycle writers; serialize absolute corrections.
      await tx.$queryRaw`SELECT id FROM goals WHERE id=${goalId}::uuid AND owner_id=${userId}::uuid FOR UPDATE`;
      const goal = await requireOwnedGoal(tx, goalId, userId);
      const now = deps.clock.now();
      const entry = await tx.dailyEntry.findFirst({
        where: { id: entryId, goalId },
      });
      if (!entry) throw new ApiError(404, "NOT_FOUND", "ไม่พบรายการที่ต้องการ");
      const date = dateString(entry.entryDate);
      validateEntryDate(date, goal, todayBangkok({ now: () => now }));
      validateEntryMinutes(minutes, goal);
      const target = await targetForDate(tx, goalId, date);
      const updated =
        entry.minutes === minutes
          ? entry
          : await tx.dailyEntry.update({
              where: { id: entry.id },
              data: { minutes, updatedAt: now },
            });
      return entryDTO(updated, target);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
