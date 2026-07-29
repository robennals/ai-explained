/**
 * Sourced data for the "It's Still the Transformer" chapter widgets.
 *
 * Every number here is transcribed from docs/plans/real-ai-model-data.md, which
 * carries the primary sources. Confidence is preserved deliberately:
 *   "confirmed"  - from the lab's own report / config / model card
 *   "leaked"     - widely reported but never confirmed by the lab (GPT-4)
 *   "unverified" - only found via aggregators; must not be shown as fact
 *   null value   - genuinely not disclosed. Render as "not disclosed", never guess.
 */

export type Confidence = "confirmed" | "leaked" | "unverified";
export type Openness = "open" | "closed";

export interface ModelStat {
  value: number | null;
  confidence?: Confidence;
}

export interface Model {
  id: string;
  name: string;
  maker: string;
  /** Fractional year, used for ordering. */
  year: number;
  /** Human-readable release date. */
  released: string;
  openness: Openness;
  /** What it is, and how it stood at the time. Shown when a reader picks the column. */
  blurb: string;
  /** Overall confidence for this model's spec numbers. */
  confidence: Confidence;
  note?: string;
  stats: Record<string, ModelStat>;
}

/** Plain-language explanation of each column, shown when a reader picks it. */
export const STAT_EXPLANATIONS: Record<string, string> = {
  params:
    "Every number the model stores. Roughly, the size of its brain. A bigger number usually means it knows more, but on its own it tells you nothing about what the model costs to run.",
  active:
    "How many of those stored numbers actually switch on to work out the meaning of a single word. That is what the model really costs to run. In a mixture-of-experts model it is far smaller than the total, which is the entire point of that design: a huge brain that only wakes a small part of itself for any one word.",
  layers:
    "How many times the passage goes round the attention-then-think cycle. Each layer is another chance to refine what every word means in context.",
  heads:
    "How many separate attention patterns run side by side inside each layer. Each head is free to look for a different kind of relationship between words.",
  tokens:
    "How much text the model read while training, counted in tokens, which are roughly word-pieces. GPT-2 read a few billion. Today's models read tens of trillions.",
  context:
    "How much text it can hold in mind at once. GPT-2 managed about a page. The newest models manage a shelf of books.",
  mmlu:
    "A general-knowledge exam spanning many school and university subjects. It was the standard comparison until around 2024, when the best models got close enough to full marks that it stopped telling them apart.",
  gpqa:
    "Graduate-level science questions, written so that searching the internet doesn't help. One of the few exams that still separates the frontier models.",
  swe:
    "Fixing real bugs in real software projects. Retired here: the frontier labs stopped reporting it during 2026.",
  swePro:
    "A harder version of the bug-fixing test, on bigger and messier codebases. This is what replaced the original once everyone started scoring well on it.",
  terminal:
    "Give the model a computer and a job to do, then see whether it actually gets done. Less a quiz than an apprenticeship: it has to run commands, read what comes back, and recover when things go wrong.",
};

export interface StatDef {
  id: string;
  label: string;
  unit: string;
  log: boolean;
  /** Which tab this column belongs to. Splitting them keeps the table readable. */
  group: "spec" | "score";
  /**
   * Saturated and no longer reported by frontier labs, so it can't show whether
   * open models have caught up. Kept for the historical record, hidden from the
   * comparison.
   */
  retired?: boolean;
  /** Formats a value for display. */
  format: (v: number) => string;
}

const compact = (v: number): string => {
  if (v >= 1e12) return `${+(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${+(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${+(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${+(v / 1e3).toFixed(0)}k`;
  return String(v);
};

