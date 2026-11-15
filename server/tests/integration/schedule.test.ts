import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, login, origin, resetData } from "../helpers.js";

describe("F07 owned reading schedule", () => {
  let fixtures: Awaited<ReturnType<typeof resetData>>;
  beforeEach(async () => {
    fixtures = await resetData();
  });
  afterAll(() => db.$disconnect());

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
});
