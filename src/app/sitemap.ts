import type { MetadataRoute } from "next";
import { getMainChapters, getAppendixChapters } from "@/lib/curriculum";
import { pageDates } from "@/lib/page-dates.generated";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  // The introduction is left out: it's too thin to be a good landing page
  // from search, and the homepage covers the same ground.
  const ready = [...getMainChapters(), ...getAppendixChapters()].filter(
    (c) => c.ready
  );
  return [
    {
      url: SITE_URL,
      lastModified: pageDates["/"],
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/educators`,
      lastModified: pageDates["/educators"],
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...ready.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      lastModified: pageDates[`/${c.slug}`],
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
