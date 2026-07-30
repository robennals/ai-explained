import Link from "next/link";
import type { ReactNode } from "react";
import { getChapter, getChapterRefLabel } from "@/lib/curriculum";

interface ChProps {
  /**
   * Stable chapter slug — the key that never changes even if chapters are
   * reordered or retitled (e.g. "vectors", "attention").
   */
  slug: string;
  /**
   * Optional section anchor within the chapter, e.g. `hash="measuring-similarity"`
   * links to that heading rather than the top of the chapter.
   */
  hash?: string;
  /**
   * Optional link text. When omitted, the link reads "Chapter N" — the chapter's
   * number, derived from ordering (see `getChapterRefLabel`). Provide children
   * for an inline concept reference where the prose needs a specific word, e.g.
   * `<Ch slug="vectors">vectors</Ch>` renders "vectors" linked to the chapter.
   */
  children?: ReactNode;
}

/**
 * Links to another chapter. Every cross-chapter reference in the tutorial goes
 * through this component rather than a raw markdown link, so the slug is the one
 * stable key, the number stays correct when chapters are reordered, and there's
 * a single place to change how references read (or add tooltips) later.
 *
 * - `<Ch slug="vectors" />` → "Chapter 4" (a numbered reference)
 * - `<Ch slug="vectors">vectors</Ch>` → "vectors" (an inline concept link)
 */
export function Ch({ slug, hash, children }: ChProps) {
  const chapter = getChapter(slug);

  if (!chapter) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`<Ch>: no chapter for slug "${slug}"`);
    }
    return <>{children ?? "that chapter"}</>;
  }

  const href = hash ? `/${chapter.slug}#${hash}` : `/${chapter.slug}`;
  return <Link href={href}>{children ?? getChapterRefLabel(chapter)}</Link>;
}
