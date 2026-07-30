import { test, expect } from "@playwright/test";

test.describe("Chapter 1: Computation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/computation");
  });

  test("renders chapter title and key prose", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Computation");
    await expect(
      page.getByRole("heading", { name: "Thinking Is a Function" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Machines with Knobs" }),
    ).toBeVisible();
  });

  test("sidebar lists chapters on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/computation");
    const sidebar = page.locator("nav.w-64");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText("Computation")).toBeVisible();
  });

  test("chapter nav links to next chapter (optimization)", async ({ page }) => {
    const nextLink = page.locator('a[href="/optimization"]').last();
    await nextLink.scrollIntoViewIfNeeded();
    await expect(nextLink).toBeVisible();
    await expect(nextLink).toContainText("Optimization");
  });

  for (const widgetTitle of [
    "Numbers Everywhere",
    "The Function Machine",
    "Parameter Playground",
    "Lookup Table Explosion",
  ]) {
    test(`widget renders: ${widgetTitle}`, async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: widgetTitle })
        .first();
      await expect(widget).toBeVisible({ timeout: 15000 });
    });
  }

  test("Numbers Everywhere widget reset button works", async ({ page }) => {
    const widget = page
      .locator(".widget-container")
      .filter({ hasText: "Numbers Everywhere" })
      .first();
    await expect(widget).toBeVisible({ timeout: 15000 });

    // Type into the text input and verify the value changes
    const textInput = widget.getByPlaceholder("Type something...");
    await textInput.fill("changed");
    await expect(textInput).toHaveValue("changed");

    // Click reset, verify text returns to default "Hello!"
    await widget.getByRole("button", { name: "Reset" }).click();
    await expect(textInput).toHaveValue("Hello!");
  });
});
