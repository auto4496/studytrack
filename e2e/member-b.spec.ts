import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { testDatabaseUrl } from "../scripts/test-env.mjs";
import { browserPassword, browserTemplateId, longTemplateId } from "./fixtures";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(browserPassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ →" }).click();
  await expect(page).toHaveURL(
    email.startsWith("manager") ? /\/manager\/templates$/ : /\/goals$/,
  );
}
async function fillTemplate(page: Page, title: string) {
  await page.getByLabel("ชื่อกิจกรรม", { exact: true }).fill(title);
  await page
    .getByLabel("คำอธิบาย (ไม่บังคับ)", { exact: true })
    .fill("อ่านทบทวนและจดแนวคิดสำคัญ");
  await page.getByLabel("เวลาอ่านขั้นต่ำ (นาที)", { exact: true }).fill("1");
  await page.getByLabel("เวลาอ่านสูงสุด (นาที)", { exact: true }).fill("1440");
}

test("TEST-F02-10: real manager creation → persisted catalog → participant goal selection", async ({
  page,
}, info) => {
  await login(page, "manager@browser.test");
  await page
    .getByRole("link", { name: "＋ สร้าง Template", exact: true })
    .click();
  const title = `อ่านร่วมกัน B ${info.project.name}`;
  await fillTemplate(page, title);
  await page.screenshot({
    path: `artifacts/evidence/ui-wording/member-b/${info.project.name}-template-form.png`,
    fullPage: true,
  });
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/templates") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "สร้าง Template →", exact: true })
    .click();
  const response = await created;
  expect(response.status()).toBe(201);
  const template = (await response.json()).data;
  await expect(page).toHaveURL(/\/manager\/templates$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/evidence/ui-wording/member-b/${info.project.name}-catalog.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, `reader-f02-${info.project.name}@browser.test`);
  await page.goto("/templates");
  await expect(
    page.getByRole("link", { name: "＋ สร้าง Template", exact: true }),
  ).toHaveCount(0);
  await page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .getByRole("link", { name: "ตั้งเป้าหมาย →", exact: true })
    .click();
  await expect(page.getByLabel("กิจกรรมการอ่าน", { exact: true })).toHaveValue(
    template.id,
  );
  await page.getByLabel("เป้าหมายรายวัน (นาที)", { exact: true }).fill("60");
  await page
    .getByRole("button", { name: "สร้างเป้าหมาย →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/goals\/[\w-]+$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.goto("/manager/templates/new");
  await expect(page.getByRole("alert")).toContainText("ไม่มีสิทธิ์");
});

test("TEST-F02-09: validation, pending and unknown POST outcome preserve input without automatic retry", async ({
  page,
}, info) => {
  await login(page, "manager@browser.test");
  await page.goto("/manager/templates/new");
  await page
    .getByRole("button", { name: "สร้าง Template →", exact: true })
    .click();
  await expect(page.getByLabel("ชื่อกิจกรรม", { exact: true })).toBeFocused();
  await expect(page.locator("#title-error")).toContainText("1–100");
  await fillTemplate(page, "a".repeat(100));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let posts = 0;
  await page.route("**/api/templates", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts++;
    await gate;
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "กรุณาตรวจข้อมูล",
          fields: { title: "ชื่อไม่ถูกต้อง" },
        },
      }),
    });
  });
  await page
    .getByRole("button", { name: "สร้าง Template →", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "กำลังบันทึก…", exact: true }),
  ).toBeDisabled();
  release();
  await expect(page.locator("#title-error")).toContainText("ชื่อไม่ถูกต้อง");
  await expect(page.getByLabel("ชื่อกิจกรรม", { exact: true })).toHaveValue(
    "a".repeat(100),
  );
  await page.unroute("**/api/templates");
  await page.route("**/api/templates", async (route) => {
    posts++;
    await route.abort();
  });
  await page
    .getByRole("button", { name: "สร้าง Template →", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ยังไม่ทราบผลการบันทึก");
  await expect(
    page.getByRole("button", { name: "สร้าง Template →", exact: true }),
  ).toBeDisabled();
  expect(posts).toBe(2);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({
    path: `artifacts/evidence/ui-wording/member-b/${info.project.name}-template-recovery.png`,
    fullPage: true,
  });
});

