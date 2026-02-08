export interface Chapter {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  prerequisites: number[];
  description: string;
  ready?: boolean;
}

export const chapters: Chapter[] = [
  {
    id: 1,
    slug: "01-computation",
    title: "Everything Is Numbers",
    subtitle: "The shape of the AI problem",
    prerequisites: [],
    description:
      "Text, images, and sound are all numbers. Thinking is a function. Models are machines with knobs. The challenge: find the right settings.",
    ready: true,
  },
  {
    id: 2,
    slug: "02-optimization",
    title: "The Power of Incremental Improvement",
    subtitle: "Why reliable tiny improvements beat brilliant design",
    prerequisites: [1],
    description:
      "Evolution, A/B testing, and gradient descent are all the same algorithm. The secret to building complex things: small changes, tested against reality, kept or discarded.",
    ready: true,
  },
  {
    id: 3,
    slug: "03-building-a-brain",
    title: "Building a Brain",
    subtitle: "From single neurons to deep networks",
    prerequisites: [2],
    description:
      "A neuron is a weighted vote. Stack them into layers and they can learn anything. Deeper beats wider. But without activation functions, stacking is useless.",
  },
  {
    id: 4,
    slug: "04-learning-from-mistakes",
    title: "Learning from Mistakes",
    subtitle: "How networks learn by failing",
    prerequisites: [3],
    description:
      "The loss function defines what 'wrong' means. Gradient descent finds the way downhill. Train too well and the model memorizes instead of learning.",
  },
  {
    id: 5,
    slug: "05-geometry-of-meaning",
    title: "The Geometry of Meaning",
    subtitle: "How AI turns words into math",
    prerequisites: [4],
    description:
      "Embeddings place words in space where meaning has geometry. King minus man plus woman equals queen. This is how AI 'understands' language.",
  },
  {
    id: 6,
    slug: "06-attention-transformers",
    title: "Attention and Transformers",
    subtitle: "The architecture that changed everything",
    prerequisites: [5],
    description:
      "Before transformers, models forgot early words like a telephone game. Attention lets every word look at every other word directly.",
  },
  {
    id: 7,
    slug: "07-how-llms-learn",
    title: "How LLMs Learn to Talk",
    subtitle: "From raw text to conversation",
    prerequisites: [6],
    description:
      "An LLM learns by predicting the next word. Seems too simple — but requires understanding grammar, facts, humor, and reasoning. Tokenization shapes what it can see.",
  },
  {
    id: 8,
    slug: "08-transfer-learning",
    title: "Transfer Learning",
    subtitle: "Train once, use everywhere",
    prerequisites: [7],
    description:
      "Pre-trained models transfer knowledge to new tasks with minimal data. Fine-tune on 1,000 examples and beat training from scratch on 100,000.",
  },
  {
    id: 9,
    slug: "09-distillation",
    title: "Distillation",
    subtitle: "Big model teaches small model",
    prerequisites: [8],
    description:
      "A giant model is too slow for your phone. Train a tiny model to mimic it using soft predictions. The teacher's intuition — 'dark knowledge' — transfers.",
  },
  {
    id: 10,
    slug: "10-mixture-of-experts",
    title: "Mixture of Experts",
    subtitle: "Not every neuron fires for every thought",
    prerequisites: [6],
    description:
      "A router sends each question to specialist sub-networks. A trillion parameters, but only a fraction active per question. Smarter without getting slower.",
  },
  {
    id: 11,
    slug: "11-thinking-step-by-step",
    title: "Thinking Step by Step",
    subtitle: "How AI learned to reason",
    prerequisites: [7],
    description:
      "Standard LLMs answer in one shot with no scratch paper. Chain-of-thought and thinking models use their own output as working memory to solve harder problems.",
  },
  {
    id: 12,
    slug: "12-scaling-emergence",
    title: "Scaling and Emergence",
    subtitle: "Bigger models, surprising abilities",
    prerequisites: [8],
    description:
      "10x bigger = smoothly better predictions. But individual capabilities appear suddenly — arithmetic, reasoning, translation quality jump at specific sizes.",
  },
  {
    id: 13,
    slug: "13-alignment",
    title: "Teaching AI Right from Wrong",
    subtitle: "RLHF, Goodhart's Law, and the alignment problem",
    prerequisites: [7],
    description:
      "RLHF transforms a text completer into a helpful assistant. But optimize too hard and the model learns to tell you what you want to hear, not what's true.",
  },
  {
    id: 14,
    slug: "14-image-generation",
    title: "Creating Images from Noise",
    subtitle: "Diffusion models and latent space",
    prerequisites: [4, 5],
    description:
      "Pixel-by-pixel generation fails. Diffusion models start with pure noise and denoise. Latent space is a map of all possible images.",
  },
];

export function getChapter(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug);
}

export function getAdjacentChapters(slug: string): {
  prev: Chapter | undefined;
  next: Chapter | undefined;
} {
  const idx = chapters.findIndex((c) => c.slug === slug);
  return {
    prev: idx > 0 ? chapters[idx - 1] : undefined,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : undefined,
  };
}
