interface LeadProps {
  children: React.ReactNode;
}

export function Lead({ children }: LeadProps) {
  return (
    <div className="lead text-xl text-muted mt-2 mb-8">
      {children}
    </div>
  );
}
