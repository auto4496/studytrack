import { test, expect, type Page } from "@playwright/test";
import { browserPassword } from "./fixtures";

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
  await page.getByLabel("เวลาต่ำสุด (นาที)", { exact: true }).fill("1");
  await page.getByLabel("เวลาสูงสุด (นาที)", { exact: true }).fill("1440");
}

test("TEST-F02-10: real manager creation → persisted catalog → participant goal selection", async ({
  page,
}, info) => {
  await login(page, "manager@browser.test");
  await page.getByRole("link", { name: "＋ สร้างแม่แบบ", exact: true }).click();
  const title = `อ่านร่วมกัน B ${info.project.name}`;
  await fillTemplate(page, title);
  await page.screenshot({
    path: `artifacts/evidence/member-b/${info.project.name}-template-form.png`,
    fullPage: true,
  });
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/templates") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "สร้างแม่แบบ →", exact: true })
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
    path: `artifacts/evidence/member-b/${info.project.name}-catalog.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await login(page, `reader-f02-${info.project.name}@browser.test`);
  await page.goto("/templates");
  await expect(
    page.getByRole("link", { name: "＋ สร้างแม่แบบ", exact: true }),
  ).toHaveCount(0);
  await page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .getByRole("link", { name: "ตั้งเป้าหมาย →", exact: true })
    .click();
  await expect(
    page.getByLabel("กิจกรรมที่อยากทำ", { exact: true }),
  ).toHaveValue(template.id);
  await page.getByLabel("เป้าหมายต่อวัน (นาที)", { exact: true }).fill("60");
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
    .getByRole("button", { name: "สร้างแม่แบบ →", exact: true })
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
    .getByRole("button", { name: "สร้างแม่แบบ →", exact: true })
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
    .getByRole("button", { name: "สร้างแม่แบบ →", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ยังไม่ทราบผลการบันทึก");
  await expect(
    page.getByRole("button", { name: "สร้างแม่แบบ →", exact: true }),
  ).toBeDisabled();
  expect(posts).toBe(2);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({
    path: `artifacts/evidence/member-b/${info.project.name}-template-recovery.png`,
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
    page.getByRole("heading", { name: "ยังไม่มีแม่แบบกิจกรรม", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "＋ สร้างแม่แบบ", exact: true }),
  ).toBeVisible();
});
