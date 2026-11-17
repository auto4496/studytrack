import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app, clock, db, login, origin, resetData } from "../helpers.js";

const enabled = {
  reminderEnabled: true,
  days: [
    { weekday: 2, readingTime: "20:00", reminderTime: "19:45" },
    { weekday: 1, readingTime: "18:00", reminderTime: "17:30" },
  ],
};

describe("F07 owned reading schedule", () => {
  let fixtures: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => {
    fixtures = await resetData();
  });
  afterAll(() => db.$disconnect());
  type Session = Awaited<ReturnType<typeof login>>;
  const put = (s: Session, path: string, body: unknown) =>
    s.agent
      .put(path)
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .send(body as object);
  async function setup(startDate = "2026-11-03") {
    const s = await login();
    const goal = (
      await s.agent
        .post("/api/goals")
        .set("Origin", origin)
        .set("X-CSRF-Token", s.csrf)
        .send({
          templateId: fixtures.template.id,
          dailyTargetMinutes: 30,
          startDate,
        })
        .expect(201)
    ).body.data;
    return { s, goal, path: `/api/goals/${goal.id}/schedule` };
  }

  it("TEST-F07-01: owned goal has a readable empty schedule before first save", async () => {
    const session = await login();
    const goal = (
      await session.agent
        .post("/api/goals")
        .set("Origin", origin)
        .set("X-CSRF-Token", session.csrf)
        .send({
          templateId: fixtures.template.id,
          dailyTargetMinutes: 30,
          startDate: "2026-11-03",
        })
        .expect(201)
    ).body.data;
    const response = await session.agent
      .get(`/api/goals/${goal.id}/schedule`)
      .expect(200);
    expect(response.body.data).toMatchObject({
      goalId: goal.id,
      timeZone: "Asia/Bangkok",
      config: null,
      evaluation: { date: "2026-11-03", weekday: 2, status: "NOT_CONFIGURED" },
    });
    expect(await db.dailyEntry.count()).toBe(0);
  });

  it("TEST-F07-01/02: canonical complete replacement persists and identical reordered retry preserves timestamps", async () => {
    const { s, goal, path } = await setup();
    const priorGoal = await db.goal.findUnique({ where: { id: goal.id } });
    const targets = await db.goalTargetVersion.findMany();
    const first = (await put(s, path, enabled).expect(200)).body.data;
    expect(
      first.config.days.map((d: { weekday: number }) => d.weekday),
    ).toEqual([1, 2]);
    expect(first.evaluation).toMatchObject({
      date: "2026-11-03",
      weekday: 2,
      status: "UPCOMING",
    });
    const original = await db.goalSchedule.findUniqueOrThrow({
      where: { goalId: goal.id },
    });
    clock.instant = new Date("2026-11-03T05:01Z");
    const identical = (
      await put(s, path, {
        reminderEnabled: true,
        days: [...enabled.days].reverse(),
      }).expect(200)
    ).body.data;
    expect(identical.config).toEqual(first.config);
    const allDays = {
      reminderEnabled: false,
      days: Array.from({ length: 7 }, (_, i) => ({
        weekday: i + 1,
        readingTime: "23:59",
        reminderTime: null,
      })),
    };
    await put(s, path, allDays).expect(200);
    expect(await db.goalSchedule.count()).toBe(1);
    expect(await db.goalScheduleDay.count()).toBe(7);
    const subset = { ...allDays, days: [allDays.days[1]] };
    const replaced = (await put(s, path, subset).expect(200)).body.data;
    expect(replaced.config).toMatchObject({
      reminderEnabled: false,
      days: subset.days,
      createdAt: original.createdAt.toISOString(),
    });
    expect(replaced.evaluation.status).toBe("DISABLED");
    expect(await db.goalScheduleDay.count()).toBe(1);
    expect((await s.agent.get(path).expect(200)).body.data).toEqual(replaced);
    expect(await db.goal.findUnique({ where: { id: goal.id } })).toEqual(
      priorGoal,
    );
    expect(await db.goalTargetVersion.findMany()).toEqual(targets);
    expect(await db.dailyEntry.count()).toBe(0);
  });

  const invalid = [
    {},
    { ...enabled, days: null },
    { ...enabled, ownerId: "injected" },
    { ...enabled, reminderEnabled: "true" },
    { ...enabled, days: [] },
    { ...enabled, days: Array(8).fill(enabled.days[0]) },
    { ...enabled, days: [enabled.days[0], enabled.days[0]] },
    ...[0, 8, 1.5, "2", null].map((weekday) => ({
      ...enabled,
      days: [{ ...enabled.days[0], weekday }],
    })),
    ...["24:00", "8:00", "20:60", "20:00:00", " 20:00", null].map(
      (readingTime) => ({
        ...enabled,
        days: [{ ...enabled.days[0], readingTime }],
      }),
    ),
    { ...enabled, days: [{ ...enabled.days[0], reminderTime: "20:01" }] },
    { ...enabled, days: [{ ...enabled.days[0], reminderTime: null }] },
    { ...enabled, days: [{ weekday: 2, readingTime: "20:00" }] },
    { ...enabled, days: [{ ...enabled.days[0], timezone: "UTC" }] },
    { reminderEnabled: false, days: enabled.days },
  ];
  it.each(invalid)(
    "TEST-F07-03/04: rejects invalid configuration %# without changing existing rows",
    async (input) => {
      const { s, path } = await setup();
      await put(s, path, enabled).expect(200);
      const before = await db.goalSchedule.findMany({
        include: { days: true },
      });
      await put(s, path, input).expect(422);
      expect(
        await db.goalSchedule.findMany({ include: { days: true } }),
      ).toEqual(before);
    },
  );

  it("TEST-F07-04/06/07/08: equality is due; a partial entry suppresses only today without changing progress or streak", async () => {
    const { s, goal, path } = await setup();
    await put(s, path, enabled).expect(200);
    clock.instant = new Date("2026-11-03T12:44:59Z");
    let fresh = await login();
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.evaluation.status,
    ).toBe("UPCOMING");
    clock.instant = new Date("2026-11-03T12:45:00Z");
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.evaluation.status,
    ).toBe("DUE");
    await fresh.agent
      .post(`/api/goals/${goal.id}/entries`)
      .set("Origin", origin)
      .set("X-CSRF-Token", fresh.csrf)
      .send({ entryDate: "2026-11-03", minutes: 20 })
      .expect(201);
    const before = await db.dailyEntry.findMany();
    for (let i = 0; i < 2; i++)
      expect(
        (await fresh.agent.get(path).expect(200)).body.data.evaluation.status,
      ).toBe("LOGGED");
    expect(
      (
        await fresh.agent
          .get(`/api/goals/${goal.id}/progress?date=2026-11-03`)
          .expect(200)
      ).body.data,
    ).toMatchObject({
      actualMinutes: 20,
      targetMinutes: 30,
      progressPercent: 66.67,
      achieved: false,
    });
    expect(
      (await fresh.agent.get(`/api/goals/${goal.id}/history`).expect(200)).body
        .data.streak,
    ).toMatchObject({ current: 0, best: 0 });
    expect(await db.dailyEntry.findMany()).toEqual(before);
    clock.instant = new Date("2026-11-03T17:00:00Z");
    fresh = await login();
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.evaluation,
    ).toMatchObject({
      date: "2026-11-04",
      weekday: 3,
      status: "NOT_SCHEDULED",
    });
  });

  it("TEST-F07-05/09/10/11: future setup is legal, inactive template independent, archived config read-only", async () => {
    const { s, goal, path } = await setup("2026-11-04");
    expect(
      (await put(s, path, enabled).expect(200)).body.data.evaluation.status,
    ).toBe("GOAL_NOT_STARTED");
    await db.activityTemplate.update({
      where: { id: fixtures.template.id },
      data: { isActive: false },
    });
    await put(s, path, {
      ...enabled,
      days: [{ weekday: 3, readingTime: "00:00", reminderTime: "00:00" }],
    }).expect(200);
    clock.instant = new Date("2026-11-03T17:00Z");
    const fresh = await login();
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.evaluation.status,
    ).toBe("DUE");
    await fresh.agent
      .post(`/api/goals/${goal.id}/stop`)
      .set("Origin", origin)
      .set("X-CSRF-Token", fresh.csrf)
      .send({})
      .expect(200);
    const before = await db.goalSchedule.findMany({ include: { days: true } });
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.evaluation.status,
    ).toBe("GOAL_ARCHIVED");
    await put(fresh, path, enabled).expect(409);
    expect(await db.goalSchedule.findMany({ include: { days: true } })).toEqual(
      before,
    );
  });

  it("TEST-F07-14: role/owner/expired/revoked privacy and strict transport without writes", async () => {
    const { s, path } = await setup();
    const other = await login("b@studytrack.test"),
      manager = await login("manager@studytrack.test");
    await request(app).get(path).expect(401);
    await request(app).put(path).send(enabled).expect(401);
    await manager.agent.get(path).expect(403);
    await put(manager, path, enabled).expect(403);
    const absent = "/api/goals/99999999-9999-4999-8999-999999999999/schedule";
    const foreign = (await other.agent.get(path).expect(404)).body.error;
    const missing = (await other.agent.get(absent).expect(404)).body.error;
    expect([foreign.code, foreign.message]).toEqual([
      missing.code,
      missing.message,
    ]);
    await put(other, path, enabled).expect(404);
    await put(other, absent, enabled).expect(404);
    await s.agent.get(path + "?date=2026-11-03").expect(422);
    await s.agent.get(path).send({ ownerId: "injected" }).expect(422);
    await put(s, path + "?x=1", enabled).expect(422);
    await s.agent.put(path).set("Origin", origin).send(enabled).expect(403);
    await s.agent
      .put(path)
      .set("Origin", "https://evil.invalid")
      .set("X-CSRF-Token", s.csrf)
      .send(enabled)
      .expect(403);
    await s.agent
      .put(path)
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .type("text")
      .send("x")
      .expect(415);
    await s.agent
      .put(path)
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .type("json")
      .send("{")
      .expect(400);
    await s.agent.get("/api/goals/bad-id/schedule").expect(400);
    await s.agent
      .post("/api/auth/logout")
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .send({})
      .expect(204);
    await s.agent.get(path).expect(401);
    await put(s, path, enabled).expect(401);
    clock.instant = new Date("2026-11-03T14:00Z");
    await other.agent.get(path).expect(401);
    await put(other, path, enabled).expect(401);
    expect(await db.goalSchedule.count()).toBe(0);
  });
});
