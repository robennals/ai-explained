// Shared data and utilities for vector chapter widgets

export interface VectorItem {
  name: string;
  emoji: string;
  values: number[];
}

export interface VectorDomain {
  id: string;
  label: string;
  properties: string[];
  items: VectorItem[];
}

// --- Utility functions ---

export function vecDot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

export function vecMagnitude(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

export function vecNormalize(v: number[]): number[] {
  const m = vecMagnitude(v);
  if (m < 0.001) return v.map(() => 0);
  return v.map((x) => x / m);
}

// --- Domain data ---

const ANIMALS: VectorItem[] = [
  { name: "Bear",     emoji: "\u{1F43B}", values: [0.90, 0.85, 0.80, 0.50, 0.40, 0.75] },
  { name: "Rabbit",   emoji: "\u{1F430}", values: [0.10, 0.02, 0.60, 0.95, 0.70, 0.15] },
  { name: "Shark",    emoji: "\u{1F988}", values: [0.80, 0.95, 0.00, 0.00, 0.75, 0.20] },
  { name: "Mouse",    emoji: "\u{1F42D}", values: [0.02, 0.05, 0.30, 0.40, 0.60, 0.10] },
  { name: "Eagle",    emoji: "\u{1F985}", values: [0.35, 0.60, 0.05, 0.02, 0.95, 0.05] },
  { name: "Elephant", emoji: "\u{1F418}", values: [0.98, 0.30, 0.05, 0.40, 0.15, 0.95] },
  { name: "Snake",    emoji: "\u{1F40D}", values: [0.20, 0.85, 0.00, 0.02, 0.50, 0.05] },
  { name: "Cat",      emoji: "\u{1F431}", values: [0.15, 0.30, 0.75, 0.85, 0.70, 0.25] },
  { name: "Dog",      emoji: "\u{1F415}", values: [0.45, 0.20, 0.70, 0.90, 0.55, 0.45] },
];

const RPG_CHARACTERS: VectorItem[] = [
  { name: "Warrior",  emoji: "\u{2694}\u{FE0F}",  values: [0.90, 0.30, 0.20, 0.85, 0.60, 0.40] },
  { name: "Wizard",   emoji: "\u{1F9D9}",  values: [0.20, 0.95, 0.80, 0.30, 0.10, 0.70] },
  { name: "Rogue",    emoji: "\u{1F5E1}\u{FE0F}",  values: [0.50, 0.40, 0.60, 0.40, 0.95, 0.85] },
  { name: "Healer",   emoji: "\u{2728}",  values: [0.15, 0.80, 0.90, 0.20, 0.30, 0.50] },
  { name: "Paladin",  emoji: "\u{1F6E1}\u{FE0F}",  values: [0.80, 0.60, 0.50, 0.90, 0.40, 0.30] },
  { name: "Ranger",   emoji: "\u{1F3F9}",  values: [0.60, 0.35, 0.45, 0.50, 0.85, 0.75] },
];

const FOODS: VectorItem[] = [
  { name: "Pizza",     emoji: "\u{1F355}", values: [0.85, 0.20, 0.75, 0.90, 0.70, 0.60] },
  { name: "Salad",     emoji: "\u{1F957}", values: [0.10, 0.05, 0.20, 0.15, 0.85, 0.30] },
  { name: "Ice cream", emoji: "\u{1F368}", values: [0.05, 0.95, 0.15, 0.40, 0.10, 0.80] },
  { name: "Sushi",     emoji: "\u{1F363}", values: [0.60, 0.30, 0.50, 0.20, 0.75, 0.45] },
  { name: "Burger",    emoji: "\u{1F354}", values: [0.90, 0.35, 0.80, 0.85, 0.50, 0.55] },
  { name: "Fruit",     emoji: "\u{1F34E}", values: [0.05, 0.70, 0.10, 0.10, 0.90, 0.25] },
  { name: "Cake",      emoji: "\u{1F370}", values: [0.30, 0.90, 0.40, 0.60, 0.15, 0.85] },
];

const INSTRUMENTS: VectorItem[] = [
  { name: "Guitar",  emoji: "\u{1F3B8}", values: [0.70, 0.60, 0.75, 0.40, 0.85, 0.50] },
  { name: "Piano",   emoji: "\u{1F3B9}", values: [0.50, 0.80, 0.90, 0.20, 0.60, 0.70] },
  { name: "Drums",   emoji: "\u{1FA98}", values: [0.95, 0.20, 0.30, 0.90, 0.40, 0.35] },
  { name: "Violin",  emoji: "\u{1F3BB}", values: [0.30, 0.90, 0.85, 0.15, 0.70, 0.80] },
  { name: "Trumpet", emoji: "\u{1F3BA}", values: [0.85, 0.50, 0.40, 0.60, 0.55, 0.45] },
  { name: "Flute",   emoji: "\u{1FA88}", values: [0.15, 0.75, 0.70, 0.10, 0.80, 0.65] },
];

export const ANIMAL_DOMAIN: VectorDomain = {
  id: "animals",
  label: "Animals",
  properties: ["big", "scary", "hairy", "cuddly", "fast", "fat"],
  items: ANIMALS,
};

export const RPG_DOMAIN: VectorDomain = {
  id: "rpg",
  label: "RPG Characters",
  properties: ["strength", "magic", "wisdom", "defense", "speed", "stealth"],
  items: RPG_CHARACTERS,
};

export const FOOD_DOMAIN: VectorDomain = {
  id: "foods",
  label: "Foods",
  properties: ["savory", "sweet", "filling", "greasy", "healthy", "rich"],
  items: FOODS,
};

export const INSTRUMENT_DOMAIN: VectorDomain = {
  id: "instruments",
  label: "Instruments",
  properties: ["loud", "melodic", "range", "rhythmic", "portable", "complex"],
  items: INSTRUMENTS,
};

export const VECTOR_DOMAINS: VectorDomain[] = [
  ANIMAL_DOMAIN,
  RPG_DOMAIN,
  FOOD_DOMAIN,
  INSTRUMENT_DOMAIN,
];

// --- Similarity labels ---

/** Labels for the arrows tab — full -1 to 1 range */
export function directionSimilarityLabel(sim: number): { text: string; color: string } {
  if (sim > 0.999) return { text: "Identical!", color: "#22c55e" };
  if (sim > 0.97) return { text: "Almost identical!", color: "#22c55e" };
  if (sim > 0.9) return { text: "Very similar", color: "#22c55e" };
  if (sim > 0.75) return { text: "Quite similar", color: "#86efac" };
  if (sim > 0.5) return { text: "Somewhat similar", color: "#94a3b8" };
  if (sim > 0.25) return { text: "Not very similar", color: "#94a3b8" };
  if (sim > -0.25) return { text: "Very different", color: "#f97316" };
  if (sim > -0.5) return { text: "Opposing", color: "#ef4444" };
  if (sim > -0.9) return { text: "Quite opposite", color: "#ef4444" };
  if (sim > -0.97) return { text: "Very opposite", color: "#ef4444" };
  return { text: "Exactly opposite!", color: "#ef4444" };
}

/** Labels for domain item comparisons — compressed scale for positive-only vectors */
export function itemSimilarityLabel(sim: number): { text: string; color: string } {
  if (sim > 0.999) return { text: "Identical!", color: "#22c55e" };
  if (sim > 0.95) return { text: "Very similar", color: "#22c55e" };
  if (sim > 0.88) return { text: "Quite similar", color: "#86efac" };
  if (sim > 0.78) return { text: "Somewhat similar", color: "#94a3b8" };
  if (sim > 0.65) return { text: "A little similar", color: "#94a3b8" };
  if (sim > 0.5) return { text: "Not very similar", color: "#f97316" };
  if (sim > 0.38) return { text: "Quite different", color: "#f97316" };
  return { text: "Very different", color: "#ef4444" };
}

/** Color for individual product values in comparison columns */
export function productColor(product: number, maxProduct: number): string {
  if (maxProduct === 0) return "#888";
  const t = Math.max(0, Math.min(1, product / maxProduct));
  const r = Math.round(220 - 140 * t);
  const g = Math.round(80 + 120 * t);
  const b = Math.round(80 - 20 * t);
  return `rgb(${r},${g},${b})`;
}
