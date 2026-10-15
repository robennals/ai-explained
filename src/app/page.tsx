import type { Metadata } from "next";
import Link from "next/link";
import {
  getAppendixChapters,
  getAppendixLabel,
  getChapter,
  getMainChapters,
} from "@/lib/curriculum";
import { learningPath } from "@/lib/learning-path";
import { getWidgetCount } from "@/lib/widget-counts";
import { ChapterCard } from "@/components/home/ChapterCard";
import { NewChaptersSignup } from "@/components/home/NewChaptersSignup";
import { PyTorchPromo } from "@/components/home/PyTorchPromo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const mainChapters = getMainChapters();
  const readyChapters = mainChapters.filter((c) => c.ready);
  const upcomingChapters = mainChapters.filter((c) => !c.ready);
  const totalWidgets = readyChapters.reduce(
    (sum, c) => sum + getWidgetCount(c.slug),
    0
  );
  const readyAppendixes = getAppendixChapters().filter((c) => c.ready);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      <div className="mx-auto max-w-3xl py-14 text-center sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Learn AI Layer by Layer
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          A hands-on guide to how modern AI actually works, built up from
          scratch one idea at a time. No math or coding background needed.
          Every chapter is full of widgets you can poke, drag, and break.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <span>
            <span className="font-semibold text-foreground">{readyChapters.length}</span> chapters
          </span>
          <span>
            <span className="font-semibold text-foreground">{totalWidgets}</span> interactive widgets
          </span>
          <span>Free, no sign-up</span>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/computation"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
          >
            Start with Chapter 1
          </Link>
          <Link href="/introduction" className="text-sm font-medium text-accent hover:text-accent-dark">
            or read the introduction →
          </Link>
        </div>
      </div>

      <nav aria-label="Parts of the course" className="mx-auto max-w-4xl">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {learningPath.map((part, i) => (
            <li key={part.title}>
              <a
                href={`#part-${i + 1}`}
                className="block h-full rounded-xl border border-border bg-white p-3 transition-shadow hover:shadow-md"
              >
                <div className="h-1.5 rounded-full" style={{ backgroundColor: part.accent }} />
                <div className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ color: part.ink }}>
                  Part {i + 1} · {part.slugs.length} chapters
                </div>
                <div className="text-sm font-semibold text-foreground">{part.title}</div>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <ol className="mt-12">
        {learningPath.map((part, i) => {
          const next = learningPath[i + 1];
          return (
            <li key={part.title} id={`part-${i + 1}`} className="relative scroll-mt-20 pb-14 pl-14 sm:pl-20">
              {next && (
                <div
                  aria-hidden
                  className="absolute top-12 bottom-0 left-[18px] w-1 rounded-full opacity-35 sm:left-[26px]"
                  style={{ background: `linear-gradient(${part.accent}, ${next.accent})` }}
                />
              )}
              <div
                aria-hidden
                className="absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-full font-mono text-lg font-bold text-white shadow-md sm:h-14 sm:w-14 sm:text-2xl"
                style={{ backgroundColor: part.accent }}
              >
                {i + 1}
              </div>
              <div className="mb-5 max-w-2xl pt-1 sm:pt-2">
                <div className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color: part.ink }}>
                  Part {i + 1}
                </div>
                <h2 className="text-2xl font-bold text-foreground">{part.title}</h2>
                <p className="mt-1 text-muted">{part.promise}</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                {part.slugs.map((slug) => {
                  const chapter = getChapter(slug);
                  if (!chapter?.ready) return null;
                  return (
                    <ChapterCard
                      key={slug}
                      chapter={chapter}
                      accent={part.accent}
                      ink={part.ink}
                      widgetCount={getWidgetCount(slug)}
                    />
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      <PyTorchPromo />

      {upcomingChapters.length > 0 && (
        <section aria-labelledby="coming-soon" className="mt-16">
          <h2 id="coming-soon" className="text-2xl font-bold text-foreground">
            Coming soon
          </h2>
          <p className="mt-1 text-muted">
            {upcomingChapters.length} more chapters are planned, covering the
            ideas behind today&apos;s cutting-edge models.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingChapters.map((c) => (
              <li key={c.id} className="rounded-xl border border-dashed border-border bg-surface/60 px-4 py-3">
                <div className="text-sm font-semibold text-foreground">{c.title}</div>
                <div className="text-xs text-muted">{c.subtitle}</div>
              </li>
            ))}
          </ul>
          <NewChaptersSignup />
        </section>
      )}

      {readyAppendixes.length > 0 && (
        <section aria-labelledby="appendixes" className="mt-16">
          <h2 id="appendixes" className="text-xl font-bold text-foreground">
            Appendixes
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {readyAppendixes.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${c.slug}`}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:border-accent/30 hover:shadow-md"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs font-bold text-accent">
                    {getAppendixLabel(c)}
                  </span>
                  <span>
                    <span className="block font-semibold text-foreground group-hover:text-accent-dark">{c.title}</span>
                    <span className="block text-xs text-muted">{c.subtitle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
