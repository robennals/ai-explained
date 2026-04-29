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
