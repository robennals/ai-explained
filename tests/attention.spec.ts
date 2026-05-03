import { test, expect } from "@playwright/test";

test.describe("Attention chapter — Live Attention widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attention");
  });

  test("model loads, grid renders, clicking a token + head produces a readout", async ({
    page,
  }) => {
    const widget = page
      .locator(".widget-container")
      .filter({ hasText: "Live Attention Heads" });

    await expect(widget).toBeVisible();

    // Wait for the loading spinner to disappear (model fetched + first
    // forward pass complete). The R2 download can take a few seconds on
    // a cold cache; allow up to 30s.
    await expect(widget.getByText("Loading attention model…")).toHaveCount(0, {
      timeout: 30_000,
    });

    // Default sentence and grid both rendered.
    await expect(widget.locator("textarea")).toHaveValue(/once upon a time/i);
    const grid = widget.locator('[title^="L"]');
    await expect(grid).toHaveCount(48, { timeout: 5_000 });

    // Default token (last "brown", index 8) is pre-selected, so an attention
    // readout should already be visible.
    await expect(widget.getByText(/Attention from/)).toBeVisible();

    // Click the previous-token head L0H7 from the grid and confirm the readout
    // updates. The cell title attribute is "L0H7".
    await widget.locator('[title="L0H7"]').click();
    await expect(widget.locator("text=/L\\s*0\\s*H\\s*7/")).toHaveCount(2, {
      timeout: 5_000,
    });
  });
});

test.describe("Attention chapter — toy widget progression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attention");
  });

  test("all four toy widgets render with their distinctive titles", async ({ page }) => {
    // Step 1: Match Scores
    await expect(
      page.locator(".widget-container").filter({ has: page.locator("h3", { hasText: "Match Scores" }) })
    ).toBeVisible({ timeout: 15_000 });

    // Step 2: Adding Softmax
    await expect(
      page.locator(".widget-container").filter({ has: page.locator("h3", { hasText: "Adding Softmax" }) })
    ).toBeVisible({ timeout: 15_000 });

    // Step 3: Attention + Values
    await expect(
      page.locator(".widget-container").filter({ has: page.locator("h3", { hasText: "Attention + Values" }) })
    ).toBeVisible({ timeout: 15_000 });

    // Step 4: Attention with Sink
    await expect(
      page.locator(".widget-container").filter({ has: page.locator("h3", { hasText: "Attention with Sink" }) })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("step-1 widget computes match score 1 for it→cat in cat blah blah it", async ({ page }) => {
    const widget = page
      .locator(".widget-container")
      .filter({ has: page.locator("h3", { hasText: "Match Scores" }) });

    await expect(widget).toBeVisible({ timeout: 15_000 });

    // The default sentence is "cat blah blah it" with "it" auto-selected,
    // so the match score against cat should be 1.
    // We look for a text that includes "= 1" within the widget.
    await expect(widget.getByText(/=\s*1$/m).first()).toBeVisible();
  });

  test("step-4 sink widget shows 100% for blah blah blah it pure-fallback case", async ({ page }) => {
    const widget = page
      .locator(".widget-container")
      .filter({ hasText: "Attention with Sink" });

    await expect(widget).toBeVisible({ timeout: 15_000 });

    // Click the "blah blah blah it" preset
    await widget.getByRole("button", { name: "blah blah blah it" }).click();

    // The "What this means" callout should mention pure fallback
    await expect(widget.getByText(/no useful info gathered/i)).toBeVisible();
  });
});
