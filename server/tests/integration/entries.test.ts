import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { app, db, clock, login, origin, resetData } from "../helpers.js";

describe("F-04 persisted daily entries, date-effective progress and privacy", () => {
  let fixtures: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => {
    fixtures = await resetData();
  });
  afterAll(() => db.$disconnect());
  type Session = Awaited<ReturnType<typeof login>>;
  async function goal(
    session: Session,
    templateId = fixtures.template.id,
    target = 60,
  ) {
    const response = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send({ templateId, dailyTargetMinutes: target, startDate: "2026-11-03" })
      .expect(201);
    return response.body.data as { id: string };
  }
  const post = (
    session: Session,
    id: string,
    minutes: unknown,
    entryDate = "2026-11-03",
  ) =>
    session.agent
      .post(`/api/goals/${id}/entries`)
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send({ entryDate, minutes });
  async function extraTemplate() {
    return db.activityTemplate.create({
      data: {
        title: "Additional reading",
        minMinutes: 1,
        maxMinutes: 1440,
        createdById: fixtures.manager.id,
      },
    });
  }

  it("TEST-F04-01/02: committed entry and progress survive a fresh request/app; empty day has no phantom row", async () => {
    const session = await login();
    const own = await goal(session);
    const saved = await post(session, own.id, 45).expect(201);
    expect(saved.body.data).toMatchObject({
      goalId: own.id,
      entryDate: "2026-11-03",
      minutes: 45,
      targetMinutes: 60,
      progressPercent: 75,
      achieved: false,
    });
    expect(Object.keys(saved.body.data).sort()).toEqual(
      [
        "id",
        "goalId",
        "entryDate",
        "minutes",
        "targetMinutes",
        "progressPercent",
        "achieved",
        "createdAt",
        "updatedAt",
      ].sort(),
    );
    const stored = await db.dailyEntry.findUniqueOrThrow({
      where: { id: saved.body.data.id },
    });
    expect(stored.minutes).toBe(45);
    const fresh = createApp({
      db,
      clock,
      config: { origin, production: false, port: 5000 },
    });
    const cookie = session.response.headers["set-cookie"][0].split(";")[0];
    const progress = await request(fresh)
      .get(`/api/goals/${own.id}/progress?date=2026-11-03`)
      .set("Cookie", cookie)
      .expect(200);
    expect(progress.body.data).toEqual({
      goalId: own.id,
      date: "2026-11-03",
      actualMinutes: 45,
      targetMinutes: 60,
      progressPercent: 75,
      achieved: false,
      entryId: saved.body.data.id,
    });
    clock.instant = new Date("2026-11-04T05:00:00Z");
    const empty = await session.agent
      .get(`/api/goals/${own.id}/progress?date=2026-11-04`)
      .expect(200);
    expect(empty.body.data).toMatchObject({
      actualMinutes: 0,
      targetMinutes: 60,
      progressPercent: 0,
      achieved: false,
      entryId: null,
    });
    expect(await db.dailyEntry.count()).toBe(1);
    await post(session, own.id, 75, "2026-11-04").expect(201);
    const page1 = await session.agent
      .get(`/api/goals/${own.id}/entries?page=1&pageSize=1`)
      .expect(200);
    const page2 = await session.agent
      .get(`/api/goals/${own.id}/entries?page=2&pageSize=1`)
      .expect(200);
    expect(page1.body.meta).toEqual({ page: 1, pageSize: 1, total: 2 });
    expect(page1.body.data[0].entryDate).toBe("2026-11-04");
    expect(page2.body.data[0].entryDate).toBe("2026-11-03");
  });

  it.each([
    [45, 60, 75, false],
    [75, 60, 125, true],
    [60, 60, 100, true],
    [1, 32, 3.13, false],
  ])(
    "TEST-F04-04: API computes %s/%s = %s percent, achieved=%s",
    async (minutes, target, percent, achieved) => {
      const session = await login();
      const own = await goal(session, fixtures.template.id, target as number);
      const saved = await post(session, own.id, minutes).expect(201);
      expect(saved.body.data).toMatchObject({
        progressPercent: percent,
        achieved,
      });
      const read = await session.agent
        .get(`/api/goals/${own.id}/progress?date=2026-11-03`)
        .expect(200);
      expect(read.body.data).toMatchObject({
        progressPercent: percent,
        achieved,
      });
    },
  );

  it.each([
    ["2026-11-02", 422],
    ["2026-11-04", 422],
    ["2026-02-30", 422],
    ["2026-02-29", 422],
    ["03/11/2026", 400],
    ["2026-11-03T00:00:00Z", 400],
  ])(
    "TEST-F04-06: invalid date %s rejects with %s and no write",
    async (date, status) => {
      const session = await login();
      const own = await goal(session);
      const result = await post(session, own.id, 45, date as string).expect(
        status as number,
      );
      if (status === 422)
        expect(result.body.error.fields).toHaveProperty("entryDate");
      await session.agent
        .get(`/api/goals/${own.id}/progress?date=${date}`)
        .expect(status as number);
      expect(await db.dailyEntry.count()).toBe(0);
    },
  );

  it("TEST-F04-06: query/missing dates and Bangkok midnight obey inclusive start/today bounds", async () => {
    const session = await login();
    const own = await goal(session);
    for (const query of ["", "?date=2026-11-03&ownerId=x"])
      await session.agent
        .get(`/api/goals/${own.id}/progress${query}`)
        .expect(422);
    clock.instant = new Date("2026-11-03T16:59:59.999Z");
    await post(session, own.id, 45, "2026-11-04").expect(422);
    clock.instant = new Date("2026-11-03T17:00:00.000Z");
    await post(session, own.id, 45, "2026-11-04").expect(201);
    await post(session, own.id, 45, "2026-11-03").expect(201);
    expect(await db.dailyEntry.count()).toBe(2);
  });

  it.each([0, -1, 29, 121, 1441, 1.5, "60", true, null, undefined])(
    "TEST-F04-08: invalid minutes %s reject using snapshot bounds",
    async (minutes) => {
      await db.activityTemplate.update({
        where: { id: fixtures.template.id },
        data: { minMinutes: 30, maxMinutes: 120 },
      });
      const session = await login();
      const own = await goal(session);
      const result = await post(session, own.id, minutes).expect(422);
      expect(result.body.error.fields).toHaveProperty("minutes");
      expect(await db.dailyEntry.count()).toBe(0);
    },
  );

  it("TEST-F04-08: snapshot endpoints 1 and 1440 are accepted", async () => {
    const session = await login();
    const own = await goal(session);
    await post(session, own.id, 1).expect(201);
    clock.instant = new Date("2026-11-04T05:00:00Z");
    await post(session, own.id, 1440, "2026-11-04").expect(201);
  });

  it("TEST-F04-09: serial duplicate never overwrites and another participant can record the same day", async () => {
    const p1 = await login();
    const own = await goal(p1);
    const first = await post(p1, own.id, 45).expect(201);
    const duplicate = await post(p1, own.id, 75).expect(409);
    expect(duplicate.body.error.code).toBe("ENTRY_ALREADY_EXISTS");
    expect(
      (
        await db.dailyEntry.findUniqueOrThrow({
          where: { id: first.body.data.id },
        })
      ).minutes,
    ).toBe(45);
    expect(await db.dailyEntry.count()).toBe(1);
    const p2 = await login("b@studytrack.test");
    const other = await goal(p2);
    await post(p2, other.id, 60).expect(201);
    expect(await db.dailyEntry.count()).toBe(2);
  });

  it("TEST-F04-10: competing API writes get one201/one409 backed by exactly one database row", async () => {
    const session = await login();
    const own = await goal(session);
    const results = await Promise.all([
      post(session, own.id, 45),
      post(session, own.id, 75),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409)!.body.error.code).toBe(
      "ENTRY_ALREADY_EXISTS",
    );
    const winner = results.find((r) => r.status === 201)!.body.data;
    const rows = await db.dailyEntry.findMany({ where: { goalId: own.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].minutes).toBe(winner.minutes);
    expect(rows[0].id).toBe(winner.id);
  });

  it("TEST-F04-11: all entry/progress routes reject anonymous/manager/cross-owner without revealing private data", async () => {
    const p2 = await login("b@studytrack.test");
    const privateGoal = await goal(p2);
    await post(p2, privateGoal.id, 123).expect(201);
    const paths = [
      `/api/goals/${privateGoal.id}/entries`,
      `/api/goals/${privateGoal.id}/progress?date=2026-11-03`,
    ];
    const p1 = await login();
    const manager = await login("manager@studytrack.test");
    for (const path of paths) {
      await request(app).get(path).expect(401);
      await manager.agent.get(path).expect(403);
      const denied = await p1.agent.get(path).expect(404);
      const missing = await p1.agent
        .get(
          path.replace(privateGoal.id, "99999999-9999-4999-8999-999999999999"),
        )
        .expect(404);
      expect(denied.body.error.code).toBe(missing.body.error.code);
      expect(denied.body.error.message).toBe(missing.body.error.message);
      expect(JSON.stringify(denied.body)).not.toMatch(
        /Read CPE|123|targetMinutes|entryDate/,
      );
    }
    await request(app)
      .post(paths[0])
      .send({ entryDate: "2026-11-03", minutes: 45 })
      .expect(401);
    await post(manager, privateGoal.id, 45).expect(403);
    await post(p1, privateGoal.id, 45).expect(404);
    await post(p1, "99999999-9999-4999-8999-999999999999", 45).expect(404);
    expect(await db.dailyEntry.count()).toBe(1);
  });

  it("TEST-F04-12: bad CSRF/origin and logout replay cannot write or retrieve protected entries", async () => {
    const session = await login();
    const own = await goal(session);
    await session.agent
      .post(`/api/goals/${own.id}/entries`)
      .set("Origin", origin)
      .send({ entryDate: "2026-11-03", minutes: 45 })
      .expect(403);
    await session.agent
      .post(`/api/goals/${own.id}/entries`)
      .set("Origin", "https://attacker.invalid")
      .set("X-CSRF-Token", session.csrf)
      .send({ entryDate: "2026-11-03", minutes: 45 })
      .expect(403);
    await session.agent
      .post("/api/auth/logout")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .expect(204);
    await session.agent.get(`/api/goals/${own.id}/entries`).expect(401);
    await session.agent
      .get(`/api/goals/${own.id}/progress?date=2026-11-03`)
      .expect(401);
    await post(session, own.id, 45).expect(401);
    expect(await db.dailyEntry.count()).toBe(0);
  });

  it("TEST-F04-13: unknown derived/owner fields reject; database failure safely rolls back", async () => {
    const session = await login();
    const own = await goal(session);
    for (const key of [
      "ownerId",
      "userId",
      "role",
      "id",
      "targetMinutes",
      "targetVersionId",
      "actualMinutes",
      "progressPercent",
      "achieved",
      "unit",
      "createdAt",
    ]) {
      await session.agent
        .post(`/api/goals/${own.id}/entries`)
        .set("Origin", origin)
        .set("X-CSRF-Token", session.csrf)
        .send({ entryDate: "2026-11-03", minutes: 45, [key]: "injected" })
        .expect(422);
    }
    await session.agent
      .get(`/api/goals/${own.id}/entries?pageSize=101`)
      .expect(422);
    await db.$executeRawUnsafe(
      "CREATE FUNCTION test_reject_entry_b() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Controlled private entry failure'; END $$",
    );
    await db.$executeRawUnsafe(
      "CREATE TRIGGER test_entry_failure_b BEFORE INSERT ON daily_entries FOR EACH ROW EXECUTE FUNCTION test_reject_entry_b()",
    );
    try {
      const result = await post(session, own.id, 45).expect(500);
      expect(result.body.error.code).toBe("INTERNAL_ERROR");
      expect(JSON.stringify(result.body)).not.toMatch(
        /Controlled|SQL|password|stack/,
      );
      expect(await db.dailyEntry.count()).toBe(0);
    } finally {
      await db.$executeRawUnsafe(
        "DROP TRIGGER test_entry_failure_b ON daily_entries",
      );
      await db.$executeRawUnsafe("DROP FUNCTION test_reject_entry_b()");
    }
  });

  it("TEST-F04-14: effective targets and immutable snapshot ranges preserve historical progress", async () => {
    const session = await login();
    const own = await goal(session);
    await db.activityTemplate.update({
      where: { id: fixtures.template.id },
      data: { minMinutes: 10, maxMinutes: 100 },
    });
    await db.goalTargetVersion.create({
      data: {
        goalId: own.id,
        effectiveFrom: new Date("2026-11-04T00:00:00Z"),
        targetMinutes: 90,
      },
    });
    clock.instant = new Date("2026-11-04T05:00:00Z");
    expect(
      (await post(session, own.id, 75).expect(201)).body.data,
    ).toMatchObject({ targetMinutes: 60, progressPercent: 125 });
    expect(
      (await post(session, own.id, 135, "2026-11-04").expect(201)).body.data,
    ).toMatchObject({ targetMinutes: 90, progressPercent: 150 });
    const old = await session.agent
      .get(`/api/goals/${own.id}/progress?date=2026-11-03`)
      .expect(200);
    expect(old.body.data.targetMinutes).toBe(60);
  });

  it("TEST-F04-14: archived goal accepts historical dates through endDate, rejects later dates", async () => {
    const session = await login();
    const own = await goal(session, (await extraTemplate()).id);
    await db.goal.update({
      where: { id: own.id },
      data: { status: "ARCHIVED", endDate: new Date("2026-11-03T00:00:00Z") },
    });
    clock.instant = new Date("2026-11-04T05:00:00Z");
    await post(session, own.id, 45).expect(201);
    await post(session, own.id, 45, "2026-11-04").expect(422);
    await session.agent
      .get(`/api/goals/${own.id}/progress?date=2026-11-04`)
      .expect(422);
    expect(await db.dailyEntry.count()).toBe(1);
  });
});
