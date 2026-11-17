// Exercise the additive migration on populated synthetic data in a guarded test DB.
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { testDatabaseUrl } from "./test-env.mjs";

const databaseUrl = testDatabaseUrl();
const db = new PrismaClient({ datasourceUrl: databaseUrl });
try {
  const oldGoals = await db.goal.findMany();
  assert.ok(
    oldGoals.length,
    "Run the valid foundation/red fixture before upgrade",
  );
  await db.dailyEntry.create({
    data: {
      goalId: oldGoals[0].id,
      entryDate: new Date("2026-11-03"),
      minutes: 20,
    },
  });
  const snapshot = async () => ({
    goals: await db.goal.findMany({ orderBy: { id: "asc" } }),
    targets: await db.goalTargetVersion.findMany({ orderBy: { id: "asc" } }),
    entries: await db.dailyEntry.findMany({ orderBy: { id: "asc" } }),
    sessionCount: await db.session.count(),
  });
  const before = await snapshot();
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "migrate",
      "deploy",
      "--schema",
      "server/prisma/schema.prisma",
    ],
    { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: "inherit" },
  );
  assert.equal(result.status, 0);
  assert.deepEqual(await snapshot(), before);
  const tables =
    await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('goal_schedules','goal_schedule_days') ORDER BY tablename`;
  assert.equal(tables.length, 2);
  mkdirSync("tmp", { recursive: true });
  writeFileSync(
    "tmp/f07-upgrade-check.json",
    JSON.stringify(
      {
        result: "PASS",
        goals: before.goals.length,
        targetVersions: before.targets.length,
        entries: before.entries.length,
        sessionCount: before.sessionCount,
        unchanged:
          "Original IDs, minutes, dates, timestamps, goal/target data and session count",
        newTables: tables.map((t) => t.tablename),
        scope:
          "Populated foundation -> additive schedule migration, synthetic isolated local DB only",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS additive F07 migration preserves populated original goal/entry/targets/timestamps/sessions",
  );
} finally {
  await db.$disconnect();
}
