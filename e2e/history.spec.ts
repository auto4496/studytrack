import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { testDatabaseUrl } from "../scripts/test-env.mjs";
import { addDays, todayBangkok } from "../server/src/clock.js";
import { browserPassword } from "./fixtures";

const db = new PrismaClient({ datasourceUrl: testDatabaseUrl() });
const today = todayBangkok(),
  yesterday = addDays(today, -1);
let userId: string,
  templateId: string,
  goalId: string,
  secondGoalId: string,
  email: string;
let browserErrors: string[];
test.beforeEach(async ({ page }) => {
  browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /same key|unique.*key|uncaught/i.test(message.text())
    )
      browserErrors.push(message.text());
  });
  const baseline = await db.user.findUniqueOrThrow({
    where: { emailNormalized: "reader@browser.test" },
  });
  const manager = await db.user.findUniqueOrThrow({
    where: { emailNormalized: "manager@browser.test" },
  });
  userId = randomUUID();
  templateId = randomUUID();
  goalId = randomUUID();
  secondGoalId = randomUUID();
  email = `f06-${userId}@browser.test`;
  await db.user.create({
    data: {
      id: userId,
      emailNormalized: email,
      displayName: "นักอ่าน F06",
      passwordHash: baseline.passwordHash,
      role: "PARTICIPANT",
    },
  });
  await db.activityTemplate.create({
    data: {
      id: templateId,
      title: "ประวัติ F06",
      minMinutes: 1,
      maxMinutes: 1440,
      createdById: manager.id,
    },
  });
  await db.goal.create({
    data: {
      id: goalId,
      ownerId: userId,
      templateId,
      templateTitleSnapshot: "ประวัติ F06",
      unit: "MINUTES",
      minMinutesSnapshot: 1,
      maxMinutesSnapshot: 1440,
      startDate: new Date(addDays(today, -25)),
      targets: {
        create: {
          effectiveFrom: new Date(addDays(today, -25)),
          targetMinutes: 30,
        },
      },
    },
  });
  await db.goal.create({
    data: {
      id: secondGoalId,
      ownerId: userId,
      templateId,
      templateTitleSnapshot: "เป้าหมายเก่าที่สิ้นสุด",
      unit: "MINUTES",
      minMinutesSnapshot: 1,
      maxMinutesSnapshot: 1440,
      startDate: new Date(addDays(today, -30)),
      endDate: new Date(addDays(today, -26)),
      status: "ARCHIVED",
      targets: {
        create: {
          effectiveFrom: new Date(addDays(today, -30)),
          targetMinutes: 30,
        },
      },
    },
  });
});
test.afterEach(async () => {
  await db.goal.deleteMany({ where: { ownerId: userId } });
  await db.activityTemplate.deleteMany({ where: { id: templateId } });
  await db.user.deleteMany({ where: { id: userId } });
  expect(browserErrors).toEqual([]);
});
test.afterAll(() => db.$disconnect());
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(browserPassword);
  await page
    .getByRole("button", { name: "เข้าสู่ระบบ →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/goals$/);
}
async function write(page: Page, path: string, body: object, method = "POST") {
  const boot = await page.request.get("/api/auth/csrf");
  const csrf = (await boot.json()).data.csrfToken;
  return page.request.fetch(`/api${path}`, {
    method,
    data: body,
    headers: { Origin: "http://127.0.0.1:3100", "X-CSRF-Token": csrf },
  });
}
async function seed(page: Page, date = yesterday, minutes = 20) {
  const r = await write(page, `/goals/${goalId}/entries`, {
    entryDate: date,
    minutes,
  });
  expect(r.status()).toBe(201);
  return (await r.json()).data;
}
async function open(page: Page) {
  await page.goto(`/goals/${goalId}`);
  await expect(
    page.getByRole("heading", { name: "ประวัติการอ่าน", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("streak-best")).toBeVisible();
}
const row = (page: Page, date = yesterday) =>
  page.getByTestId(`history-row-${date}`);
async function edit(page: Page, date = yesterday) {
  await page
    .getByRole("button", { name: `แก้ไขเวลา ${date}`, exact: true })
    .click();
  await expect(page.getByLabel("เวลาอ่านที่แก้ไข (นาที)")).toBeFocused();
}
test("TEST-F06-20/22: real create/correction/reload, both refresh directions and unsaved input", async ({
  page,
}, info) => {
  await login(page);
  const entry = await seed(page);
  await open(page);
  await page.getByLabel("เวลาที่อ่านจริง (นาที)").fill("17");
  await edit(page);
  await page.getByLabel("เวลาอ่านที่แก้ไข (นาที)").fill("0");
  await page.getByLabel("เวลาอ่านที่แก้ไข (นาที)").press("Enter");
  await expect(page.getByLabel("เวลาอ่านที่แก้ไข (นาที)")).toBeFocused();
  await expect(page.locator("#history-minutes-error")).toContainText("1–1440");
  await page.getByLabel("เวลาอ่านที่แก้ไข (นาที)").fill("30");
  await page
    .getByRole("button", { name: "บันทึกการแก้ไข", exact: true })
    .click();
  await expect(row(page)).toContainText("30 / 30");
  await expect(page.getByTestId("streak-current")).toHaveText("1 วัน");
  await expect(page.getByLabel("วันที่บันทึก (เวลาไทย)")).toHaveValue(today);
  await expect(page.getByLabel("เวลาที่อ่านจริง (นาที)")).toHaveValue("17");
  await page.getByLabel("เวลาที่อ่านจริง (นาที)").fill("30");
  await page.getByRole("button", { name: "บันทึกเวลา →", exact: true }).click();
  await expect(row(page, today)).toContainText("30 / 30");
  await expect(page.getByTestId("streak-current")).toHaveText("2 วัน");
  await page.getByLabel("วันที่บันทึก (เวลาไทย)").fill(yesterday);
  await expect(page.getByTestId("progress-amount")).toContainText("30 / 30");
  await edit(page);
  await page.getByLabel("เวลาอ่านที่แก้ไข (นาที)").fill("15");
  await page
    .getByRole("button", { name: "บันทึกการแก้ไข", exact: true })
    .click();
  await expect(page.getByTestId("progress-amount")).toContainText("15 / 30");
  await expect(page.getByLabel("วันที่บันทึก (เวลาไทย)")).toHaveValue(
    yesterday,
  );
  await expect(page.getByTestId("streak-current")).toHaveText("1 วัน");
  await page.reload();
  await expect(row(page)).toContainText("15 / 30");
  expect(
    await db.dailyEntry.findUniqueOrThrow({ where: { id: entry.id } }),
  ).toMatchObject({
    goalId,
    minutes: 15,
    createdAt: new Date(entry.createdAt),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `tmp/f06-${info.project.name}-history.png`,
    fullPage: true,
  });
});
test("TEST-F06-02/20: actual pagination, inclusive/empty range, reset, archived and goal navigation", async ({
  page,
}) => {
  await login(page);
  for (let i = 1; i <= 23; i++) await seed(page, addDays(today, -i), 30);
  await open(page);
  await expect(page.getByTestId("streak-current")).toHaveText("23 วัน");
  await expect(page.locator(".history-rows li")).toHaveCount(20);
  await page
    .getByRole("button", { name: "ประวัติหน้าถัดไป", exact: true })
    .click();
  await expect(page.locator(".history-rows li")).toHaveCount(3);
  await expect(page.getByTestId("streak-best")).toHaveText("23 วัน");
  await page.getByLabel("ประวัติตั้งแต่วันที่").fill(addDays(today, -2));
  await page.getByLabel("ประวัติถึงวันที่").fill(yesterday);
  await page
    .getByRole("button", { name: "ใช้ช่วงวันที่", exact: true })
    .click();
  await expect(page.locator(".history-rows li")).toHaveCount(2);
  await expect(page.getByTestId("streak-current")).toHaveText("23 วัน");
  await page.getByLabel("ประวัติตั้งแต่วันที่").fill(today);
  await page.getByLabel("ประวัติถึงวันที่").fill(today);
  await page
    .getByRole("button", { name: "ใช้ช่วงวันที่", exact: true })
    .click();
  await expect(
    page.getByText("ไม่มีบันทึกในช่วงหรือหน้านี้", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ดูทุกวัน", exact: true }).click();
  await expect(page.locator(".history-rows li")).toHaveCount(20);
  await page
    .getByRole("link", { name: "← เป้าหมายของฉัน", exact: true })
    .click();
  await page.goto(`/goals/${secondGoalId}`);
  await expect(page.getByTestId("streak-current")).toHaveText("0 วัน");
  await expect(page.locator(".history-rows li")).toHaveCount(0);
  const archivedDate = addDays(today, -26);
  const r = await write(page, `/goals/${secondGoalId}/entries`, {
    entryDate: archivedDate,
    minutes: 20,
  });
  expect(r.status()).toBe(201);
  await page
    .getByRole("button", { name: "รีเฟรชประวัติ", exact: true })
    .click();
  await edit(page, archivedDate);
  await page.getByLabel("เวลาอ่านที่แก้ไข (นาที)").fill("30");
  await page
    .getByRole("button", { name: "บันทึกการแก้ไข", exact: true })
    .click();
  await expect(page.getByTestId("streak-best")).toHaveText("1 วัน");
  await expect(page.getByTestId("streak-current")).toHaveText("0 วัน");
});
test("TEST-F06-21: lost committed PATCH, failed safe reconciliation then competing authoritative value; no replay", async ({
  page,
}) => {
  await login(page);
  const entry = await seed(page);
  await open(page);
  let patches = 0,
    reads = 0;
  await page.route(
    `**/api/goals/${goalId}/entries/${entry.id}`,
    async (route) => {
      patches++;
      const result = await route.fetch();
      expect(result.status()).toBe(200);
      const competing = await write(
        page,
        `/goals/${goalId}/entries/${entry.id}`,
        { minutes: 45 },
        "PATCH",
      );
      expect(competing.status()).toBe(200);
      await route.abort("failed");
    },
  );
  await page.route(`**/api/goals/${goalId}/history?**`, async (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get("from") === yesterday && params.get("to") === yesterday) {
      reads++;
      if (reads === 1)
        return route.fulfill({
          status: 503,
          json: {
            error: {
              code: "INTERNAL_ERROR",
              message: "controlled safe read unavailable",
            },
          },
        });
    }
    await route.continue();
  });
  await edit(page);
  await page.getByLabel("เวลาอ่านที่แก้ไข (นาที)").fill("30");
  await page
    .getByRole("button", { name: "บันทึกการแก้ไข", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "ตรวจผลการแก้ไขอีกครั้ง", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "บันทึกการแก้ไข", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "ตรวจผลการแก้ไขอีกครั้ง", exact: true })
    .click();
  await expect(row(page)).toContainText("45 / 30");
  await expect(page.getByText(/ตรวจข้อมูลล่าสุดแล้ว: 45 นาที/)).toBeVisible();
  expect(patches).toBe(1);
  expect(reads).toBe(2);
  expect(
    (await db.dailyEntry.findUniqueOrThrow({ where: { id: entry.id } }))
      .minutes,
  ).toBe(45);
});
test("TEST-F06-21: focus refresh preserves history draft, rejects stale filtered read, and session clears private view", async ({
  page,
}) => {
  await login(page);
  await seed(page);
  await open(page);
  await edit(page);
  await page.getByLabel("เวลาอ่านที่แก้ไข (นาที)").fill("47");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByTestId("streak-current")).toBeVisible();
  await expect(page.getByLabel("เวลาอ่านที่แก้ไข (นาที)")).toHaveValue("47");
  await page
    .getByRole("button", { name: "ยกเลิกการแก้ไข", exact: true })
    .click();
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((r) => {
      release = r;
    }),
    entered = new Promise<void>((r) => {
      started = r;
    });
  await page.route(`**/api/goals/${goalId}/history?**`, async (route) => {
    if (new URL(route.request().url()).searchParams.get("from") === yesterday) {
      const response = await route.fetch();
      started();
      await gate;
      await route.fulfill({ response }).catch(() => {});
    } else await route.continue();
  });
  await page.getByLabel("ประวัติตั้งแต่วันที่").fill(yesterday);
  await page.getByLabel("ประวัติถึงวันที่").fill(yesterday);
  await page
    .getByRole("button", { name: "ใช้ช่วงวันที่", exact: true })
    .click();
  await entered;
  await page.getByLabel("ประวัติตั้งแต่วันที่").fill(today);
  await page.getByLabel("ประวัติถึงวันที่").fill(today);
  await page
    .getByRole("button", { name: "ใช้ช่วงวันที่", exact: true })
    .click();
  await expect(
    page.getByText("ไม่มีบันทึกในช่วงหรือหน้านี้", { exact: true }),
  ).toBeVisible();
  release();
  await expect(row(page)).toHaveCount(0);
  await page.context().clearCookies();
  await page
    .getByRole("button", { name: "รีเฟรชประวัติ", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "ประวัติการอ่าน", exact: true }),
  ).toHaveCount(0);
});
test("TEST-F06-22: browser clock differs; history uses authoritative server date and future empty state", async ({
  page,
}) => {
  await login(page);
  await seed(page);
  await page.clock.install({ time: new Date("2031-01-01T00:00Z") });
  await open(page);
  const h = (
    await (await page.request.get(`/api/goals/${goalId}/history`)).json()
  ).data;
  expect(h.today).toBe(today);
  await expect(page.locator(".history-panel")).toContainText("ข้อมูล ณ");
  await expect(row(page)).toBeVisible();
  await db.goal.update({
    where: { id: goalId },
    data: { status: "ARCHIVED", endDate: new Date(today) },
  });
  const future = await db.goal.create({
    data: {
      ownerId: userId,
      templateId,
      templateTitleSnapshot: "พรุ่งนี้",
      unit: "MINUTES",
      minMinutesSnapshot: 1,
      maxMinutesSnapshot: 1440,
      startDate: new Date(addDays(today, 1)),
      targets: {
        create: {
          effectiveFrom: new Date(addDays(today, 1)),
          targetMinutes: 30,
        },
      },
    },
  });
  await page.goto(`/goals/${future.id}`);
  await expect(
    page.getByText("เป้าหมายยังไม่เริ่ม จึงยังไม่มีประวัติการอ่าน", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("streak-current")).toHaveText("0 วัน");
});
