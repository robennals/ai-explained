import { test, expect } from "@playwright/test";

test.describe("Transformers chapter — A Transformer In Action widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transformers");
  });

  test("widget renders with all stack layers", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await expect(widget).toBeVisible();
    await expect(widget.getByRole("button", { name: "Start" })).toBeVisible();
    // "Previous-token" appears twice in the stack (L1 and L4).
    await expect(widget.getByRole("button", { name: "Previous-token" }).first()).toBeVisible();
    await expect(widget.getByRole("button", { name: "Previous-token" }).nth(1)).toBeVisible();
    await expect(widget.getByRole("button", { name: "Place in the scene" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Resolve pronouns" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Find what verb acts on this" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Predict" })).toBeVisible();
  });

  test("clicking Predict shows blue's final rep and 'planet' as the top candidate", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "Predict" }).click();

    // Blue's final representation is shown above the prediction bars.
    await expect(
      widget.getByText("Martian sky", { exact: false })
    ).toBeVisible();

    // Prediction card heading.
    await expect(widget.getByText("Prediction · top candidates for the next token")).toBeVisible();

    // Top candidate is "planet".
    await expect(widget.getByText("planet").first()).toBeVisible();
    await expect(widget.getByText("62%").first()).toBeVisible();
  });

  test("clicking 'blue' at the second Previous-token layer shows it pulling 'her' as the astronaut", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    // The second "Previous-token" button is L4 (the first is L1).
    await widget.getByRole("button", { name: "Previous-token" }).nth(1).click();
    await widget.getByRole("button", { name: "blue" }).click();

    // L4's head is positional — the detail card shows the "Position bias" label.
    await expect(widget.getByText("Position bias", { exact: false }).first()).toBeVisible();

    // The Paying-attention-to table appears.
    await expect(widget.getByText("Paying attention to")).toBeVisible();

    // Value row contains the astronaut-on-Mars phrase (pulled from 'her' — now enriched).
    await expect(widget.getByText("the astronaut", { exact: false }).first()).toBeVisible();
  });

  test("clicking 'astronaut' at Place in the scene shows it binding to Mars", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "Place in the scene" }).click();
    await widget.getByRole("button", { name: "astronaut" }).click();

    // L2 head is "Place in the scene".
    await expect(widget.getByText("Place in the scene", { exact: false }).first()).toBeVisible();

    // Output rep now includes "on Mars".
    await expect(widget.getByText("currently on Mars", { exact: false }).first()).toBeVisible();
  });

  test("Next layer button advances through the stack", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    // Start at L0. Next layer should move to L1 (visible as selected).
    const nextBtn = widget.getByRole("button", { name: /Next layer/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    // L1 is the first Previous-token button. It should now look pressed / highlighted.
    await expect(widget.getByRole("button", { name: "Previous-token" }).first()).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("Transformers chapter — A Transformer At a Glance widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transformers");
  });

  test("overview widget renders with 4 input cells and 'tail' as the predicted next word", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer At a Glance" });
    await expect(widget).toBeVisible();
    await expect(widget.getByText("the", { exact: true }).first()).toBeVisible();
    await expect(widget.getByText("dog", { exact: true }).first()).toBeVisible();
    await expect(widget.getByText("chased", { exact: true }).first()).toBeVisible();
    await expect(widget.getByText("its", { exact: true }).first()).toBeVisible();
    // 'tail' appears inside the Predict cell, accessible via its aria-label.
    await expect(widget.getByLabel(/Predict next word: tail/)).toBeVisible();
  });

  test("clicking 'its' at L2 highlights its 'dog' attention source and 'its' residual source on L1", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer At a Glance" });
    await widget.getByLabel("its at L2").click();
    // Attention source: dog at L1 should have the source-cell stroke #d97706.
    await expect(widget.getByLabel("dog at L1")).toHaveAttribute("stroke", "#d97706");
    // Residual source: its at L1 should also have the source-cell stroke.
    await expect(widget.getByLabel("its at L1")).toHaveAttribute("stroke", "#d97706");
  });

  test("clicking the 'Resolve pronouns' label shows the layer summary", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer At a Glance" });
    await widget.getByLabel(/Resolve pronouns — click to see what this layer does/).click();
    await expect(widget.getByText("pronoun 'its' looks back", { exact: false })).toBeVisible();
  });
});
