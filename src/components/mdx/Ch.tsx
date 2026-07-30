import Link from "next/link";
import { getChapter, getChapterRefLabel } from "@/lib/curriculum";

interface ChProps {
  /**
   * Stable chapter slug — the key that never changes even if chapters are
   * reordered or retitled (e.g. "vectors", "attention").
   */
  slug: string;
}

/**
 * Links to another chapter, labelled the way this tutorial refers to chapters:
 * `<Ch slug="vectors" />` → "Chapter 4".
 *
 * Use this only when explicitly referring the reader to another chapter. For
 * defining a term inline, rely on the glossary (which auto-links known terms)
 * rather than linking the word to its chapter.
 *
 * Referring through the slug means the number is derived from ordering (see
 * `getChapterRefLabel`), so it survives chapters being reordered, and gives us
 * one place to change the phrasing (or add tooltips) later.
 */
export function Ch({ slug }: ChProps) {
  const chapter = getChapter(slug);

  if (!chapter) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`<Ch>: no chapter for slug "${slug}"`);
    }
    return <>that chapter</>;
  }

  return <Link href={`/${chapter.slug}`}>{getChapterRefLabel(chapter)}</Link>;
}
