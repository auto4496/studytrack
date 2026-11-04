import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { randomUUID, randomBytes } from "node:crypto";
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
const password = randomBytes(24).toString("base64url");
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

async function signIn(email: string) {
  const boot = await fetch(`${origin}/api/auth/csrf`);
  const csrf = (await boot.json()).data.csrfToken;
  const response = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookieOf(boot),
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
    },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  return {
    cookie: cookieOf(response),
    csrf: (await response.json()).data.csrfToken,
  };
}
async function post(
  path: string,
  session: { cookie: string; csrf: string },
  data: unknown,
) {
  const response = await fetch(`${origin}/api${path}`, {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: session.cookie,
      "X-CSRF-Token": session.csrf,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  assert.equal(response.status, 201);
  return (await response.json()).data;
}
try {
  const passwordHash = await hashPassword(password);
  await db.user.createMany({
    data: [
      {
        id: managerId,
        emailNormalized: `manager-${id}@restart.test`,
        displayName: "B restart manager",
        passwordHash,
        role: "PROGRAM_MANAGER",
      },
      {
        id: userId,
        emailNormalized: `reader-${id}@restart.test`,
        displayName: "B restart reader",
        passwordHash,
        role: "PARTICIPANT",
      },
    ],
  });
  await start();
  const manager = await signIn(`manager-${id}@restart.test`);
  const template = await post("/templates", manager, {
    title: "B persisted reading",
    minMinutes: 1,
    maxMinutes: 1440,
  });
  const reader = await signIn(`reader-${id}@restart.test`);
  const date = todayBangkok();
  const goal = await post("/goals", reader, {
    templateId: template.id,
    dailyTargetMinutes: 60,
    startDate: date,
  });
  const entry = await post(`/goals/${goal.id}/entries`, reader, {
    entryDate: date,
    minutes: 45,
  });
  assert.equal(entry.progressPercent, 75);
  await stop();
  await start();
  const progressResponse = await fetch(
    `${origin}/api/goals/${goal.id}/progress?date=${date}`,
    { headers: { Cookie: reader.cookie } },
  );
  assert.equal(progressResponse.status, 200);
  const saved = (await progressResponse.json()).data;
  assert.equal(saved.entryId, entry.id);
  assert.equal(saved.actualMinutes, 45);
  assert.equal(saved.targetMinutes, 60);
  assert.equal(saved.progressPercent, 75);
  const stored = await db.dailyEntry.findUniqueOrThrow({
    where: { id: entry.id },
  });
  assert.equal(stored.minutes, 45);
  const templateResponse = await fetch(
    `${origin}/api/templates/${template.id}`,
    { headers: { Cookie: manager.cookie } },
  );
  assert.equal(templateResponse.status, 200);
  assert.equal((await templateResponse.json()).data.id, template.id);
  console.log(
    "PASS TEST-F02-07 / TEST-F04-01/02 / NFR-03: real API process stopped and restarted; DB sessions, manager-created template, goal, daily entry and 45/60=75% persisted.",
  );
} finally {
  await stop();
  await db.goal.deleteMany({ where: { ownerId: userId } });
  await db.activityTemplate.deleteMany({ where: { createdById: managerId } });
  await db.user.deleteMany({ where: { id: { in: [userId, managerId] } } });
  await db.$disconnect();
}
