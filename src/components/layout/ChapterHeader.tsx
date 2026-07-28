import { getChapter } from "@/lib/curriculum";

interface ChapterHeaderProps {
  slug: string;
}

/**
 * The title block at the top of a chapter. Both lines come from
 * `curriculum.ts` so the chapter page, the sidebar, and the homepage
 * can never drift apart.
 */
export function ChapterHeader({ slug }: ChapterHeaderProps) {
  const chapter = getChapter(slug);
  if (!chapter) return null;

  return (
    <header className="mb-10">
      <h1 className="mb-0">{chapter.title}</h1>
      <p className="mt-2 text-lg text-muted">{chapter.subtitle}</p>
    </header>
  );
}
