import { Prisma } from "@prisma/client";
import type { Dependencies } from "../../auth/context.js";
import { dateString, todayBangkok } from "../../clock.js";
import { ApiError } from "../../errors.js";
import { historicalTargets } from "../entries/history-rules.js";
import { summaryRange, weightedProgress } from "./rules.js";

interface SummaryQuery {
  from?: string;
  to?: string;
  goalId?: string;
  page: number;
  pageSize: number;
}

const goalSelect = {
  id: true,
  templateTitleSnapshot: true,
  startDate: true,
  endDate: true,
  status: true,
} satisfies Prisma.GoalSelect;

export async function readingSummary(
  { db, clock }: Dependencies,
  ownerId: string,
  input: SummaryQuery,
) {
  return db.$transaction(
    async (tx) => {
      // The owner query establishes the snapshot before reading the clock.
      const sourceGoals = await tx.goal.findMany({
        where: { ownerId, id: input.goalId },
        select: goalSelect,
        orderBy: [{ startDate: "desc" }, { id: "asc" }],
      });
      if (input.goalId && sourceGoals.length === 0)
        throw new ApiError(404, "NOT_FOUND", "ไม่พบรายการที่ต้องการ");

      const now = clock.now();
      const today = todayBangkok({ now: () => now });
      const { from, to, calendarDays, dates, first, last } = summaryRange(
        today,
        input.from,
        input.to,
      );
      const selectedGoals = sourceGoals.map((goal) => ({
        id: goal.id,
        title: goal.templateTitleSnapshot,
        status: goal.status,
        startDate: dateString(goal.startDate),
        endDate: goal.endDate && dateString(goal.endDate),
      }));
      const eligible = selectedGoals
        .map((goal) => ({
          goal,
          from: goal.startDate > from ? goal.startDate : from,
          to: goal.endDate && goal.endDate < to ? goal.endDate : to,
        }))
        .filter((goal) => goal.from <= goal.to);
      const goalIds = eligible.map(({ goal }) => goal.id);
      const versions = goalIds.length
        ? await tx.goalTargetVersion.findMany({
            where: { goalId: { in: goalIds }, effectiveFrom: { lte: last } },
            select: { goalId: true, effectiveFrom: true, targetMinutes: true },
          })
        : [];
      const entries = goalIds.length
        ? await tx.dailyEntry.findMany({
            where: {
              goalId: { in: goalIds },
              entryDate: { gte: first, lte: last },
            },
            select: { goalId: true, entryDate: true, minutes: true },
          })
        : [];
      const versionsByGoal = new Map<string, typeof versions>();
      for (const version of versions) {
        const goalVersions = versionsByGoal.get(version.goalId) ?? [];
        goalVersions.push(version);
        versionsByGoal.set(version.goalId, goalVersions);
      }
      const minutesByDay = new Map(
        entries.map((entry) => [
          `${entry.goalId}/${dateString(entry.entryDate)}`,
          entry.minutes,
        ]),
      );
      const days = dates.map((date) => ({
        date,
        eligibleGoalCount: 0,
        entryCount: 0,
        totalMinutes: 0,
        targetMinutes: 0,
        achievedGoalCount: 0,
      }));
      const goals = eligible.map(({ goal, from: start, to: end }) => {
        const targetOn = historicalTargets(versionsByGoal.get(goal.id) ?? []);
        const metrics = {
          eligibleDays: 0,
          entryCount: 0,
          totalMinutes: 0,
          targetMinutes: 0,
          achievedDays: 0,
        };
        for (const day of days) {
          if (day.date < start || day.date > end) continue;
          const target = targetOn(day.date);
          const logged = minutesByDay.get(`${goal.id}/${day.date}`);
          const actual = logged ?? 0;
          const achieved = actual >= target ? 1 : 0;
          metrics.eligibleDays++;
          metrics.entryCount += Number(logged !== undefined);
          metrics.totalMinutes += actual;
          metrics.targetMinutes += target;
          metrics.achievedDays += achieved;
          day.eligibleGoalCount++;
          day.entryCount += Number(logged !== undefined);
          day.totalMinutes += actual;
          day.targetMinutes += target;
          day.achievedGoalCount += achieved;
        }
        return {
          goal,
          eligibleRange: { from: start, to: end },
          metrics: {
            ...metrics,
            progressPercent: weightedProgress(
              metrics.totalMinutes,
              metrics.targetMinutes,
            ),
          },
        };
      });

      const totals = {
        eligibleGoalCount: goals.length,
        eligibleGoalDays: 0,
        eligibleDates: 0,
        entryCount: 0,
        totalMinutes: 0,
        targetMinutes: 0,
        achievedGoalDays: 0,
        achievedDates: 0,
      };
      for (const day of days) {
        totals.eligibleGoalDays += day.eligibleGoalCount;
        totals.eligibleDates += Number(day.eligibleGoalCount > 0);
        totals.entryCount += day.entryCount;
        totals.totalMinutes += day.totalMinutes;
        totals.targetMinutes += day.targetMinutes;
        totals.achievedGoalDays += day.achievedGoalCount;
        totals.achievedDates += Number(day.achievedGoalCount > 0);
      }

      const { page, pageSize } = input;
      return {
        evaluation: {
          evaluatedAt: now.toISOString(),
          today,
          timeZone: "Asia/Bangkok",
        },
        range: { from, to, calendarDays },
        filter: { goal: input.goalId ? selectedGoals[0] : null },
        totals: {
          ...totals,
          progressPercent: weightedProgress(
            totals.totalMinutes,
            totals.targetMinutes,
          ),
        },
        days: days.map((day) => ({
          ...day,
          hasAchievement: day.achievedGoalCount > 0,
          progressPercent: weightedProgress(
            day.totalMinutes,
            day.targetMinutes,
          ),
        })),
        goals: goals.slice((page - 1) * pageSize, page * pageSize),
        pagination: { page, pageSize, total: goals.length },
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}
