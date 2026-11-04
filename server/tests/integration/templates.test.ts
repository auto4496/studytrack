import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { app, db, clock, login, origin, resetData } from "../helpers.js";

describe("F-02 manager templates, persistence and access", () => {
  let fixtures: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => {
    fixtures = await resetData();
  });
  afterAll(() => db.$disconnect());
  const body = () => ({
    title: "  อ่าน CPE 334  ",
    minMinutes: 1,
    maxMinutes: 1440,
  });

  it("TEST-F02-01/07: manager creates normalized template and a fresh app reads the committed row", async () => {
    const session = await login("manager@studytrack.test");
    const saved = await session.agent
      .post("/api/templates")
      .set("Origin", origin)
      .set("X-CSRF-Token", session.csrf)
      .send(body())
      .expect(201);
    expect(saved.body.data).toMatchObject({
      title: "อ่าน CPE 334",
      description: "",
      unit: "MINUTES",
      minMinutes: 1,
      maxMinutes: 1440,
      isActive: true,
    });
    expect(Object.keys(saved.body.data).sort()).toEqual(
      [
        "id",
        "title",
        "description",
        "unit",
        "minMinutes",
        "maxMinutes",
        "isActive",
        "createdAt",
        "updatedAt",
      ].sort(),
    );
    const stored = await db.activityTemplate.findUniqueOrThrow({
      where: { id: saved.body.data.id },
    });
    expect(stored.createdById).toBe(fixtures.manager.id);
    expect(await db.activityTemplate.count()).toBe(2);
    const fresh = createApp({
      db,
      clock,
      config: { origin, production: false, port: 5000 },
    });
    const cookie = session.response.headers["set-cookie"][0].split(";")[0];
    const result = await request(fresh)
      .get(`/api/templates/${stored.id}`)
      .set("Cookie", cookie)
      .expect(200);
    expect(result.body.data).toEqual(saved.body.data);
    const participant = await login();
    const catalog = await participant.agent
      .get("/api/templates?page=1&pageSize=100")
      .expect(200);
    expect(
      catalog.body.data.some((t: { id: string }) => t.id === stored.id),
    ).toBe(true);
  });

  it.each([
    { title: " " },
    { title: "a".repeat(101) },
    { description: "x".repeat(501) },
    { unit: "MINUTES" },
    { minMinutes: 0 },
    { maxMinutes: 1441 },
    { minMinutes: 61, maxMinutes: 60 },
    { minMinutes: 1.5 },
    { minMinutes: "60" },
    { minMinutes: true },
    { minMinutes: null },
  ])(
    "TEST-F02-03: invalid template %j is rejected without writes",
    async (change) => {
      const session = await login("manager@studytrack.test");
      const result = await session.agent
        .post("/api/templates")
        .set("Origin", origin)
        .set("X-CSRF-Token", session.csrf)
        .send({ ...body(), ...change })
        .expect(422);
      expect(result.body.error.code).toBe("VALIDATION_ERROR");
      expect(result.body.error.requestId).toEqual(expect.any(String));
      expect(await db.activityTemplate.count()).toBe(1);
    },
  );

  it("TEST-F02-03/11: inclusive bounds and duplicate titles are accepted with distinct IDs", async () => {
    const session = await login("manager@studytrack.test");
    const ids: string[] = [];
    for (const range of [
      [1, 1],
      [1440, 1440],
    ]) {
      const saved = await session.agent
        .post("/api/templates")
        .set("Origin", origin)
        .set("X-CSRF-Token", session.csrf)
        .send({
          title: "a".repeat(100),
          description: "d".repeat(500),
          minMinutes: range[0],
          maxMinutes: range[1],
        })
        .expect(201);
      ids.push(saved.body.data.id);
    }
    expect(new Set(ids).size).toBe(2);
    expect(await db.activityTemplate.count()).toBe(3);
  });

  it("TEST-F02-04: active catalog/detail are paginated and inactive templates remain manager-only", async () => {
    const inactive = await db.activityTemplate.create({
      data: {
        title: "Inactive",
        minMinutes: 1,
        maxMinutes: 60,
        isActive: false,
        createdById: fixtures.manager.id,
      },
    });
    const reader = await login();
    const list = await reader.agent
      .get("/api/templates?page=1&pageSize=1")
      .expect(200);
    expect(list.body.meta).toEqual({ page: 1, pageSize: 1, total: 1 });
    expect(list.body.data[0]).not.toHaveProperty("createdById");
    await reader.agent.get(`/api/templates/${inactive.id}`).expect(404);
    await reader.agent.get("/api/templates?includeInactive=true").expect(403);
    for (const query of ["page=0", "pageSize=101", "ownerId=x"])
      await reader.agent.get(`/api/templates?${query}`).expect(422);
    const manager = await login("manager@studytrack.test");
    const all = await manager.agent
      .get("/api/templates?includeInactive=true")
      .expect(200);
    expect(all.body.meta.total).toBe(2);
    await manager.agent.get(`/api/templates/${inactive.id}`).expect(200);
    await db.activityTemplate.updateMany({ data: { isActive: false } });
    const empty = await reader.agent.get("/api/templates").expect(200);
    expect(empty.body.data).toEqual([]);
  });

  it("TEST-F02-05/06: roles, CSRF/origin and revoked cookies are enforced before writes", async () => {
    await request(app).get("/api/templates").expect(401);
    await request(app).post("/api/templates").send(body()).expect(401);
    const reader = await login();
    await reader.agent
      .post("/api/templates")
      .set("Origin", origin)
      .set("X-CSRF-Token", reader.csrf)
      .send({ ...body(), role: "PROGRAM_MANAGER" })
      .expect(403);
    const manager = await login("manager@studytrack.test");
    await manager.agent
      .post("/api/templates")
      .set("Origin", origin)
      .send(body())
      .expect(403);
    await manager.agent
      .post("/api/templates")
      .set("Origin", "https://attacker.invalid")
      .set("X-CSRF-Token", manager.csrf)
      .send(body())
      .expect(403);
    await manager.agent
      .post("/api/auth/logout")
      .set("Origin", origin)
      .set("X-CSRF-Token", manager.csrf)
      .expect(204);
    await manager.agent.get("/api/templates").expect(401);
    await manager.agent
      .post("/api/templates")
      .set("Origin", origin)
      .set("X-CSRF-Token", manager.csrf)
      .send(body())
      .expect(401);
    expect(await db.activityTemplate.count()).toBe(1);
  });

  it("TEST-F02-08: server-owned fields are rejected; failed database insert produces only safe errors", async () => {
    const manager = await login("manager@studytrack.test");
    for (const key of [
      "id",
      "createdById",
      "isActive",
      "ownerId",
      "userId",
      "role",
      "createdAt",
    ]) {
      await manager.agent
        .post("/api/templates")
        .set("Origin", origin)
        .set("X-CSRF-Token", manager.csrf)
        .send({ ...body(), [key]: "injected" })
        .expect(422);
    }
    await db.$executeRawUnsafe(
      "CREATE FUNCTION test_reject_template_b() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Controlled private template failure'; END $$",
    );
    await db.$executeRawUnsafe(
      "CREATE TRIGGER test_template_failure_b BEFORE INSERT ON activity_templates FOR EACH ROW EXECUTE FUNCTION test_reject_template_b()",
    );
    try {
      const result = await manager.agent
        .post("/api/templates")
        .set("Origin", origin)
        .set("X-CSRF-Token", manager.csrf)
        .send(body())
        .expect(500);
      expect(result.body.error.code).toBe("INTERNAL_ERROR");
      expect(JSON.stringify(result.body)).not.toMatch(
        /Controlled|SQL|password|stack/,
      );
      expect(await db.activityTemplate.count()).toBe(1);
    } finally {
      await db.$executeRawUnsafe(
        "DROP TRIGGER test_template_failure_b ON activity_templates",
      );
      await db.$executeRawUnsafe("DROP FUNCTION test_reject_template_b()");
    }
  });
});