export const STATS: StatDef[] = [
  { id: "params", label: "Parameters", unit: "", log: true, group: "spec", format: compact },
  { id: "active", label: "Active parameters", unit: "", log: true, group: "spec", format: compact },
  { id: "layers", label: "Layers", unit: "", log: false, group: "spec", format: (v) => String(v) },
  { id: "heads", label: "Attention heads", unit: "", log: false, group: "spec", format: (v) => String(v) },
  { id: "tokens", label: "Training tokens", unit: "", log: true, group: "spec", format: compact },
  { id: "context", label: "Context window", unit: "tokens", log: true, group: "spec", format: compact },
  { id: "mmlu", label: "MMLU", unit: "%", log: false, group: "score", retired: true, format: (v) => `${v}%` },
  { id: "gpqa", label: "GPQA Diamond", unit: "%", log: false, group: "score", retired: true, format: (v) => `${v}%` },
  { id: "swe", label: "SWE-bench Verified", unit: "%", log: false, group: "score", retired: true, format: (v) => `${v}%` },
  { id: "swePro", label: "SWE-bench Pro", unit: "%", log: false, group: "score", format: (v) => `${v}%` },
  { id: "terminal", label: "Terminal-Bench 2.1", unit: "%", log: false, group: "score", format: (v) => `${v}%` },
];

const s = (value: number | null, confidence: Confidence = "confirmed"): ModelStat => ({
  value,
  confidence,
});

