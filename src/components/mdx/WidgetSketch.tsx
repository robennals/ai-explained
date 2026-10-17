interface WidgetSketchProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Stands in for a playground that has been designed but not built yet, so a
 * draft chapter can be read with the narrative and the planned widgets in
 * place. The children describe what the widget will do.
 */
export function WidgetSketch({ title, children }: WidgetSketchProps) {
  return (
    <div className="my-8 rounded-lg border-2 border-dashed border-foreground/25 p-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Planned playground
      </div>
      <div className="mb-2 font-semibold text-foreground">{title}</div>
      <div className="text-sm leading-relaxed text-foreground/80 [&>p]:my-2 [&>ul]:my-2">
        {children}
      </div>
    </div>
  );
}
