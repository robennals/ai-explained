/** The letter shown on a quiz option: 0 → "A", 1 → "B", and so on. */
export function choiceLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
