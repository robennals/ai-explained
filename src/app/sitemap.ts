import type { MetadataRoute } from "next";
import { getMainChapters, getAppendixChapters } from "@/lib/curriculum";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const ready = [...getMainChapters(), ...getAppendixChapters()].filter(
    (c) => c.ready,
  );
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...ready.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
