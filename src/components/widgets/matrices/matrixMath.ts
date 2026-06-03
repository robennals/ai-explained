// Pure matrix helpers shared by the matrices-chapter widgets.
// A matrix is a number[][] in row-major order: matrix[r][c].

/** Multiply a matrix by a vector: each row's dot product with `vec`. */
export function matVecMul(matrix: number[][], vec: number[]): number[] {
  return matrix.map((row) => row.reduce((sum, v, i) => sum + v * vec[i], 0));
}

/** Standard matrix product. `a` is m×n, `b` is n×p, result is m×p. */
export function matMul(a: number[][], b: number[][]): number[][] {
  const m = a.length;
  const n = b.length;
  const p = b[0].length;
  const out: number[][] = Array.from({ length: m }, () => Array(p).fill(0));
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < n; k++) {
      const aik = a[i][k];
      for (let j = 0; j < p; j++) out[i][j] += aik * b[k][j];
    }
  }
  return out;
}

/**
 * Invert a square matrix via Gauss-Jordan elimination.
 * Returns null if the matrix is singular (not invertible).
 */
export function invert(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  // Augment [matrix | identity].
  const aug = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let col = 0; col < n; col++) {
    // Partial pivot: find the largest-magnitude entry in this column.
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }
    if (Math.abs(aug[pivot][col]) < 1e-9) return null; // singular
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const pv = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  return aug.map((row) => row.slice(n));
}

export function relu(x: number): number {
  return x > 0 ? x : 0;
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Apply a scalar activation to every element of a vector. */
export function applyActivation(vec: number[], fn: (x: number) => number): number[] {
  return vec.map(fn);
}
