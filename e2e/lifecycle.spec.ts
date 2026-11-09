import { test, expect, type Page } from "@playwright/test";
import { browserPassword } from "./fixtures";
import { PrismaClient } from "@prisma/client";
import { testDatabaseUrl } from "../scripts/test-env.mjs";

let createdTemplates: string[] = [];
test.beforeEach(() => {
  createdTemplates = [];
});
test.afterEach(async () => {
  const db = new PrismaClient({ datasourceUrl: testDatabaseUrl() });
  try {
    await db.goal.deleteMany({
      where: { templateId: { in: createdTemplates } },
    });
    await db.activityTemplate.deleteMany({
      where: { id: { in: createdTemplates } },
    });
  } finally {
    await db.$disconnect();
  }
});

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(browserPassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ →" }).click();
  await expect(page).toHaveURL(
    email.startsWith("manager") ? /\/manager\/templates$/ : /\/goals$/,
  );
}
async function write(page: Page, method: string, path: string, data: object) {
  const boot = await page.request.get("/api/auth/csrf");
  const csrf = (await boot.json()).data.csrfToken;
  return page.request.fetch(`/api${path}`, {
    method,
    data,
    headers: { Origin: "http://127.0.0.1:3100", "X-CSRF-Token": csrf },
  });
}
async function fixture(page: Page, tag: string) {
  await login(page, "manager@browser.test");
  const r = await write(page, "POST", "/templates", {
    title: `F05 ${tag}`,
    description: "Lifecycle test",
    minMinutes: 1,
    maxMinutes: 60,
  });
  expect(r.status()).toBe(201);
  const template = (await r.json()).data;
  createdTemplates.push(template.id);
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await login(page, `reader-f05-${test.info().project.name}@browser.test`);
  await page.goto(`/goals/new?template=${template.id}`);
  await page.getByLabel("เป้าหมายต่อวัน (นาที)", { exact: true }).fill("30");
  await page.getByRole("button", { name: "สร้างเป้าหมาย →" }).click();
  await expect(page).toHaveURL(/\/goals\/[\w-]+$/);
  const id = page.url().split("/").at(-1)!;
  return { template, id };
}
const lifecycle = (page: Page) =>
  page.getByRole("region", { name: "จัดการเป้าหมาย" });
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("TEST-F05-16 full target/save/reload/stop/filter journey", async ({
  page,
}, info) => {
  const { id } = await fixture(page, `journey ${info.project.name}`);
  await page.getByLabel("เวลาที่อ่านจริง (นาที)").fill("20");
  await page.getByRole("button", { name: "บันทึกเวลา →", exact: true }).click();
  await expect(page.getByTestId("progress-percent")).toHaveText("66.67%");
  await lifecycle(page).getByLabel("เป้าหมายรายวันใหม่ (นาที)").fill("0");
  await lifecycle(page)
    .getByRole("button", { name: "บันทึกเป้าหมายใหม่" })
    .click();
  await expect(lifecycle(page).getByRole("alert")).toContainText(
    "ระบุจำนวนเต็ม",
  );
  for (const value of ["60", "45"]) {
    await lifecycle(page).getByLabel("เป้าหมายรายวันใหม่ (นาที)").fill(value);
    await lifecycle(page)
      .getByRole("button", { name: "บันทึกเป้าหมายใหม่" })
      .click();
    await expect(
      lifecycle(page).getByText(new RegExp(`เป้าหมายใหม่ ${value} นาทีต่อวัน`)),
    ).toBeVisible();
  }
  await expect(page.getByTestId("progress-percent")).toHaveText("66.67%");
  await page.reload();
  await expect(
    lifecycle(page).getByText(/เป้าหมายใหม่ 45 นาทีต่อวัน/),
  ).toBeVisible();
  await expect(page.getByTestId("progress-amount")).toContainText("20 / 30");
  await noOverflow(page);
  await page.screenshot({
    path: `artifacts/evidence/f05/${info.project.name}-pending.png`,
    fullPage: true,
  });
  await lifecycle(page)
    .getByRole("button", { name: "หยุดเป้าหมาย", exact: true })
    .click();
  await lifecycle(page)
    .getByRole("button", { name: "ยืนยันหยุดเป้าหมาย", exact: true })
    .click();
  await expect(lifecycle(page)).toContainText("เป้าหมายสิ้นสุด");
  await expect(
    lifecycle(page).getByRole("button", { name: "บันทึกเป้าหมายใหม่" }),
  ).toHaveCount(0);
  await expect(page.getByTestId("progress-amount")).toContainText("20 / 30");
  await page.screenshot({
    path: `artifacts/evidence/f05/${info.project.name}-archived.png`,
    fullPage: true,
  });
  await page.goto("/goals");
  await page
    .getByLabel("สถานะเป้าหมาย", { exact: true })
    .selectOption("ARCHIVED");
  await expect(page.locator(`a[href='/goals/${id}']`)).toBeVisible();
  await page
    .getByLabel("สถานะเป้าหมาย", { exact: true })
    .selectOption("ACTIVE");
  await expect(page.locator(`a[href='/goals/${id}']`)).toHaveCount(0);
});

