interface CalloutProps {
  type?: "info" | "warning" | "tip";
  title?: string;
  children: React.ReactNode;
}

const styles = {
  info: "border-accent/30 bg-accent/5",
  warning: "border-warning/30 bg-warning/5",
  tip: "border-success/30 bg-success/5",
};

const icons = {
  info: "i",
  warning: "!",
  tip: "\u2713",
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  return (
    <div
      className={`my-6 rounded-lg border-l-4 p-4 ${styles[type]}`}
      role="note"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold">
          {icons[type]}
        </span>
        <div className="min-w-0">
          {title && (
            <p className="mb-1 font-semibold text-foreground">{title}</p>
          )}
          <div className="text-sm leading-relaxed text-foreground/80 [&>p]:my-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
