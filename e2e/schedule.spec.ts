import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { testDatabaseUrl } from "../scripts/test-env.mjs";
import { todayBangkok, addDays } from "../server/src/clock";
import { browserPassword } from "./fixtures";

const db = new PrismaClient({ datasourceUrl: testDatabaseUrl() });
const weekdays = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];
const today = todayBangkok(),
  weekday = new Date(`${today}T00:00:00Z`).getUTCDay() || 7;
let userId: string, templateId: string, goalId: string, email: string;
let pageErrors: string[];
test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const baseline = await db.user.findUniqueOrThrow({
    where: { emailNormalized: "reader@browser.test" },
  });
  const manager = await db.user.findUniqueOrThrow({
    where: { emailNormalized: "manager@browser.test" },
  });
  userId = randomUUID();
  templateId = randomUUID();
  goalId = randomUUID();
  email = `schedule-${userId}@browser.test`;
  await db.user.create({
    data: {
      id: userId,
      emailNormalized: email,
      displayName: "นักอ่านตารางทดสอบ",
      passwordHash: baseline.passwordHash,
      role: "PARTICIPANT",
    },
  });
  await db.activityTemplate.create({
    data: {
      id: templateId,
      title: "ตารางอ่าน F07",
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
      templateTitleSnapshot: "ตารางอ่าน F07",
      unit: "MINUTES",
      minMinutesSnapshot: 1,
      maxMinutesSnapshot: 1440,
      startDate: new Date(today),
      targets: {
        create: { effectiveFrom: new Date(today), targetMinutes: 30 },
      },
    },
  });
});
test.afterEach(async () => {
  await db.goalSchedule.deleteMany({ where: { goal: { ownerId: userId } } });
  await db.goal.deleteMany({ where: { ownerId: userId } });
  await db.activityTemplate.deleteMany({ where: { id: templateId } });
  await db.user.deleteMany({ where: { id: userId } });
  expect(pageErrors).toEqual([]);
});
test.afterAll(() => db.$disconnect());
const panel = (page: Page) => page.locator(".schedule-panel");
const path = () => `/api/goals/${goalId}/schedule`;
const currentLabel = () => weekdays[weekday - 1];
async function open(page: Page) {
  await page.goto("/login");
  await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(browserPassword);
  await page
    .getByRole("button", { name: "เข้าสู่ระบบ →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/goals$/);
  await page.goto(`/goals/${goalId}`);
  await expect(panel(page).getByTestId("schedule-status")).toBeVisible();
}
async function config(page: Page) {
  return (await (await page.request.get(path())).json()).data;
}
async function write(page: Page, value: object) {
  const boot = (await (await page.request.get("/api/auth/csrf")).json()).data;
  const response = await page.request.put(path(), {
    data: value,
    headers: {
      Origin: "http://127.0.0.1:3100",
      "X-CSRF-Token": boot.csrfToken,
    },
  });
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}
const dueValue = () => ({
  reminderEnabled: true,
  days: [{ weekday, readingTime: "23:59", reminderTime: "00:00" }],
});
test("TEST-F07-01/02/16: real weekly save, reload, toggle, duplicate prevention and mobile layout", async ({
  page,
}, info) => {
  await open(page);
  await expect(panel(page).getByTestId("schedule-status")).toHaveText(
    "ยังไม่ได้ตั้งตารางอ่าน",
  );
  const second = weekday === 7 ? 1 : weekday + 1;
  await page
    .getByLabel(`อ่านวัน${weekdays[second - 1]}`, { exact: true })
    .check();
  await page
    .getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true })
    .fill("22:00");
  await page
    .getByLabel(`เวลาเตือนวัน${currentLabel()}`, { exact: true })
    .fill("21:30");
  await page
    .getByRole("button", { name: "บันทึกตารางอ่าน", exact: true })
    .click();
  await expect(
    panel(page).getByText("บันทึกตารางอ่านเรียบร้อยแล้ว", { exact: true }),
  ).toBeVisible();
  const first = await config(page);
  expect(first.config.days).toHaveLength(2);
  await page.reload();
  await expect(
    page.getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true }),
  ).toHaveValue("22:00");
  await page.getByLabel("เปิดการเตือนในแอป", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "บันทึกตารางอ่าน", exact: true })
    .click();
  await expect(panel(page).getByTestId("schedule-status")).toHaveText(
    "ปิดการเตือนอยู่ ตารางอ่านยังบันทึกไว้",
  );
  expect(
    (await config(page)).config.days.every(
      (d: { reminderTime: string | null }) => d.reminderTime === null,
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByLabel("เปิดการเตือนในแอป", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true }),
  ).toHaveValue("22:00");
  expect(await db.goalSchedule.count({ where: { goalId } })).toBe(1);
  expect(await db.dailyEntry.count({ where: { goalId } })).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `tmp/f07-${info.project.name}.png`,
    fullPage: true,
  });
});
test("TEST-F07-04/16: keyboard validation keeps input and focuses the labelled time", async ({
  page,
}) => {
  await open(page);
  await page
    .getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true })
    .fill("18:00");
  const reminder = page.getByLabel(`เวลาเตือนวัน${currentLabel()}`, {
    exact: true,
  });
  await reminder.fill("19:00");
  await reminder.press("Enter");
  await expect(reminder).toBeFocused();
  await expect(panel(page)).toContainText(
    "เวลาเตือนต้องไม่เกินเวลาอ่านของวันเดียวกัน",
  );
  expect((await config(page)).config).toBeNull();
  await reminder.fill("18:00");
  await reminder.press("Enter");
  await expect(
    panel(page).getByText("บันทึกตารางอ่านเรียบร้อยแล้ว", { exact: true }),
  ).toBeVisible();
});
test("TEST-F07-07/18: saved partial reading refreshes LOGGED without achievement or schedule writes", async ({
  page,
}) => {
  await open(page);
  await write(page, dueValue());
  await page
    .getByRole("button", { name: "อัปเดตสถานะตาราง", exact: true })
    .click();
  await expect(panel(page).getByTestId("schedule-status")).toHaveText(
    "ถึงเวลาเตือนสำหรับการอ่านวันนี้แล้ว",
  );
  const before = await config(page);
  await page.getByLabel("เวลาที่อ่านจริง (นาที)", { exact: true }).fill("20");
  await page.getByRole("button", { name: "บันทึกเวลา →", exact: true }).click();
  await expect(panel(page).getByTestId("schedule-status")).toHaveText(
    "วันนี้บันทึกการอ่านแล้ว ดูผลการอ่านได้ด้านล่าง",
  );
  await expect(page.getByTestId("progress-percent")).toHaveText("66.67%");
  await expect(page.getByTestId("streak-current")).toHaveText("0 วัน");
  expect((await config(page)).config).toEqual(before.config);
});
test("TEST-F07-17/18: focus and minute poll preserve unsaved values with a different browser clock", async ({
  page,
}) => {
  await open(page);
  await write(page, dueValue());
  await page.clock.install({ time: new Date("2031-01-01T00:00Z") });
  await page
    .getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true })
    .fill("21:12");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(panel(page).getByTestId("schedule-status")).toHaveText(
    "ถึงเวลาเตือนสำหรับการอ่านวันนี้แล้ว",
  );
  await expect(
    page.getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true }),
  ).toHaveValue("21:12");
  await page.clock.fastForward(60_100);
  await expect(
    page.getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true }),
  ).toHaveValue("21:12");
  expect((await config(page)).evaluation.date).toBe(today);
  expect((await config(page)).config.days[0].readingTime).toBe("23:59");
});
test("TEST-F07-17: uncertain committed PUT and failed reconciliation block replay then show competing configuration", async ({
  page,
}) => {
  await open(page);
  let puts = 0,
    reconciling = false;
  await page.route(`**${path()}`, async (route) => {
    if (route.request().method() === "PUT") {
      puts++;
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await write(page, {
        reminderEnabled: false,
        days: [{ weekday, readingTime: "10:15", reminderTime: null }],
      });
      reconciling = true;
      return route.abort("failed");
    }
    if (reconciling)
      return route.fulfill({
        status: 503,
        json: {
          error: { code: "INTERNAL_ERROR", message: "controlled read failure" },
        },
      });
    await route.continue();
  });
  await page
    .getByRole("button", { name: "บันทึกตารางอ่าน", exact: true })
    .click();
  const recover = page.getByRole("button", {
    name: "ตรวจผลตารางก่อนส่งใหม่",
    exact: true,
  });
  await expect(recover).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "บันทึกตารางอ่าน", exact: true }),
  ).toBeDisabled();
  reconciling = false;
  await recover.click();
  await expect(
    page.getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true }),
  ).toHaveValue("10:15");
  await expect(
    page.getByLabel("เปิดการเตือนในแอป", { exact: true }),
  ).not.toBeChecked();
  await expect(panel(page)).toContainText("โหลดตารางล่าสุดแล้ว");
  expect(puts).toBe(1);
});
test("TEST-F07-09/10/16: future goal permits setup then archived goal is read-only", async ({
  page,
}) => {
  await db.goalTargetVersion.updateMany({
    where: { goalId },
    data: { effectiveFrom: new Date(addDays(today, 1)) },
  });
  await db.goal.update({
    where: { id: goalId },
    data: { startDate: new Date(addDays(today, 1)) },
  });
  await open(page);
  await page
    .getByRole("button", { name: "บันทึกตารางอ่าน", exact: true })
    .click();
  await expect(panel(page).getByTestId("schedule-status")).toHaveText(
    "บันทึกตารางไว้ได้ การเตือนจะเริ่มเมื่อถึงวันเริ่มเป้าหมาย",
  );
  // Advance only this synthetic fixture to its start, then exercise the real stop API.
  await db.goalTargetVersion.updateMany({
    where: { goalId },
    data: { effectiveFrom: new Date(today) },
  });
  await db.goal.update({
    where: { id: goalId },
    data: { startDate: new Date(today) },
  });
  const csrf = (await (await page.request.get("/api/auth/csrf")).json()).data
    .csrfToken;
  expect(
    (
      await page.request.post(`/api/goals/${goalId}/stop`, {
        data: {},
        headers: { Origin: "http://127.0.0.1:3100", "X-CSRF-Token": csrf },
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  await expect(panel(page).getByTestId("schedule-status")).toHaveText(
    "เป้าหมายสิ้นสุดแล้ว ตารางอ่านดูได้อย่างเดียว",
  );
  await expect(
    page.getByRole("button", { name: "บันทึกตารางอ่าน", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel(`อ่านวัน${currentLabel()}`, { exact: true }),
  ).toBeDisabled();
});
test("TEST-F07-17: known server validation survives refresh and401 clears private panel", async ({
  page,
}) => {
  await open(page);
  const reading = page.getByLabel(`เวลาอ่านวัน${currentLabel()}`, {
    exact: true,
  });
  await reading.fill("21:47");
  await page.route(`**${path()}`, async (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 422,
          json: {
            error: {
              code: "VALIDATION_ERROR",
              message: "ตรวจตารางอีกครั้ง",
              fields: { "days.0.readingTime": "ตรวจเวลาอ่าน" },
            },
          },
        })
      : route.continue(),
  );
  await page
    .getByRole("button", { name: "บันทึกตารางอ่าน", exact: true })
    .click();
  await expect(panel(page).getByRole("alert")).toContainText(
    "ตรวจตารางอีกครั้ง",
  );
  await page
    .getByRole("button", { name: "อัปเดตสถานะตาราง", exact: true })
    .click();
  await expect(panel(page).getByRole("alert")).toContainText(
    "ตรวจตารางอีกครั้ง",
  );
  await expect(reading).toHaveValue("21:47");
  await page.context().clearCookies();
  await page
    .getByRole("button", { name: "อัปเดตสถานะตาราง", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(panel(page)).toHaveCount(0);
});

test("TEST-F07-17: an aborted old status response cannot replace a newer complete configuration", async ({
  page,
}) => {
  await open(page);
  await write(page, dueValue());
  let release!: () => void,
    entered!: () => void,
    reads = 0;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const started = new Promise<void>((r) => {
    entered = r;
  });
  await page.route(`**${path()}`, async (route) => {
    if (route.request().method() === "GET" && ++reads === 1) {
      const response = await route.fetch();
      entered();
      await gate;
      await route.fulfill({ response }).catch(() => {});
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "อัปเดตสถานะตาราง", exact: true })
    .click();
  await started;
  await write(page, {
    reminderEnabled: false,
    days: [{ weekday, readingTime: "11:11", reminderTime: null }],
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true }),
  ).toHaveValue("11:11");
  release();
  await expect(panel(page).getByTestId("schedule-status")).toHaveText(
    "ปิดการเตือนอยู่ ตารางอ่านยังบันทึกไว้",
  );
  await expect(
    page.getByLabel(`เวลาอ่านวัน${currentLabel()}`, { exact: true }),
  ).toHaveValue("11:11");
});
