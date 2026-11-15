import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { app, clock, db, login, origin, resetData } from "../helpers.js";

const a = {
  reminderEnabled: true,
  days: [{ weekday: 2, readingTime: "20:00", reminderTime: "19:45" }],
};
const b = {
  reminderEnabled: false,
  days: [
    { weekday: 1, readingTime: "01:00", reminderTime: null },
    { weekday: 7, readingTime: "23:59", reminderTime: null },
  ],
};
function gate() {
  let open!: () => void;
  const promise = new Promise<void>((r) => {
    open = r;
  });
  return { promise, open };
}
describe("F07 real PostgreSQL snapshot, serialization and rollback", () => {
  let f: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => {
    f = await resetData();
  });
  afterAll(() => db.$disconnect());
  async function setup() {
    const s = await login();
    const goal = (
      await s.agent
        .post("/api/goals")
        .set("Origin", origin)
        .set("X-CSRF-Token", s.csrf)
        .send({
          templateId: f.template.id,
          dailyTargetMinutes: 30,
          startDate: "2026-11-03",
        })
        .expect(201)
    ).body.data;
    const path = `/api/goals/${goal.id}/schedule`;
    return {
      s,
      goal,
      path,
      put: (body: object) =>
        s.agent
          .put(path)
          .set("Origin", origin)
          .set("X-CSRF-Token", s.csrf)
          .send(body),
    };
  }
  async function hold(goalId: string) {
    const blocker = new PrismaClient(),
      ready = gate(),
      release = gate();
    const done = blocker.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM goals WHERE id=${goalId}::uuid FOR UPDATE`;
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
  async function queued(count: number) {
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      const rows = await db.$queryRaw<
        { n: bigint }[]
      >`SELECT count(*) AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE 'SELECT id FROM goals%'`;
      if (Number(rows[0].n) >= count) return;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error(`Expected ${count} observed PostgreSQL goal lock waiters`);
  }
  it.each([false, true])(
    "TEST-F07-12: initial saves and replacements are whole serialized winners, reverse=%s",
    async (reverse) => {
      const { goal, put, s, path } = await setup();
      for (let round = 0; round < 2; round++) {
        const release = await hold(goal.id),
          pending: Promise<any>[] = [];
        const inputs = reverse ? [b, a] : [a, b];
        try {
          for (const input of inputs) {
            pending.push(put(input).then((r) => r));
            await queued(pending.length);
          }
        } finally {
          await release();
        }
        const results = await Promise.all(pending);
        expect(results.map((r) => r.status)).toEqual([200, 200]);
        const actual = (await s.agent.get(path).expect(200)).body.data.config;
        expect({
          reminderEnabled: actual.reminderEnabled,
          days: actual.days,
        }).toEqual(inputs[1]);
        expect(await db.goalSchedule.count()).toBe(1);
        expect(await db.goalScheduleDay.count()).toBe(inputs[1].days.length);
      }
    },
  );
  it.each([false, true])(
    "TEST-F07-10: replacement versus stop follows observed goal lock order, stopFirst=%s",
    async (stopFirst) => {
      const { goal, put, s, path } = await setup();
      await put(a).expect(200);
      const release = await hold(goal.id),
        pending: Promise<any>[] = [];
      const stop = () =>
        s.agent
          .post(`/api/goals/${goal.id}/stop`)
          .set("Origin", origin)
          .set("X-CSRF-Token", s.csrf)
          .send({})
          .then((r) => r);
      const replace = () => put(b).then((r) => r);
      try {
        for (const run of stopFirst ? [stop, replace] : [replace, stop]) {
          pending.push(run());
          await queued(pending.length);
        }
      } finally {
        await release();
      }
      expect((await Promise.all(pending)).map((r) => r.status)).toEqual(
        stopFirst ? [200, 409] : [200, 200],
      );
      const after = (await s.agent.get(path).expect(200)).body.data;
      expect(after.evaluation.status).toBe("GOAL_ARCHIVED");
      expect(after.config.days).toEqual(stopFirst ? a.days : b.days);
    },
  );
  it("TEST-F07-06/08/09: a waiting writer uses the post-lock midnight clock", async () => {
    const { goal, put } = await setup();
    clock.instant = new Date("2026-11-03T16:59:59Z");
    const fresh = await login(),
      release = await hold(goal.id);
    let pending!: Promise<any>;
    try {
      pending = fresh.agent
        .put(`/api/goals/${goal.id}/schedule`)
        .set("Origin", origin)
        .set("X-CSRF-Token", fresh.csrf)
        .send({
          reminderEnabled: true,
          days: [{ weekday: 3, readingTime: "00:00", reminderTime: "00:00" }],
        })
        .then((r) => r);
      await queued(1);
      clock.instant = new Date("2026-11-03T17:00:00Z");
    } finally {
      await release();
    }
    const result = await pending;
    expect(result.status).toBe(200);
    expect(result.body.data.evaluation).toMatchObject({
      evaluatedAt: clock.instant.toISOString(),
      date: "2026-11-04",
      weekday: 3,
      status: "DUE",
    });
    expect(result.body.data.config.createdAt).toBe(clock.instant.toISOString());
  });
  it.each(["create", "update"] as const)(
    "TEST-F07-13: actual SQL %s followed by failure rolls back parent, children and timestamps",
    async (operation) => {
      const { goal, put, s, path } = await setup();
      if (operation === "update") await put(a).expect(200);
      const before = await db.goalSchedule.findMany({
          include: { days: true },
        }),
        targets = await db.goalTargetVersion.findMany(),
        goals = await db.goal.findMany();
      let wrote = false;
      const failAfterSql = async ({ args, query }: any) => {
        await query(args);
        wrote = true;
        throw new Error("Controlled private schedule persistence error");
      };
      const extended = db.$extends({
        query: { goalSchedule: { [operation]: failAfterSql } },
      });
      const failingApp = createApp({
        db: extended as unknown as PrismaClient,
        clock,
        config: { origin, production: false, port: 5000 },
      });
      const result = await request(failingApp)
        .put(path)
        .set("Cookie", s.response.headers["set-cookie"][0].split(";")[0])
        .set("Origin", origin)
        .set("X-CSRF-Token", s.csrf)
        .send(b)
        .expect(500);
      expect(wrote).toBe(true);
      expect(JSON.stringify(result.body)).not.toMatch(
        /Controlled|SQL|stack|password/,
      );
      expect(
        await db.goalSchedule.findMany({ include: { days: true } }),
      ).toEqual(before);
      expect(await db.goalTargetVersion.findMany()).toEqual(targets);
      expect(await db.goal.findMany()).toEqual(goals);
      expect(await db.dailyEntry.count()).toBe(0);
    },
  );
  it.each(["replace", "stop", "entry"] as const)(
    "TEST-F07-07/10/12: a paused GET retains one pre-%s snapshot",
    async (operation) => {
      const { goal, put, s, path } = await setup();
      await put(a).expect(200);
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
      const inFlight = request(snapshotApp)
        .get(path)
        .set("Cookie", s.response.headers["set-cookie"][0].split(";")[0])
        .then((r) => r);
      await read.promise;
      try {
        if (operation === "replace") await put(b).expect(200);
        else
          await s.agent
            .post(
              `/api/goals/${goal.id}/${operation === "stop" ? "stop" : "entries"}`,
            )
            .set("Origin", origin)
            .set("X-CSRF-Token", s.csrf)
            .send(
              operation === "stop"
                ? {}
                : { entryDate: "2026-11-03", minutes: 20 },
            )
            .expect(operation === "stop" ? 200 : 201);
      } finally {
        resume.open();
      }
      const before = await inFlight;
      expect(before.status).toBe(200);
      expect(before.body.data.config.days).toEqual([...a.days]);
      expect(before.body.data.evaluation.status).toBe("UPCOMING");
      const after = (await s.agent.get(path).expect(200)).body.data;
      expect(after.evaluation.status).toBe(
        operation === "replace"
          ? "NOT_SCHEDULED"
          : operation === "stop"
            ? "GOAL_ARCHIVED"
            : "LOGGED",
      );
    },
  );
  it("TEST-F07-03/04/12: database guards reject duplicate days, invalid minute/weekday and orphan parent", async () => {
    const { goal, put } = await setup();
    await put(a).expect(200);
    const schedule = await db.goalSchedule.findUniqueOrThrow({
      where: { goalId: goal.id },
    });
    await expect(
      db.goalScheduleDay.create({
        data: {
          scheduleId: schedule.id,
          weekday: 2,
          readingMinute: 900,
          reminderMinute: 800,
        },
      }),
    ).rejects.toThrow();
    for (const values of [
      { weekday: 0, readingMinute: 900 },
      { weekday: 3, readingMinute: 1440 },
      { weekday: 3, readingMinute: 20, reminderMinute: 21 },
    ])
      await expect(
        db.goalScheduleDay.create({
          data: { scheduleId: schedule.id, ...values },
        }),
      ).rejects.toThrow();
    await expect(
      db.goalSchedule.create({
        data: {
          goalId: "99999999-9999-4999-8999-999999999999",
          reminderEnabled: false,
        },
      }),
    ).rejects.toThrow();
    await expect(db.goal.delete({ where: { id: goal.id } })).rejects.toThrow();
    expect(await db.goalScheduleDay.count()).toBe(1);
  });
});
