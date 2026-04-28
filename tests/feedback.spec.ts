import { test, expect } from "@playwright/test";

test.describe("Chapter Feedback Form", () => {
  test("renders intro callout and form fields at bottom of chapter 1", async ({
    page,
  }) => {
    await page.goto("/computation");

    const intro = page.getByText("I'd love to hear from you.");
    await intro.scrollIntoViewIfNeeded();
    await expect(intro).toBeVisible();

    await expect(page.getByLabel(/your email/i)).toBeVisible();
    await expect(page.getByLabel("Message")).toBeVisible();
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });

  test("renders form on a different chapter (transformers)", async ({
    page,
  }) => {
    await page.goto("/transformers");
    await expect(
      page.getByRole("button", { name: /send/i })
    ).toBeVisible();
  });

  test("submitting a valid form shows the thank-you message", async ({
    page,
  }) => {
    // Mock /api/feedback so this test does not call Postmark.
    await page.route("**/api/feedback", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      })
    );

    await page.goto("/computation");
    await page
      .getByRole("button", { name: /send/i })
      .scrollIntoViewIfNeeded();
    await page.getByLabel(/your name/i).fill("Playwright");
    await page.getByLabel(/your email/i).fill("test@example.com");
    await page.getByLabel("Message").fill("automated test, please ignore");
    await page.getByRole("button", { name: /send/i }).click();

    await expect(
      page.getByText(/your message is on its way/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("server error keeps the form visible and shows the error", async ({
    page,
  }) => {
    await page.route("**/api/feedback", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Postmark exploded" }),
      })
    );

    await page.goto("/computation");
    await page
      .getByRole("button", { name: /send/i })
      .scrollIntoViewIfNeeded();
    await page.getByLabel(/your email/i).fill("test@example.com");
    await page.getByLabel("Message").fill("trigger error");
    await page.getByRole("button", { name: /send/i }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Postmark exploded" })).toContainText("Postmark exploded");
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });
});
