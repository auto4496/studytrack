import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { db, clock, login, origin, resetData } from "../helpers.js";

describe("F06 real PostgreSQL serialization, snapshot and rollback", () => {
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
        { entryDate: "2026-11-03", minutes: 20 },
        "post",
      ).expect(201)
    ).body.data;
    return {
      s,
      goal,
      entry,
      patch: `/api/goals/${goal.id}/entries/${entry.id}`,
      history: `/api/goals/${goal.id}/history`,
    };
  }
  function gate() {
    let open!: () => void;
    const promise = new Promise<void>((r) => {
      open = r;
    });
    return { promise, open };
  }
  async function hold(id: string) {
    const blocker = new PrismaClient(),
      ready = gate(),
      release = gate();
    const done = blocker.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM goals WHERE id=${id}::uuid FOR UPDATE`;
        ready.open();
        await release.promise;
      },
      { timeout: 15000 },
    );
    await ready.promise;
    return async () => {
      release.open();
      try {
        await done;
      } finally {
        await blocker.$disconnect();
      }
    };
  }
  async function queued(n: number) {
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      const rows = await db.$queryRaw<
        { n: bigint }[]
      >`SELECT count(*) AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE 'SELECT id FROM goals%'`;
      if (Number(rows[0].n) >= n) return;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error(`Expected ${n} observed PostgreSQL Goal lock waiters`);
  }
  it.each([false, true])(
    "TEST-F06-16: same entry absolute writes serialize, reverse=%s",
    async (reverse) => {
      const { s, goal, entry, patch, history } = await setup();
      const release = await hold(goal.id),
        pending: Promise<any>[] = [];
      const values = reverse ? [60, 10] : [10, 60];
      try {
        for (const minutes of values) {
          pending.push(mutate(s, patch, { minutes }).then((r) => r));
          await queued(pending.length);
        }
      } finally {
        await release();
      }
      const results = await Promise.all(pending);
      expect(results.map((r) => r.status)).toEqual([200, 200]);
      expect(results.map((r) => r.body.data.minutes)).toEqual(values);
      expect(
        (await db.dailyEntry.findUniqueOrThrow({ where: { id: entry.id } }))
          .minutes,
      ).toBe(values[1]);
      expect(await db.dailyEntry.count()).toBe(1);
      expect(
        (await s.agent.get(history).expect(200)).body.data.streak.current,
      ).toBe(reverse ? 0 : 1);
    },
  );
  it.each([false, true])(
    "TEST-F06-16: distinct entries retain identities in either lock order, reverse=%s",
    async (reverse) => {
      const { goal, entry } = await setup();
      clock.instant = new Date("2026-11-04T05:00Z");
      const s = await login();
      const other = (
        await mutate(
          s,
          `/api/goals/${goal.id}/entries`,
          { entryDate: "2026-11-04", minutes: 10 },
          "post",
        ).expect(201)
      ).body.data;
      const release = await hold(goal.id),
        requests: Promise<any>[] = [];
      try {
        for (const e of reverse ? [other, entry] : [entry, other]) {
          requests.push(
            mutate(s, `/api/goals/${goal.id}/entries/${e.id}`, {
              minutes: 30,
            }).then((r) => r),
          );
          await queued(requests.length);
        }
      } finally {
        await release();
      }
      expect((await Promise.all(requests)).map((r) => r.status)).toEqual([
        200, 200,
      ]);
      expect(await db.dailyEntry.count()).toBe(2);
      expect(
        (await s.agent.get(`/api/goals/${goal.id}/history`).expect(200)).body
          .data.streak,
      ).toMatchObject({ current: 2, best: 2 });
    },
  );
  it.each(["stop", "target", "create"] as const)(
    "TEST-F06-17: correction coordinates with %s in both observed orders",
    async (action) => {
      for (const correctionFirst of [false, true]) {
        f = await resetData();
        const { s, goal, patch } = await setup();
        const release = await hold(goal.id),
          requests: Promise<any>[] = [];
        const correction = () =>
          mutate(s, patch, { minutes: 30 }).then((r) => r);
        const lifecycle = () =>
          action === "create"
            ? mutate(
                s,
                `/api/goals/${goal.id}/entries`,
                { entryDate: "2026-11-03", minutes: 60 },
                "post",
              ).then((r) => r)
            : mutate(
                s,
                `/api/goals/${goal.id}/${action}`,
                action === "target" ? { dailyTargetMinutes: 60 } : {},
                action === "stop" ? "post" : "patch",
              ).then((r) => r);
        try {
          for (const run of correctionFirst
            ? [correction, lifecycle]
            : [lifecycle, correction]) {
            requests.push(run());
            await queued(requests.length);
          }
        } finally {
          await release();
        }
        const responses = await Promise.all(requests);
        expect(responses.map((r) => r.status)).toEqual(
          action === "create"
            ? correctionFirst
              ? [200, 409]
              : [409, 200]
            : [200, 200],
        );
        const history = (
          await s.agent.get(`/api/goals/${goal.id}/history`).expect(200)
        ).body.data;
        expect(history.entries[0]).toMatchObject({
          minutes: 30,
          targetMinutes: 30,
        });
        expect(await db.dailyEntry.count()).toBe(1);
        expect(await db.goalTargetVersion.count()).toBe(
          action === "target" ? 2 : 1,
        );
      }
    },
  );
  it("TEST-F06-17: waiting correction uses post-lock Bangkok midnight, never pre-lock clock", async () => {
    const { goal, entry, patch } = await setup();
    await db.dailyEntry.update({
      where: { id: entry.id },
      data: { entryDate: new Date("2026-11-04") },
    });
    clock.instant = new Date("2026-11-03T16:59:59Z");
    const s = await login();
    const release = await hold(goal.id);
    let response!: Promise<any>;
    try {
      response = mutate(s, patch, { minutes: 30 }).then((r) => r);
      await queued(1);
      clock.instant = new Date("2026-11-03T17:00:00Z");
    } finally {
      await release();
    }
    expect((await response).status).toBe(200);
    expect(
      (await db.dailyEntry.findUniqueOrThrow({ where: { id: entry.id } }))
        .updatedAt,
    ).toEqual(clock.instant);
  });
  it.each([false, true])(
    "TEST-F06-17: actual new-day creation and historical correction both commit, correctionFirst=%s",
    async (correctionFirst) => {
      const { goal, patch } = await setup();
      clock.instant = new Date("2026-11-04T05:00Z");
      const s = await login();
      const release = await hold(goal.id),
        requests: Promise<any>[] = [];
      const correct = () => mutate(s, patch, { minutes: 30 }).then((r) => r);
      const create = () =>
        mutate(
          s,
          `/api/goals/${goal.id}/entries`,
          { entryDate: "2026-11-04", minutes: 30 },
          "post",
        ).then((r) => r);
      try {
        for (const run of correctionFirst
          ? [correct, create]
          : [create, correct]) {
          requests.push(run());
          await queued(requests.length);
        }
      } finally {
        await release();
      }
      expect((await Promise.all(requests)).map((r) => r.status)).toEqual(
        correctionFirst ? [200, 201] : [201, 200],
      );
      expect(
        (await s.agent.get(`/api/goals/${goal.id}/history`).expect(200)).body
          .data,
      ).toMatchObject({
        pagination: { total: 2 },
        streak: { current: 2, best: 2 },
      });
    },
  );
  it.each(["correction", "stop"] as const)(
    "TEST-F06-18: paused aggregate retains one pre-%s snapshot",
    async (action) => {
      const { s, goal, patch, history } = await setup();
      const read = gate(),
        resume = gate();
      const extended = db.$extends({
        query: {
          goal: {
            async findFirst({ args, query }) {
              const result = await query(args);
              read.open();
              await resume.promise;
              return result;
            },
          },
        },
      });
      const snapshotApp = createApp({
        db: extended as unknown as PrismaClient,
        clock,
        config: { origin, production: false, port: 5000 },
      });
      const cookie = s.response.headers["set-cookie"][0].split(";")[0];
      const inFlight = request(snapshotApp)
        .get(history)
        .set("Cookie", cookie)
        .then((r) => r);
      await read.promise;
      try {
        if (action === "correction")
          await mutate(s, patch, { minutes: 30 }).expect(200);
        else {
          await mutate(s, `/api/goals/${goal.id}/target`, {
            dailyTargetMinutes: 60,
          }).expect(200);
          await mutate(s, `/api/goals/${goal.id}/stop`, {}, "post").expect(200);
        }
      } finally {
        resume.open();
      }
      const before = await inFlight;
      expect(before.status).toBe(200);
      expect(before.body.data).toMatchObject({
        entries: [{ minutes: 20, targetMinutes: 30, progressPercent: 66.67 }],
        pagination: { total: 1 },
        streak: { current: 0, best: 0 },
      });
      if (action === "correction")
        expect(
          (await s.agent.get(history).expect(200)).body.data.streak.current,
        ).toBe(1);
    },
  );
  it("TEST-F06-19: failure after real SQL update rolls back minutes and timestamps", async () => {
    const { s, patch } = await setup();
    const before = await db.dailyEntry.findMany(),
      goals = await db.goal.findMany(),
      versions = await db.goalTargetVersion.findMany();
    let didUpdate = false;
    const failing = db.$extends({
      query: {
        dailyEntry: {
          async update({ args, query }) {
            await query(args);
            didUpdate = true;
            throw new Error("Controlled private post-update failure");
          },
        },
      },
    });
    const failingApp = createApp({
      db: failing as unknown as PrismaClient,
      clock,
      config: { origin, production: false, port: 5000 },
    });
    clock.instant = new Date("2026-11-03T05:02Z");
    const result = await request(failingApp)
      .patch(patch)
      .set("Cookie", s.response.headers["set-cookie"][0].split(";")[0])
      .set("Origin", origin)
      .set("X-CSRF-Token", s.csrf)
      .send({ minutes: 30 })
      .expect(500);
    expect(didUpdate).toBe(true);
    expect(result.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(result.body)).not.toMatch(
      /Controlled|SQL|password|stack/,
    );
    expect(await db.dailyEntry.findMany()).toEqual(before);
    expect(await db.goal.findMany()).toEqual(goals);
    expect(await db.goalTargetVersion.findMany()).toEqual(versions);
  });
});
