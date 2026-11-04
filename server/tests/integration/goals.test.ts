import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { targetForDate } from "../../src/features/goals/service.js";
import { app, db, clock, login, origin, resetData } from "../helpers.js";

describe("F-03 persisted personal goals and backend permissions", () => {
  let fixtures: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => {
    fixtures = await resetData();
  });
  afterAll(() => db.$disconnect());
  const body = () => ({
    templateId: fixtures.template.id,
    dailyTargetMinutes: 60,
    startDate: "2026-11-03",
  });

  it("TEST-F03-01/07: creates goal and initial version atomically with immutable snapshots", async () => {
    const session = await login();
    const response = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send(body())
      .expect(201);
    expect(response.body.data).toMatchObject({
      templateTitle: "Read CPE 334",
      targetMinutes: 60,
      targetEffectiveFrom: "2026-11-03",
      startDate: "2026-11-03",
      status: "ACTIVE",
    });
    expect(response.body.data).not.toHaveProperty("ownerId");
    const goal = await db.goal.findUniqueOrThrow({
      where: { id: response.body.data.id },
      include: { targets: true },
    });
    expect(goal.ownerId).toBe(fixtures.user.id);
    expect(goal.targets).toHaveLength(1);
    await db.activityTemplate.update({
      where: { id: fixtures.template.id },
      data: { title: "A changed title", minMinutes: 15, maxMinutes: 120 },
    });
    const saved = await session.agent.get(`/api/goals/${goal.id}`).expect(200);
    expect(saved.body.data).toMatchObject({
      templateTitle: "Read CPE 334",
      minMinutes: 1,
      maxMinutes: 1440,
    });
    expect(await targetForDate(db, goal.id, "2026-11-03")).toBe(60);
    await expect(
      targetForDate(db, goal.id, "2026-11-02"),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("TEST-F03-02: reload and new application instance retrieve committed data", async () => {
    const session = await login();
    const created = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send(body())
      .expect(201);
    const restarted = createApp({
      db,
      clock,
      config: { origin, production: false, port: 5000 },
    });
    const cookie = session.response.headers["set-cookie"][0].split(";")[0];
    const response = await request(restarted)
      .get(`/api/goals/${created.body.data.id}`)
      .set("Cookie", cookie)
      .expect(200);
    expect(response.body.data.id).toBe(created.body.data.id);
    const list = await session.agent
      .get("/api/goals?page=1&pageSize=20")
      .expect(200);
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0].id).toBe(created.body.data.id);
  });

  it("TEST-F03-01/07: accepts tomorrow start and returns initial target for a future-start goal", async () => {
    const session = await login();
    const result = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send({ ...body(), startDate: "2026-11-04" })
      .expect(201);
    expect(result.body.data).toMatchObject({
      targetMinutes: 60,
      targetEffectiveFrom: "2026-11-04",
    });
  });

  it.each([0, 1441, 1.5])(
    "TEST-F03-03: rejects invalid target %s without partial records",
    async (dailyTargetMinutes) => {
      const session = await login();
      await session.agent
        .post("/api/goals")
        .set("Origin", origin)
        .set("X-CSRF-Token", session.csrf)
        .send({ ...body(), dailyTargetMinutes })
        .expect(422);
      expect(await db.goal.count()).toBe(0);
      expect(await db.goalTargetVersion.count()).toBe(0);
    },
  );

  it.each([
    ["2026-11-02", 422],
    ["2026-11-05", 422],
    ["2026-02-30", 422],
    ["03/11/2026", 400],
  ])(
    "TEST-F03-03: validates date %s at API boundary",
    async (startDate, expected) => {
      const session = await login();
      await session.agent
        .post("/api/goals")
        .set("Origin", origin)
        .set("X-CSRF-Token", session.csrf)
        .send({ ...body(), startDate })
        .expect(expected as number);
      expect(await db.goal.count()).toBe(0);
    },
  );

  it("TEST-F03-03: a database target-insert error rolls back the whole goal", async () => {
    // The database is exclusively studytrack_test, verified by setup before this module loads.
    await db.$executeRawUnsafe(
      "CREATE FUNCTION test_reject_target() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Controlled target insert failure'; END $$",
    );
    await db.$executeRawUnsafe(
      "CREATE TRIGGER test_target_failure BEFORE INSERT ON goal_target_versions FOR EACH ROW EXECUTE FUNCTION test_reject_target()",
    );
    try {
      const session = await login();
      const response = await session.agent
        .post("/api/goals")
        .set("Origin", origin)
        .set("X-CSRF-Token", session.csrf)
        .send(body())
        .expect(500);
      expect(response.body.error.code).toBe("INTERNAL_ERROR");
      expect(JSON.stringify(response.body)).not.toContain("Controlled target");
      expect(await db.goal.count()).toBe(0);
      expect(await db.goalTargetVersion.count()).toBe(0);
    } finally {
      await db.$executeRawUnsafe(
        "DROP TRIGGER test_target_failure ON goal_target_versions",
      );
      await db.$executeRawUnsafe("DROP FUNCTION test_reject_target()");
    }
  });

  it("TEST-F03-04: missing and inactive templates create no goal", async () => {
    const session = await login();
    await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send({ ...body(), templateId: "99999999-9999-4999-8999-999999999999" })
      .expect(404);
    await db.activityTemplate.update({
      where: { id: fixtures.template.id },
      data: { isActive: false },
    });
    const invalid = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send(body())
      .expect(422);
    expect(invalid.body.error.code).toBe("TEMPLATE_INACTIVE");
    expect(await db.goal.count()).toBe(0);
  });

  it("TEST-F03-05: simultaneous requests store one ACTIVE goal and one target version", async () => {
    const session = await login();
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        session.agent
          .post("/api/goals")
          .set("Origin", origin)
          .set("X-CSRF-Token", session.csrf)
          .send(body()),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409, 409]);
    expect(await db.goal.count()).toBe(1);
    expect(await db.goalTargetVersion.count()).toBe(1);
    const duplicate = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send(body())
      .expect(409);
    expect(duplicate.body.error.code).toBe("ACTIVE_GOAL_EXISTS");
    const other = await login("b@studytrack.test");
    await other.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", other.csrf)
      .send(body())
      .expect(201);
    expect(await db.goal.count()).toBe(2);
  });

  it("TEST-F01-05 / TEST-F03-06: role checks, ownership and collections are enforced on the real API", async () => {
    await request(app).get("/api/goals").expect(401);
    await request(app).post("/api/goals").send(body()).expect(401);
    const session = await login();
    const created = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send(body())
      .expect(201);
    const other = await login("b@studytrack.test");
    const forbidden = await other.agent
      .get(`/api/goals/${created.body.data.id}`)
      .expect(404);
    const missing = await other.agent
      .get("/api/goals/99999999-9999-4999-8999-999999999999")
      .expect(404);
    expect(forbidden.body.error.code).toBe(missing.body.error.code);
    expect(forbidden.body.error.message).toBe(missing.body.error.message);
    expect(JSON.stringify(forbidden.body)).not.toContain("Read CPE 334");
    const ownList = await other.agent.get("/api/goals").expect(200);
    expect(ownList.body.data).toEqual([]);
    expect(ownList.body.meta.total).toBe(0);
    const manager = await login("manager@studytrack.test");
    await manager.agent.get("/api/goals").expect(403);
    await manager.agent.get(`/api/goals/${created.body.data.id}`).expect(403);
    await manager.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", manager.csrf)
      .send(body())
      .expect(403);
    expect(await db.goal.count()).toBe(1);
  });

  it("TEST-F03-06: client cannot override owner or role; malformed IDs and pagination reject", async () => {
    const session = await login();
    await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send({ ...body(), ownerId: fixtures.other.id })
      .expect(422);
    await session.agent.get("/api/goals/not-a-uuid").expect(400);
    for (const query of [
      "page=0",
      "page=1.5",
      "pageSize=101",
      "ownerId=x",
      "status=OTHER",
    ])
      await session.agent.get(`/api/goals?${query}`).expect(422);
    expect(await db.goal.count()).toBe(0);
  });

  it("TEST-F01-06: wrong CSRF/origin cannot create a persisted goal", async () => {
    const session = await login();
    await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .send(body())
      .expect(403);
    await session.agent
      .post("/api/goals")
      .set("Origin", "https://attacker.invalid")
      .set("X-CSRF-Token", session.csrf)
      .send(body())
      .expect(403);
    expect(await db.goal.count()).toBe(0);
  });

  it("safe error handling: malformed JSON and non-JSON mutation have no database effects", async () => {
    const session = await login();
    const malformed = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .set("Content-Type", "application/json")
      .send('{"templateId":')
      .expect(400);
    expect(malformed.body.error.code).toBe("INVALID_JSON");
    await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .set("Content-Type", "text/plain")
      .send("not JSON")
      .expect(415);
    expect(await db.goal.count()).toBe(0);
  });

  it("TEST-F03-07: targetForDate retains historical values after a future target version", async () => {
    const session = await login();
    const created = await session.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send(body())
      .expect(201);
    await db.goalTargetVersion.create({
      data: {
        goalId: created.body.data.id,
        effectiveFrom: new Date("2026-11-04T00:00:00Z"),
        targetMinutes: 90,
      },
    });
    expect(await targetForDate(db, created.body.data.id, "2026-11-03")).toBe(
      60,
    );
    expect(await targetForDate(db, created.body.data.id, "2026-11-04")).toBe(
      90,
    );
    const response = await session.agent
      .get(`/api/goals/${created.body.data.id}`)
      .expect(200);
    expect(response.body.data.targetMinutes).toBe(60);
  });

  it("read-only F-02 adapter: active catalog supports real goal selection without private user fields", async () => {
    await request(app).get("/api/templates").expect(401);
    const session = await login();
    const list = await session.agent.get("/api/templates").expect(200);
    expect(list.body.data[0]).toMatchObject({
      id: fixtures.template.id,
      unit: "MINUTES",
    });
    expect(list.body.data[0]).not.toHaveProperty("createdById");
    await session.agent.get("/api/templates?includeInactive=true").expect(403);
    await db.activityTemplate.update({
      where: { id: fixtures.template.id },
      data: { isActive: false },
    });
    await session.agent
      .get(`/api/templates/${fixtures.template.id}`)
      .expect(404);
    const empty = await session.agent.get("/api/templates").expect(200);
    expect(empty.body.data).toEqual([]);
    const manager = await login("manager@studytrack.test");
    const all = await manager.agent
      .get("/api/templates?includeInactive=true")
      .expect(200);
    expect(all.body.meta.total).toBe(1);
  });
});