export const MODELS: Model[] = [
  {
    id: "gpt2",
    name: "GPT-2",
    maker: "OpenAI",
    year: 2019.1,
    released: "February 2019",
    blurb:
      "OpenAI's second GPT, and the model that made next-word prediction famous. Startling at the time. Small enough now to run on a phone.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(1.5e9),
      active: s(1.5e9),
      layers: s(48),
      heads: s(25),
      tokens: s(null),
      context: s(1024),
      mmlu: s(null),
      gpqa: s(null),
      swe: s(null),
    },
  },
  {
    id: "gpt3",
    name: "GPT-3",
    maker: "OpenAI",
    year: 2020.4,
    released: "May 2020",
    blurb:
      "The model that made large language models a mainstream idea, at roughly a hundred times the size of GPT-2. Its architecture was published in a paper, but the weights never were.",
    openness: "closed",
    confidence: "confirmed",
    note: "Architecture published in the paper, weights never released.",
    stats: {
      params: s(175e9),
      active: s(175e9),
      layers: s(96),
      heads: s(96),
      tokens: s(300e9),
      context: s(2048),
      mmlu: s(43.9),
      gpqa: s(null),
      swe: s(null),
    },
  },
  {
    id: "gpt4",
    name: "GPT-4",
    maker: "OpenAI",
    year: 2023.2,
    released: "March 2023",
    blurb:
      "The model behind the first ChatGPT boom, and the point where disclosure stopped. OpenAI's report states plainly that it contains no details of the architecture, size, or training data. Every figure here is a leak.",
    openness: "closed",
    confidence: "leaked",
    note: "Size figures are leaks. OpenAI has never confirmed them.",
    stats: {
      params: s(1.8e12, "leaked"),
      active: s(280e9, "leaked"),
      layers: s(null),
      heads: s(null),
      tokens: s(13e12, "leaked"),
      context: s(8192),
      mmlu: s(86.4),
      gpqa: s(38),
      swe: s(null),
    },
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    maker: "DeepSeek",
    year: 2024.95,
    released: "December 2024",
    blurb:
      "The best-documented frontier model in existence. Its technical report walks through the whole design, down to the training cost. If you want to know how a modern model is actually built, this is the one to read.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(671e9),
      active: s(37e9),
      layers: s(61),
      heads: s(128),
      tokens: s(14.8e12),
      context: s(128000),
      mmlu: s(88.5),
      gpqa: s(59.1),
      swe: s(42.0),
    },
  },
  {
    id: "llama4",
    name: "Llama 4 Maverick",
    maker: "Meta",
    year: 2025.27,
    released: "April 2025",
    blurb:
      "Meta's first Llama built as a mixture of experts. The weights are downloadable, though only after accepting a licence, which is why it can't be used in the notebook.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(400e9),
      active: s(17e9),
      layers: s(null),
      heads: s(null),
      tokens: s(22e12),
      context: s(1e6),
      mmlu: s(null),
      gpqa: s(69.8),
      swe: s(null),
    },
  },
  {
    id: "qwen3",
    name: "Qwen3-235B",
    maker: "Alibaba",
    year: 2025.32,
    released: "April 2025",
    blurb:
      "Alibaba's family, running from 0.6 billion parameters up to 235 billion, trained on around 36 trillion tokens. The smallest member is the model the companion notebook actually runs.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(235e9),
      active: s(22e9),
      layers: s(94),
      heads: s(64),
      tokens: s(36e12),
      context: s(128000),
      mmlu: s(null),
      gpqa: s(71.1),
      swe: s(null),
    },
  },
  {
    id: "kimi-k2",
    name: "Kimi K2",
    maker: "Moonshot",
    year: 2025.53,
    released: "July 2025",
    blurb:
      "A trillion-parameter model from Moonshot. Its config file names DeepSeek's architecture class outright, so it is, structurally, a DeepSeek-V3 scaled up.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(1026.47e9),
      active: s(32e9),
      layers: s(61),
      heads: s(64),
      tokens: s(15.5e12),
      context: s(131072),
      mmlu: s(89.5),
      gpqa: s(75.1),
      swe: s(65.8),
    },
  },
  {
    id: "gpt-oss",
    name: "gpt-oss-120b",
    maker: "OpenAI",
    year: 2025.6,
    released: "August 2025",
    blurb:
      "OpenAI's first open-weight release since GPT-2. Not a frontier model, but valuable as a rare look at how a secretive lab builds things. It uses the same standard toolkit as everyone else.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(116.8e9),
      active: s(5.1e9),
      layers: s(36),
      heads: s(64),
      tokens: s(null),
      context: s(131072),
      mmlu: s(90.0),
      gpqa: s(80.1),
      swe: s(62.4),
    },
  },
  {
    id: "gpt5",
    name: "GPT-5",
    maker: "OpenAI",
    year: 2025.62,
    released: "August 2025",
    blurb:
      "Closed. No parameter count, no layer count, no architecture, nothing. It sits in this table to show what a column looks like when a lab tells you nothing at all.",
    openness: "closed",
    confidence: "confirmed",
    note: "Nothing about its architecture or size has been disclosed.",
    stats: {
      params: s(null),
      active: s(null),
      layers: s(null),
      heads: s(null),
      tokens: s(null),
      context: s(null),
      mmlu: s(null),
      gpqa: s(88.4),
      swe: s(74.9),
    },
  },
  {
    id: "glm-4.6",
    name: "GLM-4.6",
    maker: "Zhipu",
    year: 2025.75,
    released: "2025",
    blurb:
      "An open-weight model from Zhipu that scored competitively with closed models of its day, and published its design while doing so.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(356.79e9),
      active: s(32e9),
      layers: s(92),
      heads: s(96),
      tokens: s(null),
      context: s(202752),
      mmlu: s(null),
      gpqa: s(81.0),
      swe: s(68.0),
    },
  },
  {
    id: "glm-5",
    name: "GLM-5",
    maker: "Zhipu",
    year: 2026.1,
    released: "February 2026",
    blurb:
      "Zhipu's frontier model, fully documented. On the benchmark of fixing real bugs it reports 77.8, above GPT-5's 74.9, which is the single clearest sign that open models had caught up.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(753.86e9),
      active: s(40e9),
      layers: s(78),
      heads: s(64),
      tokens: s(28.5e12),
      context: s(202752),
      mmlu: s(88.3),
      gpqa: s(86.0),
      swe: s(77.8),
    },
  },
  {
    id: "glm-5.2",
    name: "GLM-5.2",
    maker: "Zhipu",
    year: 2026.45,
    released: "2026",
    blurb:
      "Openly downloadable and near the top of the hardest science benchmarks. No paper states its size, but since the weights are public you can simply count them: 753 billion parameters, read straight from the files.",
    openness: "open",
    confidence: "confirmed",
    stats: {
      params: s(753.33e9),
      active: s(null),
      layers: s(78),
      heads: s(64),
      tokens: s(null),
      context: s(1048576),
      mmlu: s(null),
      gpqa: s(91.2),
      swe: s(null),
      swePro: s(62.1),
      terminal: s(81.0),
    },
  },
];


/* ------------------------------------------------------------------ */
/* Benchmark leaderboard                                               */
/* ------------------------------------------------------------------ */

export interface Benchmark {
  id: string;
  /** The benchmark's real name — used as the tab label. */
  name: string;
  /** One plain sentence: what the test actually asks a model to do. */
  blurb: string;
  evaluator: string;
  href: string;
  date: string;
  /** True when the numbers come from the labs' own cards rather than one outside evaluator. */
  selfReported?: boolean;
  /** Elo-style score: shown as an integer, bars scaled from `floor` not zero. */
  elo?: boolean;
  floor?: number;
}

