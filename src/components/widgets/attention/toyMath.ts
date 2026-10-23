/**
 * Dot product of two equal-length vectors.
 */
export function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Numerically stable softmax. Subtracts the max before exponentiating.
 */
export function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * Linear combination of value vectors weighted by `weights`.
 * Assumes all value vectors share the same dimension and weights.length === values.length.
 */
export function weightedSum(weights: number[], values: number[][]): number[] {
  const dim = values[0].length;
  const result = new Array<number>(dim).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let d = 0; d < dim; d++) {
      result[d] += weights[i] * values[i][d];
    }
  }
  return result;
}
