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

  const boundaryCases = [
    ["spaces only", " \t ", false],
    ["one code point", " A ", false],
    ["two astral code points", " 📚📚 ", false],
    ["three astral code points", " 📚📚📚 ", true],
    ["100 code points", " " + "ข".repeat(100) + " ", true],
    ["101 code points", " " + "ข".repeat(101) + " ", false],
  ] as const;

  it.each(boundaryCases)(
    "TEST-L7-F02-POST / TEST-L7-F05-PATCH: %s",
    async (_, title, accepted) => {
      const { agent, csrf } = await login("manager@studytrack.test");
      const existing = await db.activityTemplate.findFirstOrThrow();
      const count = await db.activityTemplate.count();
      const created = await agent
        .post("/api/templates")
        .set("Origin", origin)
        .set("X-CSRF-Token", csrf)
        .send({ title, minMinutes: 1, maxMinutes: 1440 });
      const path = `/api/templates/${existing.id}`;
      const patched = await agent
        .patch(path)
        .set("Origin", origin)
        .set("X-CSRF-Token", csrf)
        .send({ title, description: "Valid new description" });

      if (accepted) {
        expect(created.status).toBe(201);
        expect(patched.status).toBe(200);
        expect(await db.activityTemplate.count()).toBe(count + 1);
        expect(
          (
            await agent
              .get(`/api/templates/${created.body.data.id}`)
              .expect(200)
          ).body.data.title,
        ).toBe(title.trim());
        expect((await agent.get(path).expect(200)).body.data).toMatchObject({
          title: title.trim(),
          description: "Valid new description",
        });
      } else {
        for (const result of [created, patched]) {
          expect(result.status).toBe(422);
          expect(result.body.error.fields).toEqual({
            title: expect.any(String),
          });
        }
        expect(await db.activityTemplate.count()).toBe(count);
        expect(
          await db.activityTemplate.findUnique({ where: { id: existing.id } }),
        ).toEqual(existing);
      }
    },
  );

  it("TEST-L7-F02-LEGACY: preserves short titles, snapshots and role restrictions", async () => {
    const template = await db.activityTemplate.findFirstOrThrow();
    await db.activityTemplate.update({
      where: { id: template.id },
      data: { title: "AB" },
    });
    const manager = await login("manager@studytrack.test");
    const reader = await login();
    const path = `/api/templates/${template.id}`;
    const changed = await manager.agent
      .patch(path)
      .set("Origin", origin)
      .set("X-CSRF-Token", manager.csrf)
      .send({ description: "New description for existing title" })
      .expect(200);
    expect(changed.body.data).toMatchObject({
      title: "AB",
      description: "New description for existing title",
    });
    expect((await reader.agent.get(path).expect(200)).body.data.title).toBe(
      "AB",
    );
    expect(
      (await reader.agent.get("/api/templates").expect(200)).body.data,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: template.id, title: "AB" }),
      ]),
    );
    const {
      body: { data: goal },
    } = await reader.agent
      .post("/api/goals")
      .set("Origin", origin)
      .set("X-CSRF-Token", reader.csrf)
      .send({
        templateId: template.id,
        startDate: "2026-11-03",
        dailyTargetMinutes: 30,
      })
      .expect(201);
    expect(goal.templateTitle).toBe("AB");
    const beforeRights = await db.activityTemplate.findMany();
    await reader.agent
      .post("/api/templates")
      .set("Origin", origin)
      .set("X-CSRF-Token", reader.csrf)
      .send({ title: "Wrong role", minMinutes: 1, maxMinutes: 1440 })
      .expect(403);
    await reader.agent
      .patch(path)
      .set("Origin", origin)
      .set("X-CSRF-Token", reader.csrf)
      .send({ title: "Wrong role" })
      .expect(403);
    expect(await db.activityTemplate.findMany()).toEqual(beforeRights);

    await manager.agent
      .patch(path)
      .set("Origin", origin)
      .set("X-CSRF-Token", manager.csrf)
      .send({ title: "ABC" })
      .expect(200);
    expect(
      (await reader.agent.get(`/api/goals/${goal.id}`).expect(200)).body.data
        .templateTitle,
    ).toBe("AB");
    await reader.agent
      .post(`/api/goals/${goal.id}/entries`)
      .set("Origin", origin)
      .set("X-CSRF-Token", reader.csrf)
      .send({ entryDate: "2026-11-03", minutes: 30 })
      .expect(201);
    expect(
      (
        await reader.agent
          .get(`/api/goals/${goal.id}/progress?date=2026-11-03`)
          .expect(200)
      ).body.data,
    ).toMatchObject({ progressPercent: 100, targetMinutes: 30 });
  });
});
