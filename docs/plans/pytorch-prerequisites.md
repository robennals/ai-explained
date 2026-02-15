# PyTorch Notebook Prerequisites

Tracks which PyTorch/Python concepts each notebook uses before they're formally taught. When adding or modifying notebooks, update this file.

## Assumptions across all notebooks

- Basic Python (variables, loops, functions, f-strings)
- `pip install` for package management

## Forward references by notebook

### 01-computation.ipynb

No forward references. Only uses `torch.tensor`, basic arithmetic, and matplotlib.

### 02-optimization.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `requires_grad` / autograd | Chapter 3 (backpropagation) | Described as "PyTorch doing the calculus for you" |
| `.backward()` | Chapter 3 | Explained as "compute the gradient automatically" |

### 03-neurons.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `nn.Linear` (matrix multiply) | Chapter 5 | Noted as forward reference; explained as "handles weights and bias" |
| `nn.BCELoss` | Chapter 6 (loss functions) | Described as "loss function for yes/no problems" |
| `torch.optim.SGD` | Chapter 2 (gradient descent) | Described as "does the step-downhill part automatically" |

### 04-embeddings.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `nn.Embedding` | Chapter 4 (the chapter itself) | Fully explained in notebook |
| Cosine similarity | Chapter 4 | Defined in notebook as "measures whether two vectors point in the same direction" |
| External dependency: `tiktoken` | N/A | Install instruction provided |
| External download: GloVe (~66MB) | N/A | Download automated in notebook |

### 05-matrix-math.ipynb

| Concept | Where explained | Notebook explanation |
|---------|----------------|---------------------|
| `nn.Linear` internals | Chapter 5 (the chapter itself) | Fully explained — the main point of this notebook section |
| ReLU activation | Chapter 5 | Defined in notebook |

## When adding a new notebook

1. List any PyTorch concepts used before their chapter
2. Ensure each forward reference has a brief inline explanation
3. Add the notebook to this table
