interface TryItProps {
  children: React.ReactNode;
}

export function TryIt({ children }: TryItProps) {
  return (
    <div className="my-6 rounded-lg border border-success/20 bg-success/5 p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-success">
        Try it
      </p>
      <div className="text-sm leading-relaxed text-foreground/80 [&>p]:my-1">
        {children}
      </div>
    </div>
  );
}
