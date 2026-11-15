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
  const mutate = async (
    path: string,
    method: string,
    body: object,
    sid = cookie,
    csrf = identity.data.csrfToken,
  ) => {
    const result = await fetch(`${origin}/api${path}`, {
      method,
      headers: {
        Origin: origin,
        Cookie: sid,
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
      },
      body: JSON.stringify(body),
    });
    assert.equal(result.status, 200);
    return (await result.json()).data;
  };
  await mutate(`/goals/${goal.data.id}/target`, "PATCH", {
    dailyTargetMinutes: 120,
  });
  const stoppedGoal = await mutate(`/goals/${goal.data.id}/stop`, "POST", {});
  const managerBoot = await fetch(`${origin}/api/auth/csrf`);
  const managerLogin = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookieOf(managerBoot),
      "Content-Type": "application/json",
      "X-CSRF-Token": (await managerBoot.json()).data.csrfToken,
    },
    body: JSON.stringify({ email: `manager-${id}@restart.test`, password }),
  });
  assert.equal(managerLogin.status, 200);
  const managerCookie = cookieOf(managerLogin),
    managerCsrf = (await managerLogin.json()).data.csrfToken;
  await mutate(
    `/templates/${templateId}`,
    "PATCH",
    { title: "Persisted lifecycle title" },
    managerCookie,
    managerCsrf,
  );
  const inactiveTemplate = await mutate(
    `/templates/${templateId}/deactivate`,
    "POST",
    {},
    managerCookie,
    managerCsrf,
  );
  const beforeVersions = await db.goalTargetVersion.findMany({
    where: { goalId: goal.data.id },
    orderBy: { effectiveFrom: "asc" },
  });
  assert.equal(beforeVersions.length, 2);
  const oldPid = processHandle?.pid;
  await stop();
  await start();
  assert.notEqual(processHandle?.pid, oldPid);
  const restoredGoal = await fetch(`${origin}/api/goals/${goal.data.id}`, {
    headers: { Cookie: cookie },
  });
  assert.equal(restoredGoal.status, 200);
  assert.deepEqual((await restoredGoal.json()).data, stoppedGoal);
  const restoredTemplate = await fetch(
    `${origin}/api/templates/${templateId}`,
    { headers: { Cookie: managerCookie } },
  );
  assert.equal(restoredTemplate.status, 200);
  assert.deepEqual((await restoredTemplate.json()).data, inactiveTemplate);
  assert.deepEqual(
    await db.goalTargetVersion.findMany({
      where: { goalId: goal.data.id },
      orderBy: { effectiveFrom: "asc" },
    }),
    beforeVersions,
  );
  console.log(
    "PASS TEST-F05-15 / NFR-03: distinct API process after restart retrieves the same archived goal/endDate, retained current/pending target rows, updated metadata, inactive template and DB-backed sessions. Local dedicated test DB only; no GCP restart claimed.",
  );
  const entryResponse = await fetch(
    `${origin}/api/goals/${goal.data.id}/entries`,
    {
      method: "POST",
      headers: {
        Origin: origin,
        Cookie: cookie,
        "Content-Type": "application/json",
        "X-CSRF-Token": identity.data.csrfToken,
      },
      body: JSON.stringify({ entryDate: todayBangkok(), minutes: 20 }),
    },
  );
  assert.equal(entryResponse.status, 201);
  const entry = (await entryResponse.json()).data;
  const corrected = await mutate(
    `/goals/${goal.data.id}/entries/${entry.id}`,
    "PATCH",
    { minutes: 75 },
  );
  assert.equal(corrected.id, entry.id);
  assert.equal(corrected.createdAt, entry.createdAt);
  assert.equal(corrected.targetMinutes, 60);
  assert.equal(corrected.progressPercent, 125);
  const readHistory = async () => {
    const r = await fetch(`${origin}/api/goals/${goal.data.id}/history`, {
      headers: { Cookie: cookie },
    });
    assert.equal(r.status, 200);
    return (await r.json()).data;
  };
  const beforeHistory = await readHistory();
  const beforeEntry = await db.dailyEntry.findUniqueOrThrow({
    where: { id: entry.id },
  });
  const f06Pid = processHandle?.pid;
  await stop();
  await start();
  assert.notEqual(processHandle?.pid, f06Pid);
  const afterHistory = await readHistory();
  for (const key of [
    "goalId",
    "today",
    "eligibleRange",
    "filter",
    "entries",
    "pagination",
    "streak",
  ])
    assert.deepEqual(afterHistory[key], beforeHistory[key]);
  assert.deepEqual(
    await db.dailyEntry.findUniqueOrThrow({ where: { id: entry.id } }),
    beforeEntry,
  );
  assert.equal(afterHistory.streak.current, 1);
  assert.equal(afterHistory.streak.best, 1);
  assert.deepEqual(
    await db.goalTargetVersion.findMany({
      where: { goalId: goal.data.id },
      orderBy: { effectiveFrom: "asc" },
    }),
    beforeVersions,
  );
  console.log(
    "PASS TEST-F06-22 / NFR-03: corrected archived entry, original identity/timestamps, per-date progress, history/streak and session survive a distinct real API process restart without reseed. Dedicated local test DB only.",
  );
} finally {
  await stop();
  await db.goal.deleteMany({ where: { ownerId: userId } });
  await db.activityTemplate.deleteMany({ where: { id: templateId } });
  await db.user.deleteMany({ where: { id: { in: [userId, managerId] } } });
  await db.$disconnect();
}