/**
 * Three unsaturated benchmarks, each run by an independent evaluator (not the
 * labs' own self-reports), so the numbers are directly comparable across models.
 * Saturated tests (MMLU, GPQA, SWE-bench Verified) are deliberately excluded.
 */
export const BENCHMARKS: Benchmark[] = [
  {
    id: "terminal",
    name: "Terminal-Bench",
    blurb:
      "Give the model a computer and a task, then see whether it actually gets done: run commands, read what comes back, recover from mistakes.",
    evaluator: "Vals AI",
    href: "https://www.vals.ai/benchmarks/terminal-bench-2-1",
    date: "July 2026",
  },
  {
    id: "arena",
    name: "LMArena",
    blurb:
      "Real people chat with two anonymous models side by side and vote for the better reply, over millions of votes. The one test here that isn't about coding, and the one no lab can study for.",
    evaluator: "LMArena",
    href: "https://arena.ai/leaderboard/text",
    date: "July 2026",
    elo: true,
    floor: 1450,
  },
  {
    id: "hle",
    name: "Humanity's Last Exam",
    blurb:
      "Expert questions so hard the best model gets only about half right — the opposite of a saturated test. Every model here was run the same way, with no tools, so the scores line up.",
    evaluator: "Artificial Analysis",
    href: "https://artificialanalysis.ai/evaluations/humanitys-last-exam",
    date: "July 2026",
  },
];

export interface LeaderEntry {
  name: string;
  maker: string;
  /** Release date, shown so older frontier models can be compared with newer ones. */
  released: string;
  /** Fractional year, for optional date sorting. */
  year: number;
  open: boolean;
  /** Open-weight, but the weights haven't actually been released yet. */
  pending?: boolean;
  /** Score per benchmark id. null = that evaluator didn't run this model. */
  scores: Record<string, number | null>;
}

export const LEADERBOARD: LeaderEntry[] = [
  // One flagship per lab — the best each can currently do. No small/fast variants.
  { name: "GPT-5.6", maker: "OpenAI", released: "Jul 2026", year: 2026.52, open: false, scores: { terminal: 85.77, hle: 47.2, arena: 1485 } },
  { name: "Kimi K3", maker: "Moonshot", released: "Jul 2026", year: 2026.54, open: true, pending: true, scores: { terminal: 80.9, hle: 44.3, arena: 1486 } },
  { name: "Claude Fable 5", maker: "Anthropic", released: "Jun 2026", year: 2026.44, open: false, scores: { terminal: 80.52, swePro: 80.3, hle: 53.3, arena: 1507 } },
  { name: "GLM-5.2", maker: "Zhipu", released: "Jun 2026", year: 2026.46, open: true, scores: { terminal: 67.79, swePro: 62.1, hle: 40.1, arena: 1469 } },
  { name: "Grok 4.5", maker: "xAI", released: "2026", year: 2026.2, open: false, scores: { terminal: 67.79, swePro: 64.7, hle: 40.3, arena: 1468 } },
  { name: "Gemini 3.1 Pro", maker: "Google", released: "Feb 2026", year: 2026.13, open: false, scores: { terminal: 70.79, swePro: 54.2, hle: 44.7, arena: 1486 } },
  { name: "Qwen3.7 Max", maker: "Alibaba", released: "2026", year: 2026.4, open: true, scores: { terminal: 61.05, hle: 38.1, arena: 1475 } },
];

/* ------------------------------------------------------------------ */
/* Techniques                                                          */
/* ------------------------------------------------------------------ */

export type Support = "yes" | "no" | "unknown";

export interface Technique {
  id: string;
  name: string;
  /**
   * "machine" = changes how the model runs when you use it.
   * "training" = changes how it was made. Covered in other sections.
   */
  category: "machine" | "training";
  /** The problem it solves. One line. */
  problem: string;
  /** Roughly how it solves it. One line. */
  how: string;
  /** True when every current frontier model we can inspect uses it. */
  universal: boolean;
  /** When it is not universal, who differs and how. Shown as the honest exception. */
  variation?: string;
  chapter?: { label: string; href: string };
  support: Record<string, Support>;
}

