import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { testDatabaseUrl } from "./test-env.mjs";
import { hashPassword } from "../server/src/auth/password.js";
import { todayBangkok } from "../server/src/clock.js";

const databaseUrl = testDatabaseUrl();
const db = new PrismaClient({ datasourceUrl: databaseUrl });
const probe = createServer();
await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = (probe.address() as { port: number }).port;
await new Promise<void>((resolve) => probe.close(() => resolve()));
const origin = `http://127.0.0.1:${port}`;
const id = randomUUID();
const userId = randomUUID();
const managerId = randomUUID();
const templateId = randomUUID();
const password = "Synthetic-restart-fixture.42";
let processHandle: ChildProcess | null = null;

async function start() {
  processHandle = spawn(
    process.execPath,
    ["--import", "tsx", "server/src/index.ts"],
    {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        PORT: String(port),
        APP_ORIGIN: origin,
        NODE_ENV: "test",
      },
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    },
  );
  processHandle.stderr?.on("data", () => {});
  for (let attempt = 0; attempt < 100; attempt++) {
    if (processHandle.exitCode !== null)
      throw new Error("Smoke API exited before readiness.");
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return;
    } catch {
      /* wait for readiness */
    }
    await delay(100);
  }
  throw new Error("Smoke API readiness timeout.");
}
async function stop() {
  if (processHandle && processHandle.exitCode === null) {
    const exited = once(processHandle, "exit");
    processHandle.kill();
    await exited;
  }
  processHandle = null;
}
const cookieOf = (response: Response) =>
  response.headers.getSetCookie()[0].split(";")[0];

try {
  const passwordHash = await hashPassword(password);
  await db.user.create({
    data: {
      id: managerId,
      emailNormalized: `manager-${id}@restart.test`,
      displayName: "Restart manager",
      passwordHash,
      role: "PROGRAM_MANAGER",
    },
  });
  await db.user.create({
    data: {
      id: userId,
      emailNormalized: `reader-${id}@restart.test`,
      displayName: "Restart reader",
      passwordHash,
      role: "PARTICIPANT",
    },
  });
  await db.activityTemplate.create({
    data: {
      id: templateId,
      title: "Restart verification",
      minMinutes: 1,
      maxMinutes: 1440,
      createdById: managerId,
    },
  });
  await start();
  const boot = await fetch(`${origin}/api/auth/csrf`);
  const bootBody = await boot.json();
  const login = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookieOf(boot),
      "Content-Type": "application/json",
      "X-CSRF-Token": bootBody.data.csrfToken,
    },
    body: JSON.stringify({ email: `reader-${id}@restart.test`, password }),
  });
  assert.equal(login.status, 200);
  const identity = await login.json();
  const cookie = cookieOf(login);
  const response = await fetch(`${origin}/api/goals`, {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-CSRF-Token": identity.data.csrfToken,
    },
    body: JSON.stringify({
      templateId,
      dailyTargetMinutes: 60,
      startDate: todayBangkok(),
    }),
  });
  assert.equal(response.status, 201);
  const goal = await response.json();
  await stop();
  await start();
  const afterRestart = await fetch(`${origin}/api/goals/${goal.data.id}`, {
    headers: { Cookie: cookie },
  });
  assert.equal(afterRestart.status, 200);
  const saved = await afterRestart.json();
  assert.equal(saved.data.id, goal.data.id);
  assert.equal(saved.data.targetMinutes, 60);
  assert.equal(
    await db.goalTargetVersion.count({ where: { goalId: goal.data.id } }),
    1,
  );
  console.log(
    "PASS TEST-F03-02 / NFR-03: real API process stopped and restarted; session, goal and initial target persisted in PostgreSQL.",
  );
} finally {
  await stop();
  await db.goal.deleteMany({ where: { ownerId: userId } });
  await db.activityTemplate.deleteMany({ where: { id: templateId } });
  await db.user.deleteMany({ where: { id: { in: [userId, managerId] } } });
  await db.$disconnect();
}
