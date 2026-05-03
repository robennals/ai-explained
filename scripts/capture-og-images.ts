// Captures 1200x630 OG images for every ready chapter and the site homepage.
// Saves to public/og/{slug}.png and public/og/site.png.
//
// Usage:
//   1. Start the dev server in another terminal: `pnpm dev`
//   2. Run: `pnpm og:capture`
//
// Re-run any time chapter titles or OG diagrams change.

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { getMainChapters, getAppendixChapters } from "../src/lib/curriculum";
import { getOgDiagram } from "../src/lib/og-diagrams";

const BASE_URL = process.env.OG_BASE_URL ?? "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "public/og");

async function captureOne(
  page: import("@playwright/test").Page,
  url: string,
  outPath: string,
) {
  await page.goto(url, { waitUntil: "networkidle" });
  // Give widgets a beat to settle (canvas/D3 may render asynchronously).
  await page.waitForTimeout(800);
  await page.screenshot({
    path: outPath,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  console.log(`  wrote ${path.relative(process.cwd(), outPath)}`);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log(`Capturing OG images from ${BASE_URL}…`);

  // Site homepage variant.
  await captureOne(page, `${BASE_URL}/og/site`, path.join(OUTPUT_DIR, "site.png"));

  // Each ready chapter that has a curated OG diagram. Chapters without one
  // fall back to /og/site.png in their metadata, so we skip them here.
  const chaptersWithDiagrams = [
    ...getMainChapters(),
    ...getAppendixChapters(),
  ].filter((c) => c.ready && getOgDiagram(c.slug) !== null);

  for (const ch of chaptersWithDiagrams) {
    await captureOne(
      page,
      `${BASE_URL}/og/${ch.slug}`,
      path.join(OUTPUT_DIR, `${ch.slug}.png`),
    );
  }

  await browser.close();
  console.log(
    `\nDone. ${chaptersWithDiagrams.length + 1} images written to public/og/.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