const ALL_MODERN: Record<string, Support> = {
  gpt3: "no",
  gpt4: "unknown",
  "deepseek-v3": "yes",
  llama4: "yes",
  qwen3: "yes",
  "kimi-k2": "yes",
  "gpt-oss": "yes",
  gpt5: "unknown",
  "glm-4.6": "yes",
  "glm-5": "yes",
  "glm-5.2": "yes",
};

/** Techniques that change how the model RUNS. This is the machine. */
export const MACHINE_TECHNIQUES: Technique[] = [
  {
    id: "moe",
    name: "Mixture of experts",
    category: "machine",
    problem: "A bigger thinking layer knows more, but costs more for every single word.",
    how: "Split it into many expert networks and let a router wake only a few per word.",
    universal: true,
    chapter: { label: "Mixture of experts", href: "/mixture-of-experts" },
    support: { ...ALL_MODERN },
  },
  {
    id: "kv",
    name: "Compressed attention memory",
    category: "machine",
    problem: "Storing something about every earlier word eats memory, and re-reading it is slow.",
    how: "Share one copy between many attention heads, or squeeze it into a compact summary.",
    universal: true,
    chapter: { label: "Long context", href: "/long-context" },
    support: { ...ALL_MODERN },
  },
  {
    id: "rope",
    name: "Rotary positions (RoPE)",
    category: "machine",
    problem: "Attention on its own has no idea what order the words came in.",
    how: "Rotate each word's query and key by an angle set by its position.",
    universal: true,
    chapter: { label: "Positions", href: "/positions" },
    support: { ...ALL_MODERN },
  },
  {
    id: "plumbing",
    name: "Modern plumbing (RMSNorm, SwiGLU)",
    category: "machine",
    problem: "Deep stacks of layers are hard to train without the numbers blowing up.",
    how: "A cheaper way to keep numbers in range, and a learned gate on the thinking layer.",
    universal: true,
    chapter: { label: "Making training work", href: "/training" },
    support: { ...ALL_MODERN },
  },
  {
    id: "thinking",
    name: "Thinking before answering",
    category: "machine",
    problem: "Hard questions need working out, but a plain model has to answer immediately.",
    how: "Let it write out its reasoning first and use its own output as scratch paper.",
    universal: false,
    variation:
      "Llama 4 ships without a thinking mode. Everything else here has one, and several let you switch it off for easy questions.",
    chapter: { label: "Reasoning", href: "/reasoning" },
    support: { ...ALL_MODERN, llama4: "no", "kimi-k2": "unknown", gpt5: "yes" },
  },
  {
    id: "tools",
    name: "Tool use",
    category: "machine",
    problem: "Some things a model simply cannot do by predicting text, like running code or checking today's date.",
    how: "Teach it to emit a structured request, run the real tool, and hand the result back.",
    universal: true,
    chapter: { label: "Agents and tool use", href: "/agents" },
    support: { ...ALL_MODERN, llama4: "unknown" },
  },
  {
    id: "sparse",
    name: "Sparse attention",
    category: "machine",
    problem: "Comparing every word with every other word grows with the square of the length.",
    how: "Use a cheap index to pick out the few earlier words most likely to matter.",
    universal: false,
    variation:
      "Genuinely split. DeepSeek, gpt-oss and the newest GLM models use it; Kimi K2 and GLM-4.6 don't. One of the few places the labs actually disagree.",
    chapter: { label: "Long context", href: "/long-context" },
    support: {
      ...ALL_MODERN,
      llama4: "unknown",
      qwen3: "unknown",
      "kimi-k2": "no",
      "glm-4.6": "no",
    },
  },
  {
    id: "mtp",
    name: "Multi-token prediction",
    category: "machine",
    problem: "Generating one word at a time wastes most of the hardware's capacity.",
    how: "Add small extra heads that guess the next few words, then check them all at once.",
    universal: false,
    variation:
      "DeepSeek and GLM use it. Qwen3, Kimi K2 and gpt-oss don't. It speeds generation up without changing the answer, so it's an engineering choice rather than a capability one.",
    chapter: { label: "Running models fast", href: "/inference" },
    support: {
      ...ALL_MODERN,
      llama4: "unknown",
      qwen3: "no",
      "kimi-k2": "no",
      "gpt-oss": "no",
    },
  },
];

