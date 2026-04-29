import { test, expect } from "@playwright/test";

test.describe("Attention chapter — Live Attention widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attention");
  });

  test("model loads and renders attention from a clicked token", async ({ page }) => {
    const widget = page
      .locator(".widget-container")
      .filter({ hasText: "Live Attention Heads" });

    await expect(widget).toBeVisible();

    // Wait for the loading spinner to disappear (model fetched + first
    // forward pass complete). The R2 download can be a few seconds on
    // first hit; allow up to 30s.
    await expect(widget.getByText("Loading attention model…")).toHaveCount(0, {
      timeout: 30_000,
    });

    // Default sentence should produce token chips including a [BOS] chip.
    await expect(widget.getByRole("button", { name: "[BOS]" })).toBeVisible();
    await expect(widget.locator("textarea")).toHaveValue(/the big brown/i);

    // Default selection (second "the" token, index 4) is pre-applied, so
    // an attention readout should already be visible. The readout is the
    // only place that text "Attention from" appears.
    await expect(widget.getByText(/Attention from/)).toBeVisible();
    // The default head is Phrase echo at L5H4 — check the readout's L/H label.
    await expect(widget.locator("text=/L\\s*5\\s*H\\s*4/")).toHaveCount(2, { timeout: 5_000 });

    // Switch heads via the Previous token chip and confirm the readout
    // updates to point at L0H7.
    const prevTokenChip = widget.getByRole("button", { name: /^Previous token L0H7$/ });
    await prevTokenChip.click();
    await expect(widget.locator("text=/L\\s*0\\s*H\\s*7/")).toHaveCount(2, { timeout: 5_000 });

    // Switch to the All heads tab and confirm a 6×8 = 48 cell grid rendered.
    await widget.getByRole("button", { name: /^All heads/ }).click();
    const grid = widget.locator('[title^="L"], [title*="(L"]');
    await expect(grid).toHaveCount(48, { timeout: 5_000 });
  });
});
