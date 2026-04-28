export function PolishingNotice() {
  return (
    <aside className="mb-8 rounded-lg border border-amber-200 bg-amber-50/60 px-5 py-3 text-sm">
      <p className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200">
          Polishing
        </span>
        <span className="font-semibold text-foreground">
          This chapter is still being polished
        </span>
      </p>
      <p className="mt-1.5 text-muted">
        It&apos;s good enough to read, but isn&apos;t yet at the point where my
        11-year-old fully understands it — I&apos;m planning to improve it.
      </p>
    </aside>
  );
}