test("TEST-F02-09: catalog read failure retries, then empty state is distinct from loading", async ({
  page,
}) => {
  await login(page, "manager@browser.test");
  await page.route("**/api/templates?*", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ",
  );
  await page.unroute("**/api/templates?*");
  await page.getByRole("button", { name: "ลองใหม่", exact: true }).click();
  await expect(page.locator("article").first()).toBeVisible();
  await page.route("**/api/templates?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        meta: { page: 1, pageSize: 12, total: 0 },
      }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "ยังไม่มี Template", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "＋ สร้าง Template", exact: true }),
  ).toBeVisible();
});

function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function shiftDate(date: string, amount: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}
async function mutationHeaders(page: Page) {
  const bootstrap = await page.request.get("/api/auth/csrf");
  return {
    Origin: new URL(page.url()).origin,
    "X-CSRF-Token": (await bootstrap.json()).data.csrfToken,
  };
}
async function createGoal(
  page: Page,
  templateId: string,
  startDate = todayBangkok(),
) {
  const response = await page.request.post("/api/goals", {
    headers: await mutationHeaders(page),
    data: { templateId, dailyTargetMinutes: 60, startDate },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).data as { id: string };
}

test("TEST-F04-16: full manager→goal→daily entry→persisted progress with rejection, privacy and logout", async ({
  page,
}, info) => {
  await login(page, "manager@browser.test");
  await page.goto("/manager/templates/new");
  const title = `เวลาอ่าน B ${info.project.name}`;
  await fillTemplate(page, title);
  await page
    .getByRole("button", { name: "สร้าง Template →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/manager\/templates$/);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, `reader-f04-${info.project.name}@browser.test`);
  await page.goto("/templates");
  await page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .getByRole("link", { name: "ตั้งเป้าหมาย →", exact: true })
    .click();
  await page.getByLabel("เป้าหมายรายวัน (นาที)", { exact: true }).fill("60");
  await page
    .getByRole("button", { name: "สร้างเป้าหมาย →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/goals\/[\w-]+$/);
  const id = page.url().split("/").at(-1)!;
  await expect(page.getByTestId("progress-amount")).toContainText("0 / 60");
  await page.getByLabel("เวลาที่อ่านจริง (นาที)", { exact: true }).fill("45");
  await page.getByRole("button", { name: "บันทึกเวลา →", exact: true }).click();
  await expect(page.getByTestId("progress-percent")).toHaveText("75%");
  await page.reload();
  await expect(page.getByTestId("progress-amount")).toContainText("45 / 60");
  await expect(page.getByTestId("progress-percent")).toHaveText("75%");
  const headers = await mutationHeaders(page),
    date = todayBangkok();
  const duplicate = await page.request.post(`/api/goals/${id}/entries`, {
    headers,
    data: { entryDate: date, minutes: 75 },
  });
  expect(duplicate.status()).toBe(409);
  expect((await duplicate.json()).error.code).toBe("ENTRY_ALREADY_EXISTS");
  const future = await page.request.post(`/api/goals/${id}/entries`, {
    headers,
    data: { entryDate: shiftDate(date, 1), minutes: 45 },
  });
  expect(future.status()).toBe(422);
  const entries = await page.request.get(`/api/goals/${id}/entries`);
  expect((await entries.json()).meta.total).toBe(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({
    path: `artifacts/evidence/ui-wording/member-b/${info.project.name}-daily-progress.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (await page.request.get(`/api/goals/${id}/progress?date=${date}`)).status(),
  ).toBe(401);
  await login(page, `reader-f02-${info.project.name}@browser.test`);
  expect(
    (await page.request.get(`/api/goals/${id}/progress?date=${date}`)).status(),
  ).toBe(404);
  expect(
    (
      await page.request.post(`/api/goals/${id}/entries`, {
        headers: await mutationHeaders(page),
        data: { entryDate: date, minutes: 45 },
      })
    ).status(),
  ).toBe(404);
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, "manager@browser.test");
  expect(
    (await page.request.get(`/api/goals/${id}/progress?date=${date}`)).status(),
  ).toBe(403);
});

test("TEST-F04-15: validation and committed-but-lost response reconcile before any retry", async ({
  page,
}, info) => {
  await login(page, `reader-f04-${info.project.name}@browser.test`);
  const own = await createGoal(page, browserTemplateId);
  await page.goto(`/goals/${own.id}`);
  await expect(page.getByTestId("progress-percent")).toHaveText("0%");
  await page.getByLabel("เวลาที่อ่านจริง (นาที)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "บันทึกเวลา →", exact: true }).click();
  await expect(page.locator("#minutes-error")).toContainText("1–1440");
  await expect(
    page.getByLabel("เวลาที่อ่านจริง (นาที)", { exact: true }),
  ).toBeFocused();
  await page.getByLabel("เวลาที่อ่านจริง (นาที)", { exact: true }).fill("45");
  const entryPath = `**/api/goals/${own.id}/entries`;
  await page.route(entryPath, (route) =>
    route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "ตรวจเวลาที่กรอก",
          fields: { minutes: "กรุณาตรวจเวลาที่อ่าน" },
        },
      }),
    }),
  );
  await page.getByRole("button", { name: "บันทึกเวลา →", exact: true }).click();
  await expect(page.locator("#minutes-error")).toContainText(
    "กรุณาตรวจเวลาที่อ่าน",
  );
  await expect(
    page.getByLabel("เวลาที่อ่านจริง (นาที)", { exact: true }),
  ).toHaveValue("45");
  await page.unroute(entryPath);
  let posts = 0,
    failRead = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/goals/${own.id}/progress?*`, (route) =>
    failRead ? route.abort() : route.continue(),
  );
  await page.route(entryPath, async (route) => {
    posts++;
    await gate;
    const actual = await route.fetch();
    expect(actual.status()).toBe(201);
    failRead = true;
    await route.abort(); // The real database commit succeeded, but the browser did not receive it.
  });
  await page.getByRole("button", { name: "บันทึกเวลา →", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "กำลังบันทึก…", exact: true }),
  ).toBeDisabled();
  release();
  await expect(page.getByRole("alert")).toContainText(
    "ยังตรวจสอบผลการบันทึกไม่ได้",
  );
  await expect(
    page.getByRole("button", { name: "บันทึกเวลา →", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("วันที่บันทึก (เวลาไทย)", { exact: true }),
  ).toBeDisabled();
  expect(posts).toBe(1);
  failRead = false;
  await page
    .getByRole("button", { name: "ตรวจสอบผลอีกครั้ง", exact: true })
    .click();
  await expect(page.getByTestId("progress-percent")).toHaveText("75%");
  await expect(page.getByRole("status")).toContainText("พบรายการที่บันทึกแล้ว");
  expect(posts).toBe(1);
  const list = await page.request.get(`/api/goals/${own.id}/entries`);
  expect((await list.json()).meta.total).toBe(1);
  await page.screenshot({
    path: `artifacts/evidence/ui-wording/member-b/${info.project.name}-entry-recovery.png`,
    fullPage: true,
  });
});

test("TEST-F04-15: stale date responses cannot replace the selected day; uncapped125% and read recovery", async ({
  page,
}, info) => {
  const email = `reader-history-${info.project.name}@browser.test`;
  await login(page, email);
  const date = todayBangkok(),
    past = shiftDate(date, -1);
  const db = new PrismaClient({ datasourceUrl: testDatabaseUrl() });
  let own: { id: string };
  try {
    const user = await db.user.findUniqueOrThrow({
      where: { emailNormalized: email },
    });
    own = await db.goal.create({
      data: {
        ownerId: user.id,
        templateId: browserTemplateId,
        templateTitleSnapshot: "ประวัติการอ่านทดสอบ",
        unit: "MINUTES",
        minMinutesSnapshot: 1,
        maxMinutesSnapshot: 1440,
        startDate: new Date(`${past}T00:00:00Z`),
        targets: {
          create: {
            effectiveFrom: new Date(`${past}T00:00:00Z`),
            targetMinutes: 60,
          },
        },
      },
    });
  } finally {
    await db.$disconnect();
  }
  expect(
    (
      await page.request.post(`/api/goals/${own.id}/entries`, {
        headers: await mutationHeaders(page),
        data: { entryDate: past, minutes: 75 },
      })
    ).status(),
  ).toBe(201);
  const currentPattern = new RegExp(
    `/api/goals/${own.id}/progress\\?date=${date}$`,
  );
  let fail = true;
  await page.route(currentPattern, (route) =>
    fail
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "INTERNAL_ERROR",
              message: "โหลดความคืบหน้าไม่สำเร็จ",
            },
          }),
        })
      : route.continue(),
  );
  await page.goto(`/goals/${own.id}`);
  await expect(page.getByRole("alert")).toContainText(
    "โหลดความคืบหน้าไม่สำเร็จ",
  );
  await expect(page.getByTestId("progress-amount")).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "ลองใหม่", exact: true }).click();
  await expect(page.getByTestId("progress-percent")).toHaveText("0%");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const pastPattern = new RegExp(
    `/api/goals/${own.id}/progress\\?date=${past}$`,
  );
  await page.route(pastPattern, async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  const oldRequest = page.waitForRequest((r) =>
    r.url().endsWith(`/progress?date=${past}`),
  );
  await page.getByLabel("วันที่บันทึก (เวลาไทย)", { exact: true }).fill(past);
  await oldRequest;
  await page.getByLabel("วันที่บันทึก (เวลาไทย)", { exact: true }).fill(date);
  await expect(page.getByTestId("progress-percent")).toHaveText("0%");
  const oldResponse = page.waitForResponse((r) =>
    r.url().endsWith(`/progress?date=${past}`),
  );
  release();
  await oldResponse;
  await expect(
    page.getByLabel("วันที่บันทึก (เวลาไทย)", { exact: true }),
  ).toHaveValue(date);
  await expect(page.getByTestId("progress-percent")).toHaveText("0%");
  await page.unroute(pastPattern);
  await page.getByLabel("วันที่บันทึก (เวลาไทย)", { exact: true }).fill(past);
  await expect(page.getByTestId("progress-percent")).toHaveText("125%");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "125%",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({
    path: `artifacts/evidence/ui-wording/member-b/${info.project.name}-progress-125.png`,
    fullPage: true,
  });
});

test("TEST-F04-15: tomorrow goal never fetches an invalid daily date and logout clears its private view", async ({
  page,
}, info) => {
  await login(page, `reader-f04-${info.project.name}@browser.test`);
  const own = await createGoal(
    page,
    longTemplateId,
    shiftDate(todayBangkok(), 1),
  );
  let reads = 0;
  page.on("request", (r) => {
    if (r.url().includes(`/goals/${own.id}/progress`)) reads++;
  });
  await page.goto(`/goals/${own.id}`);
  await expect(
    page.getByText(/คุณจะเริ่มบันทึกกิจกรรมได้ในวันนั้น/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "บันทึกเวลา →", exact: true }),
  ).toHaveCount(0);
  expect(reads).toBe(0);
  expect(
    (
      await page.request.post("/api/auth/logout", {
        headers: await mutationHeaders(page),
      })
    ).status(),
  ).toBe(204);
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId("progress-amount")).toHaveCount(0);
});
