import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateLocalContainerDatabase, resolveLocalContainerConfig } from "../container-config.mjs";

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

function invoke(script, argv, overrides = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("CONTAINER_")) delete env[key];
  Object.assign(env, overrides);
  return spawnSync(process.execPath, [script, ...argv, "--env-file", envFile,
    "--project", "studytrack-container-guard-check"], {
    encoding: "utf8", env, windowsHide: true, timeout: 20000,
  });
}
const check = overrides => invoke("scripts/container.mjs", ["check"], overrides);

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

test("matching inherited local credentials pass without printing resolved secrets", () => {
  const password = "synthetic-inherited-password";
  const result = check({ CONTAINER_DB_PASSWORD: password, CONTAINER_DATABASE_URL: localURL.replace("synthetic-db-password", password) });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout + result.stderr, /synthetic-inherited-password|synthetic-db-password/);
});

test("startup rejects inherited external target before any startup command", () => {
  const result = invoke("scripts/container.mjs", ["up"], {
    CONTAINER_DATABASE_URL: "postgresql://fixture:synthetic-override-password@external.invalid:5432/other_db",
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing unsafe local container database configuration/);
  assert.equal(result.stdout, "");
  assert.doesNotMatch(result.stderr, /synthetic-override-password/);
});

test("verifier rejects effective external target before recording or lifecycle checks", () => {
  const evidence = join(temporary, "not-created");
  const result = invoke("scripts/verify-container.mjs", ["--lifecycle", "--evidence", evidence], {
    CONTAINER_DATABASE_URL: "postgresql://fixture:synthetic-override-password@external.invalid:5432/other_db",
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing unsafe local container database configuration/);
  assert.equal(result.stdout, "");
  assert.equal(existsSync(evidence), false);
  assert.doesNotMatch(result.stderr, /synthetic-override-password/);
});

function fixture() {
  return { services: {
    db: { environment: { POSTGRES_USER: "studytrack", POSTGRES_DB: "studytrack_container", POSTGRES_PASSWORD: "synthetic-db-password" } },
    ...Object.fromEntries(["app", "migrate", "seed"].map(name => [name, { environment: { DATABASE_URL: localURL } }])),
  } };
}
for (const service of ["app", "migrate", "seed"]) {
  test(`all consumers are checked: reject isolated ${service} target drift`, () => {
    const config = fixture();
    config.services[service].environment.DATABASE_URL = localURL.replace("@db:", "@external.invalid:");
    assert.throws(() => validateLocalContainerDatabase(config), /Refusing unsafe/);
  });
}
for (const [name, target] of [
  ["wrong port", localURL.replace(":5432/", ":25432/")],
  ["wrong user", localURL.replace("studytrack:", "other:")],
  ["mismatched password", localURL.replace("synthetic-db-password", "other-password")],
  ["query host override", localURL + "?host=external.invalid"],
  ["alternate schema", localURL + "?schema=other"],
  ["URL fragment", localURL + "#other"],
  ["wrong protocol", localURL.replace("postgresql:", "https:")],
  ["missing database", localURL.replace("/studytrack_container", "/")],
]) {
  test(`reject ${name}`, () => {
    const config = fixture(); config.services.migrate.environment.DATABASE_URL = target;
    assert.throws(() => validateLocalContainerDatabase(config), /Refusing unsafe/);
  });
}
test("missing tools config fails closed", () => {
  const config = fixture(); delete config.services.seed;
  assert.throws(() => validateLocalContainerDatabase(config), /Refusing unsafe/);
});
test("wrong underlying database identity fails closed", () => {
  const config = fixture(); config.services.db.environment.POSTGRES_DB = "other_db";
  assert.throws(() => validateLocalContainerDatabase(config), /Refusing unsafe/);
});
test("default port and URL-encoded matching password are allowed", () => {
  const config = fixture(); config.services.db.environment.POSTGRES_PASSWORD = "synthetic:@/#password";
  for (const name of ["app", "migrate", "seed"]) {
    config.services[name].environment.DATABASE_URL = "postgresql://studytrack:synthetic%3A%40%2F%23password@db/studytrack_container";
  }
  assert.equal(validateLocalContainerDatabase(config), config);
});
test("Compose resolution includes tools and does not expose private error output", () => {
  let called;
  const config = resolveLocalContainerConfig((...argv) => { called = argv; return JSON.stringify(fixture()); });
  assert.equal(config.services.db.environment.POSTGRES_DB, "studytrack_container");
  assert.deepEqual(called, ["--profile", "tools", "config", "--format", "json"]);
  assert.throws(() => resolveLocalContainerConfig(() => { throw new Error("synthetic-private-password"); }), error => {
    assert.match(error.message, /Could not resolve/);
    assert.doesNotMatch(error.message, /synthetic-private-password/);
    assert.equal(error.cause, undefined);
    return true;
  });
});
