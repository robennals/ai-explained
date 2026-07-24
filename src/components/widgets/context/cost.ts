export function pairwiseComparisons(n: number): number {
  return n * n;
}

export function linearReference(n: number, perToken: number): number {
  return n * perToken;
}

export function formatCount(n: number): string {
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [scale, suffix] of units) {
    if (n >= scale) {
      const v = n / scale;
      return `${Number.isInteger(v) ? v : Number(v.toFixed(1))}${suffix}`;
    }
  }
  return String(n);
}
