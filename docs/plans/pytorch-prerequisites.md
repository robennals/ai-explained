# PyTorch Notebook Prerequisites

Tracks which PyTorch/Python concepts each notebook uses before they're formally taught. When adding or modifying notebooks, update this file.

## Assumptions across all notebooks

- Basic Python (variables, loops, functions, f-strings)
- `pip install` for package management

## Forward references by notebook

### computation.ipynb

No forward references. Only uses `torch.tensor`, basic arithmetic, and matplotlib.

### optimization.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `requires_grad` / autograd | Chapter 3 (backpropagation) | Described as "PyTorch doing the calculus for you" |
| `.backward()` | Chapter 3 | Explained as "compute the gradient automatically" |

### neurons.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `nn.Linear` (matrix multiply) | Chapter 5 | Noted as forward reference; explained as "handles weights and bias" |
| `nn.BCELoss` | Chapter 6 (loss functions) | Described as "loss function for yes/no problems" |
| `torch.optim.SGD` | Chapter 2 (gradient descent) | Described as "does the step-downhill part automatically" |

### vectors.ipynb

No forward references. Uses `torch.tensor`, `torch.dot`, basic arithmetic, and `torch.sigmoid` — all covered in earlier chapters or the PyTorch appendix. Assumes appendix-level tensor familiarity.

### embeddings.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `nn.Embedding` | Chapter 5 (the chapter itself) | Fully explained in notebook |
| Cosine similarity | Chapter 4 (vectors) | Defined in notebook as "measures whether two vectors point in the same direction" |
| Skip-gram with negative sampling | N/A (briefly motivated in notebook) | Notebook implements word2vec from scratch with one-line motivation |
| `sklearn.decomposition.PCA` | N/A | Used only for 2D visualization; treated as a black box |
| External dependency: `tiktoken`, `scikit-learn` | N/A | Install instruction provided |
| External download: GloVe (~862MB zip) | N/A | Download automated in notebook |
| External download: text8 (~30MB zip) | N/A | Download automated in notebook |

### next-word-prediction.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `nn.Embedding` | Chapter 5 (embeddings) | Already covered by the time the reader reaches this notebook |
| `nn.Linear`, `nn.ReLU` | Chapter 5 (the matrix-math chapter, future) | Brief inline explanation as "weighted sum + nonlinearity" |
| `nn.CrossEntropyLoss` | N/A | One-line explanation: "compares predicted probabilities to the correct token" |
| `torch.optim.Adam` | Chapter 2 (optimization) | Already covered |
| `torch.multinomial` (sampling) | N/A | Inline: "draw a sample from a probability distribution" |
| Temperature sampling | Chapter 6 (the chapter itself) | Fully explained in notebook |
| External dependencies: `datasets`, `tokenizers` | N/A | Install instruction provided |
| External download: TinyStories first-50k (streaming, ~30s) | N/A | HuggingFace `datasets` streaming, automated |
| External download: WordPiece tokenizer JSON (~90KB) | N/A | Fetched from raw.githubusercontent.com |

### attention.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `torch.softmax` | Chapter 7 (the chapter itself) | Fully explained — the notebook implements softmax from scratch alongside the built-in |
| `torch.bmm` (batch matmul) | Chapter 5 (matrix-math, future) | One-line inline: "batched dot products" |
| `nn.Linear` for Q/K/V projections | Chapter 7 (the chapter itself) | Explained as "single-layer NN with no activation" |
| HuggingFace `transformers` BERT | N/A | Treated as a black box that exposes attention weights |
| External dependency: `transformers` | N/A | Install instruction provided |
| External download: `bert-base-uncased` (~440MB) | N/A | Cached after first run by `from_pretrained` |

### matrix-math.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `nn.Linear` internals | Chapter 5 (the chapter itself) | Fully explained — the main point of this notebook section |
| ReLU activation | Chapter 5 | Defined in notebook |

### positions.ipynb

No forward references. Uses `torch.tensor`, `torch.dot`, `math.cos`/`math.sin` for 2D rotations, `torch.softmax`, `torch.triu`, `masked_fill`, and matplotlib for the multi-speed RoPE curves. Reuses the toy attention setup from `attention.ipynb`.

## When adding a new notebook

1. List any PyTorch concepts used before their chapter
2. Ensure each forward reference has a brief inline explanation
3. Add the notebook to this table
