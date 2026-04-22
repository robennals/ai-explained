import { test, expect } from "@playwright/test";

test.describe("Transformers chapter — A Transformer In Action widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transformers");
  });

  test("widget renders with the stack strip", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await expect(widget).toBeVisible();
    await expect(widget.getByRole("button", { name: "Embed" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L1" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L2" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "L3" })).toBeVisible();
    await expect(widget.getByRole("button", { name: "Predict" })).toBeVisible();
  });

  test("clicking Predict shows 'planet' as the top candidate", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "Predict" }).click();

    // The prediction card shows a list of rows, top being "planet".
    await expect(widget.getByText("Prediction · top candidates for the next token")).toBeVisible();
    await expect(widget.getByText("planet").first()).toBeVisible();

    // The first row percentage is 62%.
    await expect(widget.getByText("62%").first()).toBeVisible();
  });

  test("clicking 'blue' at L3 shows the adj-to-possessor head pulling her", async ({ page }) => {
    const widget = page.locator(".widget-container").filter({ hasText: "A Transformer In Action" });
    await widget.getByRole("button", { name: "L3" }).click();
    await widget.getByRole("button", { name: "blue" }).click();

    // Default head is "Adj → Possessor". Two cells contain "a possessor" (Q and K),
    // which is expected — just confirm at least one is visible.
    await expect(widget.getByText("a possessor", { exact: false }).first()).toBeVisible();
    // The V "the astronaut" appears in the pull row.
    await expect(widget.getByText("the astronaut", { exact: false }).first()).toBeVisible();
    // The output rep at the bottom shows the final composition.
    await expect(
      widget.getByText("a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet", { exact: false })
    ).toBeVisible();
  });
});
