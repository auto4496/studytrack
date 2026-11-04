import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app.js";
import { hashPassword } from "../src/auth/password.js";
import type { Clock } from "../src/clock.js";

export const db = new PrismaClient();
export const origin = "http://localhost:3000";
export const fixturePassword = "Synthetic-test-password.42";
export const clock: Clock & { instant: Date } = {
  instant: new Date("2026-11-03T05:00:00.000Z"),
  now() {
    return new Date(this.instant);
  },
};
export const app = createApp({
  db,
  clock,
  config: { origin, production: false, port: 5000 },
});
export type Agent = ReturnType<typeof request.agent>;

export async function resetData() {
  clock.instant = new Date("2026-11-03T05:00:00.000Z");
  await db.dailyEntry.deleteMany();
  await db.goalTargetVersion.deleteMany();
  await db.goal.deleteMany();
  await db.activityTemplate.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();
  const passwordHash = await hashPassword(fixturePassword);
  const user = await db.user.create({
    data: {
      emailNormalized: "a@studytrack.test",
      displayName: "Reader A",
      passwordHash,
      role: "PARTICIPANT",
    },
  });
  const other = await db.user.create({
    data: {
      emailNormalized: "b@studytrack.test",
      displayName: "Reader B",
      passwordHash,
      role: "PARTICIPANT",
    },
  });
  const manager = await db.user.create({
    data: {
      emailNormalized: "manager@studytrack.test",
      displayName: "Manager",
      passwordHash,
      role: "PROGRAM_MANAGER",
    },
  });
  const template = await db.activityTemplate.create({
    data: {
      title: "Read CPE 334",
      minMinutes: 1,
      maxMinutes: 1440,
      createdById: manager.id,
    },
  });
  return { user, other, manager, template };
}

export async function login(email = "a@studytrack.test") {
  const agent = request.agent(app);
  const boot = await agent.get("/api/auth/csrf").expect(200);
  agent.set("Cookie", boot.headers["set-cookie"][0].split(";")[0]);
  const response = await agent
    .post("/api/auth/login")
    .set("Origin", origin)
    .set("X-CSRF-Token", boot.body.data.csrfToken)
    .send({ email, password: fixturePassword })
    .expect(200);
  agent.set("Cookie", response.headers["set-cookie"][0].split(";")[0]);
  return { agent, csrf: response.body.data.csrfToken as string, response };
}
