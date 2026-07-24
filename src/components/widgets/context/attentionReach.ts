export type LayerKind = "local" | "global";

export function layerCost(kind: LayerKind, seqLen: number, window: number): number {
  return kind === "local" ? seqLen * window : seqLen * seqLen;
}

export function totalCost(layers: LayerKind[], seqLen: number, window: number): number {
  return layers.reduce((sum, k) => sum + layerCost(k, seqLen, window), 0);
}

export function reachableDistance(layers: LayerKind[], window: number, seqLen: number): number {
  let reach = 0;
  for (const k of layers) {
    reach = k === "global" ? seqLen : reach + window;
    if (reach >= seqLen) return seqLen;
  }
  return Math.min(reach, seqLen);
}

export function gemma3Layers(blocks: number): LayerKind[] {
  const out: LayerKind[] = [];
  for (let i = 0; i < blocks; i++) out.push("local", "local", "local", "local", "local", "global");
  return out;
}
