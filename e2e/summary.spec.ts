import { expect, test } from "@playwright/test";
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
