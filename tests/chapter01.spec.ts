import { test, expect } from "@playwright/test";

test.describe("Chapter 1: What Is Computation?", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/01-computation");
  });

  test("renders chapter title and prose content", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("What Is Computation?");
    await expect(
      page.getByText("Addition and multiplication alone can't compute")
    ).toBeVisible();
    await expect(page.getByText("NAND Universality")).toBeVisible();
    await expect(
      page.getByText("The Bridge to Neural Networks")
    ).toBeVisible();
  });

  test("sidebar shows chapters on wide viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/01-computation");
    // The sidebar nav has a heading "Chapters" and a list of chapter links
    const sidebar = page.locator('nav.w-64');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText("What Is Computation?")).toBeVisible();
  });

  test("chapter navigation has link to next chapter", async ({ page }) => {
    // The chapter nav at the bottom has a "Next" link to ch2
    const nextLink = page.locator('a[href="/02-neurons"]').last();
    await nextLink.scrollIntoViewIfNeeded();
    await expect(nextLink).toBeVisible();
    await expect(nextLink).toContainText("Neurons and Perceptrons");
  });

  test.describe("Arithmetic vs Boolean Demo", () => {
    test("widget loads and displays", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Arithmetic vs Boolean" });
      await expect(widget).toBeVisible({ timeout: 10000 });
    });

    test("can toggle between + and × operations", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Arithmetic vs Boolean" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      await widget.getByRole("button", { name: "A + B" }).click();
      await widget.getByRole("button", { name: "A × B" }).click();
    });

    test("can enable threshold and see threshold slider", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Arithmetic vs Boolean" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      // Enable threshold via the toggle
      const thresholdToggle = widget.getByRole("switch");
      await thresholdToggle.click();

      // The threshold slider control should now be visible
      // Wait a moment for the toggle to take effect
      await page.waitForTimeout(300);
      await expect(widget.getByText("Add threshold")).toBeVisible();
    });

    test("truth table is visible", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Arithmetic vs Boolean" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      await expect(widget.getByText("Truth Table")).toBeVisible();
      await expect(widget.getByText("Output")).toBeVisible();
    });

    test("AND gate detection works with addition + threshold", async ({
      page,
    }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Arithmetic vs Boolean" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      // Select addition (should be default)
      await widget.getByRole("button", { name: "A + B" }).click();

      // Enable threshold
      await widget.getByRole("switch").click();

      // Default threshold is 1.5 which works for A+B to create AND
      await expect(widget.getByText("You built AND!")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Fuzzy Logic Playground", () => {
    test("widget loads and displays formulas", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Fuzzy Logic Playground" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      await expect(widget.getByText("AND(A, B)")).toBeVisible();
      await expect(widget.getByText("OR(A, B)")).toBeVisible();
      await expect(widget.getByText("NOT(A)")).toBeVisible();
    });

    test("can toggle NAND operation on", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Fuzzy Logic Playground" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      await widget.getByRole("button", { name: "NAND" }).click();
      await expect(widget.getByText("NAND(A, B)")).toBeVisible();
    });

    test("challenges section is visible", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Fuzzy Logic Playground" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      await expect(widget.getByText("Challenges")).toBeVisible();
      await expect(widget.getByText("Both inputs high")).toBeVisible();
    });
  });

  test.describe("Logic Gate Builder", () => {
    test("widget loads and displays", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Logic Gate Builder" });
      await expect(widget).toBeVisible({ timeout: 10000 });
    });

    test("can add a NAND gate", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Logic Gate Builder" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      const addNandBtn = widget
        .locator("button")
        .filter({ hasText: "NAND" })
        .first();
      await addNandBtn.click();

      await expect(widget.getByText("1 gate")).toBeVisible();
    });

    test("can toggle input A and B", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Logic Gate Builder" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      const inputA = widget.getByRole("button", { name: /A = / });
      await inputA.click();
      await expect(inputA).toContainText("A = 1");

      await inputA.click();
      await expect(inputA).toContainText("A = 0");
    });

    test("challenges are visible", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Logic Gate Builder" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      await expect(
        widget.getByText("AND from NAND", { exact: true })
      ).toBeVisible();
      await expect(
        widget.getByText("OR from NAND", { exact: true })
      ).toBeVisible();
      await expect(
        widget.getByText("XOR from NAND", { exact: true })
      ).toBeVisible();
    });

    test("can build AND from NAND (2 gates)", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Logic Gate Builder" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      // AND from NAND: NAND(NAND(A,B), NAND(A,B))
      const addNandBtn = widget
        .locator("button")
        .filter({ hasText: "NAND" })
        .first();
      await addNandBtn.click();
      await addNandBtn.click();

      // Set gate 2 inputs to G1
      const selects = widget.locator("select");
      await selects.nth(2).selectOption("G1");
      await selects.nth(3).selectOption("G1");

      // AND from NAND challenge should be solved
      const andChallenge = widget
        .locator("div")
        .filter({ hasText: "AND from NAND" })
        .first();
      await expect(andChallenge).toContainText("\u2713", { timeout: 3000 });
    });

    test("reset button clears all gates", async ({ page }) => {
      const widget = page
        .locator(".widget-container")
        .filter({ hasText: "Logic Gate Builder" });
      await expect(widget).toBeVisible({ timeout: 10000 });

      const addNandBtn = widget
        .locator("button")
        .filter({ hasText: "NAND" })
        .first();
      await addNandBtn.click();
      await addNandBtn.click();

      await widget.getByRole("button", { name: "Reset" }).click();

      await expect(
        widget.getByText("Add gates using the buttons")
      ).toBeVisible();
    });
  });

  test.describe("MDX Components", () => {
    test("KeyInsight component renders", async ({ page }) => {
      await expect(page.getByText("Key Insight")).toBeVisible();
    });

    test("TryIt component renders", async ({ page }) => {
      const tryItBoxes = page.getByText("Try it");
      await expect(tryItBoxes.first()).toBeVisible();
    });
  });
});
