import { ColabLink } from "./ColabLink";

interface TryItInPyTorchProps {
  notebook: string;
  children: React.ReactNode;
}

export function TryItInPyTorch({ notebook, children }: TryItInPyTorchProps) {
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH ?? "main";
  const colabUrl = `https://colab.research.google.com/github/robennals/ai-explained/blob/${branch}/notebooks/${notebook}.ipynb`;

  return (
    <div
      id="try-it-in-pytorch"
      data-nav-title="Try it in PyTorch"
      className="my-8 scroll-mt-20 rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent p-6"
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
        Try it in PyTorch — Optional
      </p>
      <div className="mb-4 text-sm leading-relaxed text-foreground/80 [&>p]:my-1">
        {children}
      </div>
      <ColabLink href={colabUrl} />
    </div>
  );
}
