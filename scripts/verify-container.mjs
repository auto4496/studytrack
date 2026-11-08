import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import { request } from "node:https";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
import { resolveLocalContainerConfig } from "./container-config.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const project = option("--project", "studytrack-container-review");
const envFile = option("--env-file", ".env.container.local");
const evidence = resolve(option("--evidence", "artifacts/evidence/lab5-container"));
if (!/^studytrack-container(?:-[a-z0-9-]+)?$/.test(project)) throw new Error("Use a dedicated studytrack-container project.");
// Use the same environment snapshot and resolved config as the startup wrapper.
const executionEnvironment = { ...process.env };
const run = (command, argv) => execFileSync(command, argv, { encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024, env: executionEnvironment, stdio: ["ignore", "pipe", "pipe"] }).trim();
const compose = (...argv) => run("docker", ["compose", "--env-file", envFile, "-f", "compose.container.yaml", "-p", project, ...argv]);
const config = resolveLocalContainerConfig(compose);
const env = {
  CONTAINER_APP_ORIGIN: config.services.app.environment.APP_ORIGIN,
  CONTAINER_HTTPS_PORT: String(config.services.proxy.ports.find(port => port.target === 443).published),
  CONTAINER_VCS_REF: config.services.app.build.args.VCS_REF,
  CONTAINER_MANAGER_PASSWORD: config.services.seed.environment.SEED_MANAGER_PASSWORD,
  CONTAINER_PARTICIPANT_PASSWORD: config.services.seed.environment.SEED_PARTICIPANT_PASSWORD,
};
const origin = env.CONTAINER_APP_ORIGIN;
const originURL = new URL(origin);
assert.equal(originURL.protocol, "https:");
assert.equal(originURL.hostname, "localhost");
assert.equal(originURL.port, env.CONTAINER_HTTPS_PORT);
assert(!Object.values(env).some(v => v.includes("CHANGE_ME")), "Replace example placeholders.");
const source = run("git", ["rev-parse", "HEAD"]);
assert.equal(env.CONTAINER_VCS_REF, source, "Run setup:container after checking out the tested revision.");
const inspect = id => JSON.parse(run("docker", ["inspect", id]))[0];
const checks = [];
mkdirSync(evidence, { recursive: true });
mkdirSync("tmp", { recursive: true });
const caFile = resolve("tmp", `${project}-root.crt`);
const startedAt = new Date().toISOString();
let ca;
const record = (name, expected, actual) => {
  assert.deepEqual(actual, expected, name);
  checks.push({ name, expected, actual, result: "PASS" });
  console.log(`PASS ${name}`);
};

async function send(method, path, session = {}, body, extra = {}) {
  const headers = { ...(session.cookie ? { Cookie: session.cookie } : {}), ...extra };
  if (method !== "GET") {
    headers.Origin ??= origin;
    if (session.csrf && !headers["X-CSRF-Token"]) headers["X-CSRF-Token"] = session.csrf;
    if (body !== undefined) headers["Content-Type"] = "application/json";
  }
  const result = await new Promise((resolveResult, reject) => {
    const req = request(new URL(path, origin), { method, headers, ca, family: 4, timeout: 8000 }, res => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let value; try { value = JSON.parse(text); } catch { value = text; }
        resolveResult({ status: res.statusCode, body: value, headers: res.headers });
      });
    });
    req.on("error", reject); req.on("timeout", () => req.destroy(new Error("Local HTTPS request timeout")));
    if (body !== undefined) req.write(JSON.stringify(body)); req.end();
  });
  const cookie = result.headers["set-cookie"]?.[0];
  if (cookie) session.cookie = cookie.split(";")[0];
  return result;
}

async function waitHealthy() {
  for (let i = 0; i < 60; i++) {
    try { if ((await send("GET", "/api/health")).status === 200) return; } catch {}
    await delay(500);
  }
  throw new Error("Local HTTPS application did not become healthy.");
}
async function login(email, password) {
  const session = {};
  const boot = await send("GET", "/api/auth/csrf", session);
  assert.equal(boot.status, 200); session.csrf = boot.body.data.csrfToken;
  const result = await send("POST", "/api/auth/login", session, { email, password });
  assert.equal(result.status, 200, "Valid synthetic login");
  session.csrf = result.body.data.csrfToken;
  return { session, result };
}

