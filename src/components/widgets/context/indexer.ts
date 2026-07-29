import type { Token } from "./haystack";

export function scoreTokens(query: { relevant: number[] }, tokens: Token[]): { id: number; score: number }[] {
  const rel = new Set(query.relevant);
  return tokens.map((t) => ({
    id: t.id,
    // Toy stand-in for a lightning indexer: relevant tokens score high, with a
    // small deterministic wobble so ties break stably; others score low.
    score: (rel.has(t.id) ? 100 : 10) - (t.id % 7),
  }));
}

export function topK(scores: { id: number; score: number }[], k: number): number[] {
  return [...scores]
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, k)
    .map((s) => s.id);
}

export function indexShareLayers(nLayers: number, reuseEvery: number): boolean[] {
  return Array.from({ length: nLayers }, (_, i) => i % reuseEvery === 0);
}

export function flops(
  seqLen: number,
  k: number,
  nLayers: number,
  opts: { sparse: boolean; share: boolean; reuseEvery: number; indexerCost: number }
): number {
  if (!opts.sparse) return nLayers * seqLen * seqLen;
  const attn = nLayers * seqLen * Math.min(k, seqLen);
  const computedLayers = opts.share ? Math.ceil(nLayers / opts.reuseEvery) : nLayers;
  const indexer = computedLayers * opts.indexerCost * seqLen;
  return attn + indexer;
}
