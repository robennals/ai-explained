/** Vector math and embedding utilities for the embeddings chapter widgets. */

export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export function vecNorm(v: number[]): number {
  return Math.sqrt(dotProduct(v, v));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const na = vecNorm(a);
  const nb = vecNorm(b);
  if (na === 0 || nb === 0) return 0;
  return dotProduct(a, b) / (na * nb);
}

export function vecAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

export function vecSub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

export function vecScale(v: number[], s: number): number[] {
  return v.map((x) => x * s);
}

export function vecNormalize(v: number[]): number[] {
  const n = vecNorm(v);
  if (n === 0) return v.map(() => 0);
  return v.map((x) => x / n);
}

/**
 * Find nearest neighbors to a query vector by cosine similarity.
 * Returns top-k indices with similarity scores.
 */
export function findNearest(
  queryVec: number[],
  allVectors: number[][],
  k: number,
  excludeIndices?: Set<number>
): { index: number; similarity: number }[] {
  const results: { index: number; similarity: number }[] = [];
  for (let i = 0; i < allVectors.length; i++) {
    if (excludeIndices?.has(i)) continue;
    results.push({ index: i, similarity: cosineSimilarity(queryVec, allVectors[i]) });
  }
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, k);
}
