import { test, expect } from "@playwright/test";

test("optional receipt reading asks for consent and review", async ({ page }) => {
  await page.route("**/api/config", async route => route.fulfill({ json: { ocr: true, ocrProvider: "near-ai", publicPilot: false, live: { enabled: false } } }));
  await page.route("**/api/session", async route => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/receipts", async route => {
    expect(route.request().headers()["x-receipt-ocr"]).toBe("true");
    expect(route.request().headers()["x-receipt-ocr-provider"]).toBe("near-ai");
    await route.fulfill({ status: 201, json: { receiptId: "00000000-0000-4000-8000-000000000000", extracted: { merchant: "Cafe", total: "12.50", currency: "USD" }, message: "Check and confirm the suggested details against your receipt." } });
  });
  await page.goto("/");
  await page.getByLabel(/Send this receipt image to NEAR AI/).check();
  await page.getByLabel("Upload receipt").setInputFiles({ name: "receipt.jpg", mimeType: "image/jpeg", buffer: Buffer.from([255, 216, 255, 0]) });
  await expect(page.getByLabel("Bill name")).toHaveValue("Cafe");
  await expect(page.getByLabel("Receipt total", { exact: true })).toHaveValue("12.50");
  const confirmation = page.getByLabel(/I checked these suggestions/);
  await expect(confirmation).toHaveAttribute("required", "");
  await page.getByLabel("Receipt total", { exact: true }).fill("13.00");
  await confirmation.check();
  await expect(page.getByLabel("Receipt total", { exact: true })).toHaveValue("13.00");
});

test("manual entry and unreadable receipts require choosing a currency", async ({ page }) => {
  await page.route("**/api/config", async route => route.fulfill({ json: { ocr: true, ocrProvider: "near-ai", publicPilot: false, live: { enabled: false } } }));
  await page.route("**/api/session", async route => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/receipts", async route => route.fulfill({ status: 201, json: { receiptId: "00000000-0000-4000-8000-000000000000", extracted: null, message: "Enter details manually." } }));
  await page.goto("/");
  await page.getByRole("button", { name: /Enter details manually/ }).click();
  const currency = page.locator("select");
  await expect(currency).toHaveValue("");
  await expect(currency).toHaveAttribute("required", "");
  await currency.selectOption("GBP");
  await page.getByRole("button", { name: /Back/ }).click();
  await page.getByLabel("Upload receipt").setInputFiles({ name: "receipt.jpg", mimeType: "image/jpeg", buffer: Buffer.from([255, 216, 255, 0]) });
  await expect(currency).toHaveValue("");
});

test("OCR.space consent names the recipient of the image", async ({ page }) => {
  await page.route("**/api/config", async route => route.fulfill({ json: { ocr: true, ocrProvider: "ocr-space", publicPilot: false, live: { enabled: false } } }));
  await page.route("**/api/session", async route => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/receipts", async route => {
    expect(route.request().headers()["x-receipt-ocr-provider"]).toBe("ocr-space");
    await route.fulfill({ status: 201, json: { receiptId: "00000000-0000-4000-8000-000000000000", extracted: { merchant: "DINEFINE RESTAURANT", total: "51.30" }, message: "Check and confirm the suggested details against your receipt." } });
  });
  await page.goto("/");
  await page.getByLabel(/Send this JPG or PNG receipt to OCR.space/).check();
  await page.getByLabel("Upload receipt").setInputFiles({ name: "receipt.jpg", mimeType: "image/jpeg", buffer: Buffer.from([255, 216, 255, 0]) });
  await expect(page.getByLabel("Bill name")).toHaveValue("DINEFINE RESTAURANT");
  await expect(page.getByLabel("Receipt total", { exact: true })).toHaveValue("51.30");
  await expect(page.locator("select")).toHaveValue("");
  await expect(page.getByLabel(/I checked these suggestions/)).toHaveAttribute("required", "");
});
