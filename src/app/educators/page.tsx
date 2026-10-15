import type { Metadata } from "next";
import Link from "next/link";
import { getChapter, type Chapter } from "@/lib/curriculum";
import { learningPath } from "@/lib/learning-path";
import { getReadingMinutes } from "@/lib/reading-time";
import { PRODUCTION_URL } from "@/lib/site-url";
import { EducatorSignup } from "@/components/feedback/EducatorSignup";

const TITLE = "For educators";
const DESCRIPTION =
  "How to use Learn AI Layer by Layer in a class: who it suits, how to fit the chapters into a course, and how to assign them. Free, with no accounts.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/educators" },
  openGraph: { title: TITLE, description: DESCRIPTION, images: ["/og/site.png"] },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/site.png"],
  },
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 30) / 2;
  return `about ${hours} hours`;
}

export default function EducatorsPage() {
  const parts = learningPath.map((part) => {
    const chapters = part.slugs
      .map((slug) => getChapter(slug))
      .filter((c): c is Chapter => !!c?.ready);
    const minutes = chapters.reduce((sum, c) => sum + getReadingMinutes(c.slug), 0);
    return { part, chapters, minutes };
  });
  const chapterCount = parts.reduce((sum, p) => sum + p.chapters.length, 0);
  const totalMinutes = parts.reduce((sum, p) => sum + p.minutes, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24">
      <div className="py-12 sm:py-14">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">For educators</h1>
        <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted">
          <p>
            Learn AI Layer by Layer explains how modern AI works, built up from
            first principles. It&apos;s written for curious learners from about
            age 12 to adults, and the only background it assumes is arithmetic.
            It fits AI-literacy units in middle and high school, introductory
            college courses such as AI for everyone or AI and society, and
            adult education.
          </p>
          <p>
            It&apos;s free, with no ads and no accounts. Students never need to
            sign up or give any personal information. The site uses standard
            analytics (Google Analytics) to count visits and see which chapters
            work.
          </p>
        </div>
        <a
          href="#tell-me"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
        >
          Using it with a class? Tell me
        </a>
      </div>

      <section aria-labelledby="course" className="scroll-mt-20">
        <h2 id="course" className="text-2xl font-bold text-foreground">
          Fitting it into a course
        </h2>
        <p className="mt-2 leading-relaxed text-muted">
          Each chapter builds on the ones before it, so students should work
          through them in order. The {chapterCount} chapters fall into four
          parts, which make natural units. At one chapter per class session or
          homework assignment, that&apos;s {chapterCount} sessions — about 6–8
          weeks at two a week — and {formatMinutes(totalMinutes)} of student
          time in total. Times below
          are estimates for one student reading and trying the widgets.
        </p>
        <ol className="mt-6 space-y-6">
          {parts.map(({ part, chapters, minutes }, i) => (
            <li key={part.title} className="rounded-xl border border-border bg-white p-5">
              <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: part.accent }} />
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="text-lg font-semibold text-foreground">
                  <span style={{ color: part.ink }}>Part {i + 1}:</span> {part.title}
                </h3>
                <span className="text-sm text-muted">{formatMinutes(minutes)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{part.promise}</p>
              <ul className="mt-4 divide-y divide-border">
                {chapters.map((c) => (
                  <li key={c.slug} className="flex items-baseline justify-between gap-4 py-2">
                    <span className="min-w-0">
                      <span className="mr-2 font-mono text-xs text-muted">{c.id}</span>
                      <Link href={`/${c.slug}`} className="font-medium text-foreground hover:text-accent-dark">
                        {c.title}
                      </Link>
                      <span className="block text-sm text-muted sm:inline sm:before:content-['_—_']">
                        {c.subtitle}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-muted">
                      {getReadingMinutes(c.slug)} min
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
          The <Link href="/introduction" className="text-accent hover:text-accent-dark">introduction</Link>{" "}
          is a two-minute read about why I wrote this; it&apos;s optional.
        </p>
      </section>

      <section aria-labelledby="tips" className="mt-14">
        <h2 id="tips" className="text-2xl font-bold text-foreground">Teaching tips</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted">
          <li>
            <strong className="text-foreground">Try each chapter yourself first.</strong>{" "}
            You&apos;ll see where students are likely to get stuck, and how long
            the widgets take — students who like to tinker take longer than the
            estimates.
          </li>
          <li>
            <strong className="text-foreground">Pair students on one device.</strong>{" "}
            The widgets are playgrounds, not demos, and talking about what
            happens when you change something is where much of the learning is.
          </li>
          <li>
            <strong className="text-foreground">Use the end-of-chapter quiz as a check.</strong>{" "}
            Every chapter finishes with a short quiz on its key ideas, which
            works as an exit ticket or a homework check.
          </li>
          <li>
            <strong className="text-foreground">Stretch students who code.</strong>{" "}
            Each chapter links to a Python notebook in Google Colab that runs
            the same ideas with real PyTorch code.
          </li>
        </ul>
      </section>

      <section aria-labelledby="assign" className="mt-14">
        <h2 id="assign" className="text-2xl font-bold text-foreground">Assigning it</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted">
          <li>
            Every chapter has a permanent link, such as{" "}
            <a href={`${PRODUCTION_URL}/attention`} className="break-all text-accent hover:text-accent-dark">
              {PRODUCTION_URL.replace(/^https:\/\//, "")}/attention
            </a>
            ,
            that you can paste into Google Classroom, Canvas, or any other
            learning platform.
          </li>
          <li>
            Nothing requires an account, so students can start straight from
            the link.
          </li>
          <li>
            Quiz answers are saved in the student&apos;s own browser. They&apos;re
            kept if the student comes back on the same device, but they
            don&apos;t follow the student to another device, and I can&apos;t
            see them.
          </li>
        </ul>
      </section>

      <section id="tell-me" aria-labelledby="tell-me-heading" className="mt-14 scroll-mt-20 rounded-xl border border-accent/30 bg-accent/5 p-5 sm:p-6">
        <h2 id="tell-me-heading" className="text-2xl font-bold text-foreground">
          Using it with a class? Tell me
        </h2>
        <p className="mt-2 mb-5 leading-relaxed text-muted">
          It helps me a lot to know who is teaching with this, and it shapes
          what I write next. It only takes a minute.
        </p>
        <EducatorSignup />
      </section>

      <section aria-labelledby="contact" className="mt-14">
        <h2 id="contact" className="text-2xl font-bold text-foreground">Questions?</h2>
        <p className="mt-2 leading-relaxed text-muted">
          If you&apos;d like help fitting this into your course, or have any
          other questions, email me at{" "}
          <a href="mailto:rob.ennals@gmail.com" className="text-accent hover:text-accent-dark">
            rob.ennals@gmail.com
          </a>
          . I usually reply.
        </p>
      </section>
    </main>
  );
}
