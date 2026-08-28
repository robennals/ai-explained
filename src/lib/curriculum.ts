export interface Chapter {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  prerequisites: number[];
  description: string;
  ready?: boolean;
  polishing?: boolean;
  section?: "appendix" | "intro";
}

export const chapters: Chapter[] = [
  {
    id: 0,
    slug: "introduction",
    title: "Introduction",
    subtitle: "What this is and how to use it",
    prerequisites: [],
    description:
      "An interactive tutorial about how modern AI actually works. The goal is a real, intuitive understanding, with no math or computer science background assumed.",
    ready: true,
    section: "intro",
  },
  {
    id: 1,
    slug: "computation",
    title: "Computation",
    subtitle: "Everything is numbers",
    prerequisites: [],
    description:
      "Text, images, and sound are all numbers. Thinking is a function. Models are machines with knobs. The challenge: find the right settings.",
    ready: true,
  },
  {
    id: 2,
    slug: "optimization",
    title: "Optimization",
    subtitle: "The power of incremental improvement",
    prerequisites: [1],
    description:
      "Evolution, A/B testing, and gradient descent are all the same algorithm. The secret to building complex things: small changes, tested against reality, kept or discarded.",
    ready: true,
  },
  {
    id: 3,
    slug: "neurons",
    title: "Neural Networks",
    subtitle: "Building a brain",
    prerequisites: [2],
    description:
      "A neuron is a smooth logic gate. Stack them in layers and they can compute anything — and backpropagation lets you train all the weights at once.",
    ready: true,
  },
  {
    id: 4,
    slug: "vectors",
    title: "Vectors",
    subtitle: "Describing the world with numbers",
    prerequisites: [3],
    description:
      "A vector is just a list of numbers — but lists of numbers can describe position, color, animals, and anything else. The dot product measures similarity, and a single neuron turns out to be a pattern detector built from one.",
    ready: true,
  },
  {
    id: 5,
    slug: "embeddings",
    title: "Embeddings",
    subtitle: "From words to meanings",
    prerequisites: [4],
    description:
      "From one-hot to learned representations. Word analogies, semantic structure, and the geometry of meaning.",
    ready: true,
  },
  {
    id: 6,
    slug: "next-word-prediction",
    title: "Next-Word Prediction",
    subtitle: "Understanding by predicting",
    prerequisites: [5],
    description:
      "If you can predict the next word accurately, you must understand grammar, facts, and common sense. From n-grams to neural networks — prediction REQUIRES understanding.",
    ready: true,
  },
  {
    id: 7,
    slug: "attention",
    title: "Attention",
    subtitle: "Letting words look at each other",
    prerequisites: [6],
    description:
      "Attention — letting each word choose which other words to focus on — is the breakthrough behind modern AI. Built from things you already know: embeddings, dot products, and neural networks.",
    ready: true,
  },
  {
    id: 8,
    slug: "positions",
    title: "Positional Encoding",
    subtitle: "Where am I?",
    prerequisites: [7],
    description:
      "Attention is position-blind — it has no idea where words are in a sentence. Distance penalties, rotation tricks, and the elegant geometry of RoPE fix this.",
    ready: true,
  },
  {
    id: 9,
    slug: "transformers",
    title: "Transformers",
    subtitle: "One architecture to rule them all",
    prerequisites: [8],
    description:
      "The transformer wires attention and neural networks together. Trained only to predict the next word, it learns grammar, narrative, and common sense — from nothing but prediction.",
    ready: true,
  },
  {
    id: 10,
    slug: "chat",
    title: "Chat Models",
    subtitle: "From predictor to assistant",
    prerequisites: [9],
    description:
      "A trained transformer completes documents. It does not answer questions, think before speaking, or look things up. Post-training, reasoning tokens, and tool calls are what turn one into the assistant you actually talk to.",
  },
  {
    id: 11,
    slug: "matrix-math",
    title: "Matrix Math",
    subtitle: "Thinking by rotating",
    prerequisites: [4],
    description:
      "Every layer is a transformation in space — a rotation, a stretch, a fold. The geometry of high-dimensional space is how neural networks reshape vectors of meaning.",
  },
  {
    id: 12,
    slug: "training",
    title: "Making Training Work",
    subtitle: "Why training almost doesn't work",
    prerequisites: [3],
    description:
      "Plain gradient descent on a deep network barely works. Activation functions (ReLU, Swish), regularization, dropout, learning rate schedules, and Adam are the hard-won tricks that make modern training possible.",
  },
  {
    id: 13,
    slug: "mixture-of-experts",
    title: "Mixture of Experts",
    subtitle: "Only wake the specialists you need",
    prerequisites: [9],
    description:
      "A router sends each question to specialist sub-networks. A trillion parameters, but only a fraction active per question. Smarter without getting slower.",
  },
  {
    id: 14,
    slug: "long-context",
    title: "Long Context",
    subtitle: "Remembering a million words",
    prerequisites: [9],
    description:
      "Attention scales as the square of the input — so how do models read entire books? KV caching, sparse attention, and position scaling tricks stretch memory from sentences to libraries.",
  },
  {
    id: 15,
    slug: "inference",
    title: "Inference and Hardware",
    subtitle: "Running models fast",
    prerequisites: [9],
    description:
      "GPUs, CUDA, FlashAttention, KV caching, speculative decoding, memory bandwidth — the engineering that makes inference cheap enough to use.",
  },
  {
    id: 16,
    slug: "interpretability",
    title: "Interpretability",
    subtitle: "Looking inside the mind",
    prerequisites: [9],
    description:
      "Models aren't black boxes anymore. Sparse autoencoders, feature visualization, and circuit tracing reveal what individual neurons mean — sometimes finding a literal Golden Gate Bridge neuron inside.",
  },
  {
    id: 17,
    slug: "reinforcement-learning",
    title: "Reinforcement Learning",
    subtitle: "Learning from experience",
    prerequisites: [2],
    description:
      "What if you don't have right answers, only rewards? RL learns from trial, error, and consequence — the algorithm behind robots that walk, agents that play games, and models that improve themselves.",
  },
  {
    id: 18,
    slug: "self-play",
    title: "Self-Play",
    subtitle: "Getting better by beating yourself",
    prerequisites: [17],
    description:
      "AlphaZero mastered chess and Go without ever seeing a human game — by playing itself, millions of times. The same idea now teaches reasoning models to think.",
  },
  {
    id: 19,
    slug: "alignment",
    title: "Alignment",
    subtitle: "Teaching AI right from wrong",
    prerequisites: [10, 17],
    description:
      "RLHF transforms a text completer into a helpful assistant. But optimize too hard and the model learns to tell you what you want to hear, not what's true.",
  },
  {
    id: 20,
    slug: "synthetic-data",
    title: "Distillation and Synthetic Data",
    subtitle: "Models teaching models",
    prerequisites: [9],
    description:
      "Train a small model to mimic a big one. Train a strong model on a weaker one's mistakes. Models can train models — and sometimes the student outgrows the teacher.",
  },
  {
    id: 21,
    slug: "vision",
    title: "Image Comprehension",
    subtitle: "Teaching machines to see",
    prerequisites: [9],
    description:
      "Cut an image into patches, treat them like tokens, feed them to a transformer. CLIP, ViT, and the trick that lets the same architecture read text and see pictures.",
  },
  {
    id: 22,
    slug: "image-generation",
    title: "Image Generation",
    subtitle: "Drawing pictures",
    prerequisites: [9],
    description:
      "Diffusion models start with pure noise and gradually paint a picture. Latent space is a map of all possible images — and you can walk between any two of them.",
  },
  {
    id: 23,
    slug: "world-models",
    title: "World Models",
    subtitle: "Simulating reality",
    prerequisites: [22],
    description:
      "Sora and Veo don't just animate frames — they learn physics. Genie generates playable game worlds it has never seen. Generative video as a learned simulator of reality.",
  },
  {
    id: 24,
    slug: "audio",
    title: "Audio",
    subtitle: "Listening, speaking, and singing",
    prerequisites: [9],
    description:
      "Sound is just numbers over time. Whisper transcribes any language. Voice cloning copies you from seconds. Music models compose. Audio fits into AI the same way text does — with surprises along the way.",
  },
  {
    id: 25,
    slug: "hallucination",
    title: "Hallucination and Grounding",
    subtitle: "Making stuff up",
    prerequisites: [9],
    description:
      "Models sound confident even when they're wrong. Next-word training all but guarantees it. Why hallucinations happen, why they're hard to detect, and what actually reduces them.",
  },
  {
    id: 26,
    slug: "context",
    title: "Context Management",
    subtitle: "Getting the right information",
    prerequisites: [5, 9],
    description:
      "A model's intelligence depends as much on what you put in front of it as on its weights. Retrieval, prompt construction, memory systems — the art of feeding the right facts at the right time.",
  },
  {
    id: 27,
    slug: "appendix-pytorch",
    title: "PyTorch from Scratch",
    subtitle: "A hands-on introduction to the code behind AI",
    prerequisites: [],
    description:
      "Install PyTorch, write your first tensor operations, and train a simple neural network. A standalone guide for readers who want to go from understanding to building.",
    section: "appendix",
    ready: true,
  },
  {
    id: 28,
    slug: "glossary",
    title: "Glossary",
    subtitle: "Words this tutorial uses, in one place",
    prerequisites: [],
    description:
      "Every technical word the tutorial uses, with a short definition and links to the chapters where it appears.",
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

export function getIntroChapter(): Chapter | undefined {
  return chapters.find((c) => c.section === "intro");
}

export function getAppendixChapters(): Chapter[] {
  return chapters.filter((c) => c.section === "appendix");
}

/**
 * How prose refers to a chapter, e.g. "Chapter 6". This is the single place the
 * wording lives, so changing how cross-references read is one edit here rather
 * than a sweep through every `content.mdx`. The number is a chapter's 1-based
 * position among the main chapters, derived from ordering so it stays correct if
 * chapters are reordered.
 */
export function getChapterRefLabel(chapter: Chapter): string {
  if (chapter.section === "appendix") return `Appendix ${getAppendixLabel(chapter)}`;
  if (chapter.section === "intro") return chapter.title;
  const idx = getMainChapters().findIndex((c) => c.id === chapter.id);
  return idx === -1 ? chapter.title : `Chapter ${idx + 1}`;
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
  // Navigate within the same section. The intro chapter is paired with the
  // main chapters so readers can move from the introduction into chapter 1
  // and back, but appendix chapters navigate among themselves.
  const pool =
    chapter?.section === "appendix"
      ? getAppendixChapters()
      : [...(getIntroChapter() ? [getIntroChapter()!] : []), ...getMainChapters()];
  const readyPool = pool.filter((c) => c.ready);
  const idx = readyPool.findIndex((c) => c.slug === slug);
  return {
    prev: idx > 0 ? readyPool[idx - 1] : undefined,
    next: idx < readyPool.length - 1 ? readyPool[idx + 1] : undefined,
  };
}
