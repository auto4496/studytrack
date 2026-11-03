import { test, expect, type Page } from "@playwright/test";
import { browserPassword, longTemplateId } from "./fixtures";

async function login(page: Page, email = "reader@browser.test") {
  await page.goto("/login");
  await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(browserPassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ →" }).click();
  await expect(page).toHaveURL(
    email.startsWith("manager") ? /\/manager\/templates$/ : /\/goals$/,
  );
}

test("TEST-F01-08: invalid login, keyboard recovery, reload and logout revoke browser access", async ({
  page,
}, info) => {
  await page.goto("/login");
  await expect(page.getByLabel("อีเมล", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `artifacts/evidence/member-a/${info.project.name}-login.png`,
    fullPage: true,
  });
  await page.getByLabel("อีเมล", { exact: true }).fill("reader@browser.test");
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("incorrect");
  await page.getByLabel("รหัสผ่าน", { exact: true }).press("Enter");
  await expect(page.getByRole("alert")).toContainText(
    "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  );
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(browserPassword);
  await page.getByLabel("รหัสผ่าน", { exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/goals$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "เป้าหมายการอ่าน", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const response = await page.request.get("/api/auth/me");
  expect(response.status()).toBe(401);
  await page.goto("/goals");
  await expect(page).toHaveURL(/\/login$/);
});

test("TEST-F03-08: create, reload and retrieve a real persisted goal; duplicate is rejected", async ({
  page,
}, info) => {
  await login(page, `reader-${info.project.name}@browser.test`);
  await page
    .getByRole("link", { name: "＋ ตั้งเป้าหมายใหม่", exact: true })
    .click();
  await page
    .getByLabel("กิจกรรมที่อยากทำ", { exact: true })
    .selectOption({ label: "อ่านทบทวน CPE 334" });
  await page.getByLabel("เป้าหมายต่อวัน (นาที)", { exact: true }).fill("60");
  await page.screenshot({
    path: `artifacts/evidence/member-a/${info.project.name}-goal-form.png`,
    fullPage: true,
  });
  const creation = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/goals") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "สร้างเป้าหมาย →" }).click();
  const response = await creation;
  expect(response.status()).toBe(201);
  await expect(page).toHaveURL(/\/goals\/[\w-]+$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "อ่านทบทวน CPE 334", exact: true }),
  ).toBeVisible();
  const currentId = page.url().split("/").at(-1);
  const saved = await page.request.get(`/api/goals/${currentId}`);
  expect(saved.status()).toBe(200);
  expect((await saved.json()).data.targetMinutes).toBe(60);
  await page.screenshot({
    path: `artifacts/evidence/member-a/${info.project.name}-goal-detail.png`,
    fullPage: true,
  });
  await page.goto("/goals/new");
  await page
    .getByLabel("กิจกรรมที่อยากทำ", { exact: true })
    .selectOption({ label: "อ่านทบทวน CPE 334" });
  await page.getByRole("button", { name: "สร้างเป้าหมาย →" }).click();
  await expect(page.getByRole("alert")).toContainText("คุณมีเป้าหมาย");
  await page.screenshot({
    path: `artifacts/evidence/member-a/${info.project.name}-duplicate.png`,
    fullPage: true,
  });
  await page.goto("/goals");
  await expect(
    page.getByRole("heading", { name: "เป้าหมายการอ่าน", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/evidence/member-a/${info.project.name}-goals.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("manager sees catalog but cannot read participant goals via the backend", async ({
  page,
}) => {
  await login(page, "manager@browser.test");
  await expect(
    page.getByRole("heading", { name: "แม่แบบกิจกรรม", exact: true }),
  ).toBeVisible();
  const response = await page.request.get("/api/goals");
  expect(response.status()).toBe(403);
  expect((await response.json()).error.code).toBe("FORBIDDEN");
});

test("FR-19: a failed list request offers retry and recovers with real API data", async ({
  page,
}) => {
  await login(page);
  await page.route("**/api/goals?page=1&pageSize=12", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ",
  );
  await page.unroute("**/api/goals?page=1&pageSize=12");
  await page.getByRole("button", { name: "ลองใหม่", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "เป้าหมายแรกเริ่มต้นได้วันนี้",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("NFR-06: a valid long activity title stays inside the goal detail viewport", async ({
  page,
}, info) => {
  await login(page, `reader-${info.project.name}@browser.test`);
  const bootstrap = await page.request.get("/api/auth/csrf");
  const origin = new URL(page.url()).origin;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const created = await page.request.post("/api/goals", {
    headers: {
      Origin: origin,
      "X-CSRF-Token": (await bootstrap.json()).data.csrfToken,
    },
    data: {
      templateId: longTemplateId,
      dailyTargetMinutes: 60,
      startDate: today,
    },
  });
  expect(created.status()).toBe(201);
  const goal = (await created.json()).data;
  await page.goto(`/goals/${goal.id}`);
  await expect(
    page.getByRole("heading", { name: "Reading".repeat(14), exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({
    path: `artifacts/evidence/member-a/${info.project.name}-long-title.png`,
    fullPage: true,
  });
});
