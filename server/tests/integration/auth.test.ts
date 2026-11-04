import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import {
  app,
  db,
  clock,
  fixturePassword,
  login,
  origin,
  resetData,
} from "../helpers.js";
import { digestToken } from "../../src/auth/session.js";
import { verifyPassword } from "../../src/auth/password.js";
import { createApp } from "../../src/app.js";

describe("F-01 real PostgreSQL sessions", () => {
  beforeEach(resetData);
  afterAll(() => db.$disconnect());

  it("TEST-F01-01: salted Argon2id passwords and valid role identity", async () => {
    for (const email of ["a@studytrack.test", "manager@studytrack.test"]) {
      const result = await login(email);
      expect(result.response.body.data.user.email).toBe(email);
      expect(result.response.body.data.user).not.toHaveProperty("passwordHash");
      const user = await db.user.findUniqueOrThrow({
        where: { emailNormalized: email },
      });
      expect(user.passwordHash).toMatch(/^\$argon2id\$/);
      expect(await verifyPassword(user.passwordHash, fixturePassword)).toBe(
        true,
      );
    }
  });

  it("TEST-F01-04: logout revokes the real DB session, replay fails, independent session survives", async () => {
    const first = await login();
    const second = await login();
    const raw = first.response.headers["set-cookie"][0].split(";")[0];
    const token = decodeURIComponent(raw.split("=")[1]);
    expect(
      await db.session.findUnique({ where: { tokenHash: digestToken(token) } }),
    ).not.toBeNull();
    const loggedOut = await first.agent
      .post("/api/auth/logout")
      .set("Origin", origin)
      .set("X-CSRF-Token", first.csrf)
      .expect(204);
    expect(loggedOut.headers["set-cookie"][0]).toContain(
      "Expires=Thu, 01 Jan 1970",
    );
    expect(
      await db.session.findUnique({ where: { tokenHash: digestToken(token) } }),
    ).toBeNull();
    await request(app).get("/api/auth/me").set("Cookie", raw).expect(401);
    await second.agent.get("/api/auth/me").expect(200);
  });

  it("TEST-F01-03: absent/tampered and server-expired sessions return no private data", async () => {
    await request(app).get("/api/auth/me").expect(401);
    await request(app)
      .get("/api/auth/me")
      .set("Cookie", "studytrack.sid=tampered")
      .expect(401);
    const { agent } = await login();
    clock.instant = new Date("2026-11-03T13:00:00Z");
    const expired = await agent.get("/api/auth/me").expect(401);
    expect(JSON.stringify(expired.body)).not.toContain("a@studytrack.test");
  });

  it("TEST-F01-02: wrong email/password share a generic failure and create no authenticated session", async () => {
    const outcomes: unknown[] = [];
    for (const input of [
      { email: "missing@studytrack.test", password: fixturePassword },
      { email: "a@studytrack.test", password: "wrong-password" },
    ]) {
      const boot = await request(app).get("/api/auth/csrf").expect(200);
      const response = await request(app)
        .post("/api/auth/login")
        .set("Cookie", boot.headers["set-cookie"][0].split(";")[0])
        .set("Origin", origin)
        .set("X-CSRF-Token", boot.body.data.csrfToken)
        .send(input)
        .expect(401);
      outcomes.push({
        code: response.body.error.code,
        message: response.body.error.message,
      });
      expect(response.body).not.toHaveProperty("data");
    }
    expect(outcomes[0]).toEqual(outcomes[1]);
    expect(await db.session.count({ where: { userId: { not: null } } })).toBe(
      0,
    );
  });

  it("TEST-F01-02: normalized email works; missing/oversize/unknown fields reject", async () => {
    const { agent, csrf } = await login("  A@STUDYTRACK.TEST  ");
    const response = await agent.get("/api/auth/me").expect(200);
    expect(response.body.data.user.email).toBe("a@studytrack.test");
    await agent.get("/api/auth/me?ownerId=ignored").expect(422);
    await request(app).get("/api/auth/me?ownerId=ignored").expect(401);
    for (const body of [
      { email: "a@studytrack.test" },
      { email: "a@studytrack.test", password: "x".repeat(129) },
      {
        email: "a@studytrack.test",
        password: fixturePassword,
        role: "PROGRAM_MANAGER",
      },
    ]) {
      await agent
        .post("/api/auth/login")
        .set("Origin", origin)
        .set("X-CSRF-Token", csrf)
        .send(body)
        .expect(422);
    }
  });

  it("TEST-F01-06: login CSRF/origin failures do not authenticate", async () => {
    const boot = await request(app).get("/api/auth/csrf").expect(200);
    const cookie = boot.headers["set-cookie"][0].split(";")[0];
    for (const [requestOrigin, csrf] of [
      [origin, "wrong"],
      ["https://attacker.invalid", boot.body.data.csrfToken],
      ["", boot.body.data.csrfToken],
    ]) {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Cookie", cookie)
        .set("Origin", requestOrigin)
        .set("X-CSRF-Token", csrf)
        .send({ email: "a@studytrack.test", password: fixturePassword })
        .expect(403);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    }
    expect(await db.session.count({ where: { userId: { not: null } } })).toBe(
      0,
    );
  });

  it("TEST-F01-06: absent, cross-session and wrong CSRF/origin cannot revoke a session", async () => {
    const first = await login();
    const second = await login();
    for (const [requestOrigin, token] of [
      [origin, ""],
      [origin, second.csrf],
      ["https://attacker.invalid", first.csrf],
    ]) {
      await first.agent
        .post("/api/auth/logout")
        .set("Origin", requestOrigin)
        .set("X-CSRF-Token", token)
        .expect(403);
      await first.agent.get("/api/auth/me").expect(200);
    }
  });

  it("TEST-F01-07: rotating login removes old pre-auth token and fixes the 8h expiry", async () => {
    const boot = await request(app).get("/api/auth/csrf").expect(200);
    const oldCookie = boot.headers["set-cookie"][0].split(";")[0];
    const response = await request(app)
      .post("/api/auth/login")
      .set("Cookie", oldCookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", boot.body.data.csrfToken)
      .send({ email: "a@studytrack.test", password: fixturePassword })
      .expect(200);
    expect(response.body.data.csrfToken).not.toBe(boot.body.data.csrfToken);
    expect(response.body.data.expiresAt).toBe("2026-11-03T13:00:00.000Z");
    const oldToken = decodeURIComponent(oldCookie.split("=")[1]);
    expect(
      await db.session.findUnique({
        where: { tokenHash: digestToken(oldToken) },
      }),
    ).toBeNull();
    await request(app).get("/api/auth/me").set("Cookie", oldCookie).expect(401);
    const currentCookie = response.headers["set-cookie"][0].split(";")[0];
    clock.instant = new Date("2026-11-03T12:59:59.999Z");
    await request(app)
      .get("/api/auth/me")
      .set("Cookie", currentCookie)
      .expect(200);
    clock.instant = new Date("2026-11-03T13:00:00.000Z");
    await request(app)
      .get("/api/auth/me")
      .set("Cookie", currentCookie)
      .expect(401);
  });

  it("TEST-F01-06: secure production cookie and cache policy, pre-auth never identifies a user", async () => {
    const secure = createApp({
      db,
      clock,
      config: {
        origin: "https://studytrack.example",
        production: true,
        port: 5000,
      },
    });
    const boot = await request(secure).get("/api/auth/csrf").expect(200);
    expect(boot.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(boot.headers["set-cookie"][0]).toContain("Secure");
    expect(boot.headers["set-cookie"][0]).toContain("SameSite=Lax");
    expect(boot.headers["set-cookie"][0]).toContain("Path=/");
    expect(boot.headers["set-cookie"][0]).not.toContain("Domain=");
    expect(boot.headers["cache-control"]).toBe("no-store");
    expect(boot.body.data).not.toHaveProperty("user");
    await request(secure)
      .get("/api/auth/me")
      .set("Cookie", boot.headers["set-cookie"][0].split(";")[0])
      .expect(401);
  });
});
