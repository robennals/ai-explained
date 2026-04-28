import type { Metadata } from "next";
import { getChapter } from "./curriculum";

export function chapterMetadata(slug: string): Metadata {
  const ch = getChapter(slug);
  if (!ch) {
    return { title: "Chapter not found" };
  }
  return {
    title: ch.title,
    description: ch.description,
    openGraph: {
      title: ch.title,
      description: ch.description,
      images: [`/og/${slug}.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: ch.title,
      description: ch.description,
      images: [`/og/${slug}.png`],
    },
  };
}
