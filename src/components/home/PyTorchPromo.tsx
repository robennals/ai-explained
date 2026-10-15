import Link from "next/link";

/** Home-page banner for the PyTorch notebooks and the PyTorch appendix. */
export function PyTorchPromo() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-orange-500/0 p-6 sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="text-xs font-bold uppercase tracking-widest text-orange-700">
          Want to write the code yourself?
        </div>
        <h2 className="mt-1 text-xl font-bold text-foreground">
          Every chapter comes with real PyTorch code
        </h2>
        <p className="mt-1 text-sm text-muted">
          Each chapter ends with an optional notebook you can run in Google
          Colab, with nothing to install. New to PyTorch? The{" "}
          <span className="font-medium text-foreground">PyTorch from Scratch</span>{" "}
          appendix teaches you enough to follow along.
        </p>
      </div>
      <Link
        href="/appendix-pytorch"
        className="shrink-0 self-start rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 sm:self-center"
      >
        PyTorch from Scratch →
      </Link>
    </div>
  );
}
