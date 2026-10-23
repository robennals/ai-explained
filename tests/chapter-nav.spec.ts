import { test, expect } from "@playwright/test";

test.describe("chapter ending", () => {
  test("mid-part, pitches the next chapter in the same part", async ({ page }) => {
    await page.goto("/computation");
    const nav = page.locator("nav[data-chapter-end]");
    await expect(nav.getByRole("link", { name: "Up next: Chapter 2, Optimization" })).toHaveAttribute("href", "/optimization");
    await expect(nav.getByRole("link", { name: /Previous: Introduction/ })).toHaveAttribute("href", "/introduction");
  });

  test("at the end of a part, pitches the next part with a card per chapter", async ({ page }) => {
    await page.goto("/transformers");
    const promo = page.getByRole("region", { name: "Up next: Part 4" });
    await expect(promo.getByRole("heading", { name: "From model to assistant" })).toBeVisible();
    for (const slug of ["post-training", "conversations", "reasoning", "agents"]) {
      await expect(promo.locator(`a[href="/${slug}"]`).first()).toBeVisible();
    }
    await expect(promo.getByRole("link", { name: "Start Part 4: Post-Training →" })).toHaveAttribute("href", "/post-training");
    await expect(page.locator("nav[data-chapter-end]").getByRole("link", { name: /Previous: Positional Encoding/ })).toHaveAttribute("href", "/positions");
  });

  test("on the introduction, pitches Part 1", async ({ page }) => {
    await page.goto("/introduction");
    await expect(
      page.getByRole("region", { name: "Up next: Part 1" }).getByRole("link", { name: "Start Part 1: Computation →" }),
    ).toHaveAttribute("href", "/computation");
  });

  test("after the last chapter, offers the new-chapters signup", async ({ page }) => {
    await page.goto("/agents");
    const end = page.getByRole("region", { name: "End of the tutorial so far" });
    await expect(end.getByRole("link", { name: "Subscribe to Messy Progress" })).toHaveAttribute("href", /messyprogress\.substack\.com/);
  });
});

test.describe("chapter menu", () => {
  test("lists only chapters that are ready, with no coming-soon entries", async ({ page }) => {
    await page.goto("/computation");
    await page.getByRole("button", { name: "Switch chapter" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("link", { name: /Agents/ })).toHaveAttribute("href", "/agents");
    await expect(menu.getByRole("link", { name: /PyTorch from Scratch/ })).toBeVisible();
    // Matrix Math (chapter 14) isn't written yet.
    await expect(menu.getByText("Matrix Math")).toHaveCount(0);
    await expect(menu.getByText(/coming soon/i)).toHaveCount(0);
  });
});

test.describe("on mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("ChapterNav stacks vertically", async ({ page }) => {
    await page.goto("/computation");
    const nav = page.locator("article > nav").last();
    await expect(nav).toBeVisible();

    const flexDirection = await nav.evaluate(
      (el) => getComputedStyle(el).flexDirection,
    );
    expect(flexDirection).toBe("column");
  });
});
