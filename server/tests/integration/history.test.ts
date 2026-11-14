import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { targetForDate } from "../../src/features/goals/service.js";
import { app, db, clock, login, origin, resetData } from "../helpers.js";

describe("F-06 owned history and corrections", () => {
  let f: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => {
    f = await resetData();
  });
  afterAll(() => db.$disconnect());
  type Session = Awaited<ReturnType<typeof login>>;
  const mutate = (
    s: Session,
    path: string,
    body: object,
    method: "post" | "patch" = "patch",
  ) =>
    s.agent[method](path)
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .send(body);
  async function setup() {
    const s = await login();
    const goal = (
      await mutate(
        s,
        "/api/goals",
        {
          templateId: f.template.id,
          dailyTargetMinutes: 30,
          startDate: "2026-11-03",
        },
        "post",
      ).expect(201)
    ).body.data;
    const entry = (
      await mutate(
        s,
        `/api/goals/${goal.id}/entries`,
        {
          entryDate: "2026-11-03",
          minutes: 20,
        },
        "post",
      ).expect(201)
    ).body.data;
    return {
      s,
      goal,
      entry,
      path: `/api/goals/${goal.id}/history`,
      patch: `/api/goals/${goal.id}/entries/${entry.id}`,
    };
  }
  it("TEST-F06-01/05: reads persisted history and corrects the original entry", async () => {
    const { s, goal, entry, path, patch } = await setup();
    const h = (await s.agent.get(path).expect(200)).body.data;
    expect(h).toMatchObject({
      goalId: goal.id,
      today: "2026-11-03",
      pagination: { page: 1, pageSize: 20, total: 1 },
      entries: [entry],
      streak: { current: 0, best: 0 },
    });
    clock.instant = new Date("2026-11-03T05:01Z");
    const corrected = (await mutate(s, patch, { minutes: 30 }).expect(200)).body
      .data;
    expect(corrected).toMatchObject({
      id: entry.id,
      goalId: goal.id,
      entryDate: entry.entryDate,
      createdAt: entry.createdAt,
      minutes: 30,
      achieved: true,
      progressPercent: 100,
    });
    expect(corrected.updatedAt).not.toBe(entry.updatedAt);
    expect(
      (await s.agent.get(path).expect(200)).body.data.streak,
    ).toMatchObject({ current: 1, best: 1 });
    expect(await db.dailyEntry.count()).toBe(1);
    expect(
      (await mutate(s, patch, { minutes: 30 }).expect(200)).body.data,
    ).toEqual(corrected);
  });
  it("TEST-F06-02/04/08/12: real lifecycle fixture, inclusive pages and correction join/split historical streak", async () => {
    clock.instant = new Date("2026-11-01T05:00Z");
    let s = await login();
    const goal = (
      await mutate(
        s,
        "/api/goals",
        {
          templateId: f.template.id,
          dailyTargetMinutes: 30,
          startDate: "2026-11-01",
        },
        "post",
      ).expect(201)
    ).body.data;
    clock.instant = new Date("2026-11-05T05:00Z");
    s = await login();
    await mutate(s, `/api/goals/${goal.id}/target`, {
      dailyTargetMinutes: 60,
    }).expect(200);
    clock.instant = new Date("2026-11-09T05:00Z");
    s = await login();
    const saved = new Map<string, any>();
    for (const [date, minutes] of [
      ["01", 30],
      ["02", 45],
      ["04", 30],
      ["05", 20],
      ["06", 60],
      ["07", 70],
      ["08", 60],
    ] as const) {
      const d = `2026-11-${date}`;
      saved.set(
        d,
        (
          await mutate(
            s,
            `/api/goals/${goal.id}/entries`,
            { entryDate: d, minutes },
            "post",
          ).expect(201)
        ).body.data,
      );
    }
    await db.activityTemplate.update({
      where: { id: f.template.id },
      data: {
        title: "Changed",
        minMinutes: 100,
        maxMinutes: 120,
        isActive: false,
      },
    });
    const path = `/api/goals/${goal.id}/history`;
    const initial = (await s.agent.get(path).expect(200)).body.data;
    expect(initial.streak).toMatchObject({
      current: 3,
      best: 3,
      currentStartDate: "2026-11-06",
      currentEndDate: "2026-11-08",
    });
    for (const e of initial.entries) {
      expect(e.targetMinutes).toBe(
        await targetForDate(db, goal.id, e.entryDate),
      );
      expect(
        (
          await s.agent
            .get(`/api/goals/${goal.id}/progress?date=${e.entryDate}`)
            .expect(200)
        ).body.data.progressPercent,
      ).toBe(e.progressPercent);
    }
    const filter = "?from=2026-11-01&to=2026-11-02&pageSize=1";
    for (const [page, dates] of [
      [1, ["2026-11-02"]],
      [2, ["2026-11-01"]],
      [3, []],
    ] as const) {
      const h = (await s.agent.get(`${path}${filter}&page=${page}`).expect(200))
        .body.data;
      expect(h.pagination).toEqual({ page, pageSize: 1, total: 2 });
      expect(h.entries.map((e: any) => e.entryDate)).toEqual(dates);
      expect(h.streak).toEqual(initial.streak);
    }
    expect(
      (await s.agent.get(`${path}?from=2026-11-03&to=2026-11-03`).expect(200))
        .body.data.entries,
    ).toEqual([]);
    const versions = await db.goalTargetVersion.findMany({
      where: { goalId: goal.id },
    });
    const goalBefore = await db.goal.findUnique({ where: { id: goal.id } });
    const corrected = (
      await mutate(
        s,
        `/api/goals/${goal.id}/entries/${saved.get("2026-11-05").id}`,
        { minutes: 30 },
      ).expect(200)
    ).body.data;
    expect(corrected).toMatchObject({
      targetMinutes: 30,
      progressPercent: 100,
      achieved: true,
    });
    expect(
      (await s.agent.get(path).expect(200)).body.data.streak,
    ).toMatchObject({
      current: 5,
      best: 5,
      bestStartDate: "2026-11-04",
      bestEndDate: "2026-11-08",
    });
    expect(
      (
        await mutate(
          s,
          `/api/goals/${goal.id}/entries/${saved.get("2026-11-07").id}`,
          { minutes: 50 },
        ).expect(200)
      ).body.data,
    ).toMatchObject({
      targetMinutes: 60,
      progressPercent: 83.33,
      achieved: false,
    });
    expect((await s.agent.get(path).expect(200)).body.data.streak).toEqual({
      current: 1,
      best: 3,
      currentStartDate: "2026-11-08",
      currentEndDate: "2026-11-08",
      bestStartDate: "2026-11-04",
      bestEndDate: "2026-11-06",
    });
    expect(await db.dailyEntry.count()).toBe(7);
    expect(await db.goal.findUnique({ where: { id: goal.id } })).toEqual(
      goalBefore,
    );
    expect(
      await db.goalTargetVersion.findMany({ where: { goalId: goal.id } }),
    ).toEqual(versions);
  });
  it.each([
    ["from=2026-11-03", 422],
    ["to=2026-11-03", 422],
    ["from=2026-11-03&to=2026-11-02", 422],
    ["from=2026-11-02&to=2026-11-03", 422],
    ["from=2026-11-03&to=2026-11-04", 422],
    ["from=03-11-2026&to=2026-11-03", 400],
    ["from=2026-02-30&to=2026-11-03", 422],
    ["from=x&from=y&to=2026-11-03", 422],
    ["from[]=2026-11-03&to=2026-11-03", 422],
    ["page=0", 422],
    ["page=01", 422],
    ["page=1.5", 422],
    ["page=1000001", 422],
    ["pageSize=101", 422],
    ["page=1&page=2", 422],
    ["ownerId=x", 422],
  ])("TEST-F06-03: rejects query %s safely", async (query, status) => {
    const { s, path } = await setup();
    const before = await db.dailyEntry.findMany();
    await s.agent.get(`${path}?${query}`).expect(status as number);
    expect(await db.dailyEntry.findMany()).toEqual(before);
  });
  it.each([0, -1, 1441, 1.5, "30", true, null, undefined])(
    "TEST-F06-06: rejects minutes %s without writes",
    async (minutes) => {
      const { s, patch } = await setup();
      const before = await db.dailyEntry.findMany();
      await mutate(s, patch, { minutes }).expect(422);
      expect(await db.dailyEntry.findMany()).toEqual(before);
    },
  );
  it("TEST-F06-06/15: strict request bodies/query, snapshot endpoints and media/CSRF/IDs", async () => {
    const { s, patch, path } = await setup();
    for (const key of [
      "id",
      "goalId",
      "ownerId",
      "entryDate",
      "targetMinutes",
      "progressPercent",
      "achieved",
      "createdAt",
      "updatedAt",
      "today",
      "role",
    ]) {
      await mutate(s, patch, { minutes: 30, [key]: "injected" }).expect(422);
    }
    await mutate(s, `${patch}?x=1`, { minutes: 30 }).expect(422);
    await s.agent.get(path).send({ minutes: 30 }).expect(422);
    await s.agent
      .patch(patch)
      .set("Origin", origin)
      .send({ minutes: 30 })
      .expect(403);
    await s.agent
      .patch(patch)
      .set("Origin", "https://evil.invalid")
      .set("X-CSRF-Token", s.csrf)
      .send({ minutes: 30 })
      .expect(403);
    await s.agent
      .patch(patch)
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .type("text")
      .send("hello")
      .expect(415);
    await s.agent
      .patch(patch)
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .type("json")
      .send("{")
      .expect(400);
    await mutate(s, patch.replace(/[^/]+$/, "bad-id"), { minutes: 30 }).expect(
      400,
    );
    await s.agent.get("/api/goals/bad-id/history").expect(400);
    for (const minutes of [1, 1440])
      await mutate(s, patch, { minutes }).expect(200);
    expect(await db.dailyEntry.count()).toBe(1);
  });
  it("TEST-F06-07/10/13: future empty context, inclusive archive corrections and Bangkok midnight", async () => {
    const { s, goal, entry, path, patch } = await setup();
    await mutate(s, `/api/goals/${goal.id}/stop`, {}, "post").expect(200);
    clock.instant = new Date("2026-11-04T05:00Z");
    let fresh = await login();
    const future = (
      await mutate(
        fresh,
        "/api/goals",
        {
          templateId: f.template.id,
          dailyTargetMinutes: 30,
          startDate: "2026-11-05",
        },
        "post",
      ).expect(201)
    ).body.data;
    expect(
      (await fresh.agent.get(`/api/goals/${future.id}/history`).expect(200))
        .body.data,
    ).toMatchObject({
      eligibleRange: { from: "2026-11-05", to: null },
      filter: { from: null, to: null },
      entries: [],
      pagination: { total: 0 },
      streak: { current: 0, best: 0 },
    });
    await fresh.agent
      .get(`/api/goals/${future.id}/history?from=2026-11-05&to=2026-11-05`)
      .expect(422);
    await mutate(fresh, patch, { minutes: 30 }).expect(200);
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.streak.current,
    ).toBe(1);
    clock.instant = new Date("2026-11-04T16:59:59Z");
    fresh = await login();
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.streak.current,
    ).toBe(1);
    clock.instant = new Date("2026-11-04T17:00:00Z");
    expect((await fresh.agent.get(path).expect(200)).body.data).toMatchObject({
      today: "2026-11-05",
      streak: { current: 0, best: 1 },
    });
    expect(
      (await db.goal.findUniqueOrThrow({ where: { id: goal.id } })).status,
    ).toBe("ARCHIVED");
    // Invalid stored fixture must not be legitimized by correction.
    await db.dailyEntry.update({
      where: { id: entry.id },
      data: { entryDate: new Date("2026-11-04") },
    });
    await mutate(fresh, patch, { minutes: 45 }).expect(422);
  });
  it("TEST-F06-14: roles, foreign goal, wrong-parent and missing entry are private; expired/revoked", async () => {
    const { s, goal, entry, path, patch } = await setup();
    const other = await login("b@studytrack.test"),
      manager = await login("manager@studytrack.test");
    await request(app).get(path).expect(401);
    await request(app).patch(patch).send({ minutes: 30 }).expect(401);
    await manager.agent.get(path).expect(403);
    await mutate(manager, patch, { minutes: 30 }).expect(403);
    const missingGoal = "99999999-9999-4999-8999-999999999999";
    const foreign = (await other.agent.get(path).expect(404)).body.error;
    const missing = (
      await other.agent.get(`/api/goals/${missingGoal}/history`).expect(404)
    ).body.error;
    expect([foreign.code, foreign.message]).toEqual([
      missing.code,
      missing.message,
    ]);
    await mutate(other, patch, { minutes: 30 }).expect(404);
    const p2Goal = (
      await mutate(
        other,
        "/api/goals",
        {
          templateId: f.template.id,
          dailyTargetMinutes: 60,
          startDate: "2026-11-03",
        },
        "post",
      ).expect(201)
    ).body.data;
    await mutate(other, `/api/goals/${p2Goal.id}/entries/${entry.id}`, {
      minutes: 30,
    }).expect(404);
    await mutate(s, `/api/goals/${goal.id}/entries/${missingGoal}`, {
      minutes: 30,
    }).expect(404);
    await mutate(s, "/api/auth/logout", {}, "post").expect(204);
    await s.agent.get(path).expect(401);
    await mutate(s, patch, { minutes: 30 }).expect(401);
    clock.instant = new Date("2026-11-03T14:00Z");
    await other.agent.get(`/api/goals/${p2Goal.id}/history`).expect(401);
    expect(
      (await db.dailyEntry.findUniqueOrThrow({ where: { id: entry.id } }))
        .minutes,
    ).toBe(20);
  });
  it("TEST-F06-04/06/09: HALF_UP, uncapped/exact achievement, snapshot custom bounds and other-goal gaps", async () => {
    const { s, goal, entry, path, patch } = await setup();
    await db.goalTargetVersion.updateMany({
      where: { goalId: goal.id },
      data: { targetMinutes: 32 },
    });
    expect(
      (await mutate(s, patch, { minutes: 1 }).expect(200)).body.data,
    ).toMatchObject({
      targetMinutes: 32,
      progressPercent: 3.13,
      achieved: false,
    });
    await db.goalTargetVersion.updateMany({
      where: { goalId: goal.id },
      data: { targetMinutes: 60 },
    });
    expect(
      (await mutate(s, patch, { minutes: 75 }).expect(200)).body.data,
    ).toMatchObject({ progressPercent: 125, achieved: true });
    await db.goal.update({
      where: { id: goal.id },
      data: { minMinutesSnapshot: 30, maxMinutesSnapshot: 120 },
    });
    for (const minutes of [29, 121])
      await mutate(s, patch, { minutes }).expect(422);
    for (const minutes of [30, 120])
      await mutate(s, patch, { minutes }).expect(200);
    clock.instant = new Date("2026-11-05T05:00Z");
    const fresh = await login();
    await mutate(
      fresh,
      `/api/goals/${goal.id}/entries`,
      { entryDate: "2026-11-05", minutes: 60 },
      "post",
    ).expect(201);
    const other = await login("b@studytrack.test");
    const otherGoal = await db.goal.create({
      data: {
        ownerId: f.other.id,
        templateId: f.template.id,
        templateTitleSnapshot: "other",
        unit: "MINUTES",
        minMinutesSnapshot: 1,
        maxMinutesSnapshot: 1440,
        startDate: new Date("2026-11-03"),
        targets: {
          create: { effectiveFrom: new Date("2026-11-03"), targetMinutes: 30 },
        },
      },
    });
    await mutate(
      other,
      `/api/goals/${otherGoal.id}/entries`,
      { entryDate: "2026-11-04", minutes: 30 },
      "post",
    ).expect(201);
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.streak,
    ).toMatchObject({
      current: 1,
      best: 1,
      bestStartDate: "2026-11-03",
      bestEndDate: "2026-11-03",
    });
    expect(
      (await fresh.agent.get(path).expect(200)).body.data.entries.map(
        (e: any) => e.id,
      ),
    ).toContain(entry.id);
  });
});
