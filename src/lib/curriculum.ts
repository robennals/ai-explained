export interface Chapter {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  prerequisites: number[];
  description: string;
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
  },
  {
    id: 2,
    slug: "02-optimization",
    title: "The Power of Incremental Improvement",
    subtitle: "Why reliable tiny improvements beat brilliant design",
    prerequisites: [1],
    description:
      "Evolution, A/B testing, and gradient descent are all the same algorithm. The secret to building complex things: small changes, tested against reality, kept or discarded.",
  },
  {
    id: 3,
    slug: "03-neurons",
    title: "Neural Networks",
    subtitle: "The building block that can compute anything",
    prerequisites: [2],
    description:
      "A neuron is a smooth logic gate. Stack them with nonlinear activations and they can compute anything — without activation, depth is an illusion.",
  },
  {
    id: 4,
    slug: "04-matrix-math",
    title: "Matrix Math and Linear Transformations",
    subtitle: "Neural networks as geometry",
    prerequisites: [3],
    description:
      "Every layer is a geometric transformation. Training is learning which rotation, scaling, and shearing to apply.",
  },
  {
    id: 5,
    slug: "05-training",
    title: "Training, Gradient Descent, Backpropagation",
    subtitle: "Rolling downhill in a million dimensions",
    prerequisites: [3, 4],
    description:
      "Gradient descent, saddle points vs local minima, learning rate, momentum, Adam, and flat vs sharp minima.",
  },
  {
    id: 6,
    slug: "06-loss-functions",
    title: "Loss Functions",
    subtitle: "Defining what 'wrong' means",
    prerequisites: [5],
    description:
      "MSE, cross-entropy, Huber loss. The loss function shapes what the model learns. Cross-entropy as compression.",
  },
  {
    id: 7,
    slug: "07-regularization",
    title: "Regularization and Generalization",
    subtitle: "Why perfect training is perfectly terrible",
    prerequisites: [5, 6],
    description:
      "Overfitting, L1/L2 regularization, dropout. Why deliberately handicapping the model makes it better.",
  },
  {
    id: 8,
    slug: "08-embeddings",
    title: "Embeddings and Vector Spaces",
    subtitle: "The geometry of meaning",
    prerequisites: [4, 5],
    description:
      "From one-hot to learned representations. Word analogies, semantic structure, and rotatable dimensions of meaning.",
  },
  {
    id: 9,
    slug: "09-recurrent",
    title: "Recurrent Architectures",
    subtitle: "Memory, forgetting, and the telephone game",
    prerequisites: [3, 8],
    description:
      "RNNs, LSTMs, vanishing gradients through time, and why memory decays. Historical context for attention.",
  },
  {
    id: 10,
    slug: "10-attention-transformers",
    title: "Attention and Transformers",
    subtitle: "The architecture that changed everything",
    prerequisites: [4, 8, 9],
    description:
      "Self-attention, Q/K/V, position encoding, multi-head attention. Why transformers replaced RNNs.",
  },
  {
    id: 11,
    slug: "11-tokenization",
    title: "Tokenization",
    subtitle: "The ugly plumbing that shapes what models see",
    prerequisites: [8],
    description:
      "BPE, token artifacts, why LLMs can't do arithmetic, cross-language efficiency. Tokenization as compression.",
  },
  {
    id: 12,
    slug: "12-pretraining-finetuning",
    title: "Pre-training and Fine-tuning",
    subtitle: "Learning everything by predicting the next word",
    prerequisites: [5, 10, 11],
    description:
      "Next-token prediction, transfer learning, few-shot magic. Pre-training as education, fine-tuning as specialization.",
  },
  {
    id: 13,
    slug: "13-scaling-laws",
    title: "Scaling Laws",
    subtitle: "Smooth trends, sudden capabilities",
    prerequisites: [12],
    description:
      "Power laws, Chinchilla scaling, emergence. Predictable loss curves, unpredictable capability jumps.",
  },
  {
    id: 14,
    slug: "14-rlhf-alignment",
    title: "RLHF and Alignment",
    subtitle: "Teaching AI what humans actually want",
    prerequisites: [5, 12],
    description:
      "Reward models, Goodhart's Law, reward hacking, KL penalties, the alignment tax.",
  },
  {
    id: 15,
    slug: "15-modern-architectures",
    title: "Modern Architectures",
    subtitle: "GPT, BERT, T5, and Mixture of Experts",
    prerequisites: [10, 12, 13],
    description:
      "Attention masks, causal vs bidirectional, encoder-decoder, sparse routing, temperature and sampling.",
  },
  {
    id: 16,
    slug: "16-image-generation",
    title: "Image Generation",
    subtitle: "Creating images from noise and numbers",
    prerequisites: [5, 8, 15],
    description:
      "Autoencoders, VAEs, diffusion models. Train real toy models in the browser.",
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
