# Notebook Sync — Unit B / embeddings.ipynb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `notebooks/embeddings.ipynb` from scratch so it mirrors the `embeddings` chapter section by section. Walks: load GloVe (300d) and find nearest neighbors → projection-onto-line for word spectra → all four arithmetic patterns from the chapter → tokenization with tiktoken → train word2vec (skip-gram + negative sampling) on text8 from scratch and visualize the learned embeddings.

**Architecture:** Build via a one-shot `/tmp/build-embeddings-notebook.py` Python script using `nbformat` (same pattern as the neurons plan). The script overwrites the existing `notebooks/embeddings.ipynb`. Cells appended in topical groups; final task runs the builder, executes via `jupyter nbconvert`, runs spot-check verifications (especially that word2vec actually produces sensible clusters), clears outputs, then commits.

**Tech Stack:** Python 3 + PyTorch + matplotlib + tiktoken + scikit-learn (PCA) + numpy. Uses existing `pnpm test:notebooks` infra (jupyter at `/Users/robennals/Library/Python/3.9/bin/jupyter`).

**Reference docs:**
- Spec: `docs/plans/notebook-sync-unit-b.md` (embeddings section)
- Philosophy: `docs/plans/notebook-philosophy.md` (especially principle 5b)
- Chapter: `src/app/(tutorial)/embeddings/content.mdx`

All commands below assume working directory `/Users/robennals/broomy-repos/ai-explained/meta/colabs` and the `chapter/notebook-rework-unit-b` branch.

**One-time prerequisites:** the implementer should ensure `tiktoken` and `scikit-learn` are installed (`pip install tiktoken scikit-learn` if missing). `urllib`, `zipfile` are stdlib. GloVe download (~862MB zip → 300d.txt is ~1GB) is already cached from Unit A — verify with `ls -la notebooks/glove.6B.300d.txt`. text8 will be downloaded fresh.

---

## Task 1: Builder skeleton — cells 1-2 (title + imports)

**Files:**
- Create: `/tmp/build-embeddings-notebook.py`

- [ ] **Step 1: Write the skeleton**

```python
"""One-shot builder for notebooks/embeddings.ipynb. Run once and discard."""

import nbformat as nbf

CELLS = []

def md(text):
    CELLS.append(nbf.v4.new_markdown_cell(text))

def code(text):
    CELLS.append(nbf.v4.new_code_cell(text))

# --- Cell 1: title + links ---
md(
    "# From Words to Meanings — Try it in PyTorch\n"
    "\n"
    "This is an **optional** hands-on companion to "
    "[Chapter 5: From Words to Meanings](https://learnai.robennals.org/embeddings). "
    "I'll explore a real 300-dimensional GloVe embedding, project words onto a "
    "spectrum line, do vector arithmetic on word meanings, see how a real tokenizer "
    "splits text, and then train my own word embeddings from scratch using word2vec.\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# --- Cell 2: imports ---
code(
    "import torch\n"
    "import torch.nn as nn\n"
    "import urllib.request\n"
    "import os\n"
    "import zipfile\n"
    "import matplotlib.pyplot as plt"
)

# Later tasks append more cells above this line.

# --- Build and write ---
nb = nbf.v4.new_notebook()
nb['cells'] = CELLS
nb['metadata'] = {
    'kernelspec': {
        'display_name': 'Python 3',
        'language': 'python',
        'name': 'python3',
    },
    'language_info': {'name': 'python'},
}

nbf.write(nb, 'notebooks/embeddings.ipynb')
print(f'Wrote notebooks/embeddings.ipynb with {len(CELLS)} cells')
```

- [ ] **Step 2: Verify the script parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-embeddings-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 2: Append cells 3-5 (Exploring a Real Embedding — load GloVe + neighbors)

**Files:**
- Modify: `/tmp/build-embeddings-notebook.py`

- [ ] **Step 1: Insert load + neighbors cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 3: Exploring a Real Embedding markdown ---
md(
    "## Exploring a Real Embedding\n"
    "\n"
    "I'll start with a real pre-trained embedding: **GloVe**, created by Stanford. "
    "Each word is a point in 300-dimensional space, trained on billions of words of "
    "text. The full embedding contains 400,000 words.\n"
    "\n"
    "First I download and load it. The full zip is ~862MB; if running in Colab the "
    "download takes a minute or two."
)