/** Techniques that change how the model was TRAINED. Covered in other sections. */
export const TRAINING_TECHNIQUES: Technique[] = [
  {
    id: "longctx",
    name: "Stretched context",
    category: "training",
    problem: "A model trained on short text falls apart when you hand it a whole book.",
    how: "Adjust the position signal and train further, so positions past the training length still work.",
    universal: true,
    chapter: { label: "Long context", href: "/long-context" },
    support: { ...ALL_MODERN },
  },
  {
    id: "rl",
    name: "Reinforcement learning",
    category: "training",
    problem: "A next-word predictor isn't trying to be helpful, honest, or correct.",
    how: "After pre-training, reward good answers instead of merely copying text.",
    universal: true,
    chapter: { label: "Alignment", href: "/alignment" },
    support: { ...ALL_MODERN, "kimi-k2": "unknown", gpt5: "yes" },
  },
];

/** Kept for anything that still wants the combined list. */
export const TECHNIQUES: Technique[] = [...MACHINE_TECHNIQUES, ...TRAINING_TECHNIQUES];

/**
 * The "same shape, different dials" evidence. Every number is read from the
 * published weights or config of a model in MODELS, so it is checkable.
 */
export const DIAL_SPREAD = [
  { label: "Experts", range: "128 to 384", note: "gpt-oss has 128, Kimi K2 has 384. Both wake 4 to 8 per word." },
  { label: "Active parameters", range: "5B to 40B", note: "gpt-oss uses 5.1 billion per word, GLM-5 around 40 billion." },
  { label: "Layers", range: "36 to 92", note: "gpt-oss stacks 36, GLM-4.6 stacks 92." },
  { label: "Training tokens", range: "14.8T to 36T", note: "DeepSeek-V3 read 14.8 trillion words, Qwen3 about 36 trillion." },
];

/* ------------------------------------------------------------------ */
/* Efficiency                                                          */
/* ------------------------------------------------------------------ */

export type SavingCategory = "model" | "serving" | "hardware";

export interface Saving {
  id: string;
  name: string;
  /** Bar length. A multiplier: 4 means "4x". */
  factor: number;
  /** What the multiplier is measuring. */
  measures: string;
  detail: string;
  category: SavingCategory;
}

export const SAVINGS: Saving[] = [
  {
    id: "pruning",
    name: "Pruning and distillation",
    factor: 40,
    measures: "training data needed",
    detail: "Cutting a trained model down and retraining it from the original needed 40x fewer tokens than training the small model from scratch, and scored 16% better on MMLU.",
    category: "model",
  },
  {
    id: "moe-oss",
    name: "Mixture of experts (gpt-oss)",
    factor: 23,
    measures: "computation per word",
    detail: "117 billion parameters stored, 5.1 billion used per word.",
    category: "model",
  },
  {
    id: "moe-ds",
    name: "Mixture of experts (DeepSeek-V3)",
    factor: 18,
    measures: "computation per word",
    detail: "671 billion parameters stored, 37 billion used per word.",
    category: "model",
  },
  {
    id: "mla",
    name: "Compressed attention memory",
    factor: 15,
    measures: "memory",
    detail: "DeepSeek reported a 93% smaller store of keys and values, and 5.8x more text generated per second.",
    category: "model",
  },
  {
    id: "quant4",
    name: "Quantization (16-bit to 4-bit)",
    factor: 4,
    measures: "memory",
    detail: "Four times smaller, keeping around 99% of accuracy. This is usually what makes a serious model fit on an ordinary computer.",
    category: "model",
  },
  {
    id: "flash",
    name: "FlashAttention",
    factor: 3,
    measures: "speed",
    detail: "Exactly the same attention maths, reorganised so intermediate results never travel to slow memory.",
    category: "model",
  },
  {
    id: "sparse",
    name: "Sparse attention (at 1M words)",
    factor: 2.9,
    measures: "computation per word",
    detail: "Reusing one index across every four layers cut the work per word by 2.9x at a million tokens of context.",
    category: "model",
  },
  {
    id: "spec",
    name: "Speculative decoding",
    factor: 2.5,
    measures: "speed",
    detail: "A cheap guesser proposes the next few words and the big model checks them all at once. The output is provably identical.",
    category: "model",
  },
  {
    id: "quant8",
    name: "Quantization (16-bit to 8-bit)",
    factor: 2,
    measures: "memory",
    detail: "Half the size, with essentially no measurable loss in quality.",
    category: "model",
  },
  {
    id: "paged",
    name: "Better memory handling when serving",
    factor: 3,
    measures: "throughput",
    detail: "Serving systems used to waste 60-80% of their attention memory. Managing it in pages cut waste below 4%.",
    category: "serving",
  },
  {
    id: "gpu",
    name: "Cheaper hardware (per year)",
    factor: 1.43,
    measures: "cost per unit of performance",
    detail: "Hardware gets roughly 30% cheaper per unit of performance every year. Nothing about the model changed.",
    category: "hardware",
  },
];

