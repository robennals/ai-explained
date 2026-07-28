import { test, expect } from "@playwright/test";

const cases = [
  { slug: "computation", expectedTitleStart: "Computation" },
  { slug: "attention", expectedTitleStart: "Attention" },
  { slug: "transformers", expectedTitleStart: "Transformers" },
];

for (const c of cases) {
  test(`/${c.slug} has correct metadata`, async ({ page }) => {
    await page.goto(`/${c.slug}`, { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(
      new RegExp(`^${c.expectedTitleStart} — Learn AI Layer by Layer$`),
    );
    const ogImage = await page.evaluate(() => {
      const metaTag = document.querySelector(`meta[property="og:image"]`);
      return metaTag?.getAttribute("content") || null;
    });
    expect(ogImage).toContain(`/og/${c.slug}.png`);
  });
}
