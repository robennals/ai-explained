interface KeyInsightProps {
  children: React.ReactNode;
}

export function KeyInsight({ children }: KeyInsightProps) {
  return (
    <div className="my-8 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-transparent p-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
        Key Insight
      </p>
      <div className="text-lg leading-relaxed text-foreground [&>p]:my-1">
        {children}
      </div>
    </div>
  );
}
