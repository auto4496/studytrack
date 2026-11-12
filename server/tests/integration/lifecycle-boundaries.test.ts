import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { todayBangkok } from "../../src/clock.js";
import { app, db, clock, login, origin, resetData } from "../helpers.js";

describe("F-05 boundaries, security, rollback and serialized requests", () => {
  let f: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => {
    f = await resetData();
  });
  afterAll(() => db.$disconnect());
  async function setup(startDate = todayBangkok(clock)) {
    const s = await login();
    const r = await s.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .send({ templateId: f.template.id, startDate, dailyTargetMinutes: 30 })
      .expect(201);
    return { ...s, id: r.body.data.id as string };
  }
  const mutate = (
    s: Awaited<ReturnType<typeof login>>,
    path: string,
    body: object,
    method: "post" | "patch" = "patch",
  ) =>
    s.agent[method](path)
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .send(body);

  it.each([0, 1441, 1.5, "45", null, true])(
    "TEST-F05-03 rejects invalid target %s with no version write",
    async (value) => {
      const s = await setup();
      await mutate(s, `/api/goals/${s.id}/target`, {
        dailyTargetMinutes: value,
      }).expect(422);
      expect(await db.goalTargetVersion.count()).toBe(1);
    },
  );
  it("TEST-F05-03 accepts both snapshot boundaries and rejects injected fields", async () => {
    const s = await setup();
    for (const value of [1, 1440])
      await mutate(s, `/api/goals/${s.id}/target`, {
        dailyTargetMinutes: value,
      }).expect(200);
    for (const extra of [
      { ownerId: f.other.id },
      { effectiveFrom: "2026-11-03" },
      { status: "ARCHIVED" },
    ])
      await mutate(s, `/api/goals/${s.id}/target`, {
        dailyTargetMinutes: 45,
        ...extra,
      }).expect(422);
    expect(await db.goalTargetVersion.count()).toBe(2);
  });
  it("TEST-F05-02 reads historical and new-day denominators and the additive list shape", async () => {
    const s = await setup();
    await mutate(
      s,
      `/api/goals/${s.id}/entries`,
      { entryDate: "2026-11-03", minutes: 20 },
      "post",
    ).expect(201);
    const original = await db.dailyEntry.findFirstOrThrow();
    await mutate(s, `/api/goals/${s.id}/target`, {
      dailyTargetMinutes: 45,
    }).expect(200);
    clock.instant = new Date("2026-11-04T05:00Z");
    const next = await login();
    const goal = await next.agent.get(`/api/goals/${s.id}`).expect(200);
    expect(goal.body.data).toMatchObject({
      targetMinutes: 45,
      targetEffectiveFrom: "2026-11-04",
      pendingTarget: null,
    });
    const old = await next.agent
      .get(`/api/goals/${s.id}/progress?date=2026-11-03`)
      .expect(200);
    expect(old.body.data).toMatchObject({
      targetMinutes: 30,
      actualMinutes: 20,
      progressPercent: 66.67,
    });
    const newer = await mutate(
      next,
      `/api/goals/${s.id}/entries`,
      { entryDate: "2026-11-04", minutes: 30 },
      "post",
    ).expect(201);
    expect(newer.body.data).toMatchObject({
      targetMinutes: 45,
      progressPercent: 66.67,
    });
    expect(
      await db.dailyEntry.findUnique({ where: { id: original.id } }),
    ).toEqual(original);
    const list = await next.agent.get("/api/goals").expect(200);
    expect(list.body.data[0].pendingTarget).toBeNull();
  });
  it.each(["target", "stop"])(
    "TEST-F05-08 rejects %s on a future-start goal without mutation",
    async (action) => {
      const s = await setup("2026-11-04");
      const r = await mutate(
        s,
        `/api/goals/${s.id}/${action}`,
        action === "target" ? { dailyTargetMinutes: 45 } : {},
        action === "target" ? "patch" : "post",
      ).expect(409);
      expect(r.body.error.code).toBe("GOAL_NOT_STARTED");
      expect(await db.goal.findUnique({ where: { id: s.id } })).toMatchObject({
        status: "ACTIVE",
        endDate: null,
      });
      expect(await db.goalTargetVersion.count()).toBe(1);
    },
  );
  it("TEST-F05-06/07 includes the end date, freezes archived display, and releases only the active slot", async () => {
    const s = await setup();
    await mutate(s, `/api/goals/${s.id}/target`, {
      dailyTargetMinutes: 60,
    }).expect(200);
    await mutate(s, `/api/goals/${s.id}/stop`, {}, "post").expect(200);
    await mutate(
      s,
      `/api/goals/${s.id}/entries`,
      { entryDate: "2026-11-03", minutes: 20 },
      "post",
    ).expect(201);
    clock.instant = new Date("2026-11-04T05:00Z");
    const next = await login();
    await mutate(
      next,
      `/api/goals/${s.id}/entries`,
      { entryDate: "2026-11-04", minutes: 20 },
      "post",
    ).expect(422);
    await next.agent
      .get(`/api/goals/${s.id}/progress?date=2026-11-04`)
      .expect(422);
    const archived = await next.agent
      .get("/api/goals?status=ARCHIVED")
      .expect(200);
    expect(archived.body.data[0]).toMatchObject({
      id: s.id,
      targetMinutes: 30,
      pendingTarget: null,
      endDate: "2026-11-03",
    });
    await mutate(next, `/api/goals/${s.id}/target`, {
      dailyTargetMinutes: 45,
    }).expect(409);
    const newGoal = await mutate(
      next,
      "/api/goals",
      {
        templateId: f.template.id,
        startDate: "2026-11-04",
        dailyTargetMinutes: 30,
      },
      "post",
    ).expect(201);
    expect(newGoal.body.data.id).not.toBe(s.id);
    expect(await db.goal.count({ where: { status: "ACTIVE" } })).toBe(1);
    expect(await db.dailyEntry.count()).toBe(1);
  });
  it.each([
    ["2028-02-28T16:59:59Z", "2028-02-29"],
    ["2026-12-31T05:00Z", "2027-01-01"],
    ["2028-02-29T05:00Z", "2028-03-01"],
  ])("TEST-F05-04 computes next Bangkok date at %s", async (instant, date) => {
    clock.instant = new Date(instant);
    const s = await setup();
    const r = await mutate(s, `/api/goals/${s.id}/target`, {
      dailyTargetMinutes: 45,
    }).expect(200);
    expect(r.body.data.pendingTarget.effectiveFrom).toBe(date);
  });
  it("TEST-F05-10/11 manager metadata is normalized/shared, no-op is stable, inactive edits retain bounds", async () => {
    const manager = await login("manager@studytrack.test");
    const t = await db.activityTemplate.update({
      where: { id: f.template.id },
      data: { description: "preserve" },
    });
    const owner = await db.user.findUniqueOrThrow({
      where: { id: f.manager.id },
    });
    await db.user.create({
      data: {
        emailNormalized: "second-manager@studytrack.test",
        displayName: "Second",
        passwordHash: owner.passwordHash,
        role: "PROGRAM_MANAGER",
      },
    });
    const second = await login("second-manager@studytrack.test");
    const same = await mutate(manager, `/api/templates/${t.id}`, {
      title: t.title,
    }).expect(200);
    expect(same.body.data.updatedAt).toBe(t.updatedAt.toISOString());
    expect(same.body.data.description).toBe("preserve");
    await mutate(
      second,
      `/api/templates/${t.id}/deactivate`,
      {},
      "post",
    ).expect(200);
    const inactive = await db.activityTemplate.findUniqueOrThrow({
      where: { id: t.id },
    });
    const retry = await mutate(
      manager,
      `/api/templates/${t.id}/deactivate`,
      {},
      "post",
    ).expect(200);
    expect(retry.body.data.updatedAt).toBe(inactive.updatedAt.toISOString());
    const edited = await mutate(second, `/api/templates/${t.id}`, {
      title: "  Changed  ",
      description: "",
    }).expect(200);
    expect(edited.body.data).toMatchObject({
      title: "Changed",
      description: "",
      isActive: false,
      minMinutes: 1,
      maxMinutes: 1440,
    });
    for (const body of [
      {},
      { minMinutes: 2 },
      { isActive: true },
      { title: " " },
      { title: "x".repeat(101) },
      { description: "x".repeat(501) },
    ])
      await mutate(manager, `/api/templates/${t.id}`, body).expect(422);
  });

  for (const [kind, method] of [
    ["target", "patch"],
    ["stop", "post"],
    ["metadata", "patch"],
    ["deactivate", "post"],
  ] as const) {
    it(`TEST-F05-13 access/CSRF/shape matrix for ${kind}`, async () => {
      const s = await setup(),
        manager = await login("manager@studytrack.test"),
        other = await login("b@studytrack.test");
      const goal = kind === "target" || kind === "stop";
      const path = goal
        ? `/api/goals/${s.id}/${kind}`
        : `/api/templates/${f.template.id}${kind === "deactivate" ? "/deactivate" : ""}`;
      const body =
        kind === "target"
          ? { dailyTargetMinutes: 45 }
          : kind === "metadata"
            ? { title: "Edited" }
            : {};
      const good = goal ? s : manager,
        wrong = goal ? manager : s;
      await request(app)[method](path).send(body).expect(401);
      await mutate(wrong, path, body, method).expect(403);
      await good.agent[method](path)
        .set("Origin", origin)
        .set("X-CSRF-Token", "wrong")
        .send(body)
        .expect(403);
      await good.agent[method](path)
        .set("Origin", "https://other.test")
        .set("X-CSRF-Token", good.csrf)
        .send(body)
        .expect(403);
      await mutate(good, path, { ...body, ownerId: f.other.id }, method).expect(
        422,
      );
      await mutate(good, path + "?unexpected=1", body, method).expect(422);
      await mutate(
        good,
        path.replace(goal ? s.id : f.template.id, "invalid"),
        body,
        method,
      ).expect(400);
      await mutate(
        good,
        path.replace(
          goal ? s.id : f.template.id,
          "99999999-9999-4999-8999-999999999999",
        ),
        body,
        method,
      ).expect(404);
      await good.agent[method](path)
        .set("Origin", origin)
        .set("X-CSRF-Token", good.csrf)
        .set("Content-Type", "text/plain")
        .send("{}")
        .expect(415);
      if (goal) await mutate(other, path, body, method).expect(404);
      await good.agent
        .post("/api/auth/logout")
        .set("Origin", origin)
        .set("X-CSRF-Token", good.csrf)
        .expect(204);
      await mutate(good, path, body, method).expect(401);
      expect(await db.goalTargetVersion.count()).toBe(1);
      expect(await db.goal.count({ where: { status: "ACTIVE" } })).toBe(1);
      expect(
        await db.activityTemplate.findUnique({ where: { id: f.template.id } }),
      ).toMatchObject({ title: "Read CPE 334", isActive: true });
    });
  }
  it.each(["target", "stop", "template"])(
    "TEST-F05-14 rolls back a failing %s transaction",
    async (kind) => {
      const s = await setup(),
        manager = await login("manager@studytrack.test");
      const table =
        kind === "target"
          ? "goal_target_versions"
          : kind === "stop"
            ? "goals"
            : "activity_templates";
      await db.$executeRawUnsafe(
        "CREATE FUNCTION f05_reject() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic lifecycle failure'; END $$",
      );
      await db.$executeRawUnsafe(
        `CREATE TRIGGER f05_reject BEFORE ${kind === "target" ? "INSERT OR UPDATE" : "UPDATE"} ON ${table} FOR EACH ROW EXECUTE FUNCTION f05_reject()`,
      );
      try {
        const r =
          kind === "target"
            ? await mutate(s, `/api/goals/${s.id}/target`, {
                dailyTargetMinutes: 45,
              })
            : kind === "stop"
              ? await mutate(s, `/api/goals/${s.id}/stop`, {}, "post")
              : await mutate(manager, `/api/templates/${f.template.id}`, {
                  title: "Edited",
                });
        expect(r.status).toBe(500);
        expect(r.body.error.code).toBe("INTERNAL_ERROR");
        expect(JSON.stringify(r.body)).not.toContain("synthetic lifecycle");
        expect(await db.goalTargetVersion.count()).toBe(1);
        expect(await db.goal.findUnique({ where: { id: s.id } })).toMatchObject(
          { status: "ACTIVE", endDate: null },
        );
        expect(
          await db.activityTemplate.findUnique({
            where: { id: f.template.id },
          }),
        ).toMatchObject({ title: "Read CPE 334", isActive: true });
      } finally {
        await db.$executeRawUnsafe(`DROP TRIGGER f05_reject ON ${table}`);
        await db.$executeRawUnsafe("DROP FUNCTION f05_reject()");
      }
    },
  );

  // An independent PostgreSQL transaction queues each actual API writer in a known order.
  async function hold(table: "goals" | "activity_templates", id: string) {
    const blocker = new PrismaClient();
    let unlock!: () => void, ready!: () => void;
    const gate = new Promise<void>((r) => {
        unlock = r;
      }),
      acquired = new Promise<void>((r) => {
        ready = r;
      });
    const complete = blocker.$transaction(
      async (tx) => {
        if (table === "goals")
          await tx.$queryRaw`SELECT id FROM goals WHERE id=${id}::uuid FOR UPDATE`;
        else
          await tx.$queryRaw`SELECT id FROM activity_templates WHERE id=${id}::uuid FOR UPDATE`;
        ready();
        await gate;
      },
      { timeout: 15000 },
    );
    await acquired;
    return async () => {
      unlock();
      try {
        await complete;
      } finally {
        await blocker.$disconnect();
      }
    };
  }
  async function queued(count: number) {
    const until = Date.now() + 4000;
    while (Date.now() < until) {
      const rows = await db.$queryRaw<
        Array<{ n: bigint }>
      >`SELECT count(*) AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE 'SELECT id FROM %'`;
      if (Number(rows[0].n) >= count) return;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error(`Expected ${count} PostgreSQL lock waiters`);
  }
  it.each([false, true])(
    "TEST-F05-09 forces target/stop ordering, stopFirst=%s",
    async (stopFirst) => {
      const s = await setup(),
        release = await hold("goals", s.id);
      const promises: Promise<any>[] = [];
      try {
        for (const action of stopFirst
          ? ["stop", "target"]
          : ["target", "stop"]) {
          promises.push(
            mutate(
              s,
              `/api/goals/${s.id}/${action}`,
              action === "stop" ? {} : { dailyTargetMinutes: 45 },
              action === "stop" ? "post" : "patch",
            ).then((r) => r),
          );
          await queued(promises.length);
        }
      } finally {
        await release();
      }
      const results = await Promise.all(promises);
      expect(results.map((r) => r.status)).toEqual(
        stopFirst ? [200, 409] : [200, 200],
      );
      expect(await db.goalTargetVersion.count()).toBe(stopFirst ? 1 : 2);
      expect(await db.goal.findUnique({ where: { id: s.id } })).toMatchObject({
        status: "ARCHIVED",
        endDate: new Date("2026-11-03"),
      });
    },
  );
  it("TEST-F05-04/05 uses the post-lock clock and serializes competing targets", async () => {
    const s = await setup();
    clock.instant = new Date("2026-11-03T16:59:59Z");
    const fresh = await login();
    const release = await hold("goals", s.id);
    let a!: Promise<any>, b!: Promise<any>;
    try {
      a = mutate(fresh, `/api/goals/${s.id}/target`, {
        dailyTargetMinutes: 45,
      }).then((r) => r);
      await queued(1);
      b = mutate(fresh, `/api/goals/${s.id}/target`, {
        dailyTargetMinutes: 60,
      }).then((r) => r);
      await queued(2);
      clock.instant = new Date("2026-11-03T17:00:00Z");
    } finally {
      await release();
    }
    const results = await Promise.all([a, b]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(results[1].body.data.pendingTarget).toEqual({
      effectiveFrom: "2026-11-05",
      targetMinutes: 60,
    });
    const versions = await db.goalTargetVersion.findMany({
      where: { goalId: s.id },
      orderBy: { effectiveFrom: "asc" },
    });
    expect(versions.map((v) => v.targetMinutes)).toEqual([30, 60]);
  });
  it.each([false, true])(
    "TEST-F05-12 forces create/deactivate ordering, deactivateFirst=%s",
    async (deactivateFirst) => {
      const s = await login(),
        manager = await login("manager@studytrack.test"),
        release = await hold("activity_templates", f.template.id);
      const promises: Promise<any>[] = [];
      try {
        for (const action of deactivateFirst
          ? ["deactivate", "create"]
          : ["create", "deactivate"]) {
          promises.push(
            action === "create"
              ? mutate(
                  s,
                  "/api/goals",
                  {
                    templateId: f.template.id,
                    startDate: "2026-11-03",
                    dailyTargetMinutes: 30,
                  },
                  "post",
                ).then((r) => r)
              : mutate(
                  manager,
                  `/api/templates/${f.template.id}/deactivate`,
                  {},
                  "post",
                ).then((r) => r),
          );
          await queued(promises.length);
        }
      } finally {
        await release();
      }
      const result = await Promise.all(promises);
      expect(result.map((r) => r.status)).toEqual(
        deactivateFirst ? [200, 422] : [201, 200],
      );
      expect(await db.goal.count()).toBe(deactivateFirst ? 0 : 1);
    },
  );
  it("TEST-F05-09 create is rejected before stop releases the active slot, then succeeds after commit", async () => {
    const s = await setup(),
      release = await hold("goals", s.id);
    let stop!: Promise<any>;
    try {
      stop = mutate(s, `/api/goals/${s.id}/stop`, {}, "post").then((r) => r);
      await queued(1);
      await mutate(
        s,
        "/api/goals",
        {
          templateId: f.template.id,
          startDate: "2026-11-03",
          dailyTargetMinutes: 30,
        },
        "post",
      ).expect(409);
    } finally {
      await release();
    }
    expect((await stop).status).toBe(200);
    await mutate(
      s,
      "/api/goals",
      {
        templateId: f.template.id,
        startDate: "2026-11-03",
        dailyTargetMinutes: 30,
      },
      "post",
    ).expect(201);
    expect(await db.goal.count({ where: { status: "ACTIVE" } })).toBe(1);
  });
  it.each([false, true])(
    "TEST-F05-09 entry/stop coordination rechecks date bounds after lock, stopFirst=%s",
    async (stopFirst) => {
      const s = await setup();
      const blocker = new PrismaClient();
      let release!: () => void, ready!: () => void;
      const gate = new Promise<void>((r) => (release = r)),
        acquired = new Promise<void>((r) => (ready = r));
      if (stopFirst) clock.instant = new Date("2026-11-04T05:00Z");
      const fresh = await login();
      const transaction = blocker.$transaction(
        async (tx) => {
          if (stopFirst) {
            await tx.$queryRaw`SELECT id FROM goals WHERE id=${s.id}::uuid FOR UPDATE`;
            await tx.goal.update({
              where: { id: s.id },
              data: { status: "ARCHIVED", endDate: new Date("2026-11-03") },
            });
          } else {
            await tx.$queryRaw`SELECT id FROM goals WHERE id=${s.id}::uuid FOR SHARE`;
            await tx.dailyEntry.create({
              data: {
                goalId: s.id,
                entryDate: new Date("2026-11-03"),
                minutes: 20,
              },
            });
          }
          ready();
          await gate;
        },
        { timeout: 15000 },
      );
      await acquired;
      let operation!: Promise<any>;
      try {
        operation = stopFirst
          ? mutate(
              fresh,
              `/api/goals/${s.id}/entries`,
              { entryDate: "2026-11-04", minutes: 20 },
              "post",
            ).then((r) => r)
          : mutate(fresh, `/api/goals/${s.id}/stop`, {}, "post").then((r) => r);
        await queued(1);
      } finally {
        release();
        await transaction;
        await blocker.$disconnect();
      }
      expect((await operation).status).toBe(stopFirst ? 422 : 200);
      expect(await db.dailyEntry.count()).toBe(stopFirst ? 0 : 1);
      expect(await db.goal.findUnique({ where: { id: s.id } })).toMatchObject({
        status: "ARCHIVED",
        endDate: new Date("2026-11-03"),
      });
    },
  );
  it.each([false, true])(
    "TEST-F05-12 forces metadata/create snapshot ordering, metadataFirst=%s",
    async (metadataFirst) => {
      const s = await login(),
        manager = await login("manager@studytrack.test"),
        release = await hold("activity_templates", f.template.id);
      const promises: Promise<any>[] = [];
      try {
        for (const action of metadataFirst
          ? ["metadata", "create"]
          : ["create", "metadata"]) {
          promises.push(
            action === "create"
              ? mutate(
                  s,
                  "/api/goals",
                  {
                    templateId: f.template.id,
                    startDate: "2026-11-03",
                    dailyTargetMinutes: 30,
                  },
                  "post",
                ).then((r) => r)
              : mutate(manager, `/api/templates/${f.template.id}`, {
                  title: "Edited",
                }).then((r) => r),
          );
          await queued(promises.length);
        }
      } finally {
        await release();
      }
      const result = await Promise.all(promises);
      expect(result.map((r) => r.status)).toEqual(
        metadataFirst ? [200, 201] : [201, 200],
      );
      expect((await db.goal.findFirstOrThrow()).templateTitleSnapshot).toBe(
        metadataFirst ? "Edited" : "Read CPE 334",
      );
    },
  );
});
