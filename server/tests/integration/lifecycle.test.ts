import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, clock, login, origin, resetData } from "../helpers.js";

describe("F-05 goal and template lifecycle", () => {
  let fixtures: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => { fixtures = await resetData(); });
  afterAll(() => db.$disconnect());

  async function setup(startDate = "2026-11-03") {
    const session = await login();
    const created = await session.agent.post("/api/goals").set("Origin", origin)
      .set("X-CSRF-Token", session.csrf).send({ templateId: fixtures.template.id, dailyTargetMinutes: 30, startDate }).expect(201);
    return { ...session, goal: created.body.data };
  }

  it("TEST-F05-01/02: tomorrow target replacement preserves today's recorded denominator", async () => {
    const s = await setup();
    await s.agent.post(`/api/goals/${s.goal.id}/entries`).set("Origin", origin).set("X-CSRF-Token", s.csrf)
      .send({ entryDate: "2026-11-03", minutes: 20 }).expect(201);
    for (const target of [60, 45]) {
      const r = await s.agent.patch(`/api/goals/${s.goal.id}/target`).set("Origin", origin).set("X-CSRF-Token", s.csrf)
        .send({ dailyTargetMinutes: target }).expect(200);
      expect(r.body.data).toMatchObject({ targetMinutes: 30, pendingTarget: { effectiveFrom: "2026-11-04", targetMinutes: target } });
    }
    expect(await db.goalTargetVersion.count({ where: { goalId: s.goal.id } })).toBe(2);
    const progress = await s.agent.get(`/api/goals/${s.goal.id}/progress?date=2026-11-03`).expect(200);
    expect(progress.body.data).toMatchObject({ targetMinutes: 30, actualMinutes: 20, progressPercent: 66.67 });
  });

  it("TEST-F05-06: repeat stop on a later day preserves inclusive end date and pending history", async () => {
    const s = await setup();
    await db.goalTargetVersion.create({ data: { goalId: s.goal.id, effectiveFrom: new Date("2026-11-04"), targetMinutes: 60 } });
    const stopped = await s.agent.post(`/api/goals/${s.goal.id}/stop`).set("Origin", origin).set("X-CSRF-Token", s.csrf).send({}).expect(200);
    expect(stopped.body.data).toMatchObject({ status: "ARCHIVED", endDate: "2026-11-03", targetMinutes: 30, pendingTarget: null });
    clock.instant = new Date("2026-11-04T05:00:00Z");
    const again = await login();
    const retried = await again.agent.post(`/api/goals/${s.goal.id}/stop`).set("Origin", origin).set("X-CSRF-Token", again.csrf).send({}).expect(200);
    expect(retried.body.data).toMatchObject({ endDate: "2026-11-03", targetMinutes: 30 });
    expect(await db.goalTargetVersion.count({ where: { goalId: s.goal.id } })).toBe(2);
  });

  it("TEST-F05-10/11: deactivated template blocks new goals but retains existing snapshots and entries", async () => {
    const s = await setup(); const manager = await login("manager@studytrack.test");
    await manager.agent.patch(`/api/templates/${fixtures.template.id}`).set("Origin", origin).set("X-CSRF-Token", manager.csrf)
      .send({ title: "New catalog title" }).expect(200);
    await manager.agent.post(`/api/templates/${fixtures.template.id}/deactivate`).set("Origin", origin).set("X-CSRF-Token", manager.csrf).send({}).expect(200);
    const other = await login("b@studytrack.test");
    await other.agent.post("/api/goals").set("Origin", origin).set("X-CSRF-Token", other.csrf)
      .send({ templateId: fixtures.template.id, dailyTargetMinutes: 30, startDate: "2026-11-03" }).expect(422);
    const goal = await s.agent.get(`/api/goals/${s.goal.id}`).expect(200);
    expect(goal.body.data.templateTitle).toBe("Read CPE 334");
    await s.agent.post(`/api/goals/${s.goal.id}/entries`).set("Origin", origin).set("X-CSRF-Token", s.csrf).send({ entryDate: "2026-11-03", minutes: 20 }).expect(201);
  });
});
