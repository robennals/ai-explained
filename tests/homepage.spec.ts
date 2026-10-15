import { test, expect } from "@playwright/test";
import { getMainChapters } from "../src/lib/curriculum";
import { learningPath } from "../src/lib/learning-path";

test.describe("Homepage", () => {
  test("renders title and intro", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Learn AI Layer by Layer");
    await expect(
      page.getByText("A hands-on guide to how modern AI actually works"),
    ).toBeVisible();
  });

  test("Start button links to chapter 1", async ({ page }) => {
    await page.goto("/");
    const startButton = page.getByRole("link", { name: "Start with Chapter 1" });
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveAttribute("href", "/computation");
  });

  test("each part shows a card for each of its ready chapters", async ({
    page,
  }) => {
    await page.goto("/");
    const ready = new Set(
      getMainChapters().filter((c) => c.ready).map((c) => c.slug),
    );
    for (const [i, part] of learningPath.entries()) {
      const section = page.locator(`#part-${i + 1}`);
      await expect(section.getByRole("heading", { name: part.title })).toBeVisible();
      for (const slug of part.slugs.filter((s) => ready.has(s))) {
        await expect(section.locator(`a[href="/${slug}"]`)).toBeVisible();
      }
    }
  });

  test("lists upcoming chapters with a signup link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
    const upcoming = getMainChapters().filter((c) => !c.ready);
    for (const chapter of upcoming) {
      await expect(page.getByText(chapter.title, { exact: true })).toBeVisible();
    }
    await expect(
      page.getByRole("link", { name: "Get new chapters by email" }),
    ).toHaveAttribute("href", /messyprogress\.substack\.com/);
  });

  test("promotes the PyTorch appendix", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "PyTorch from Scratch →" }),
    ).toHaveAttribute("href", "/appendix-pytorch");
    await expect(page.getByRole("heading", { name: "Appendixes" })).toBeVisible();
  });
});
