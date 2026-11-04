import assert from "node:assert/strict";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { validateTestDatabaseUrl } from "../../../../scripts/test-env.mjs";

config({ path: ".env.test.local", quiet: true });
const plain = new URL(process.env.TEST_DATABASE_URL);
assert.equal(plain.pathname, "/studytrack_b_test");
const first = new PrismaClient({ datasourceUrl: plain.href });
const results = [];
try {
  const a = await first.$queryRawUnsafe("SELECT current_database() AS name");
  for (const host of ["LOCALHOST", "localhost."]) {
    const alias = new URL(plain); alias.hostname = host;
    const second = new PrismaClient({ datasourceUrl: alias.href });
    try {
      const b = await second.$queryRawUnsafe("SELECT current_database() AS name");
      let guardRejected = false;
      try { validateTestDatabaseUrl(alias.href, plain.href); } catch { guardRejected = true; }
      results.push({ alias: host, sameDatabase: a[0].name === b[0].name, guardRejected });
    } catch { results.push({ alias: host, connectionSucceeded: false, findingConfirmed: false }); }
    finally { await second.$disconnect(); }
  }
  console.log(JSON.stringify({ operations: "SELECT current_database() only; no writes", results }, null, 2));
  assert.ok(!results.some(result => result.sameDatabase && !result.guardRejected), "Guard accepted equivalent localhost URLs that reach the same PostgreSQL database");
} finally { await first.$disconnect(); }
