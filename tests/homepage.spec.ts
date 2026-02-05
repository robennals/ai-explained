import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders title and chapter list", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("AI Explained");
    await expect(
      page.getByText("An interactive guide to understanding AI")
    ).toBeVisible();

    // Should list all 17 chapters as cards (each is a link with chapter title)
    const chapterCards = page.locator("main .grid a");
    await expect(chapterCards).toHaveCount(17);
  });

  test("Start Learning button links to chapter 1", async ({ page }) => {
    await page.goto("/");
    const startButton = page.getByRole("link", { name: "Start Learning" });
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveAttribute("href", "/01-computation");
  });

  test("chapter cards link to correct pages", async ({ page }) => {
    await page.goto("/");
    const firstChapter = page.getByRole("link", {
      name: /What Is Computation/,
    });
    await expect(firstChapter).toHaveAttribute("href", "/01-computation");
  });
});
