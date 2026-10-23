import { test, expect, type Page } from "@playwright/test";

function widgetTitled(page: Page, title: string) {
  return page
    .locator(".widget-container")
    .filter({ has: page.locator("h3", { hasText: title }) });
}

test.describe("Attention chapter — playground progression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attention");
  });

  test("all six playgrounds render with their distinctive titles", async ({ page }) => {
    for (const title of [
      "Which Tokens Need Other Tokens?",
      "Query, Key, and Value",
      "Scoring the Match",
      "Softmax Explorer",
      "The Attention Sink",
      "Gathering the Value",
    ]) {
      await expect(widgetTitled(page, title)).toBeVisible({ timeout: 15_000 });
    }
  });

  test("Scoring the Match shows a match score under each token and marks the query", async ({ page }) => {
    const widget = widgetTitled(page, "Scoring the Match");
    await expect(widget).toBeVisible({ timeout: 15_000 });

    // The default sentence is "I dropped the glass and it broke." with "it"
    // as the token doing the asking, so "it" is labelled as the query and
    // every other token gets a numeric score.
    await expect(widget.getByRole("button", { name: /^it\s*query$/ })).toBeVisible();
    await expect(widget.getByRole("button", { name: /^glass\s*\d+\.\d$/ })).toBeVisible();
  });

  test("Attention Sink presets explain who wins the attention", async ({ page }) => {
    const widget = widgetTitled(page, "The Attention Sink");
    await expect(widget).toBeVisible({ timeout: 15_000 });

    // The widget starts on the "Nothing matches" scores, so the sink wins.
    await expect(widget.getByText(/exactly right when there was nothing to find/)).toBeVisible();

    await widget.getByRole("button", { name: "Something matches" }).click();
    await expect(widget.getByText(/A takes almost all the attention/)).toBeVisible();

    await widget.getByRole("button", { name: "Nothing matches" }).click();
    await expect(widget.getByText(/exactly right when there was nothing to find/)).toBeVisible();
  });

  test("Gathering the Value blends values when attention is split", async ({ page }) => {
    const widget = widgetTitled(page, "Gathering the Value");
    await expect(widget).toBeVisible({ timeout: 15_000 });

    await expect(widget.getByText("What “it” gathered")).toBeVisible();
    await expect(widget.getByText("the glass", { exact: true }).last()).toBeVisible();

    await widget.getByRole("tab", { name: "An even split" }).click();
    await expect(widget.getByText("either the cat or the dog", { exact: true })).toBeVisible();
  });
});
