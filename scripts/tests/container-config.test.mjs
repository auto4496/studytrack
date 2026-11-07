import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Config-only checks: no build, migration, seed, container or database operation.
const temporary = mkdtempSync(join(tmpdir(), "studytrack-container-config-"));
const envFile = join(temporary, "synthetic.env");
const localURL = "postgresql://studytrack:synthetic-db-password@db:5432/studytrack_container";
writeFileSync(envFile, [
  "CONTAINER_DB_PASSWORD=synthetic-db-password",
  `CONTAINER_DATABASE_URL=${localURL}`,
  "CONTAINER_MANAGER_PASSWORD=synthetic-manager-password",
  "CONTAINER_PARTICIPANT_PASSWORD=synthetic-participant-password",
  "CONTAINER_APP_ORIGIN=https://localhost:3443",
  "CONTAINER_HTTPS_PORT=3443",
  "CONTAINER_IMAGE_TAG=guard-test",
  "CONTAINER_VCS_REF=0123456789012345678901234567890123456789",
  "",
].join("\n"));
after(() => { unlinkSync(envFile); rmdirSync(temporary); });

function check(overrides = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("CONTAINER_")) delete env[key];
  Object.assign(env, overrides);
  return spawnSync(process.execPath, ["scripts/container.mjs", "check", "--env-file", envFile,
    "--project", "studytrack-container-guard-check"], {
    encoding: "utf8", env, windowsHide: true, timeout: 20000,
  });
}

test("dedicated local Compose database passes the read-only preflight", () => {
  const result = check();
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});

test("inherited external database override is rejected despite a safe env file", () => {
  const result = check({ CONTAINER_DATABASE_URL: "postgresql://fixture:synthetic-override-password@external.invalid:5432/other_db" });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0, "Effective external target must not pass preflight");
  assert.match(result.stderr, /Refusing unsafe local container database configuration/);
  assert.doesNotMatch(result.stdout + result.stderr, /synthetic-override-password/);
});

test("inherited wrong-database override on the local service is rejected", () => {
  const result = check({ CONTAINER_DATABASE_URL: localURL.replace("/studytrack_container", "/other_db") });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0, "Wrong database must not pass preflight");
  assert.match(result.stderr, /Refusing unsafe local container database configuration/);
});
