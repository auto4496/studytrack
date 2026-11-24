import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { clock, db, login, origin, resetData } from "../helpers.js";

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
});