# --- Cell 4: Download + load GloVe ---
code(
    "glove_path = 'glove.6B.300d.txt'\n"
    "if not os.path.exists(glove_path):\n"
    "    print('Downloading GloVe embeddings (~862MB zip — this takes a minute)...')\n"
    "    urllib.request.urlretrieve(\n"
    "        'https://huggingface.co/stanfordnlp/glove/resolve/main/glove.6B.zip',\n"
    "        'glove.6B.zip',\n"
    "    )\n"
    "    with zipfile.ZipFile('glove.6B.zip', 'r') as z:\n"
    "        z.extract('glove.6B.300d.txt')\n"
    "    print('Done!')\n"
    "\n"
    "print('Loading 300d embeddings into a dict (this takes a couple of minutes)...')\n"
    "word_vecs = {}\n"
    "with open(glove_path, 'r') as f:\n"
    "    for line in f:\n"
    "        parts = line.split()\n"
    "        word = parts[0]\n"
    "        vec = torch.tensor([float(x) for x in parts[1:]])\n"
    "        word_vecs[word] = vec\n"
    "print(f'Loaded {len(word_vecs)} word vectors of dim {len(next(iter(word_vecs.values())))}')"
)

# --- Cell 5: Top-5 nearest neighbors ---
code(
    "def nearest(word, top_k=5):\n"
    "    \"\"\"Find top-k nearest neighbors of `word` by cosine similarity.\"\"\"\n"
    "    if word not in word_vecs:\n"
    "        return []\n"
    "    target = word_vecs[word]\n"
    "    scored = []\n"
    "    for w, v in word_vecs.items():\n"
    "        if w == word:\n"
    "            continue\n"
    "        sim = torch.cosine_similarity(target.unsqueeze(0), v.unsqueeze(0)).item()\n"
    "        scored.append((w, sim))\n"
    "    scored.sort(key=lambda x: -x[1])\n"
    "    return scored[:top_k]\n"
    "\n"
    "for seed in ['dog', 'guitar', 'queen']:\n"
    "    print(f'\\n--- nearest to {seed} ---')\n"
    "    for w, s in nearest(seed):\n"
    "        print(f'  {w:15s} {s:.3f}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-embeddings-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 3: Append cells 6-7 (Directions Have Meaning — spectrum)

**Files:**
- Modify: `/tmp/build-embeddings-notebook.py`

- [ ] **Step 1: Insert spectrum cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 6: Directions Have Meaning markdown ---
md(
    "## Directions Have Meaning\n"
    "\n"
    "The embedding doesn't just group similar words together — *directions* in the space "
    "carry meaning too. The chapter's `WordPairSpectrumWidget` finds words that genuinely "
    "lie on the line between two endpoints (not just words similar to one endpoint).\n"
    "\n"
    "I'll implement the same algorithm: for each candidate word, project it onto the line "
    "between two endpoint words. Keep words whose projection lies *between* the endpoints "
    "(parameter `t` in [0.05, 0.95]) and that don't sit too far off the line."
)

# --- Cell 7: Spectrum projection algorithm ---
code(
    "def spectrum(word_a, word_b, candidates, top_k=10, t_min=0.05, t_max=0.95):\n"
    "    \"\"\"Find words whose embedding lies along the line from word_a to word_b.\"\"\"\n"
    "    vec_a = word_vecs[word_a]\n"
    "    vec_b = word_vecs[word_b]\n"
    "    line_dir = vec_b - vec_a\n"
    "    line_len_sq = (line_dir ** 2).sum()\n"
    "\n"
    "    results = []\n"
    "    for w in candidates:\n"
    "        if w in (word_a, word_b) or w not in word_vecs:\n"
    "            continue\n"
    "        v = word_vecs[w]\n"
    "        offset = v - vec_a\n"
    "        t = ((offset * line_dir).sum() / line_len_sq).item()\n"
    "        if not (t_min < t < t_max):\n"
    "            continue\n"
    "        proj = vec_a + t * line_dir\n"
    "        perp = float(((v - proj) ** 2).sum().sqrt())\n"
    "        results.append((w, t, perp))\n"
    "\n"
    "    # Sort by perpendicular distance (closest to the line first), then take top_k\n"
    "    # and re-sort by t so the spectrum reads in order.\n"
    "    results.sort(key=lambda r: r[2])\n"
    "    selected = results[:top_k]\n"
    "    selected.sort(key=lambda r: r[1])\n"
    "    return selected\n"
    "\n"
    "# Use a candidate pool of 50k most common GloVe words (rare words mostly add noise)\n"
    "candidate_pool = list(word_vecs.keys())[:50_000]\n"
    "\n"
    "for a, b in [('rabbit', 'elephant'), ('salad', 'cake'), ('tiny', 'huge')]:\n"
    "    print(f'\\n--- spectrum from {a} to {b} ---')\n"
    "    for w, t, perp in spectrum(a, b, candidate_pool):\n"
    "        print(f'  t={t:.2f}  perp={perp:.2f}  {w}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-embeddings-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 4: Append cells 8-9 (Adding Meaning — vector arithmetic)

**Files:**
- Modify: `/tmp/build-embeddings-notebook.py`

- [ ] **Step 1: Insert arithmetic cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 8: Adding Meaning markdown ---
md(
    "## Adding Meaning\n"
    "\n"
    "If directions in embedding space carry meaning, then adding a vector to a word "
    "moves its meaning along that direction. I can extract a transformation as a "
    "subtraction (`elephant − mouse` = \"bigger animal\") and apply it as an addition.\n"
    "\n"
    "Below are the four patterns the chapter highlights: bigger-animal, capital-of, "
    "gender-swap, and present-participle. Each is computed as `b − a + c`."
)

# --- Cell 9: All four arithmetic patterns ---
code(
    "def analogy(a, b, c, top_k=3):\n"
    "    \"\"\"a is to b as c is to ???  →  return top-k candidates by cosine similarity.\"\"\"\n"
    "    target = word_vecs[b] - word_vecs[a] + word_vecs[c]\n"
    "    scored = []\n"
    "    for w, v in word_vecs.items():\n"
    "        if w in (a, b, c):\n"
    "            continue\n"
    "        sim = torch.cosine_similarity(target.unsqueeze(0), v.unsqueeze(0)).item()\n"
    "        scored.append((w, sim))\n"
    "    scored.sort(key=lambda x: -x[1])\n"
    "    return scored[:top_k]\n"
    "\n"
    "patterns = [\n"
    "    ('bigger animal',     'mouse',  'elephant', 'rabbit'),\n"
    "    ('capital of',        'france', 'paris',    'japan'),\n"
    "    ('gender swap',       'man',    'king',     'woman'),\n"
    "    ('present participle','walk',   'walking',  'run'),\n"
    "]\n"
    "\n"
    "for label, a, b, c in patterns:\n"
    "    top = analogy(a, b, c)\n"
    "    print(f'{label}: {b} - {a} + {c} =')\n"
    "    for w, s in top:\n"
    "        print(f'  {w:15s} {s:.3f}')\n"
    "    print()"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-embeddings-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 5: Append cells 10-11 (From Words to Tokens — tiktoken)

**Files:**
- Modify: `/tmp/build-embeddings-notebook.py`

- [ ] **Step 1: Insert tokenization cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 10: Tokenization markdown ---
md(
    "## From Words to Tokens\n"
    "\n"
    "Real language models don't treat each whole word as one unit — they break text into "
    "**tokens** that can be whole words, parts of words, or punctuation. I'll use **tiktoken**, "
    "OpenAI's tokenizer for GPT-4. Notice how common words become a single token while rare or "
    "made-up words get split into recognizable parts."
)

# --- Cell 11: Tiktoken demo ---
code(
    "import tiktoken\n"
    "\n"
    "enc = tiktoken.get_encoding('cl100k_base')  # the GPT-4 tokenizer\n"
    "\n"
    "def show_tokens(text):\n"
    "    ids = enc.encode(text)\n"
    "    tokens = [enc.decode([i]) for i in ids]\n"
    "    print(f'  text:   {text!r}')\n"
    "    print(f'  tokens: {tokens}')\n"
    "    print(f'  ids:    {ids}')\n"
    "    print()\n"
    "\n"
    "for text in [\n"
    "    'superman, superb, superlative',\n"
    "    'qwertyflorp',\n"
    "    'Hello, world! How are you?',\n"
    "    'The cat sat on the mat.',\n"
    "]:\n"
    "    show_tokens(text)"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-embeddings-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 6: Append cells 12-14 (Where Do Embeddings Come From? — text8 download + vocab)

**Files:**
- Modify: `/tmp/build-embeddings-notebook.py`

- [ ] **Step 1: Insert text8 + vocab cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 12: Where Do Embeddings Come From? markdown ---
md(
    "## Where Do Embeddings Come From?\n"
    "\n"
    "GloVe is **pre-trained**. Where do those vectors actually come from? I'll train my own "
    "embeddings from scratch using **word2vec** (skip-gram with negative sampling) — the same "
    "core idea behind modern embedding layers, just simpler. Word2vec learns by trying to predict "
    "which words appear near which other words.\n"
    "\n"
    "I'll train on **text8** — Matt Mahoney's standard ~100MB Wikipedia text dump, the canonical "
    "tiny corpus for word2vec demos. The download is ~30MB compressed. Training takes a few minutes "
    "(faster on a GPU; switch the Colab runtime to **T4 GPU** for ~5x speedup)."
)

# --- Cell 13: Download + read text8 ---
code(
    "text8_path = 'text8'\n"
    "if not os.path.exists(text8_path):\n"
    "    print('Downloading text8.zip (~30MB)...')\n"
    "    urllib.request.urlretrieve('https://mattmahoney.net/dc/text8.zip', 'text8.zip')\n"
    "    with zipfile.ZipFile('text8.zip', 'r') as z:\n"
    "        z.extract('text8')\n"
    "    print('Done!')\n"
    "\n"
    "print('Reading text8...')\n"
    "with open(text8_path, 'r') as f:\n"
    "    text = f.read()\n"
    "tokens = text.split()\n"
    "print(f'  {len(tokens):,} total tokens')\n"
    "print(f'  first 20 tokens: {tokens[:20]}')"
)

# --- Cell 14: Build vocab including chapter examples ---
code(
    "from collections import Counter\n"
    "\n"
    "VOCAB_SIZE = 10_000\n"
    "EXAMPLE_WORDS = ['the', 'dog', 'cat', 'fish', 'car', 'apple', 'king', 'piano']\n"
    "\n"
    "counts = Counter(tokens)\n"
    "most_common = [w for w, _ in counts.most_common(VOCAB_SIZE)]\n"
    "\n"
    "# Make sure all chapter example words are in the vocab even if they're rare\n"
    "for w in EXAMPLE_WORDS:\n"
    "    if w not in most_common:\n"
    "        most_common.append(w)\n"
    "        print(f'  added {w!r} (rank {[w_ for w_,_ in counts.most_common()].index(w)})')\n"
    "\n"
    "word_to_id = {w: i for i, w in enumerate(most_common)}\n"
    "id_to_word = most_common\n"
    "vocab_size = len(word_to_id)\n"
    "print(f'\\nVocab size: {vocab_size}')\n"
    "\n"
    "# Convert tokens to ids, dropping OOV\n"
    "token_ids = [word_to_id[w] for w in tokens if w in word_to_id]\n"
    "print(f'In-vocab tokens: {len(token_ids):,} ({len(token_ids)/len(tokens):.1%} of corpus)')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-embeddings-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 7: Append cells 15-16 (Skip-gram model + training)

**Files:**
- Modify: `/tmp/build-embeddings-notebook.py`

- [ ] **Step 1: Insert skip-gram cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 15: Skip-gram model definition ---
code(
    "EMBED_DIM = 100\n"
    "WINDOW = 5\n"
    "NEG_SAMPLES = 5\n"
    "\n"
    "device = 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu')\n"
    "print(f'Training on {device}')\n"
    "if device == 'cpu':\n"
    "    print('  (For ~5x speedup, switch the Colab runtime to T4 GPU.)')\n"
    "\n"
    "class SkipGramNeg(nn.Module):\n"
    "    \"\"\"Skip-gram with negative sampling: each word has two embeddings,\n"
    "    one as a center word and one as a context word.\"\"\"\n"
    "\n"
    "    def __init__(self, vocab_size, embed_dim):\n"
    "        super().__init__()\n"
    "        self.in_emb = nn.Embedding(vocab_size, embed_dim)\n"
    "        self.out_emb = nn.Embedding(vocab_size, embed_dim)\n"
    "        # Initialize input embeddings small, output to zero (Mikolov-style)\n"
    "        nn.init.uniform_(self.in_emb.weight, -0.5/embed_dim, 0.5/embed_dim)\n"
    "        nn.init.zeros_(self.out_emb.weight)\n"
    "\n"
    "    def forward(self, centers, contexts, negatives):\n"
    "        # centers: (B,) ; contexts: (B,) ; negatives: (B, K)\n"
    "        c = self.in_emb(centers)            # (B, D)\n"
    "        ctx = self.out_emb(contexts)        # (B, D)\n"
    "        neg = self.out_emb(negatives)       # (B, K, D)\n"
    "        pos_score = (c * ctx).sum(dim=1)                      # (B,)\n"
    "        neg_score = torch.bmm(neg, c.unsqueeze(2)).squeeze(2) # (B, K)\n"
    "        # Maximize log-sigmoid of positive, log-sigmoid of negated negatives\n"
    "        loss = -torch.nn.functional.logsigmoid(pos_score).mean() \\\n"
    "               - torch.nn.functional.logsigmoid(-neg_score).mean()\n"
    "        return loss\n"
    "\n"
    "model = SkipGramNeg(vocab_size, EMBED_DIM).to(device)\n"
    "n_params = sum(p.numel() for p in model.parameters())\n"
    "print(f'Model parameters: {n_params:,}')"
)

# --- Cell 16: Training loop ---
code(
    "import random\n"
    "import time\n"
    "\n"
    "EPOCHS = 3\n"
    "BATCH_SIZE = 1024\n"
    "LR = 0.005\n"
    "\n"
    "# Pre-build skip-gram pairs from a SUBSAMPLE of the corpus to keep training time bounded.\n"
    "# Subsampling frequent words (Mikolov's trick) accelerates training and improves quality.\n"
    "import math\n"
    "freq = torch.tensor([counts.get(id_to_word[i], 0) for i in range(vocab_size)], dtype=torch.float32)\n"
    "p_word = freq / freq.sum()\n"
    "# Subsample: keep word with probability sqrt(t / f) where t is a small constant\n"
    "t_subsample = 1e-4\n"
    "keep_prob = torch.clamp((torch.sqrt(t_subsample / p_word) + t_subsample / p_word), max=1.0)\n"
    "\n"
    "rng = random.Random(0)\n"
    "filtered_ids = [i for i in token_ids if rng.random() < keep_prob[i].item()]\n"
    "print(f'After subsampling: {len(filtered_ids):,} tokens (from {len(token_ids):,})')\n"
    "\n"
    "# Negative sampling distribution: unigram^0.75\n"
    "neg_probs = (freq ** 0.75)\n"
    "neg_probs = neg_probs / neg_probs.sum()\n"
    "\n"
    "# Build all (center, context) pairs once\n"
    "print('Building skip-gram pairs...')\n"
    "centers, contexts = [], []\n"
    "for i, c_id in enumerate(filtered_ids):\n"
    "    # Random window size in [1, WINDOW] (Mikolov-style — biases toward closer context)\n"
    "    w = rng.randint(1, WINDOW)\n"
    "    lo, hi = max(0, i - w), min(len(filtered_ids), i + w + 1)\n"
    "    for j in range(lo, hi):\n"
    "        if j == i: continue\n"
    "        centers.append(c_id)\n"
    "        contexts.append(filtered_ids[j])\n"
    "centers = torch.tensor(centers, dtype=torch.long)\n"
    "contexts = torch.tensor(contexts, dtype=torch.long)\n"
    "n_pairs = len(centers)\n"
    "print(f'Total skip-gram pairs: {n_pairs:,}')\n"
    "\n"
    "optimizer = torch.optim.Adam(model.parameters(), lr=LR)\n"
    "\n"
    "model.train()\n"
    "for epoch in range(EPOCHS):\n"
    "    t0 = time.time()\n"
    "    perm = torch.randperm(n_pairs)\n"
    "    total_loss = 0.0\n"
    "    n_batches = 0\n"
    "    for i in range(0, n_pairs, BATCH_SIZE):\n"
    "        batch = perm[i:i+BATCH_SIZE]\n"
    "        c = centers[batch].to(device)\n"
    "        x = contexts[batch].to(device)\n"
    "        n = torch.multinomial(neg_probs, len(batch) * NEG_SAMPLES, replacement=True)\n"
    "        n = n.view(len(batch), NEG_SAMPLES).to(device)\n"
    "        loss = model(c, x, n)\n"
    "        optimizer.zero_grad()\n"
    "        loss.backward()\n"
    "        optimizer.step()\n"
    "        total_loss += loss.item()\n"
    "        n_batches += 1\n"
    "    print(f'Epoch {epoch+1}/{EPOCHS}  loss={total_loss/n_batches:.4f}  time={time.time()-t0:.1f}s')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-embeddings-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 8: Append cells 17-18 (PCA + scatter plot, plus closing markdown)

**Files:**
- Modify: `/tmp/build-embeddings-notebook.py`

- [ ] **Step 1: Insert PCA + plot + closing cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 17: PCA + scatter plot of learned embeddings ---
code(
    "from sklearn.decomposition import PCA\n"
    "import numpy as np\n"
    "\n"
    "# Pull the input embeddings (the conventional 'word embedding' from skip-gram)\n"
    "trained_vecs = model.in_emb.weight.detach().cpu().numpy()\n"
    "\n"
    "# Pick which words to plot: chapter's 8 example tokens plus a few neighbors so clusters are visible\n"
    "extra_words = ['puppy', 'kitten', 'truck', 'apple', 'banana', 'queen', 'guitar', 'piano', 'violin', 'horse']\n"
    "plot_words = list(dict.fromkeys(EXAMPLE_WORDS + extra_words))  # dedupe, preserve order\n"
    "plot_words = [w for w in plot_words if w in word_to_id]\n"
    "ids = [word_to_id[w] for w in plot_words]\n"
    "vecs_to_plot = trained_vecs[ids]\n"
    "\n"
    "# PCA to 2D for visualization\n"
    "pca = PCA(n_components=2)\n"
    "coords = pca.fit_transform(vecs_to_plot)\n"
    "\n"
    "plt.figure(figsize=(9, 7))\n"
    "plt.scatter(coords[:, 0], coords[:, 1], s=40)\n"
    "for w, (x, y) in zip(plot_words, coords):\n"
    "    plt.annotate(w, (x, y), xytext=(5, 5), textcoords='offset points', fontsize=11)\n"
    "plt.title('Word2vec embeddings trained on text8 (PCA to 2D)')\n"
    "plt.grid(True, alpha=0.3)\n"
    "plt.tight_layout()\n"
    "plt.show()\n"
    "\n"
    "# Sanity check: cosine similarity in the FULL learned space (not the 2D projection)\n"
    "def cossim(a, b):\n"
    "    return float(torch.cosine_similarity(\n"
    "        torch.tensor(trained_vecs[word_to_id[a]]).unsqueeze(0),\n"
    "        torch.tensor(trained_vecs[word_to_id[b]]).unsqueeze(0),\n"
    "    ))\n"
    "\n"
    "print('\\nQuick sanity check (cosine similarity in the trained 100d space):')\n"
    "print(f'  cossim(dog, cat) = {cossim(\"dog\", \"cat\"):.3f}')\n"
    "print(f'  cossim(dog, car) = {cossim(\"dog\", \"car\"):.3f}')\n"
    "print(f'  cossim(cat, car) = {cossim(\"cat\", \"car\"):.3f}')\n"
    "print('Expected: dog/cat similarity > dog/car and cat/car similarity (animals cluster).')"
)

# --- Cell 18: Closing ---
md(
    "---\n"
    "\n"
    "*This notebook accompanies [Chapter 5: From Words to Meanings](https://learnai.robennals.org/embeddings). "
    "Next up: [Chapter 6: Understanding by Predicting](https://learnai.robennals.org/next-word-prediction) — "
    "where I'll build a next-word predictor that uses these embedding ideas to generalize across similar words.*\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-embeddings-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 9: Build, execute, verify, clear outputs, commit

**Files:**
- Overwrite: `notebooks/embeddings.ipynb`

- [ ] **Step 1: Run the builder**

```bash
python3 /tmp/build-embeddings-notebook.py
```

Expected: `Wrote notebooks/embeddings.ipynb with 18 cells`.

- [ ] **Step 2: Execute the notebook end-to-end**

This is the longest-running notebook in Unit B. The GloVe load is slow (~3-5 min on the first run, faster if `notebooks/glove.6B.300d.txt` is already extracted). The text8 download is ~30MB. The word2vec training is the expensive part — on CPU it'll take 5-15 min for 3 epochs; on MPS/GPU it's much faster.

Use the absolute path to jupyter:

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --to notebook --execute notebooks/embeddings.ipynb --output embeddings.ipynb --ExecutePreprocessor.timeout=2400
```

Expected: `[NbConvertApp] Writing ... to notebooks/embeddings.ipynb`, no errors.

- [ ] **Step 3: Spot-check the analogy outputs**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/embeddings.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'patterns =' in ''.join(c['source']):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: the four chapter analogies produce sensible top-1 results:
- `bigger animal: elephant - mouse + rabbit` → top result should be a larger mammal (lion, deer, rhinoceros, etc.)
- `capital of: paris - france + japan` → `tokyo` in top 3
- `gender swap: king - man + woman` → `queen` in top 3
- `present participle: walking - walk + run` → `running` in top 3

- [ ] **Step 4: Spot-check the spectrum outputs**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/embeddings.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'spectrum from' in ''.join(c.get('source', '')) or ('candidate_pool' in ''.join(c.get('source', ''))):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
                break
"
```

Expected: at least one of the three spectra (rabbit→elephant, salad→cake, tiny→huge) contains visibly intermediate words. For rabbit→elephant, expect mid-size mammals (cat, dog, deer, monkey, etc.) sorted roughly by t. If the result is empty for all three, the perpendicular threshold is too tight; increase `t_max` or relax filtering and re-execute.

- [ ] **Step 5: Spot-check the word2vec quality (the load-bearing test)**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/embeddings.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'cossim(dog' in ''.join(c.get('source', '')):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: `cossim(dog, cat)` is **larger than** both `cossim(dog, car)` and `cossim(cat, car)`. If not, training did not converge — increase `EPOCHS` to 5 or `EMBED_DIM` to 150 in the builder script and re-execute.

- [ ] **Step 6: Spot-check tiktoken**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/embeddings.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'tiktoken' in ''.join(c.get('source', '')):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: tokens for `qwertyflorp` are split into multiple subword pieces. Tokens for common phrases come out close to whole words.

- [ ] **Step 7: Clear executed outputs**

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --clear-output --inplace notebooks/embeddings.ipynb
```

Expected: `[NbConvertApp] Writing ... to notebooks/embeddings.ipynb`.

- [ ] **Step 8: Verify outputs cleared**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/embeddings.ipynb'))
for c in nb['cells']:
    if c['cell_type'] != 'code': continue
    assert c.get('execution_count') is None, 'has exec count'
    assert c.get('outputs') == [], 'has outputs'
print('clean')
"
```

Expected: `clean`.

- [ ] **Step 9: Commit**

```bash
git add notebooks/embeddings.ipynb && git commit -m "$(cat <<'EOF'
Rework embeddings notebook to mirror chapter section by section

Rebuilds notebooks/embeddings.ipynb from scratch under philosophy
principle 5b. Walks the chapter top-to-bottom: load 300d GloVe and
print top-5 nearest neighbors for chapter examples, project words
onto a spectrum line between two endpoints (mirrors
WordPairSpectrumWidget), compute all four chapter arithmetic
patterns (bigger-animal, capital-of, gender-swap, present-
participle), tokenize with tiktoken's cl100k_base (GPT-4 tokenizer)
on the chapter's example words, then train word2vec (skip-gram with
negative sampling) from scratch on text8 and visualize the result
with PCA. Skips chapter sections that are pure intuition (Adding a
Second Dimension, Beyond Two Dimensions, Beyond Words). First-person
voice throughout.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 10: Verify the commit**

```bash
git log -1 --stat
```

Expected: one file modified — `notebooks/embeddings.ipynb`.

---

## Notes for the executing engineer

- `jupyter` is at `/Users/robennals/Library/Python/3.9/bin/jupyter` — not on `PATH`. Always use the absolute path.
- `tiktoken` and `scikit-learn` may need to be installed (`pip install tiktoken scikit-learn`).
- GloVe is already cached from Unit A. If `notebooks/glove.6B.300d.txt` exists, the GloVe download cell skips. text8 is fresh (~30MB).
- **Word2vec quality is load-bearing.** If `cossim(dog, cat)` does not exceed `cossim(dog, car)` and `cossim(cat, car)` after the planned EPOCHS/EMBED_DIM, the demo has failed. First remedy: bump EPOCHS to 5; second: bump EMBED_DIM to 150. Re-execute and re-check. Do not commit a failed word2vec result.
- Don't push.
- Don't touch any other files.
