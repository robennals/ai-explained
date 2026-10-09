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
      page.getByRole("heading", { name: "Functions with Knobs" }),
    ).toBeVisible();
  });

  test.describe("sidebar on desktop viewport", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("lists this chapter's sections and jumps to the one clicked", async ({
      page,
    }) => {
      const sidebar = page.locator("nav.w-64");
      const sectionLink = sidebar.getByRole("link", {
        name: "Functions with Knobs",
      });
      await expect(sectionLink).not.toHaveAttribute("aria-current");

      await sectionLink.click();

      await expect(page).toHaveURL("/computation#functions-with-knobs");
      await expect(
        page.getByRole("heading", { name: "Functions with Knobs" }),
      ).toBeInViewport();
      await expect(sectionLink).toHaveAttribute("aria-current", "location");
    });

    test("lists the PyTorch notebook and the quiz after the sections", async ({
      page,
    }) => {
      const sidebar = page.locator("nav.w-64");
      const quizLink = sidebar.getByRole("link").last();
      await expect(quizLink).toHaveText("Quiz");

      await quizLink.click();
      await expect(quizLink).toHaveAttribute("aria-current", "location");

      await sidebar.getByRole("link", { name: "Try it in PyTorch" }).click();

      await expect(page).toHaveURL("/computation#try-it-in-pytorch");
      await expect(
        page.getByRole("link", { name: /Open in Google Colab/ }),
      ).toBeInViewport();
    });

    test("chapter menu switches to another chapter", async ({ page }) => {
      const sidebar = page.locator("nav.w-64");
      const chapterMenu = sidebar.getByRole("button", {
        name: "Switch chapter",
      });
      await expect(chapterMenu).toContainText("Computation");

      await chapterMenu.click();
      await page.getByRole("link", { name: /Neural Networks/ }).click();

      await expect(page).toHaveURL("/neurons");
      await expect(chapterMenu).toContainText("Neural Networks");
      await expect(
        sidebar.getByRole("link", { name: "Three Neurons Solve XOR" }),
      ).toBeVisible();
    });

    test("a page with no sections lists the chapters instead", async ({
      page,
    }) => {
      await page.goto("/introduction");
      const sidebar = page.locator("nav.w-64");
      await expect(
        sidebar.getByRole("link", { name: /Neural Networks/ }),
      ).toBeVisible();
    });
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
