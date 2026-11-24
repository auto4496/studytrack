import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { testDatabaseUrl } from "../scripts/test-env.mjs";
import { expect, test, type Route } from "@playwright/test";
import { browserPassword, longTemplateId, longTemplateTitle } from "./fixtures";

test("TEST-F08-17/22: persisted summary, applied dates, goal picker and responsive layout", async ({
  page,
}, info) => {
  await page.goto("/login");
  await page
    .getByLabel("อีเมล", { exact: true })
    .fill(`reader-f08-${info.project.name}@browser.test`);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(browserPassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ →" }).click();
  await expect(page).toHaveURL(/\/goals$/);
  await page.getByRole("link", { name: "สรุปการอ่าน" }).click();
  const results = page.getByRole("region", { name: "ผลรวมตามช่วง" });
  await expect(results).toContainText("ไม่มีวันอยู่ในช่วงของเป้าหมายที่เลือก");

  const initial = await page.request.get("/api/summary");
  expect(initial.status()).toBe(200);
  const today = (await initial.json()).data.evaluation.today;
  const csrf = await page.request.get("/api/auth/csrf");
  const headers = {
    Origin: new URL(page.url()).origin,
    "X-CSRF-Token": (await csrf.json()).data.csrfToken,
  };
  const created = await page.request.post("/api/goals", {
    headers,
    data: {
      templateId: longTemplateId,
      startDate: today,
      dailyTargetMinutes: 30,
    },
  });
  expect(created.status()).toBe(201);
  const goalId = (await created.json()).data.id;
  const entry = await page.request.post(`/api/goals/${goalId}/entries`, {
    headers,
    data: { entryDate: today, minutes: 45 },
  });
  expect(entry.status()).toBe(201);

  await page.getByRole("button", { name: "รีเฟรชผลสรุป" }).click();
  await expect(results).toContainText("45 / 30 นาที");
  await expect(results).toContainText("150%");
  const choice = page.getByRole("combobox", { name: "เป้าหมาย", exact: true });
  await choice.selectOption(goalId);
  await page
    .getByRole("combobox", { name: "ช่วงเวลา", exact: true })
    .selectOption("custom");
  await page.getByLabel("วันเริ่ม").fill(today);
  await page.getByLabel("วันสิ้นสุด").fill(today);
  await page.getByRole("button", { name: "แสดงสรุป" }).press("Enter");
  await expect(results.getByRole("heading")).toHaveText(longTemplateTitle);
  await expect(
    page.getByRole("table", { name: "สรุปการอ่านรายวัน" }),
  ).toContainText("45 / 30");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);

  await page.getByLabel("วันสิ้นสุด").fill("");
  await page.getByRole("button", { name: "แสดงสรุป" }).click();
  await expect(page.getByLabel("วันสิ้นสุด")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("วันสิ้นสุด")).toBeFocused();
  await expect(results).toHaveCount(0);
  await page.getByRole("button", { name: "กลับไปสัปดาห์นี้" }).click();
  await expect(results).toContainText("45 / 30 นาที");
});

test("TEST-F08-18/22: all owned picker pages, stale reads, retry and session expiry", async ({
  page,
}, info) => {
  const email = `reader-f08-recovery-${info.project.name}@browser.test`;
  await page.goto("/login");
  await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(browserPassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ →" }).click();
  await expect(page).toHaveURL(/\/goals$/);
  const me = await page.request.get("/api/auth/me");
  expect(me.status()).toBe(200);
  const owner = (await me.json()).data.user.id;
  const db = new PrismaClient({ datasourceUrl: testDatabaseUrl() });
  let secondPageGoal = "";
  try {
    const fixtures = Array.from({ length: 101 }, (_, index) => ({
      id: randomUUID(),
      ownerId: owner,
      templateId: longTemplateId,
      templateTitleSnapshot: `Archived reading ${index + 1}`,
      minMinutesSnapshot: 1,
      maxMinutesSnapshot: 1440,
      status: "ARCHIVED" as const,
      startDate: new Date("2020-01-01"),
      endDate: new Date("2020-01-01"),
      createdAt: new Date(Date.UTC(2020, 0, 1 + index)),
    }));
    secondPageGoal = fixtures[0].id;
    await db.goal.createMany({ data: fixtures });
    await db.goalTargetVersion.createMany({
      data: fixtures.map((goal) => ({
        goalId: goal.id,
        effectiveFrom: goal.startDate,
        targetMinutes: 30,
      })),
    });
  } finally {
    await db.$disconnect();
  }
  await page.getByRole("link", { name: "สรุปการอ่าน" }).click();
  const choice = page.getByRole("combobox", { name: "เป้าหมาย", exact: true });
  const results = page.getByRole("region", { name: "ผลรวมตามช่วง" });
  await expect(choice.getByRole("option")).toHaveCount(102);
  await choice.selectOption(secondPageGoal);
  const ready = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const complete = Promise.withResolvers<void>();
  const delaySelected = async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("goalId") !== secondPageGoal)
      return route.continue();
    ready.resolve();
    await release.promise;
    try {
      await route.continue();
    } catch {
      /* the superseded browser request was aborted */
    }
    complete.resolve();
  };
  await page.route("**/api/summary?*", delaySelected);
  await page.getByRole("button", { name: "แสดงสรุป" }).click();

  try {
    await ready.promise;
    await expect(results).toHaveCount(0);
    await page.getByRole("button", { name: "กลับไปสัปดาห์นี้" }).click();
    await expect(results.getByRole("heading")).toHaveText("ทุกเป้าหมายของฉัน");
  } finally {
    release.resolve();
  }
  await complete.promise;
  await page.unroute("**/api/summary?*", delaySelected);
  await expect(results.getByRole("heading")).toHaveText("ทุกเป้าหมายของฉัน");

  await choice.selectOption(secondPageGoal);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(results.getByRole("heading")).toHaveText("ทุกเป้าหมายของฉัน");
  await expect(choice).toHaveValue(secondPageGoal);
  await page.route(
    "**/api/summary?*",
    (route) =>
      route.fulfill({
        status: 503,
        json: { error: { message: "ลองใหม่หลังเชื่อมต่อ" } },
      }),
    { times: 1 },
  );
  await page.getByRole("button", { name: "แสดงสรุป" }).click();
  await expect(page.getByRole("alert")).toContainText("ลองใหม่หลังเชื่อมต่อ");
  await expect(results).toHaveCount(0);
  await page.getByRole("button", { name: "ลองใหม่", exact: true }).click();
  await expect(results.getByRole("heading")).toHaveText("Archived reading 1");
  await expect(results).toContainText("ไม่มีวันอยู่ในช่วงของเป้าหมายที่เลือก");

  const bootstrap = await page.request.get("/api/auth/csrf");
  const logout = await page.request.post("/api/auth/logout", {
    headers: {
      Origin: new URL(page.url()).origin,
      "X-CSRF-Token": (await bootstrap.json()).data.csrfToken,
    },
  });
  expect(logout.status()).toBe(204);
  await page.getByRole("button", { name: "รีเฟรชผลสรุป" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(results).toHaveCount(0);
});