test("TEST-F05-16 metadata/deactivation UI retains existing active goal snapshot and usable entries", async ({
  page,
}, info) => {
  const { id, template } = await fixture(page, `catalog ${info.project.name}`);
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await login(page, "manager@browser.test");
  const card = page.locator("article").filter({
    has: page.getByRole("heading", { name: template.title, exact: true }),
  });
  await card
    .getByRole("button", { name: "แก้ไขข้อมูลกิจกรรม", exact: true })
    .click();
  await card.getByLabel("ชื่อกิจกรรมใหม่").fill(template.title + " edited");
  await card.getByLabel("ชื่อกิจกรรมใหม่").fill("x".repeat(101));
  await card
    .getByRole("button", { name: "บันทึกข้อมูลกิจกรรม", exact: true })
    .click();
  await expect(card.getByLabel("ชื่อกิจกรรมใหม่")).toHaveValue("x".repeat(101));
  await expect(card.getByLabel("ชื่อกิจกรรมใหม่")).toBeFocused();
  await card.getByLabel("ชื่อกิจกรรมใหม่").fill(template.title + " edited");
  await card
    .getByRole("button", { name: "บันทึกข้อมูลกิจกรรม", exact: true })
    .click();
  const edited = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: template.title + " edited",
      exact: true,
    }),
  });
  await edited
    .getByRole("button", { name: "ปิดใช้กิจกรรม", exact: true })
    .click();
  await edited
    .getByRole("button", { name: "ยืนยันปิดใช้กิจกรรม", exact: true })
    .click();
  await expect(edited).toHaveCount(0);
  await page.getByLabel("รวมแม่แบบที่ปิดใช้").check();
  await expect(edited).toContainText("ปิดใช้แล้ว");
  await noOverflow(page);
  await page.screenshot({
    path: `artifacts/evidence/f05/${info.project.name}-inactive.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await login(page, `reader-f05-${info.project.name}@browser.test`);
  await page.goto(`/goals/${id}`);
  await expect(
    page.getByRole("heading", { name: template.title, exact: true }),
  ).toBeVisible();
  await page.getByLabel("เวลาที่อ่านจริง (นาที)").fill("20");
  await page.getByRole("button", { name: "บันทึกเวลา →", exact: true }).click();
  await expect(page.getByTestId("progress-amount")).toContainText("20 / 30");
  await lifecycle(page).getByLabel("เป้าหมายรายวันใหม่ (นาที)").fill("45");
  await lifecycle(page)
    .getByRole("button", { name: "บันทึกเป้าหมายใหม่" })
    .click();
  await expect(
    lifecycle(page).getByText(/เป้าหมายใหม่ 45 นาทีต่อวัน/),
  ).toBeVisible();
});

test("TEST-F05-08/16 future-start goal explains boundary without lifecycle write controls", async ({
  page,
}, info) => {
  const { template } = await fixture(page, `future-base ${info.project.name}`);
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await login(page, "reader-history-desktop@browser.test");
  const tomorrow = await page.evaluate(() => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const next = new Date(today + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString().slice(0, 10);
  });
  const result = await write(page, "POST", "/goals", {
    templateId: template.id,
    dailyTargetMinutes: 30,
    startDate: tomorrow,
  });
  expect(result.status()).toBe(201);
  const goal = (await result.json()).data;
  await page.goto(`/goals/${goal.id}`);
  await expect(lifecycle(page)).toContainText(
    "เปลี่ยนหรือหยุดเป้าหมายได้ตั้งแต่",
  );
  await expect(lifecycle(page).getByRole("button")).toHaveCount(0);
  await noOverflow(page);
});

test("TEST-F05-16 pending request disables duplicate submission", async ({
  page,
}, info) => {
  const { id } = await fixture(page, `pending ${info.project.name}`);
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let count = 0;
  await page.route(`**/api/goals/${id}/target`, async (route) => {
    count++;
    await gate;
    await route.continue();
  });
  await lifecycle(page).getByLabel("เป้าหมายรายวันใหม่ (นาที)").fill("45");
  await lifecycle(page)
    .getByRole("button", { name: "บันทึกเป้าหมายใหม่" })
    .click();
  await expect(lifecycle(page).locator("form button")).toBeDisabled();
  expect(count).toBe(1);
  release();
  await expect(
    lifecycle(page).getByText(/เป้าหมายใหม่ 45 นาทีต่อวัน/),
  ).toBeVisible();
  expect(count).toBe(1);
});

test("TEST-F05-16 uncertain committed PATCH blocks replay until authoritative read succeeds", async ({
  page,
}, info) => {
  const { id } = await fixture(page, `uncertain ${info.project.name}`);
  let blockRead = true,
    count = 0;
  await page.route(`**/api/goals/${id}`, async (route) => {
    if (blockRead) await route.abort();
    else await route.continue();
  });
  await page.route(`**/api/goals/${id}/target`, async (route) => {
    count++;
    const r = await route.fetch();
    expect(r.status()).toBe(200);
    await route.abort();
  });
  await lifecycle(page).getByLabel("เป้าหมายรายวันใหม่ (นาที)").fill("45");
  await lifecycle(page)
    .getByRole("button", { name: "บันทึกเป้าหมายใหม่" })
    .click();
  await expect(
    lifecycle(page).getByRole("button", { name: "ตรวจสอบสถานะล่าสุด" }),
  ).toBeVisible();
  await expect(lifecycle(page).locator("form button")).toBeDisabled();
  expect(count).toBe(1);
  blockRead = false;
  await lifecycle(page)
    .getByRole("button", { name: "ตรวจสอบสถานะล่าสุด" })
    .click();
  await expect(
    lifecycle(page).getByText(/เป้าหมายใหม่ 45 นาทีต่อวัน/),
  ).toBeVisible();
  await expect(lifecycle(page).locator("form button")).toBeEnabled();
  expect(count).toBe(1);
});

test("TEST-F05-16 old progress response cannot overwrite refreshed committed data", async ({
  page,
}, info) => {
  const { id } = await fixture(page, `stale ${info.project.name}`);
  let release!: () => void, read!: () => void;
  const gate = new Promise<void>((r) => (release = r)),
    ready = new Promise<void>((r) => (read = r));
  let count = 0;
  await page.route(`**/api/goals/${id}/progress?*`, async (route) => {
    if (++count === 1) {
      const r = await route.fetch();
      read();
      await gate;
      await route.fulfill({ response: r }).catch(() => {});
    } else await route.continue();
  });
  await page.reload();
  await ready;
  const date = await page.getByLabel("วันที่บันทึก (เวลาไทย)").inputValue();
  expect(
    (
      await write(page, "POST", `/goals/${id}/entries`, {
        entryDate: date,
        minutes: 20,
      })
    ).status(),
  ).toBe(201);
  await lifecycle(page).getByLabel("เป้าหมายรายวันใหม่ (นาที)").fill("45");
  await lifecycle(page)
    .getByRole("button", { name: "บันทึกเป้าหมายใหม่" })
    .click();
  await expect(page.getByTestId("progress-percent")).toHaveText("66.67%");
  release();
  await expect(page.getByTestId("progress-amount")).toContainText("20 / 30");
});

test("TEST-F05-16 expired/revoked session clears lifecycle controls without replay", async ({
  page,
}, info) => {
  const { id } = await fixture(page, `session ${info.project.name}`);
  await expect(page.getByTestId("progress-percent")).toHaveText("0%");
  await lifecycle(page).getByLabel("เป้าหมายรายวันใหม่ (นาที)").fill("45");
  expect((await write(page, "POST", "/auth/logout", {})).status()).toBe(204);
  await lifecycle(page)
    .getByRole("button", { name: "บันทึกเป้าหมายใหม่" })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("region", { name: "จัดการเป้าหมาย" }),
  ).toHaveCount(0);
  await login(page, `reader-f05-${info.project.name}@browser.test`);
  const r = await page.request.get(`/api/goals/${id}`);
  expect((await r.json()).data.pendingTarget).toBeNull();
});
