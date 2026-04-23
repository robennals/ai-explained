import { test, expect } from "@playwright/test";

test.describe("Transformers chapter — A Transformer In Action widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transformers");
  });

  test("widget renders with all stack layers", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await expect(widget).toBeVisible();
    await expect(widget.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Previous-token" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Place in the scene" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Find what each word refers to" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Compose the picture" })).toBeVisible();
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

  test("clicking 'blue' at Compose the picture shows the 'Compose the picture' head pulling the scene", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "Compose the picture" }).click();
    await widget.getByRole("button", { name: "blue" }).click();

    // L4's single head is "Compose the picture".
    await expect(widget.getByText("the scene this thing belongs to", { exact: false }).first()).toBeVisible();

    // The Paying-attention-to table appears.
    await expect(widget.getByText("Paying attention to")).toBeVisible();

    // Value row contains the astronaut-on-Mars phrase.
    await expect(widget.getByText("the astronaut, who is on Mars", { exact: false }).first()).toBeVisible();

    // Output representation shows the full composition.
    await expect(
      widget.getByText("a blue thing belonging to the astronaut on Mars", { exact: false }).first()
    ).toBeVisible();
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
    // L1 button should now look pressed / highlighted. Assert by checking aria-pressed.
    await expect(widget.getByRole("button", { name: "Previous-token" })).toHaveAttribute("aria-pressed", "true");
  });
});
