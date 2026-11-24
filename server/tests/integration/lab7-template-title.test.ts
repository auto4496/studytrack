import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, login, origin, resetData } from "../helpers.js";

describe("Lab 7 template title boundaries", () => {
  beforeEach(async () => {
    await resetData();
  });
  afterAll(() => db.$disconnect());

  it("TEST-L7-F02-POST: rejects two trimmed code points without creating a template", async () => {
    const { agent, csrf } = await login("manager@studytrack.test");
    const before = await db.activityTemplate.count();
    const response = await agent
      .post("/api/templates")
      .set("Origin", origin)
      .set("X-CSRF-Token", csrf)
      .send({ title: " AB ", minMinutes: 1, maxMinutes: 1440 });

    expect(response.status).toBe(422);
    expect(response.body.error.fields.title).toEqual(expect.any(String));
    expect(await db.activityTemplate.count()).toBe(before);
  });
});
