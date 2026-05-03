// Smoke tests for chapters 2-9 (and the appendix).
// One representative widget per chapter: page loads, headline widget mounts.
// Chapter 1 has its own dedicated suite in chapter01.spec.ts.
// The transformers chapter has a dedicated suite in transformers.spec.ts.

import { test, expect } from "@playwright/test";

interface ChapterCase {
  slug: string;
  h1Contains: string;
  /** WidgetContainer titles to verify on the page (smoke check). */
  widgetTitles: string[];
}

const CHAPTERS: ChapterCase[] = [
  {
    slug: "optimization",
    h1Contains: "Power of Incremental Improvement",
    widgetTitles: ["Search: Blind vs. Guided"],
  },
  {
    slug: "neurons",
    h1Contains: "Building a Brain",
    widgetTitles: ["A Neural Network"],
  },
  {
    slug: "vectors",
    h1Contains: "Describing the World with Numbers",
    widgetTitles: ["Describing Things with Vectors"],
  },
  {
    slug: "embeddings",
    h1Contains: "From Words to Meanings",
    widgetTitles: ["One Dimension, Multiple Meanings"],
  },
  {
    slug: "next-word-prediction",
    h1Contains: "Understanding by Predicting",
    widgetTitles: ["Guess the Next Word"],
  },
  {
    slug: "attention",
    h1Contains: "Paying Attention",
    widgetTitles: ["Which Words Matter?"],
  },
  {
    slug: "positions",
    h1Contains: "Where Am I",
    widgetTitles: ["Word Order Changes Meaning"],
  },
  {
    slug: "appendix-pytorch",
    h1Contains: "PyTorch",
    widgetTitles: [],
  },
];

for (const ch of CHAPTERS) {
  test.describe(`/${ch.slug}`, () => {
    test("page loads with chapter title", async ({ page }) => {
      await page.goto(`/${ch.slug}`);
      await expect(page.locator("h1")).toContainText(ch.h1Contains);
    });

    for (const title of ch.widgetTitles) {
      test(`widget renders: ${title}`, async ({ page }) => {
        await page.goto(`/${ch.slug}`);
        const widget = page
          .locator(".widget-container")
          .filter({ hasText: title })
          .first();
        await expect(widget).toBeVisible({ timeout: 15000 });
      });
    }
  });
}
