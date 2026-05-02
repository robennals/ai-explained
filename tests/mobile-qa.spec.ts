import { test, expect } from "@playwright/test";
import path from "node:path";

const OUT_DIR = path.resolve(process.cwd(), "test-results/mobile-qa");

test.use({ viewport: { width: 375, height: 812 } });

async function snapshotWidget(
  page: import("@playwright/test").Page,
  url: string,
  titleText: string,
  filename: string,
) {
  await page.goto(url);
  const widget = page
    .locator(".widget-container")
    .filter({ hasText: titleText })
    .first();
  await expect(widget).toBeVisible({ timeout: 15000 });
  await widget.scrollIntoViewIfNeeded();
  // Push the widget under the sticky header so the header doesn't overlap.
  await page.evaluate(() => window.scrollBy({ top: -64, behavior: "instant" }));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT_DIR, filename),
    fullPage: false,
  });
}

test("@mobile-qa NumbersEverywhere mobile snapshot", async ({ page }) => {
  await snapshotWidget(
    page,
    "/computation",
    "Numbers Everywhere",
    "numbers-everywhere.png",
  );
});

test("@mobile-qa FunctionMachine mobile snapshot", async ({ page }) => {
  await snapshotWidget(
    page,
    "/computation",
    "The Function Machine",
    "function-machine.png",
  );
});

test("@mobile-qa NetworkOverview mobile snapshot", async ({ page }) => {
  await snapshotWidget(
    page,
    "/neurons",
    "A Neural Network",
    "network-overview.png",
  );
});
