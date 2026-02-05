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
        <Link
          href="/01-computation"
          className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
        >
          Start Learning
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {chapters.map((ch) => (
          <Link
            key={ch.id}
            href={`/${ch.slug}`}
            className="group rounded-xl border border-border p-5 transition-all hover:border-accent/30 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface font-mono text-xs font-bold text-muted group-hover:bg-accent/10 group-hover:text-accent">
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
        ))}
      </div>
    </main>
  );
}
