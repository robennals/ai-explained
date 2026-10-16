import { test, expect, type Page } from "@playwright/test";

async function fillRequired(page: Page) {
  await page.getByLabel("Your email").fill("teacher@example.com");
  await page.getByLabel("School or organization").fill("Playwright High");
  await page.getByLabel("Course").fill("AI and Society");
}

test.describe("Educators page", () => {
  test("renders every part of the course with linked chapters", async ({ page }) => {
    await page.goto("/educators");
    await expect(page.getByRole("heading", { level: 1, name: "For educators" })).toBeVisible();
    for (const part of ["The building blocks", "Meaning as numbers", "The transformer", "From model to assistant"]) {
      await expect(page.getByRole("heading", { name: new RegExp(part) })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Attention", exact: true })).toHaveAttribute("href", "/attention");
  });

  test("is linked from the site header", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "For educators" }).click();
    await expect(page).toHaveURL(/\/educators$/);
  });

  test("won't submit without the required fields", async ({ page }) => {
    let posted = false;
    await page.route("**/api/feedback", (route) => {
      posted = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto("/educators");
    await page.getByLabel("Your email").fill("teacher@example.com");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByLabel("School or organization")).toHaveJSProperty("validity.valueMissing", true);
    expect(posted).toBe(false);
  });

  test("posts an educator message and thanks the teacher", async ({ page }) => {
    let body: Record<string, string> | undefined;
    await page.route("**/api/feedback", (route) => {
      body = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto("/educators");
    await fillRequired(page);
    await page.getByLabel(/how many students/i).fill("30");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText(/it means a lot/i)).toBeVisible();
    expect(body).toMatchObject({
      type: "educator",
      email: "teacher@example.com",
      organization: "Playwright High",
      course: "AI and Society",
      students: "30",
    });
  });

  test("fits a 360px-wide phone without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/educators");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    await expect(page.getByRole("banner").getByRole("link", { name: "For educators" })).toBeVisible();
  });
});
