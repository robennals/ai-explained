import type { Metadata } from "next";
import { getChapter } from "./curriculum";
import { getOgDiagram } from "./og-diagrams";

export function chapterMetadata(slug: string): Metadata {
  const ch = getChapter(slug);
  if (!ch) {
    return { title: "Chapter not found" };
  }
  // Chapters with a curated diagram get their own OG image; others fall back
  // to the site-wide branded card.
  const ogImage = getOgDiagram(slug) ? `/og/${slug}.png` : `/og/site.png`;
  return {
    title: ch.title,
    description: ch.description,
    openGraph: {
      title: ch.title,
      description: ch.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ch.title,
      description: ch.description,
      images: [ogImage],
    },
  };
}
