import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

test("ChapterNav stacks vertically on mobile", async ({ page }) => {
  await page.goto("/computation");
  const nav = page.locator("article > nav").last();
  await expect(nav).toBeVisible();

  const flexDirection = await nav.evaluate(
    (el) => getComputedStyle(el).flexDirection,
  );
  expect(flexDirection).toBe("column");
});
