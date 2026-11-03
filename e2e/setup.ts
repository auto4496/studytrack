import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { testDatabaseUrl } from "../scripts/test-env.mjs";
import { hashPassword } from "../server/src/auth/password.js";
import { browserPassword, browserTemplateId, longTemplateId } from "./fixtures";

export default async function setup() {
  const url = testDatabaseUrl();
  const migrated = spawnSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "migrate",
      "deploy",
      "--schema",
      "server/prisma/schema.prisma",
    ],
    {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    },
  );
  if (migrated.status !== 0) throw new Error("Test migrations failed.");
  const db = new PrismaClient({ datasourceUrl: url });
  try {
    await db.dailyEntry.deleteMany();
    await db.goalTargetVersion.deleteMany();
    await db.goal.deleteMany();
    await db.activityTemplate.deleteMany();
    await db.session.deleteMany();
    await db.user.deleteMany();
    const passwordHash = await hashPassword(browserPassword);
    const manager = await db.user.create({
      data: {
        emailNormalized: "manager@browser.test",
        displayName: "ผู้ดูแลทดสอบ",
        passwordHash,
        role: "PROGRAM_MANAGER",
      },
    });
    for (const email of [
      "reader@browser.test",
      "reader-desktop@browser.test",
      "reader-mobile@browser.test",
      "reader-f02-desktop@browser.test",
      "reader-f02-mobile@browser.test",
      "reader-f04-desktop@browser.test",
      "reader-f04-mobile@browser.test",
      "reader-history-desktop@browser.test",
      "reader-history-mobile@browser.test",
    ]) {
      await db.user.create({
        data: {
          emailNormalized: email,
          displayName: "นักอ่านทดสอบ",
          passwordHash,
          role: "PARTICIPANT",
        },
      });
    }
    await db.activityTemplate.create({
      data: {
        id: browserTemplateId,
        title: "อ่านทบทวน CPE 334",
        description: "ทบทวนบทเรียนและจดแนวคิดสำคัญ",
        minMinutes: 1,
        maxMinutes: 1440,
        createdById: manager.id,
      },
    });
    await db.activityTemplate.create({
      data: {
        id: longTemplateId,
        title: "Reading".repeat(14),
        minMinutes: 1,
        maxMinutes: 1440,
        createdById: manager.id,
      },
    });
  } finally {
    await db.$disconnect();
  }
}