let retained;
try {
  const appID = compose("ps", "-q", "app");
  const app = inspect(appID);
  const db = inspect(compose("ps", "-q", "db"));
  assert.equal(app.Config.Labels["com.docker.compose.project"], project);
  assert.equal(db.Config.Labels["com.docker.compose.project"], project);
  assert(db.Mounts.some(m => m.Type === "volume" && m.Destination === "/var/lib/postgresql/data"));
  record("runtime uses non-root node user", "node", app.Config.User);
  record("runtime root filesystem is read-only", true, app.HostConfig.ReadonlyRootfs);
  record("database is not published to host", true, Object.keys(db.NetworkSettings.Ports).every(p => db.NetworkSettings.Ports[p] === null));
  const image = JSON.parse(run("docker", ["image", "inspect", app.Image]))[0];
  record("OCI revision matches tested commit", source, image.Config.Labels["org.opencontainers.image.revision"]);
  const bakedFiles = compose("exec", "-T", "app", "node", "-e", "const f=require('fs');console.log(JSON.stringify({env:f.existsSync('/app/.env'),privateContainerEnv:f.existsSync('/app/.env.container.local'),git:f.existsSync('/app/.git'),devCLI:f.existsSync('/app/node_modules/prisma')}))");
  record("private files and Prisma CLI excluded from runtime", { env: false, privateContainerEnv: false, git: false, devCLI: false }, JSON.parse(bakedFiles));
  for (let i = 0; i < 30; i++) {
    try { compose("cp", "proxy:/data/caddy/pki/authorities/local/root.crt", caFile); break; } catch (e) { if (i === 29) throw e; await delay(300); }
  }
  ca = readFileSync(caFile);
  await waitHealthy();
  const ui = await send("GET", "/login");
  record("production serves built SPA over HTTPS", true, ui.status === 200 && ui.body.includes('id="root"') && ui.body.includes("/assets/"));
  const jsAsset = ui.body.match(/src="([^"]+\.js)"/)?.[1];
  assert(jsAsset); record("built JavaScript asset is served", 200, (await send("GET", jsAsset)).status);
  record("anonymous goal API denied", 401, (await send("GET", "/api/goals")).status);

  const invalid = {};
  invalid.csrf = (await send("GET", "/api/auth/csrf", invalid)).body.data.csrfToken;
  record("invalid login rejects", 401, (await send("POST", "/api/auth/login", invalid, { email: "student1@studytrack.test", password: "Synthetic-wrong-password.42" })).status);
  const { session: manager, result: managerLogin } = await login("manager@studytrack.test", env.CONTAINER_MANAGER_PASSWORD);
  const flags = managerLogin.headers["set-cookie"][0];
  record("production cookie keeps intended flags", { secure: true, httpOnly: true, sameSiteLax: true }, { secure: /;\s*Secure/i.test(flags), httpOnly: /;\s*HttpOnly/i.test(flags), sameSiteLax: /SameSite=Lax/i.test(flags) });
  const templateResult = await send("POST", "/api/templates", manager, { title: `Container verification ${randomUUID().slice(0, 8)}`, description: "Synthetic local container evidence", minMinutes: 1, maxMinutes: 1440 });
  record("manager creates template", 201, templateResult.status);
  const template = templateResult.body.data;
  const { session: participant } = await login("student1@studytrack.test", env.CONTAINER_PARTICIPANT_PASSWORD);
  record("participant cannot create manager template", 403, (await send("POST", "/api/templates", participant, { title: "Forbidden", minMinutes: 1, maxMinutes: 1440 })).status);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const goalResult = await send("POST", "/api/goals", participant, { templateId: template.id, dailyTargetMinutes: 60, startDate: date });
  record("participant creates own goal from new template", 201, goalResult.status);
  const goal = goalResult.body.data;
  const entryPath = `/api/goals/${goal.id}/entries`;
  record("wrong Origin rejects container mutation", 403, (await send("POST", entryPath, participant, { entryDate: date, minutes: 45 }, { Origin: "https://attacker.invalid" })).status);
  record("bad CSRF rejects container mutation", 403, (await send("POST", entryPath, participant, { entryDate: date, minutes: 45 }, { "X-CSRF-Token": "not-the-token" })).status);
  record("invalid minutes reject without activity", 422, (await send("POST", entryPath, participant, { entryDate: date, minutes: 0 })).status);
  record("rejected requests create no entry", 0, (await send("GET", entryPath, participant)).body.meta.total);
  const saved = await send("POST", entryPath, participant, { entryDate: date, minutes: 45 });
  record("valid45-minute entry persists", 201, saved.status);
  const entry = saved.body.data;
  const expected = { goalId: goal.id, date, actualMinutes: 45, targetMinutes: 60, progressPercent: 75, achieved: false, entryId: entry.id };
  const readSaved = async label => {
    const progress = await send("GET", `/api/goals/${goal.id}/progress?date=${date}`, participant);
    assert.equal(progress.status, 200); record(label, expected, progress.body.data);
  };
  await readSaved("saved45/60=75% retrieves from production container");
  const duplicate = await send("POST", entryPath, participant, { entryDate: date, minutes: 75 });
  record("duplicate entry returns409", { status: 409, code: "ENTRY_ALREADY_EXISTS" }, { status: duplicate.status, code: duplicate.body.error.code });
  const rows = await send("GET", entryPath, participant);
  record("duplicate preserves one original row", { total: 1, minutes: 45, id: entry.id }, { total: rows.body.meta.total, minutes: rows.body.data[0].minutes, id: rows.body.data[0].id });
  const { session: other } = await login("student2@studytrack.test", env.CONTAINER_PARTICIPANT_PASSWORD);
  const denied = await send("GET", entryPath, other);
  record("cross-owner API denies without data", { status: 404, hasData: false }, { status: denied.status, hasData: "data" in denied.body });
  record("manager cannot access participant progress", 403, (await send("GET", `/api/goals/${goal.id}/progress?date=${date}`, manager)).status);
  retained = { templateId: template.id, goalId: goal.id, entryId: entry.id, date, minutes: 45, targetMinutes: 60, progressPercent: 75 };

  if (args.includes("--lifecycle")) {
    compose("restart", "app"); await waitHealthy(); await readSaved("record and DB session survive actual app restart");
    compose("up", "-d", "--no-deps", "--force-recreate", "--wait", "app"); await waitHealthy();
    record("application container was actually recreated", true, compose("ps", "-q", "app") !== appID);
    await readSaved("record and DB session survive local container recreation");
    compose("restart", "db"); await waitHealthy(); await readSaved("record and session survive database restart");
  }
  if (args.includes("--browser")) {
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
    try {
      for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
        // Only this automated local context accepts the container's internal CA.
        // All external requests are blocked; no OS/browser trust store is changed.
        const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
        await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        const page = await context.newPage(); await page.goto(`${origin}/login`);
        await page.getByLabel("อีเมล", { exact: true }).fill("student1@studytrack.test");
        await page.getByLabel("รหัสผ่าน", { exact: true }).fill(env.CONTAINER_PARTICIPANT_PASSWORD);
        await page.getByRole("button", { name: "เข้าสู่ระบบ →", exact: true }).click(); await page.waitForURL("**/goals");
        await page.goto(`${origin}/goals/${goal.id}`); await page.getByTestId("progress-percent").filter({ hasText: "75%" }).waitFor();
        await page.reload(); await page.getByTestId("progress-percent").filter({ hasText: "75%" }).waitFor();
        record(`${name} actual HTTPS browser reload shows saved75%`, "75%", await page.getByTestId("progress-percent").innerText());
        record(`${name} has no horizontal page overflow`, true, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        await page.screenshot({ path: join(evidence, `${name}-container-progress.png`), fullPage: true });
        await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click(); await page.waitForURL("**/login");
        record(`${name} logout revokes protected browser access`, 401, (await page.request.get(`${origin}${entryPath}`)).status());
        await context.close();
      }
    } finally { await browser.close(); }
  }
  const replay = { ...participant };
  record("API logout succeeds", 204, (await send("POST", "/api/auth/logout", participant)).status);
  record("revoked cookie replay denied", 401, (await send("GET", entryPath, replay)).status);
  writeFileSync(join(evidence, "execution.json"), JSON.stringify({ sourceCommit: source, startedAt, finishedAt: new Date().toISOString(), project, origin, imageId: app.Image, runtimeRevision: image.Config.Labels["org.opencontainers.image.revision"], lifecycle: args.includes("--lifecycle"), browser: args.includes("--browser"), checks, retained, passed: checks.length, failed: 0, independentHumanUAT: false, gcpRestartRedeployVerified: false, tls: "API verifies the exported local CA; scoped browser context accepts this local certificate only and blocks external requests; no system trust changes" }, null, 2));
  console.log(`PASS ${checks.length} local container checks; evidence saved without credentials/cookie/CSRF values.`);
} catch (error) {
  writeFileSync(join(evidence, "failed-execution.json"), JSON.stringify({ sourceCommit: source, startedAt, finishedAt: new Date().toISOString(), passed: checks.length, failed: 1, checks, failure: error.message }, null, 2));
  throw error;
}
