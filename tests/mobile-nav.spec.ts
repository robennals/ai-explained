import { test, expect } from "@playwright/test";

test.describe("Mobile chapter drawer", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger opens drawer; clicking a chapter navigates and closes it", async ({
    page,
  }) => {
    await page.goto("/computation");

    const hamburger = page.getByRole("button", { name: "Open chapter list" });
    await expect(hamburger).toBeVisible();

    await hamburger.click();

    // Drawer is open — close button visible.
    const closeButton = page
      .getByRole("button", { name: "Close chapter list" })
      .first();
    await expect(closeButton).toBeVisible();

    // Click "Building a Brain" (chapter 3, neurons).
    await page.getByRole("link", { name: /Building a Brain/ }).click();

    await expect(page).toHaveURL("/neurons");

    // Drawer closes after route change.
    await expect(
      page.getByRole("button", { name: "Close chapter list" }).first(),
    ).not.toBeVisible();
  });

  test("hamburger is hidden on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/computation");
    await expect(
      page.getByRole("button", { name: "Open chapter list" }),
    ).not.toBeVisible();
  });
});
