import type { Source } from "./caseTypes";

/** A list of source links; `compact` drops the divider for use inside a card. */
export function SourceLine({ sources, compact = false }: { sources: Source[]; compact?: boolean }) {
  return (
    <p className={`text-xs leading-relaxed text-muted ${compact ? "mt-2" : "mt-4 border-t border-widget-border pt-3"}`}>
      Sources:{" "}
      {sources.map((source, i) => (
        <span key={source.url}>
          {i > 0 && " · "}
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            {source.label}
          </a>
        </span>
      ))}
    </p>
  );
}
