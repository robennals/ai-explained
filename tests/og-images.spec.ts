import { test, expect } from "@playwright/test";

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
  "appendix-pytorch",
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
