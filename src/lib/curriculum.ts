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
    subtitle: "Computation",
    prerequisites: [],
    description:
      "Text, images, and sound are all numbers. Thinking is a function. Models are machines with knobs. The challenge: find the right settings.",
    ready: true,
  },
  {
    id: 2,
    slug: "optimization",
    title: "The Power of Incremental Improvement",
    subtitle: "Optimization",
    prerequisites: [1],
    description:
      "Evolution, A/B testing, and gradient descent are all the same algorithm. The secret to building complex things: small changes, tested against reality, kept or discarded.",
    ready: true,
  },
  {
    id: 3,
    slug: "neurons",
    title: "Building a Brain",
    subtitle: "Neural networks",
    prerequisites: [2],
    description:
      "A neuron is a smooth logic gate. Stack them in layers and they can compute anything — and backpropagation lets you train all the weights at once.",
    ready: true,
  },
  {
    id: 4,
    slug: "vectors",
    title: "Describing the World with Numbers",
    subtitle: "Vectors",
    prerequisites: [3],
    description:
      "A vector is just a list of numbers — but lists of numbers can describe position, color, animals, and anything else. See neurons as vector operations and discover why activation functions make depth meaningful.",
    ready: true,
  },
  {
    id: 5,
    slug: "embeddings",
    title: "From Words to Meanings",
    subtitle: "Embeddings",
    prerequisites: [4],
    description:
      "From one-hot to learned representations. Word analogies, semantic structure, and the geometry of meaning.",
    ready: true,
  },
  {
    id: 6,
    slug: "next-word-prediction",
    title: "Prediction Requires Understanding",
    subtitle: "Next-word prediction",
    prerequisites: [5],
    description:
      "If you can predict the next word accurately, you must understand grammar, facts, and common sense. From n-grams to neural networks — prediction IS understanding.",
    ready: true,
  },
  {
    id: 7,
    slug: "attention",
    title: "Paying Attention",
    subtitle: "Attention",
    prerequisites: [6],
    description:
      "Attention — letting each word choose which other words to focus on — is the breakthrough behind modern AI. Built from things you already know: embeddings, dot products, and neural networks.",
  },
  {
    id: 8,
    slug: "matrix-math",
    title: "Neural Networks as Geometry",
    subtitle: "Matrix math",
    prerequisites: [4],
    description:
      "Every layer is a geometric transformation. See how matrices rotate, scale, and shear space — from 1D to 4D and beyond — and why that's the same thing as a layer of neurons.",
  },
  {
    id: 9,
    slug: "transformers",
    title: "One Architecture to Rule Them All",
    subtitle: "Transformers",
    prerequisites: [7],
    description:
      "The transformer wires attention and neural networks together. Trained only to predict the next word, it learns grammar, narrative, and common sense — from nothing but prediction.",
  },
  {
    id: 10,
    slug: "transfer-learning",
    title: "Train Once, Adapt Everywhere",
    subtitle: "Transfer learning",
    prerequisites: [9],
    description:
      "Pre-trained models transfer knowledge to new tasks with minimal data. Fine-tune on 1,000 examples and beat training from scratch on 100,000.",
  },
  {
    id: 11,
    slug: "distillation",
    title: "Shrinking a Giant into Something Fast",
    subtitle: "Distillation",
    prerequisites: [10],
    description:
      "A giant model is too slow for your phone. Train a tiny model to mimic it using soft predictions. The teacher's intuition — 'dark knowledge' — transfers.",
  },
  {
    id: 12,
    slug: "mixture-of-experts",
    title: "Not Every Neuron Fires for Every Thought",
    subtitle: "Mixture of experts",
    prerequisites: [9],
    description:
      "A router sends each question to specialist sub-networks. A trillion parameters, but only a fraction active per question. Smarter without getting slower.",
  },
  {
    id: 13,
    slug: "thinking-step-by-step",
    title: "How AI Learned to Think Step by Step",
    subtitle: "Chain of thought",
    prerequisites: [10],
    description:
      "Standard LLMs answer in one shot with no scratch paper. Chain-of-thought and thinking models use their own output as working memory to solve harder problems.",
  },
  {
    id: 14,
    slug: "scaling-emergence",
    title: "Bigger Models, Surprising Abilities",
    subtitle: "Scaling and emergence",
    prerequisites: [10],
    description:
      "10x bigger = smoothly better predictions. But individual capabilities appear suddenly — arithmetic, reasoning, translation quality jump at specific sizes.",
  },
  {
    id: 15,
    slug: "alignment",
    title: "Teaching AI Right from Wrong",
    subtitle: "Alignment",
    prerequisites: [10],
    description:
      "RLHF transforms a text completer into a helpful assistant. But optimize too hard and the model learns to tell you what you want to hear, not what's true.",
  },
  {
    id: 16,
    slug: "image-generation",
    title: "Creating Images from Pure Noise",
    subtitle: "Image generation",
    prerequisites: [6, 7],
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
