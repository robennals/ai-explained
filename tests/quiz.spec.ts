import { expect, test } from "@playwright/test";

test.describe("chapter 1 quiz", () => {
  test("answer flow: click, lock, advance, summary, retake", async ({ page }) => {
    await page.goto("/computation");

    // Reset any prior progress so the test starts clean.
    await page.evaluate(() => window.localStorage.removeItem("quiz:computation:v1"));
    await page.reload();

    const quiz = page.locator('section[aria-label="Chapter quiz"]');
    await expect(quiz).toBeVisible();
    await expect(quiz.locator("h3")).toHaveText("Quiz: Check Your Understanding");
    await expect(quiz).toContainText("Question 1");
    await expect(quiz).toContainText(/every color you've ever seen/);

    // Wrong answer: pick "One number". Feedback should appear, all buttons disabled.
    await quiz.getByRole("button", { name: /One number/ }).click();
    await expect(quiz).toContainText("Not quite");
    await expect(quiz.getByRole("button", { name: /One number/ })).toBeDisabled();
    await expect(quiz.getByRole("button", { name: /Three numbers/ })).toBeDisabled();

    // Advance to Q2.
    await quiz.getByRole("button", { name: "Next question →" }).click();
    await expect(quiz).toContainText(/technical name for those knobs/);

    // Q2 right answer: "Parameters".
    await quiz.getByRole("button", { name: /Parameters/ }).click();
    await expect(quiz).toContainText("Correct");

    // Answer remaining four questions correctly to reach summary.
    await quiz.getByRole("button", { name: "Next question →" }).click();
    await quiz.getByRole("button", { name: /They all have the same shape/ }).click();
    await quiz.getByRole("button", { name: "Next question →" }).click();
    await quiz.getByRole("button", { name: /The parameters must be set/ }).click();
    await quiz.getByRole("button", { name: "Next question →" }).click();
    await quiz.getByRole("button", { name: /The table would need too many entries/ }).click();
    await quiz.getByRole("button", { name: "Next question →" }).click();
    await quiz.getByRole("button", { name: /Even if the function is computable/ }).click();
    await quiz.getByRole("button", { name: "Finish quiz" }).click();

    // Summary footer appears inside the same quiz section.
    await expect(quiz).toContainText("Quiz complete");
    await expect(quiz).toContainText("5");
    await expect(quiz).toContainText("6");

    // Retake.
    await quiz.getByRole("button", { name: "Retake quiz" }).click();
    await expect(quiz).toContainText(/every color you've ever seen/);
  });

  test("past questions remain reachable as collapsible rows", async ({ page }) => {
    await page.goto("/computation");
    await page.evaluate(() => window.localStorage.removeItem("quiz:computation:v1"));
    await page.reload();

    const quiz = page.locator('section[aria-label="Chapter quiz"]');

    // Answer Q1 wrong, advance.
    await quiz.getByRole("button", { name: /One number/ }).click();
    await quiz.getByRole("button", { name: "Next question →" }).click();

    // Q1 should now appear as a collapsed row above the active Q2.
    const q1Row = quiz.getByRole("button", { name: /Question 1.*Not quite/ });
    await expect(q1Row).toBeVisible();
    await expect(q1Row).toHaveAttribute("aria-expanded", "false");

    // Q1's stem should not be visible while collapsed.
    await expect(quiz.getByText(/every color you've ever seen/)).toBeHidden();

    // Expand Q1.
    await q1Row.click();
    await expect(q1Row).toHaveAttribute("aria-expanded", "true");
    await expect(quiz.getByText(/every color you've ever seen/)).toBeVisible();

    // Q1's choices are still locked.
    await expect(quiz.getByRole("button", { name: /Three numbers/ })).toBeDisabled();

    // Collapse Q1 again.
    await q1Row.click();
    await expect(q1Row).toHaveAttribute("aria-expanded", "false");
    await expect(quiz.getByText(/every color you've ever seen/)).toBeHidden();
  });

  test("progress persists across reloads", async ({ page }) => {
    await page.goto("/computation");
    await page.evaluate(() => window.localStorage.removeItem("quiz:computation:v1"));
    await page.reload();

    const quiz = page.locator('section[aria-label="Chapter quiz"]');
    await quiz.getByRole("button", { name: /Three numbers/ }).click();
    await quiz.getByRole("button", { name: "Next question →" }).click();
    await expect(quiz).toContainText(/technical name for those knobs/);

    await page.reload();
    await expect(quiz).toContainText(/technical name for those knobs/);

    // The previously-answered Q1 should appear as a collapsed row.
    await expect(
      quiz.getByRole("button", { name: /Question 1.*Correct/ })
    ).toBeVisible();
  });
});
