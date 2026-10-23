import Link from "next/link";
import { ChapterArt } from "@/components/home/art/ChapterArt";
import { ChapterCard } from "@/components/home/ChapterCard";
import { NewChaptersSignup } from "@/components/home/NewChaptersSignup";
import {
  type Chapter,
  getAdjacentChapters,
  getChapter,
  getChapterRefLabel,
} from "@/lib/curriculum";
import { getPartOf, type LearningPart } from "@/lib/learning-path";
import { getWidgetCount } from "@/lib/widget-counts";

/**
 * The end of every chapter: a pitch for whatever the reader should read next,
 * then a small link back. What's pitched depends on where the reader is:
 *
 * - the next chapter starts a new part → that part, with a card per chapter
 * - the next chapter is in the same part (or an appendix) → that chapter
 * - there's no next main chapter → the signup for new chapters
 */
export function ChapterNav({ slug }: { slug: string }) {
  const { prev, next } = getAdjacentChapters(slug);
  const nextPart = next && getPartOf(next.slug);
  const startsNewPart = nextPart && nextPart.number !== getPartOf(slug)?.number;
  const isLastMainChapter = !next && getChapter(slug)?.section === undefined;

  return (
    <nav
      // Marks the end of the chapter, for analytics in chapters with no quiz.
      data-chapter-end
      className="mt-16 flex flex-col gap-6 border-t border-border pt-8"
    >
      {next && startsNewPart && <UpNextPart part={nextPart.part} number={nextPart.number} />}
      {next && !startsNewPart && <UpNextChapter chapter={next} part={nextPart?.part} />}
      {isLastMainChapter && <EndOfTutorialSoFar />}
      {prev && (
        <Link
          href={`/${prev.slug}`}
          className="self-start text-sm text-muted transition-colors hover:text-accent-dark"
        >
          ← Previous: <span className="font-medium">{prev.title}</span>
        </Link>
      )}
    </nav>
  );
}

function UpNextPart({ part, number }: { part: LearningPart; number: number }) {
  const chapters = part.slugs.flatMap((s) => {
    const chapter = getChapter(s);
    return chapter?.ready ? [chapter] : [];
  });
  const first = chapters[0];
  if (!first) return null;

  return (
    <section
      aria-label={`Up next: Part ${number}`}
      className="rounded-2xl border p-6 sm:p-8"
      style={{ backgroundColor: `${part.accent}0d`, borderColor: `${part.accent}40` }}
    >
      <div className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color: part.ink }}>
        Up next · Part {number}
      </div>
      <h2 className="mt-1 text-2xl font-bold text-foreground">{part.title}</h2>
      <p className="mt-1 max-w-2xl text-muted">{part.promise}</p>
      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {chapters.map((chapter) => (
          <ChapterCard
            key={chapter.slug}
            chapter={chapter}
            accent={part.accent}
            ink={part.ink}
            widgetCount={getWidgetCount(chapter.slug)}
          />
        ))}
      </div>
      <Link
        href={`/${first.slug}`}
        className="mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: part.ink }}
      >
        Start Part {number}: {first.title} →
      </Link>
    </section>
  );
}

/** A single next chapter. Chapters in a part get their illustration and colour. */
function UpNextChapter({ chapter, part }: { chapter: Chapter; part?: LearningPart }) {
  const label = getChapterRefLabel(chapter);
  return (
    <Link
      href={`/${chapter.slug}`}
      aria-label={`Up next: ${label}, ${chapter.title}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:flex-row"
    >
      {part && (
        <div
          className="aspect-[16/9] border-b border-border/60 sm:w-2/5 sm:shrink-0 sm:border-r sm:border-b-0"
          style={{ backgroundColor: `${part.accent}0d` }}
        >
          <ChapterArt slug={chapter.slug} number={chapter.id} accent={part.accent} />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center p-5">
        <span
          className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-dark"
          style={part && { color: part.ink }}
        >
          Up next · {label}
        </span>
        <span className="mt-1 text-xl font-bold text-foreground group-hover:text-accent-dark">
          {chapter.title}
        </span>
        <span className="text-sm text-muted">{chapter.subtitle}</span>
        <span className="mt-2 text-sm leading-relaxed text-foreground/80">{chapter.description}</span>
        <span
          className="mt-4 self-start rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm"
          style={part && { backgroundColor: part.ink }}
        >
          Continue →
        </span>
      </div>
    </Link>
  );
}

function EndOfTutorialSoFar() {
  return (
    <section aria-label="End of the tutorial so far">
      <h2 className="text-2xl font-bold text-foreground">
        You&apos;ve reached the end of the tutorial, for now
      </h2>
      <p className="mt-1 text-muted">
        There are more chapters on the way, covering the ideas behind
        today&apos;s cutting-edge models.
      </p>
      <NewChaptersSignup />
    </section>
  );
}
