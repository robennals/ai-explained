/* ------------------------------------------------------------------ */
/*  Cost of full (all-pairs) attention                                */
/*                                                                     */
/*  Every token compares against every other token: W^2 pairs. Each   */
/*  comparison is a dot product over one attention head's dimensions, */
/*  and a model stacks many heads across many layers. Per head, per   */
/*  layer, that's roughly 2*W^2*headDim FLOPs for QK^T plus another   */
/*  2*W^2*headDim for AV (multiply + add counted separately), summed  */
/*  across every head in every layer.                                 */
/* ------------------------------------------------------------------ */

export function attentionFlops(
  windowTokens: number,
  headDim: number,
  totalHeads: number
): number {
  return 4 * windowTokens * windowTokens * headDim * totalHeads;
}

/** Effective ~1 pJ/FLOP (an assumption worth stating out loud). */
export function energyJoules(flops: number, flopsPerJoule = 1e12): number {
  return flops / flopsPerJoule;
}

/** ~$2.5/GPU-hour at ~5e14 FLOP/s effective throughput (an assumption). */
export function dollars(flops: number, dollarsPerFlop = 1.39e-18): number {
  return flops * dollarsPerFlop;
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

/* ------------------------------------------------------------------ */
/*  Human-readable energy and dollar formatting                       */
/* ------------------------------------------------------------------ */

const JOULES_PER_KWH = 3.6e6;

export function formatEnergy(joules: number): string {
  if (joules >= JOULES_PER_KWH * 0.1) {
    // kWh (or MWh once large) once we're in a "household appliance" range
    const kwh = joules / JOULES_PER_KWH;
    if (kwh >= 1000) {
      return `${kwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`;
    }
    if (kwh >= 10) {
      return `${kwh.toFixed(0)} kWh`;
    }
    return `${Number(kwh.toFixed(1))} kWh`;
  }
  if (joules >= 1e9) {
    return `${Number((joules / 1e9).toFixed(1))} GJ`;
  }
  if (joules >= 1e6) {
    return `${Number((joules / 1e6).toFixed(1))} MJ`;
  }
  if (joules >= 1e3) {
    return `${Number((joules / 1e3).toFixed(1))} kJ`;
  }
  return `${Math.round(joules)} J`;
}

export function formatDollars(usd: number): string {
  if (usd >= 1e6) {
    return `$${Number((usd / 1e6).toFixed(1))}M`;
  }
  if (usd >= 1e3) {
    return `$${Number((usd / 1e3).toFixed(1))}K`;
  }
  if (usd >= 1) {
    return `$${usd.toFixed(2)}`;
  }
  if (usd >= 0.001) {
    return `$${usd.toFixed(3)}`;
  }
  return `$${usd.toFixed(4)}`;
}

/* ------------------------------------------------------------------ */
/*  Real-world energy equivalents, ordered smallest to largest         */
/* ------------------------------------------------------------------ */

export interface Equivalent {
  joules: number;
  singular: string;
  plural: string;
}

export const EQUIVALENTS: Equivalent[] = [
  { joules: 1080, singular: "web search", plural: "web searches" },
  { joules: 36000, singular: "LED bulb for an hour", plural: "LED bulbs for an hour" },
  { joules: 65000, singular: "phone charge", plural: "phone charges" },
  { joules: 180000, singular: "laptop for an hour", plural: "laptops for an hour" },
  { joules: 1.26e6, singular: "mile of driving an electric car", plural: "miles of driving an electric car" },
  { joules: 1.04e8, singular: "home for a day", plural: "homes for a day" },
  { joules: 2.2e9, singular: "transatlantic flight", plural: "transatlantic flights" },
  { joules: 3.78e10, singular: "home for a year", plural: "homes for a year" },
  { joules: 4.63e12, singular: "full training run of GPT-3", plural: "full training runs of GPT-3" },
];

export function nearestEquivalent(
  joules: number
): { label: string; count: number; entry: Equivalent } {
  let entry = EQUIVALENTS[0];
  for (const candidate of EQUIVALENTS) {
    if (candidate.joules <= joules) {
      entry = candidate;
    } else {
      break;
    }
  }
  const count = joules / entry.joules;
  const label = Math.abs(count - 1) < 0.05 ? entry.singular : entry.plural;
  return { label, count, entry };
}

/**
 * The context window that would make full attention cost exactly
 * `targetJoules` of energy, at a given headDim/totalHeads shape. Inverts
 * `energyJoules(attentionFlops(w, headDim, totalHeads))` for `w`. Used to
 * let a reader click a real-world equivalent and jump the window slider
 * to land on it.
 */
export function windowForEnergy(
  targetJoules: number,
  headDim: number,
  totalHeads: number
): number {
  return Math.sqrt((targetJoules * 1e12) / (4 * headDim * totalHeads));
}
