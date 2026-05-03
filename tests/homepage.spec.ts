import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders title and intro", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Learn AI Layer by Layer");
    await expect(
      page.getByText("An interactive guide to understanding AI"),
    ).toBeVisible();
  });

  test("Start Learning button links to chapter 1", async ({ page }) => {
    await page.goto("/");
    const startButton = page.getByRole("link", { name: "Start Learning" });
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveAttribute("href", "/computation");
  });

  test("first ready chapter card links to /computation", async ({ page }) => {
    await page.goto("/");
    const firstChapter = page.getByRole("link", {
      name: /Everything Is Numbers/,
    });
    await expect(firstChapter).toHaveAttribute("href", "/computation");
  });

  test("chapter grid shows main chapters and at least one appendix", async ({
    page,
  }) => {
    await page.goto("/");
    // Main chapter grid: 27 entries (some "ready", some "coming soon")
    const mainGrid = page.locator("main > .grid").first();
    await expect(mainGrid.locator("> *")).toHaveCount(27);

    // Appendix section header
    await expect(
      page.getByRole("heading", { name: "Appendixes" }),
    ).toBeVisible();
  });
});
