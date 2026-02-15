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
    slug: "03-neurons",
    title: "Neural Networks",
    subtitle: "The building block that can compute anything",
    prerequisites: [2],
    description:
      "A neuron is a smooth logic gate. Stack them with nonlinear activations and they can compute anything — without activation, depth is an illusion.",
    ready: true,
  },
  {
    id: 4,
    slug: "04-embeddings",
    title: "Embeddings and Vector Spaces",
    subtitle: "How AI turns words into math",
    prerequisites: [3],
    description:
      "From one-hot to learned representations. Word analogies, semantic structure, and the geometry of meaning.",
    ready: true,
  },
  {
    id: 5,
    slug: "05-matrix-math",
    title: "Matrix Math and Linear Transformations",
    subtitle: "Neural networks as geometry",
    prerequisites: [3],
    description:
      "Every layer is a geometric transformation. See how matrices rotate, scale, and shear space — from 1D to 4D and beyond — and why that's the same thing as a layer of neurons.",
    ready: true,
  },
  {
    id: 6,
    slug: "06-next-word-prediction",
    title: "Predicting the Next Word",
    subtitle: "Why prediction requires understanding",
    prerequisites: [4, 5],
    description:
      "If you can predict the next word accurately, you must understand grammar, facts, and common sense. From n-grams to neural networks — prediction IS understanding.",
    ready: true,
  },
  {
    id: 7,
    slug: "07-attention",
    title: "Attention",
    subtitle: "Letting words choose what to look at",
    prerequisites: [6],
    description:
      "Attention — letting each word choose which other words to focus on — is the breakthrough behind modern AI. Built from things you already know: embeddings, dot products, and neural networks.",
    ready: true,
  },
  {
    id: 8,
    slug: "08-transformers",
    title: "Transformers",
    subtitle: "The architecture that changed everything",
    prerequisites: [7],
    description:
      "The transformer wires attention and neural networks together. Trained only to predict the next word, it learns grammar, narrative, and common sense — from nothing but prediction.",
    ready: true,
  },
  {
    id: 9,
    slug: "09-transfer-learning",
    title: "Transfer Learning",
    subtitle: "Train once, use everywhere",
    prerequisites: [8],
    description:
      "Pre-trained models transfer knowledge to new tasks with minimal data. Fine-tune on 1,000 examples and beat training from scratch on 100,000.",
  },
  {
    id: 11,
    slug: "10-distillation",
    title: "Distillation",
    subtitle: "Big model teaches small model",
    prerequisites: [10],
    description:
      "A giant model is too slow for your phone. Train a tiny model to mimic it using soft predictions. The teacher's intuition — 'dark knowledge' — transfers.",
  },
  {
    id: 12,
    slug: "11-mixture-of-experts",
    title: "Mixture of Experts",
    subtitle: "Not every neuron fires for every thought",
    prerequisites: [8],
    description:
      "A router sends each question to specialist sub-networks. A trillion parameters, but only a fraction active per question. Smarter without getting slower.",
  },
  {
    id: 13,
    slug: "12-thinking-step-by-step",
    title: "Thinking Step by Step",
    subtitle: "How AI learned to reason",
    prerequisites: [9],
    description:
      "Standard LLMs answer in one shot with no scratch paper. Chain-of-thought and thinking models use their own output as working memory to solve harder problems.",
  },
  {
    id: 14,
    slug: "13-scaling-emergence",
    title: "Scaling and Emergence",
    subtitle: "Bigger models, surprising abilities",
    prerequisites: [10],
    description:
      "10x bigger = smoothly better predictions. But individual capabilities appear suddenly — arithmetic, reasoning, translation quality jump at specific sizes.",
  },
  {
    id: 15,
    slug: "14-alignment",
    title: "Teaching AI Right from Wrong",
    subtitle: "RLHF, Goodhart's Law, and the alignment problem",
    prerequisites: [9],
    description:
      "RLHF transforms a text completer into a helpful assistant. But optimize too hard and the model learns to tell you what you want to hear, not what's true.",
  },
  {
    id: 16,
    slug: "15-image-generation",
    title: "Creating Images from Noise",
    subtitle: "Diffusion models and latent space",
    prerequisites: [6, 7],
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
