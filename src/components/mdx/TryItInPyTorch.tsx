interface TryItInPyTorchProps {
  notebook: string;
  children: React.ReactNode;
}

export function TryItInPyTorch({ notebook, children }: TryItInPyTorchProps) {
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH ?? "main";
  const colabUrl = `https://colab.research.google.com/github/robennals/ai-explained/blob/${branch}/notebooks/${notebook}.ipynb`;

  return (
    <div className="my-8 rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent p-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
        Try it in PyTorch — Optional
      </p>
      <div className="mb-4 text-sm leading-relaxed text-foreground/80 [&>p]:my-1">
        {children}
      </div>
      <a
        href={colabUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        Open in Google Colab →
      </a>
    </div>
  );
}
