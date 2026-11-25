import type { PrismaClient } from "@prisma/client";
import { createApp } from "../../src/app.js";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app, clock, db, login, origin, resetData } from "../helpers.js";

describe("F-08 participant period summary", () => {
  let fixtures: Awaited<ReturnType<typeof resetData>>;

  beforeEach(async () => {
    fixtures = await resetData();
  });

  afterAll(() => db.$disconnect());

  it("TEST-F08-03/04/06: reads persisted minutes and includes targets for missing days", async () => {
    clock.instant = new Date("2026-11-02T05:00Z");
    const { agent, csrf } = await login();
    const goal = await agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", csrf)
      .send({
        templateId: fixtures.template.id,
        dailyTargetMinutes: 30,
        startDate: "2026-11-02",
      })
      .expect(201);
    await agent
      .post(`/api/goals/${goal.body.data.id}/entries`)
      .set("Origin", origin)
      .set("X-CSRF-Token", csrf)
      .send({ entryDate: "2026-11-02", minutes: 45 })
      .expect(201);
    clock.instant = new Date("2026-11-03T05:00Z");
    const fresh = await login();

    const summary = await fresh.agent
      .get("/api/summary?from=2026-11-02&to=2026-11-03")
      .expect(200);
    expect(summary.body.data.totals).toMatchObject({
      eligibleGoalDays: 2,
      eligibleDates: 2,
      entryCount: 1,
      totalMinutes: 45,
      targetMinutes: 60,
      achievedGoalDays: 1,
      achievedDates: 1,
      progressPercent: 75,
    });
    expect(summary.body.data.days[1]).toMatchObject({
      date: "2026-11-03",
      targetMinutes: 30,
      totalMinutes: 0,
      progressPercent: 0,
    });
  });

  async function makeGoal(
    ownerId: string,
    templateId: string,
    start: string,
    target: number,
    end?: string,
  ) {
    return db.goal.create({
      data: {
        ownerId,
        templateId,
        templateTitleSnapshot: "Reading snapshot",
        unit: "MINUTES",
        minMinutesSnapshot: 1,
        maxMinutesSnapshot: 1440,
        startDate: new Date(start),
        endDate: end ? new Date(end) : null,
        status: end ? "ARCHIVED" : "ACTIVE",
        targets: {
          create: { effectiveFrom: new Date(start), targetMinutes: target },
        },
      },
    });
  }

  it("TEST-F08-03/05/08/09/13: historical targets, distinct dates, paging and correction", async () => {
    clock.instant = new Date("2026-11-06T05:00Z");
    const owner = fixtures.user.id;
    const template = fixtures.template.id;
    const first = await makeGoal(
      owner,
      template,
      "2026-11-02",
      30,
      "2026-11-05",
    );
    const second = await makeGoal(owner, template, "2026-11-03", 20);
    const foreign = await makeGoal(
      fixtures.other.id,
      template,
      "2026-11-02",
      1,
    );
    await db.goalTargetVersion.createMany({
      data: [
        {
          goalId: first.id,
          effectiveFrom: new Date("2026-11-04"),
          targetMinutes: 60,
        },
        {
          goalId: first.id,
          effectiveFrom: new Date("2026-11-06"),
          targetMinutes: 120,
        },
      ],
    });
    await db.dailyEntry.createMany({
      data: [
        { goalId: first.id, entryDate: new Date("2026-11-02"), minutes: 30 },
        { goalId: first.id, entryDate: new Date("2026-11-04"), minutes: 30 },
        { goalId: first.id, entryDate: new Date("2026-11-05"), minutes: 90 },
        { goalId: second.id, entryDate: new Date("2026-11-03"), minutes: 20 },
        { goalId: second.id, entryDate: new Date("2026-11-04"), minutes: 5 },
        { goalId: second.id, entryDate: new Date("2026-11-05"), minutes: 20 },
        { goalId: foreign.id, entryDate: new Date("2026-11-02"), minutes: 999 },
      ],
    });
    await db.activityTemplate.update({
      where: { id: template },
      data: { title: "Renamed", isActive: false },
    });
    const { agent, csrf } = await login();
    const query = "/api/summary?from=2026-11-02&to=2026-11-06";
    const before = (await agent.get(query + "&pageSize=1").expect(200)).body
      .data;
    expect(before.totals).toEqual({
      eligibleGoalCount: 2,
      eligibleGoalDays: 8,
      eligibleDates: 5,
      entryCount: 6,
      totalMinutes: 195,
      targetMinutes: 260,
      achievedGoalDays: 4,
      achievedDates: 3,
      progressPercent: 75,
    });
    expect(before.days[3]).toMatchObject({
      totalMinutes: 110,
      targetMinutes: 80,
      achievedGoalCount: 2,
      progressPercent: 137.5,
    });
    expect(before.goals[0].goal.id).toBe(second.id);
    const next = (await agent.get(query + "&pageSize=1&page=2").expect(200))
      .body.data;
    expect(next.goals[0]).toMatchObject({
      goal: { id: first.id, title: "Reading snapshot", status: "ARCHIVED" },
      metrics: {
        totalMinutes: 150,
        targetMinutes: 180,
        progressPercent: 83.33,
      },
    });
    expect(next.totals).toEqual(before.totals);
    expect(next.days).toEqual(before.days);
    const later = (await agent.get(query + "&pageSize=1&page=3").expect(200))
      .body.data;
    expect(later.goals).toEqual([]);
    expect(later.totals).toEqual(before.totals);
    const selected = (
      await agent.get(query + "&goalId=" + first.id).expect(200)
    ).body.data;
    expect(selected.totals).toMatchObject({
      totalMinutes: 150,
      targetMinutes: 180,
      achievedDates: 2,
    });
    const entry = await db.dailyEntry.findFirstOrThrow({
      where: { goalId: first.id, entryDate: new Date("2026-11-04") },
    });
    await agent
      .patch(`/api/goals/${first.id}/entries/${entry.id}`)
      .set("Origin", origin)
      .set("X-CSRF-Token", csrf)
      .send({ minutes: 60 })
      .expect(200);
    const after = (await agent.get(query).expect(200)).body.data;
    expect(after.totals).toMatchObject({
      totalMinutes: 225,
      targetMinutes: 260,
      achievedGoalDays: 5,
      achievedDates: 4,
      progressPercent: 86.54,
    });
    expect(await db.dailyEntry.count()).toBe(7);
  });

  it("TEST-F08-01/07/11/16: default, empty, owned future and protected goal selection", async () => {
    const future = await makeGoal(
      fixtures.user.id,
      fixtures.template.id,
      "2026-11-07",
      30,
    );
    const { agent } = await login();
    const anonymous = request(app);
    await anonymous.get("/api/summary").expect(401);
    const manager = await login("manager@studytrack.test");
    await manager.agent.get("/api/summary").expect(403);
    const owner = (
      await agent.get("/api/summary?goalId=" + future.id).expect(200)
    ).body.data;
    expect(owner.range).toEqual({
      from: "2026-11-02",
      to: "2026-11-03",
      calendarDays: 2,
    });
    expect(owner.filter.goal.id).toBe(future.id);
    expect(owner.totals).toMatchObject({
      targetMinutes: 0,
      progressPercent: null,
    });
    expect(
      owner.days.map(
        (day: { progressPercent: number | null }) => day.progressPercent,
      ),
    ).toEqual([null, null]);
    const other = await login("b@studytrack.test");
    const foreign = (
      await other.agent.get("/api/summary?goalId=" + future.id).expect(404)
    ).body.error;
    const missing = (
      await other.agent
        .get("/api/summary?goalId=99999999-9999-4999-8999-999999999999")
        .expect(404)
    ).body.error;
    expect([foreign.code, foreign.message]).toEqual([
      missing.code,
      missing.message,
    ]);
    expect(await db.goal.count()).toBe(1);
    await db.goalTargetVersion.deleteMany({ where: { goalId: future.id } });
    clock.instant = new Date("2026-11-07T05:00Z");
    const fresh = await login();
    await fresh.agent.get("/api/summary?goalId=" + future.id).expect(422);
    expect(await db.goalTargetVersion.count()).toBe(0);
  });

  it("TEST-F08-02/12/21: strict query, date calendar and 366-date boundary", async () => {
    clock.instant = new Date("2024-03-01T05:00Z");
    const { agent } = await login();
    const accepted = (
      await agent.get("/api/summary?from=2023-03-02&to=2024-03-01").expect(200)
    ).body.data;
    expect(accepted.days).toHaveLength(366);
    expect(accepted.days[364].date).toBe("2024-02-29");
    await agent.get("/api/summary?from=2023-03-01&to=2024-03-01").expect(422);
    for (const [query, status] of [
      ["from=2024-02-28", 422],
      ["from=2024-02-29&to=2024-02-28", 422],
      ["from=2024-02-29&to=2024-03-02", 422],
      ["from=2024-02-30&to=2024-03-01", 422],
      ["from=x&to=2024-03-01", 400],
      ["page=1&page=2", 422],
      ["ownerId=another-user", 422],
      ["goalId=invalid", 400],
    ] as const) {
      await agent.get("/api/summary?" + query).expect(status);
    }
    await agent.get("/api/summary").send({ ownerId: "any" }).expect(422);
  });

  it("TEST-F08-14/15: concurrent writes do not tear the owner summary snapshot", async () => {
    const { agent, response } = await login();
    const own = fixtures.user.id;
    const template = fixtures.template.id;
    const goal = await makeGoal(own, template, "2026-11-03", 30);
    const entry = await db.dailyEntry.create({
      data: { goalId: goal.id, entryDate: new Date("2026-11-03"), minutes: 20 },
    });
    const paused = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    const delayedDb = db.$extends({
      query: {
        goal: {
          async findMany({ args, query }) {
            const rows = await query(args);
            paused.resolve();
            await resume.promise;
            return rows;
          },
        },
      },
    });
    const delayedApp = createApp({
      db: delayedDb as unknown as PrismaClient,
      clock,
      config: { origin, production: false, port: 5000 },
    });
    const pending = request(delayedApp)
      .get("/api/summary")
      .set("Cookie", response.headers["set-cookie"][0].split(";")[0])
      .then((result) => result);
    await paused.promise;
    try {
      await db.$transaction([
        db.dailyEntry.update({
          where: { id: entry.id },
          data: { minutes: 30 },
        }),
        db.goalTargetVersion.updateMany({
          where: { goalId: goal.id },
          data: { targetMinutes: 40 },
        }),
        db.goal.update({
          where: { id: goal.id },
          data: { status: "ARCHIVED", endDate: new Date("2026-11-03") },
        }),
      ]);
      await makeGoal(own, template, "2026-11-03", 10);
    } finally {
      resume.resolve();
    }
    const before = await pending;
    expect(before.status).toBe(200);
    expect(before.body.data.totals).toMatchObject({
      eligibleGoalCount: 1,
      totalMinutes: 20,
      targetMinutes: 30,
      progressPercent: 66.67,
    });
    expect(before.body.data.goals[0].goal.status).toBe("ACTIVE");
    const after = (await agent.get("/api/summary").expect(200)).body.data;
    expect(after.totals).toMatchObject({
      eligibleGoalCount: 2,
      totalMinutes: 30,
      targetMinutes: 50,
      progressPercent: 60,
    });
    expect(
      after.goals.find(
        (row: { goal: { id: string } }) => row.goal.id === goal.id,
      ).goal.status,
    ).toBe("ARCHIVED");
  });

  it("TEST-F08-10/11/16: schedules are independent, reads preserve rows, sessions expire", async () => {
    const { agent, csrf } = await login();
    const goal = await makeGoal(
      fixtures.user.id,
      fixtures.template.id,
      "2026-11-03",
      30,
    );
    const createSchedule = (reminderEnabled: boolean) =>
      agent
        .put(`/api/goals/${goal.id}/schedule`)
        .set("Origin", origin)
        .set("X-CSRF-Token", csrf)
        .send({
          reminderEnabled,
          days: [
            {
              weekday: 2,
              readingTime: "20:00",
              reminderTime: reminderEnabled ? "19:45" : null,
            },
          ],
        })
        .expect(200);
    await db.dailyEntry.create({
      data: { goalId: goal.id, entryDate: new Date("2026-11-03"), minutes: 20 },
    });
    const path = "/api/summary";
    const baseline = (await agent.get(path).expect(200)).body.data;
    const rows = await db.dailyEntry.findMany({ where: { goalId: goal.id } });
    const targets = await db.goalTargetVersion.findMany({
      where: { goalId: goal.id },
    });
    await createSchedule(true);
    expect((await agent.get(path).expect(200)).body.data).toEqual(baseline);
    await createSchedule(false);
    expect((await agent.get(path).expect(200)).body.data).toEqual(baseline);
    expect(
      await db.dailyEntry.findMany({ where: { goalId: goal.id } }),
    ).toEqual(rows);
    expect(
      await db.goalTargetVersion.findMany({ where: { goalId: goal.id } }),
    ).toEqual(targets);
    expect(await db.goal.findUnique({ where: { id: goal.id } })).toEqual(goal);

    const expired = await login();
    await agent
      .post("/api/auth/logout")
      .set("Origin", origin)
      .set("X-CSRF-Token", csrf)
      .expect(204);
    await agent.get(path).expect(401);
    clock.instant = new Date("2026-11-03T16:59Z");
    await expired.agent.get(path).expect(401);
    const atMidnight = await login();
    clock.instant = new Date("2026-11-03T17:00Z");
    const next = (await atMidnight.agent.get(path).expect(200)).body.data;
    expect(next.evaluation.today).toBe("2026-11-04");
    expect(next.range.to).toBe("2026-11-04");
    expect(next.days.at(-1).date).toBe("2026-11-04");
  });

  it("TEST-F08-13: the default second page excludes earlier rows without changing totals", async () => {
    for (let index = 0; index < 21; index++)
      await makeGoal(
        fixtures.user.id,
        fixtures.template.id,
        "2026-11-03",
        30,
        "2026-11-03",
      );
    const { agent } = await login();
    const one = (await agent.get("/api/summary").expect(200)).body.data;
    const two = (await agent.get("/api/summary?page=2").expect(200)).body.data;
    const ids = [...one.goals, ...two.goals].map(
      (item: { goal: { id: string } }) => item.goal.id,
    );
    expect(one.pagination).toEqual({ page: 1, pageSize: 20, total: 21 });
    expect(two.pagination).toEqual({ page: 2, pageSize: 20, total: 21 });
    expect(one.goals).toHaveLength(20);
    expect(two.goals).toHaveLength(1);
    expect(new Set(ids).size).toBe(21);
    expect([...ids].sort()).toEqual(ids);
    expect(two.totals).toEqual(one.totals);
    expect(two.days).toEqual(one.days);
  });
});
