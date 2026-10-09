import { test, expect } from "@playwright/test";

// Only chapters with a curated diagram in src/lib/og-diagrams.tsx get their
// own image; every other page falls back to /og/site.png.
const slugs = [
  "site",
  "computation",
  "optimization",
  "neurons",
  "vectors",
  "embeddings",
  "next-word-prediction",
  "attention",
  "positions",
  "transformers",
];

for (const slug of slugs) {
  test(`OG image /og/${slug}.png exists and is non-empty`, async ({
    request,
  }) => {
    const res = await request.get(`/og/${slug}.png`);
    expect(res.status()).toBe(200);
    const body = await res.body();
    expect(body.byteLength).toBeGreaterThan(1000);
  });
}
