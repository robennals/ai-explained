import Link from "next/link";
import { ChapterNav } from "@/components/layout/ChapterNav";
import { chapterMetadata } from "@/lib/chapter-metadata";
import { chapters, getAdjacentChapters } from "@/lib/curriculum";
import { glossaryEntries } from "@/lib/glossary/index.generated";
import { GlossaryHashOpener } from "./GlossaryHashOpener";

export const metadata = chapterMetadata("glossary");

function chapterTitle(slug: string): string {
  return chapters.find((c) => c.slug === slug)?.title ?? slug;
}

function isReady(slug: string): boolean {
  return chapters.find((c) => c.slug === slug)?.ready === true;
}

export default function GlossaryPage() {
  const { prev, next } = getAdjacentChapters("glossary");

  return (
    <article>
      <GlossaryHashOpener />
      <div className="prose prose-lg max-w-none">
        <h1>Glossary</h1>
        <p>
          Every technical word this tutorial uses, with a short definition and
          links to the chapters where it appears. Click any word with a dotted
          underline in a chapter to see its entry without leaving the page.
        </p>
      </div>

      <div className="mt-8 space-y-2">
        {glossaryEntries.map((entry) => {
          const Body = entry.Body;
          // Only link to chapters that are actually published.
          const readyChapters = entry.chaptersAppearedIn.filter(isReady);
          const introduced = isReady(entry.firstAppearance)
            ? entry.firstAppearance
            : readyChapters[0];
          const others = readyChapters.filter((s) => s !== introduced);
          return (
            <details
              key={entry.slug}
              id={entry.slug}
              className="glossary-card scroll-mt-20"
            >
              <summary className="glossary-card-summary">
                <span className="glossary-card-term">{entry.term}</span>
                <span className="glossary-card-short">{entry.short}</span>
                <span className="glossary-card-chevron" aria-hidden="true" />
              </summary>
              <div className="glossary-card-body prose max-w-none">
                <Body />
                {introduced && (
                  <p className="glossary-card-refs">
                    <span className="font-medium">Introduced in: </span>
                    <Link href={`/${introduced}`}>
                      {chapterTitle(introduced)}
                    </Link>
                    {others.length > 0 && (
                      <>
                        <span className="mx-2">·</span>
                        <span className="font-medium">Also appears in: </span>
                        {others.map((slug, i) => (
                          <span key={slug}>
                            <Link href={`/${slug}`}>{chapterTitle(slug)}</Link>
                            {i < others.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </>
                    )}
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <ChapterNav prev={prev} next={next} />
    </article>
  );
}