export const CATEGORY_LABELS: Record<SavingCategory, string> = {
  model: "Changes to the model",
  serving: "Changes to how it's served",
  hardware: "Changes to the hardware",
};

/* ------------------------------------------------------------------ */
/* Alignment                                                           */
/* ------------------------------------------------------------------ */

export interface AlignmentExample {
  prompt: string;
  base: string;
  sft: string;
  aligned: string;
}

/**
 * Illustrative responses, written to show the *character* of each stage.
 * These are not transcripts of any real model.
 */
export const ALIGNMENT_EXAMPLES: AlignmentExample[] = [
  {
    prompt: "How do volcanoes form?",
    base: "How do earthquakes happen? How are mountains made? How does the water cycle work? Write your answers in the space below. Chapter 4 review questions...",
    sft: "Volcanoes form where molten rock reaches the surface.",
    aligned:
      "Volcanoes form where molten rock from inside the Earth finds a way to the surface. That usually happens in two places: where two tectonic plates meet and one is pushed under the other, and over \"hot spots\" where a plume of heat rises through the middle of a plate. Hawaii is the classic hot-spot example.",
  },
  {
    prompt: "Is 17 a prime number?",
    base: "Is 18 a prime number? Is 19 a prime number? Exercise 3.2: determine which of the following are prime.",
    sft: "Yes.",
    aligned:
      "Yes. A prime number has no factors except 1 and itself, and 17 isn't divisible by 2, 3, 5, 7, 11 or 13. You only have to check up to the square root of 17, which is a bit over 4, so testing 2 and 3 is actually enough.",
  },
];

export interface RankingRound {
  question: string;
  optionA: string;
  optionB: string;
  /** Which option is the sycophantic one. */
  sycophantic: "A" | "B";
  lessonHonest: string;
  lessonSycophantic: string;
}

export const RANKING_ROUNDS: RankingRound[] = [
  {
    question: "You tell the model: \"I'm certain the Great Wall of China is visible from the Moon. Right?\"",
    optionA:
      "You're right that it's a famous claim, but it isn't true. The Wall is very long, but far too narrow to see from the Moon. Even from low orbit it's extremely hard to pick out.",
    optionB:
      "Yes, exactly right! The Great Wall of China is famously the only human-made structure visible from the Moon. Great instinct.",
    sycophantic: "B",
    lessonHonest:
      "You rewarded the answer that corrected you. Do that a million times and the model learns that being right matters more than agreeing.",
    lessonSycophantic:
      "You rewarded the answer that agreed with you. Do that a million times and the model learns that agreeing is what earns a good score, whether or not it's true.",
  },
  {
    question: "You show the model a story you wrote and say: \"This is basically ready to publish, isn't it?\"",
    optionA:
      "It's a strong opening and the dialogue is natural. Two things would hold it back from publication: the middle section repeats the same beat three times, and the ending resolves in a paragraph. Want me to mark the spots?",
    optionB:
      "Honestly, this is publication-ready. The prose is gorgeous and the pacing is perfect. I wouldn't change a thing.",
    sycophantic: "B",
    lessonHonest:
      "You rewarded useful criticism. That's harder to write and less pleasant to read, which is exactly why models drift away from it unless raters ask for it.",
    lessonSycophantic:
      "You rewarded flattery. This is how a helpful assistant slowly turns into one that tells everyone their work is perfect.",
  },
];
