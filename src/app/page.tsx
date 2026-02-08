import Link from "next/link";
import { chapters } from "@/lib/curriculum";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          AI Explained
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          An interactive guide to understanding AI from first principles.
          Tinker with real models, break things on purpose, and discover why
          neural networks work the way they do.
        </p>
        <div className="mx-auto mt-6 max-w-md rounded-lg border border-accent/20 bg-accent/5 px-5 py-3 text-sm">
          <p className="font-semibold text-foreground">Work in progress</p>
          <p className="mt-1 text-muted">
            Subscribe to{" "}
            <a
              href="https://messyprogress.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent underline underline-offset-2 hover:text-accent-dark"
            >
              messyprogress.substack.com
            </a>{" "}
            to find out when new chapters get released.
          </p>
        </div>
        <Link
          href="/01-computation"
          className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
        >
          Start Learning
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {chapters.map((ch) =>
          ch.ready ? (
            <Link
              key={ch.id}
              href={`/${ch.slug}`}
              className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-xs font-bold text-accent group-hover:bg-accent/15">
                  {ch.id}
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground group-hover:text-accent-dark">
                    {ch.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">{ch.subtitle}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div
              key={ch.id}
              className="rounded-xl border border-dashed border-border/70 bg-surface/50 p-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface font-mono text-xs font-bold text-muted/50">
                  {ch.id}
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-muted">
                    {ch.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted/70">{ch.subtitle}</p>
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted/50">
                    Coming soon
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </main>
  );
}
