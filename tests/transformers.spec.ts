import { test, expect } from "@playwright/test";

test.describe("Transformers chapter — A Transformer In Action widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transformers");
  });

  test("widget renders with all stack layers", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await expect(widget).toBeVisible();
    await expect(widget.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L1" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L2" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L3" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L4" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Predict" })).toBeVisible();
  });

  test("clicking Predict shows blue's final rep and 'planet' as the top candidate", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "Predict" }).click();

    // Blue's final representation is shown above the prediction bars.
    await expect(
      widget.getByText("a blue thing belonging to the astronaut on Mars", { exact: false })
    ).toBeVisible();

    // Prediction card heading.
    await expect(widget.getByText("Prediction · top candidates for the next token")).toBeVisible();

    // Top candidate is "planet".
    await expect(widget.getByText("planet").first()).toBeVisible();
    await expect(widget.getByText("62%").first()).toBeVisible();
  });

  test("clicking 'blue' at L4 shows the 'Find the owner' head pulling her", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "L4" }).click();
    await widget.getByRole("button", { name: "blue" }).click();

    // Default L4 head is "Find the owner".
    await expect(widget.getByText("the owner of this thing", { exact: false }).first()).toBeVisible();

    // "her" appears in the Paying-attention-to table.
    await expect(widget.getByText("Paying attention to")).toBeVisible();

    // Value row contains the astronaut-on-Mars phrase.
    await expect(widget.getByText("the astronaut, who is on Mars", { exact: false }).first()).toBeVisible();

    // Output representation shows the full composition.
    await expect(
      widget.getByText("a blue thing belonging to the astronaut on Mars", { exact: false }).first()
    ).toBeVisible();
  });

  test("clicking 'astronaut' at L2 shows it binding to Mars", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "L2" }).click();
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
    // L1 button should now look pressed / highlighted. Assert by checking aria-pressed.
    await expect(widget.getByRole("button", { name: "L1" })).toHaveAttribute("aria-pressed", "true");
  });
});
