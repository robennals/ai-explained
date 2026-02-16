export interface Chapter {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  prerequisites: number[];
  description: string;
  ready?: boolean;
  section?: "appendix";
}

export const chapters: Chapter[] = [
  {
    id: 1,
    slug: "computation",
    title: "Everything Is Numbers",
    subtitle: "The shape of the AI problem",
    prerequisites: [],
    description:
      "Text, images, and sound are all numbers. Thinking is a function. Models are machines with knobs. The challenge: find the right settings.",
    ready: true,
  },
  {
    id: 2,
    slug: "optimization",
    title: "The Power of Incremental Improvement",
    subtitle: "Why reliable tiny improvements beat brilliant design",
    prerequisites: [1],
    description:
      "Evolution, A/B testing, and gradient descent are all the same algorithm. The secret to building complex things: small changes, tested against reality, kept or discarded.",
    ready: true,
  },
  {
    id: 3,
    slug: "neurons",
    title: "Neural Networks",
    subtitle: "Simple building blocks, stacked into intelligence",
    prerequisites: [2],
    description:
      "A neuron is a smooth logic gate. Stack them in layers and they can compute anything — and backpropagation lets you train all the weights at once.",
    ready: true,
  },
  {
    id: 4,
    slug: "vectors",
    title: "Vectors",
    subtitle: "Lists of numbers that describe the world",
    prerequisites: [3],
    description:
      "A vector is just a list of numbers — but lists of numbers can describe position, color, animals, and anything else. See neurons as vector operations and discover why activation functions make depth meaningful.",
    ready: true,
  },
  {
    id: 5,
    slug: "embeddings",
    title: "Embeddings and Vector Spaces",
    subtitle: "How AI turns words into math",
    prerequisites: [4],
    description:
      "From one-hot to learned representations. Word analogies, semantic structure, and the geometry of meaning.",
    ready: true,
  },
  {
    id: 6,
    slug: "matrix-math",
    title: "Matrix Math and Linear Transformations",
    subtitle: "Neural networks as geometry",
    prerequisites: [4],
    description:
      "Every layer is a geometric transformation. See how matrices rotate, scale, and shear space — from 1D to 4D and beyond — and why that's the same thing as a layer of neurons.",
    ready: true,
  },
  {
    id: 7,
    slug: "next-word-prediction",
    title: "Predicting the Next Word",
    subtitle: "Why prediction requires understanding",
    prerequisites: [5, 6],
    description:
      "If you can predict the next word accurately, you must understand grammar, facts, and common sense. From n-grams to neural networks — prediction IS understanding.",
    ready: true,
  },
  {
    id: 8,
    slug: "attention",
    title: "Attention",
    subtitle: "Letting words choose what to look at",
    prerequisites: [7],
    description:
      "Attention — letting each word choose which other words to focus on — is the breakthrough behind modern AI. Built from things you already know: embeddings, dot products, and neural networks.",
  },
  {
    id: 9,
    slug: "transformers",
    title: "Transformers",
    subtitle: "The architecture that changed everything",
    prerequisites: [8],
    description:
      "The transformer wires attention and neural networks together. Trained only to predict the next word, it learns grammar, narrative, and common sense — from nothing but prediction.",
  },
  {
    id: 10,
    slug: "transfer-learning",
    title: "Transfer Learning",
    subtitle: "Train once, use everywhere",
    prerequisites: [9],
    description:
      "Pre-trained models transfer knowledge to new tasks with minimal data. Fine-tune on 1,000 examples and beat training from scratch on 100,000.",
  },
  {
    id: 11,
    slug: "distillation",
    title: "Distillation",
    subtitle: "Big model teaches small model",
    prerequisites: [10],
    description:
      "A giant model is too slow for your phone. Train a tiny model to mimic it using soft predictions. The teacher's intuition — 'dark knowledge' — transfers.",
  },
  {
    id: 12,
    slug: "mixture-of-experts",
    title: "Mixture of Experts",
    subtitle: "Not every neuron fires for every thought",
    prerequisites: [9],
    description:
      "A router sends each question to specialist sub-networks. A trillion parameters, but only a fraction active per question. Smarter without getting slower.",
  },
  {
    id: 13,
    slug: "thinking-step-by-step",
    title: "Thinking Step by Step",
    subtitle: "How AI learned to reason",
    prerequisites: [10],
    description:
      "Standard LLMs answer in one shot with no scratch paper. Chain-of-thought and thinking models use their own output as working memory to solve harder problems.",
  },
  {
    id: 14,
    slug: "scaling-emergence",
    title: "Scaling and Emergence",
    subtitle: "Bigger models, surprising abilities",
    prerequisites: [10],
    description:
      "10x bigger = smoothly better predictions. But individual capabilities appear suddenly — arithmetic, reasoning, translation quality jump at specific sizes.",
  },
  {
    id: 15,
    slug: "alignment",
    title: "Teaching AI Right from Wrong",
    subtitle: "RLHF, Goodhart's Law, and the alignment problem",
    prerequisites: [10],
    description:
      "RLHF transforms a text completer into a helpful assistant. But optimize too hard and the model learns to tell you what you want to hear, not what's true.",
  },
  {
    id: 16,
    slug: "image-generation",
    title: "Creating Images from Noise",
    subtitle: "Diffusion models and latent space",
    prerequisites: [7, 8],
    description:
      "Pixel-by-pixel generation fails. Diffusion models start with pure noise and denoise. Latent space is a map of all possible images.",
  },
  {
    id: 17,
    slug: "appendix-pytorch",
    title: "PyTorch from Scratch",
    subtitle: "A hands-on introduction to the code behind AI",
    prerequisites: [],
    description:
      "Install PyTorch, write your first tensor operations, and train a simple neural network. A standalone guide for readers who want to go from understanding to building.",
    section: "appendix",
    ready: true,
  },
];

export function getChapter(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug);
}

export function getMainChapters(): Chapter[] {
  return chapters.filter((c) => !c.section);
}

export function getAppendixChapters(): Chapter[] {
  return chapters.filter((c) => c.section === "appendix");
}

export function getAppendixLabel(chapter: Chapter): string {
  const appendixes = getAppendixChapters();
  const idx = appendixes.findIndex((c) => c.id === chapter.id);
  return `A${idx + 1}`;
}

export function getAdjacentChapters(slug: string): {
  prev: Chapter | undefined;
  next: Chapter | undefined;
} {
  const chapter = chapters.find((c) => c.slug === slug);
  // Navigate within the same section (main or appendix)
  const pool = chapter?.section === "appendix" ? getAppendixChapters() : getMainChapters();
  const readyPool = pool.filter((c) => c.ready);
  const idx = readyPool.findIndex((c) => c.slug === slug);
  return {
    prev: idx > 0 ? readyPool[idx - 1] : undefined,
    next: idx < readyPool.length - 1 ? readyPool[idx + 1] : undefined,
  };
}
