# Notebook Sync — Unit B / next-word-prediction.ipynb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `notebooks/next-word-prediction.ipynb` from scratch so it mirrors the `next-word-prediction` chapter section by section. Walks: load the same tokenizer + TinyStories first-50k subset that the chapter's deployed model uses → bigram counts with the chapter's "33% for 'of the'" reproduced + temperature sampling → train the deployed-architecture neural-net predictor (`nn.Embedding(4096, 64) → flatten → nn.Linear(192, 128) → ReLU → nn.Linear(128, 4096)`) → temperature sampling on the chapter's example prompts.

**Architecture:** Build via a one-shot `/tmp/build-next-word-prediction-notebook.py` Python script using `nbformat`. Cells appended in topical groups; final task runs the builder, executes via `jupyter nbconvert`, runs the spot-check verifications (especially that NN predictions on "once upon a" land somewhere sensible like "time"), clears outputs, then commits.

**Tech Stack:** Python 3 + PyTorch + HuggingFace `datasets` (streaming) + HuggingFace `tokenizers`. The repo's pre-trained WordPiece tokenizer is downloaded from raw.githubusercontent.com.

**Reference docs:**
- Spec: `docs/plans/notebook-sync-unit-b.md` (next-word-prediction section)
- Source of truth for the deployed model: `scripts/train-next-word-model.py`
- Philosophy: `docs/plans/notebook-philosophy.md` (especially principle 5b)
- Chapter: `src/app/(tutorial)/next-word-prediction/content.mdx`

All commands below assume working directory `/Users/robennals/broomy-repos/ai-explained/meta/colabs` and the `chapter/notebook-rework-unit-b` branch.

**One-time prerequisites:** the implementer should ensure `datasets` and `tokenizers` are installed (`pip install datasets tokenizers` if missing).

---

## Task 1: Builder skeleton — cells 1-2 (title + imports)

**Files:**
- Create: `/tmp/build-next-word-prediction-notebook.py`

- [ ] **Step 1: Write the skeleton**

```python
"""One-shot builder for notebooks/next-word-prediction.ipynb. Run once and discard."""

import nbformat as nbf

CELLS = []

def md(text):
    CELLS.append(nbf.v4.new_markdown_cell(text))

def code(text):
    CELLS.append(nbf.v4.new_code_cell(text))

# --- Cell 1: title + links ---
md(
    "# Understanding by Predicting — Try it in PyTorch\n"
    "\n"
    "This is an **optional** hands-on companion to "
    "[Chapter 6: Understanding by Predicting](https://learnai.robennals.org/next-word-prediction). "
    "I'll build a bigram model from word counts (reproducing the chapter's \"33% for 'of the'\" "
    "statistic), then train the same neural-network next-word predictor that powers the chapter's "
    "interactive widget — using the same tokenizer, the same TinyStories subset, and the same "
    "architecture as the deployed model.\n"
    "\n"
    "**Recommended:** switch the Colab runtime to **T4 GPU** (Runtime → Change runtime type) for "
    "~5x faster training. CPU works too but takes longer.\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# --- Cell 2: imports ---
code(
    "import torch\n"
    "import torch.nn as nn\n"
    "import torch.nn.functional as F\n"
    "import urllib.request\n"
    "import os\n"
    "import time\n"
    "from collections import Counter"
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

nbf.write(nb, 'notebooks/next-word-prediction.ipynb')
print(f'Wrote notebooks/next-word-prediction.ipynb with {len(CELLS)} cells')
```

- [ ] **Step 2: Verify the script parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-next-word-prediction-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 2: Append cells 3-4 (Setup tokenizer)

**Files:**
- Modify: `/tmp/build-next-word-prediction-notebook.py`

- [ ] **Step 1: Insert tokenizer cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 3: Setup markdown ---
md(
    "## Setup: same tokenizer, same corpus as the deployed model\n"
    "\n"
    "I'll use the WordPiece tokenizer (4096 tokens) and TinyStories subset (first 50,000 stories) "
    "that the chapter's deployed neural-net predictor was trained on — so when I train the model, "
    "I should get predictions of the same quality as the chapter's widget.\n"
    "\n"
    "First, the tokenizer. It's a small JSON file living in the project repo."
)

# --- Cell 4: Download + load tokenizer ---
code(
    "from tokenizers import Tokenizer\n"
    "\n"
    "TOKENIZER_PATH = 'ts-tokenizer-4096.json'\n"
    "if not os.path.exists(TOKENIZER_PATH):\n"
    "    print('Downloading WordPiece tokenizer...')\n"
    "    url = 'https://raw.githubusercontent.com/robennals/ai-explained/main/public/data/tokenizer/ts-tokenizer-4096.json'\n"
    "    urllib.request.urlretrieve(url, TOKENIZER_PATH)\n"
    "    print('Done!')\n"
    "\n"
    "tokenizer = Tokenizer.from_file(TOKENIZER_PATH)\n"
    "vocab_size = tokenizer.get_vocab_size()\n"
    "print(f'Vocab size: {vocab_size}')\n"
    "\n"
    "# Sanity check: tokenize a chapter example\n"
    "example = 'once upon a time'\n"
    "ids = tokenizer.encode(example).ids\n"
    "tokens = [tokenizer.id_to_token(i) for i in ids]\n"
    "print(f\"\\n  text:   {example!r}\")\n"
    "print(f'  tokens: {tokens}')\n"
    "print(f'  ids:    {ids}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-next-word-prediction-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 3: Append cell 5 (Download + tokenize TinyStories)

**Files:**
- Modify: `/tmp/build-next-word-prediction-notebook.py`

- [ ] **Step 1: Insert TinyStories cell**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 5: Load + tokenize first 50k TinyStories ---
code(
    "from datasets import load_dataset\n"
    "\n"
    "NUM_STORIES = 50_000\n"
    "\n"
    "print(f'Loading first {NUM_STORIES} TinyStories from HuggingFace (streaming)...')\n"
    "ds = load_dataset('roneneldan/TinyStories', split='train', streaming=True)\n"
    "\n"
    "all_ids = []\n"
    "t0 = time.time()\n"
    "for i, story in enumerate(ds):\n"
    "    if i >= NUM_STORIES:\n"
    "        break\n"
    "    enc = tokenizer.encode(story['text'])\n"
    "    all_ids.append(enc.ids)\n"
    "    if (i + 1) % 5000 == 0:\n"
    "        print(f'  Tokenized {i + 1:,} stories...  ({time.time() - t0:.1f}s)')\n"
    "\n"
    "total_tokens = sum(len(s) for s in all_ids)\n"
    "print(f'\\nDone: {len(all_ids):,} stories, {total_tokens:,} total tokens')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-next-word-prediction-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 4: Append cells 6-8 (Bigram section)

**Files:**
- Modify: `/tmp/build-next-word-prediction-notebook.py`

- [ ] **Step 1: Insert bigram cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 6: Bigram markdown ---
md(
    "## Bigrams: count what comes next\n"
    "\n"
    "The simplest next-word predictor: for every word, count what word usually comes after it. "
    "I'll build a bigram count table from my tokenized stories, then look up the most common "
    "next tokens for a few seed words.\n"
    "\n"
    "The chapter promises that \"of\" is most often followed by \"the\" (about 33% of the time). "
    "Let me see if I get the same number."
)

# --- Cell 7: Build bigram counts + show top predictions ---
code(
    "# Build a bigram count table: bigram_counts[a][b] = how often b followed a\n"
    "bigram_counts = [Counter() for _ in range(vocab_size)]\n"
    "for story in all_ids:\n"
    "    for a, b in zip(story[:-1], story[1:]):\n"
    "        bigram_counts[a][b] += 1\n"
    "\n"
    "def top_next(seed_word, top_k=5):\n"
    "    seed_id = tokenizer.encode(seed_word).ids\n"
    "    if len(seed_id) != 1:\n"
    "        print(f'  WARNING: {seed_word!r} encodes to {len(seed_id)} tokens — using the last one')\n"
    "    seed_id = seed_id[-1]\n"
    "    counts = bigram_counts[seed_id]\n"
    "    total = sum(counts.values())\n"
    "    if total == 0:\n"
    "        print(f'  no bigrams found for {seed_word!r}')\n"
    "        return\n"
    "    top = counts.most_common(top_k)\n"
    "    print(f'\\nTop {top_k} next tokens after {seed_word!r} (out of {total:,} occurrences):')\n"
    "    for next_id, count in top:\n"
    "        next_tok = tokenizer.id_to_token(next_id)\n"
    "        print(f'  {next_tok:15s} {count:7,}  ({count/total:.1%})')\n"
    "\n"
    "for seed in ['of', 'he', 'she', 'the']:\n"
    "    top_next(seed)"
)

# --- Cell 8: Bigram temperature sampling ---
code(
    "import math\n"
    "import random\n"
    "\n"
    "def sample_with_temperature(counts, temperature):\n"
    "    \"\"\"Sample a next token id from a Counter of (next_id -> count) at given temperature.\"\"\"\n"
    "    items = list(counts.items())\n"
    "    if not items:\n"
    "        return None\n"
    "    # Convert counts to probabilities, then re-shape with temperature\n"
    "    total = sum(c for _, c in items)\n"
    "    log_probs = [math.log(c / total) / max(temperature, 1e-6) for _, c in items]\n"
    "    # Subtract max for numerical stability, exponentiate, normalize\n"
    "    m = max(log_probs)\n"
    "    weights = [math.exp(lp - m) for lp in log_probs]\n"
    "    s = sum(weights)\n"
    "    r = random.random() * s\n"
    "    acc = 0.0\n"
    "    for (next_id, _), w in zip(items, weights):\n"
    "        acc += w\n"
    "        if r <= acc:\n"
    "            return next_id\n"
    "    return items[-1][0]\n"
    "\n"
    "def generate_bigram(seed_word, n_tokens=20, temperature=1.0, seed=42):\n"
    "    random.seed(seed)\n"
    "    seed_id = tokenizer.encode(seed_word).ids[-1]\n"
    "    out = [seed_id]\n"
    "    for _ in range(n_tokens):\n"
    "        nxt = sample_with_temperature(bigram_counts[out[-1]], temperature)\n"
    "        if nxt is None:\n"
    "            break\n"
    "        out.append(nxt)\n"
    "    return tokenizer.decode(out)\n"
    "\n"
    "for temperature in [0.3, 1.0, 1.5]:\n"
    "    print(f'\\n--- temperature {temperature} ---')\n"
    "    print(generate_bigram('once', n_tokens=30, temperature=temperature))"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-next-word-prediction-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 5: Append cells 9-11 (NN predictor: model + training)

**Files:**
- Modify: `/tmp/build-next-word-prediction-notebook.py`

- [ ] **Step 1: Insert NN model + training cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 9: NN markdown ---
md(
    "## Neural network predictor\n"
    "\n"
    "Bigrams generalize poorly: the model has no idea that \"the cat\" and \"the dog\" should produce "
    "similar predictions, because they share zero state. A neural network with embeddings fixes this — "
    "similar words get similar embeddings, so the network's predictions for similar contexts come out "
    "similar automatically.\n"
    "\n"
    "I'll replicate the **exact architecture** the chapter's deployed widget uses: embed each of the last "
    "3 tokens into 64 dimensions, flatten, pass through a 128-unit ReLU layer, then to a softmax over the "
    "vocab. Trained for 5 epochs on the same 50,000 TinyStories.\n"
    "\n"
    "On a T4 GPU this trains in 3-5 minutes; on CPU, 15-20 minutes."
)

# --- Cell 10: Model definition + training data prep ---
code(
    "CONTEXT_LEN = 3\n"
    "EMBED_DIM = 64\n"
    "HIDDEN_DIM = 128\n"
    "EPOCHS = 5\n"
    "BATCH_SIZE = 1024\n"
    "LR = 1e-3\n"
    "\n"
    "device = 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu')\n"
    "print(f'Training on {device}')\n"
    "if device == 'cpu':\n"
    "    print('  (For ~5x speedup, switch the Colab runtime to T4 GPU.)')\n"
    "\n"
    "class NextWordModel(nn.Module):\n"
    "    \"\"\"Simple next-word predictor: embed context tokens, flatten, dense, softmax.\"\"\"\n"
    "    def __init__(self, vocab_size, embed_dim, context_len, hidden_dim):\n"
    "        super().__init__()\n"
    "        self.context_len = context_len\n"
    "        self.embedding = nn.Embedding(vocab_size, embed_dim)\n"
    "        self.fc1 = nn.Linear(context_len * embed_dim, hidden_dim)\n"
    "        self.fc2 = nn.Linear(hidden_dim, vocab_size)\n"
    "\n"
    "    def forward(self, x):\n"
    "        # x: (batch, context_len) of token ids\n"
    "        e = self.embedding(x)               # (batch, context_len, embed_dim)\n"
    "        e = e.view(e.size(0), -1)           # (batch, context_len * embed_dim)\n"
    "        h = F.relu(self.fc1(e))             # (batch, hidden_dim)\n"
    "        return self.fc2(h)                  # (batch, vocab_size)\n"
    "\n"
    "model = NextWordModel(vocab_size, EMBED_DIM, CONTEXT_LEN, HIDDEN_DIM).to(device)\n"
    "n_params = sum(p.numel() for p in model.parameters())\n"
    "print(f'Model parameters: {n_params:,}')\n"
    "\n"
    "# Build training data: (context_len consecutive tokens, next token) pairs\n"
    "print('\\nBuilding training pairs...')\n"
    "xs, ys = [], []\n"
    "for story in all_ids:\n"
    "    if len(story) <= CONTEXT_LEN:\n"
    "        continue\n"
    "    for i in range(len(story) - CONTEXT_LEN):\n"
    "        xs.append(story[i : i + CONTEXT_LEN])\n"
    "        ys.append(story[i + CONTEXT_LEN])\n"
    "X = torch.tensor(xs, dtype=torch.long)\n"
    "Y = torch.tensor(ys, dtype=torch.long)\n"
    "print(f'Training samples: {len(X):,}')"
)

# --- Cell 11: Training loop ---
code(
    "optimizer = torch.optim.Adam(model.parameters(), lr=LR)\n"
    "loss_fn = nn.CrossEntropyLoss()\n"
    "\n"
    "n = len(X)\n"
    "split = int(n * 0.95)\n"
    "perm0 = torch.randperm(n)\n"
    "X, Y = X[perm0], Y[perm0]\n"
    "X_train, X_val = X[:split], X[split:]\n"
    "Y_train, Y_val = Y[:split], Y[split:]\n"
    "\n"
    "for epoch in range(EPOCHS):\n"
    "    t0 = time.time()\n"
    "    model.train()\n"
    "    perm = torch.randperm(len(X_train))\n"
    "    Xs = X_train[perm]\n"
    "    Ys = Y_train[perm]\n"
    "    total_loss = 0.0\n"
    "    n_batches = 0\n"
    "    for i in range(0, len(Xs), BATCH_SIZE):\n"
    "        xb = Xs[i:i+BATCH_SIZE].to(device)\n"
    "        yb = Ys[i:i+BATCH_SIZE].to(device)\n"
    "        logits = model(xb)\n"
    "        loss = loss_fn(logits, yb)\n"
    "        optimizer.zero_grad()\n"
    "        loss.backward()\n"
    "        optimizer.step()\n"
    "        total_loss += loss.item()\n"
    "        n_batches += 1\n"
    "    train_loss = total_loss / n_batches\n"
    "    # Validation\n"
    "    model.eval()\n"
    "    with torch.no_grad():\n"
    "        val_loss = 0.0\n"
    "        nv = 0\n"
    "        for i in range(0, len(X_val), BATCH_SIZE):\n"
    "            xb = X_val[i:i+BATCH_SIZE].to(device)\n"
    "            yb = Y_val[i:i+BATCH_SIZE].to(device)\n"
    "            logits = model(xb)\n"
    "            val_loss += loss_fn(logits, yb).item()\n"
    "            nv += 1\n"
    "        val_loss /= nv\n"
    "    print(f'Epoch {epoch+1}/{EPOCHS}  train={train_loss:.4f}  val={val_loss:.4f}  time={time.time()-t0:.1f}s')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-next-word-prediction-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 6: Append cells 12-13 (NN sampling + closing)

**Files:**
- Modify: `/tmp/build-next-word-prediction-notebook.py`

- [ ] **Step 1: Insert NN sampling + closing cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 12: NN predictions + temperature sampling ---
code(
    "def predict_next_top(prompt, top_k=5):\n"
    "    \"\"\"Show top-k predictions after `prompt`.\"\"\"\n"
    "    ids = tokenizer.encode(prompt).ids[-CONTEXT_LEN:]\n"
    "    if len(ids) < CONTEXT_LEN:\n"
    "        # Pad with the first token (a hack; real models use a special pad token)\n"
    "        ids = [ids[0]] * (CONTEXT_LEN - len(ids)) + ids\n"
    "    model.eval()\n"
    "    with torch.no_grad():\n"
    "        x = torch.tensor([ids], dtype=torch.long).to(device)\n"
    "        logits = model(x).squeeze(0)\n"
    "        probs = F.softmax(logits, dim=-1)\n"
    "        top = torch.topk(probs, top_k)\n"
    "    print(f'\\nAfter {prompt!r}:')\n"
    "    for prob, idx in zip(top.values.tolist(), top.indices.tolist()):\n"
    "        tok = tokenizer.id_to_token(idx)\n"
    "        print(f'  {tok:15s} {prob:.3f}')\n"
    "\n"
    "for prompt in ['once upon a', 'the little', 'she was very']:\n"
    "    predict_next_top(prompt)\n"
    "\n"
    "def generate_nn(prompt, n_tokens=30, temperature=1.0, seed=42):\n"
    "    torch.manual_seed(seed)\n"
    "    ids = tokenizer.encode(prompt).ids\n"
    "    model.eval()\n"
    "    with torch.no_grad():\n"
    "        for _ in range(n_tokens):\n"
    "            ctx = ids[-CONTEXT_LEN:]\n"
    "            if len(ctx) < CONTEXT_LEN:\n"
    "                ctx = [ctx[0]] * (CONTEXT_LEN - len(ctx)) + ctx\n"
    "            x = torch.tensor([ctx], dtype=torch.long).to(device)\n"
    "            logits = model(x).squeeze(0) / max(temperature, 1e-6)\n"
    "            probs = F.softmax(logits, dim=-1).cpu()\n"
    "            ids.append(int(torch.multinomial(probs, 1).item()))\n"
    "    return tokenizer.decode(ids)\n"
    "\n"
    "for temperature in [0.3, 0.8, 1.5]:\n"
    "    print(f'\\n--- temperature {temperature} ---')\n"
    "    print(generate_nn('once upon a time', n_tokens=40, temperature=temperature))"
)

# --- Cell 13: Closing ---
md(
    "---\n"
    "\n"
    "*This notebook accompanies [Chapter 6: Understanding by Predicting](https://learnai.robennals.org/next-word-prediction). "
    "Next up: [Chapter 7: Paying Attention](https://learnai.robennals.org/attention) — where I'll see "
    "how letting each word choose what other words to focus on lets the model reach beyond a fixed "
    "context window.*\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-next-word-prediction-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 7: Build, execute, verify, clear outputs, commit

**Files:**
- Overwrite: `notebooks/next-word-prediction.ipynb`

- [ ] **Step 1: Run the builder**

```bash
python3 /tmp/build-next-word-prediction-notebook.py
```

Expected: `Wrote notebooks/next-word-prediction.ipynb with 13 cells`.

- [ ] **Step 2: Execute the notebook end-to-end**

This notebook trains a model — long-running. Tokenizing 50k stories takes ~1-2 min; building training pairs takes a few sec; training takes 3-5 min on GPU/MPS or ~15-20 min on CPU.

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --to notebook --execute notebooks/next-word-prediction.ipynb --output next-word-prediction.ipynb --ExecutePreprocessor.timeout=2400
```

Expected: `[NbConvertApp] Writing ... to notebooks/next-word-prediction.ipynb`, no errors.

- [ ] **Step 3: Spot-check the bigram "of" → "the" statistic**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/next-word-prediction.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'bigram_counts =' in ''.join(c.get('source', '')):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: in the top tokens after `'of'`, `the` appears with a percentage between roughly 25% and 40% (the exact figure depends on TinyStories distribution; the chapter said 33% for English text generally, TinyStories may be slightly different but should be in the same ballpark).

- [ ] **Step 4: Spot-check the NN predictions**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/next-word-prediction.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'predict_next_top' in ''.join(c.get('source', '')):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected:
- After `'once upon a'`: top prediction is `time` (or has `time` in top 3 with high probability)
- After `'the little'`: top predictions are common nouns/adjectives that follow "little" in children's stories (boy, girl, mouse, ...)
- After `'she was very'`: top predictions are adjectives (happy, sad, tired, sleepy, ...)

If `time` is not in the top 3 after `'once upon a'`, training did not converge well. Bump EPOCHS to 7 and re-execute.

- [ ] **Step 5: Spot-check the NN generation samples**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/next-word-prediction.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'generate_nn' in ''.join(c.get('source', '')):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: at low temperature (0.3), generation is grammatical and somewhat repetitive. At high temperature (1.5), generation is wilder but still mostly readable.

- [ ] **Step 6: Clear executed outputs**

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --clear-output --inplace notebooks/next-word-prediction.ipynb
```

Expected: `[NbConvertApp] Writing ... to notebooks/next-word-prediction.ipynb`.

- [ ] **Step 7: Verify outputs cleared**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/next-word-prediction.ipynb'))
for c in nb['cells']:
    if c['cell_type'] != 'code': continue
    assert c.get('execution_count') is None, 'has exec count'
    assert c.get('outputs') == [], 'has outputs'
print('clean')
"
```

Expected: `clean`.

- [ ] **Step 8: Commit**

```bash
git add notebooks/next-word-prediction.ipynb && git commit -m "$(cat <<'EOF'
Rework next-word-prediction notebook to mirror chapter section by section

Rebuilds notebooks/next-word-prediction.ipynb from scratch under
philosophy principle 5b. Walks the chapter top-to-bottom: download
the same WordPiece tokenizer (vocab=4096) and TinyStories first-50k
subset that the chapter's deployed widget uses, build a bigram count
table and reproduce the chapter's "33% for 'of the'" statistic plus
temperature sampling, then train the same neural-net predictor
architecture (Embedding(4096,64) -> flatten -> Linear(192,128) ->
ReLU -> Linear(128,4096)) for 5 epochs with batch_size=1024 — same
hyperparameters as scripts/train-next-word-model.py — and sample
with temperature on chapter example prompts. Skips chapter sections
that are pure intuition or narrative softening (The Game, N-gram
Wall, More Context, "Just Predicts the Next Word", Friston framing).
First-person voice throughout.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Verify the commit**

```bash
git log -1 --stat
```

Expected: one file modified — `notebooks/next-word-prediction.ipynb`.

---

## Notes for the executing engineer

- `jupyter` is at `/Users/robennals/Library/Python/3.9/bin/jupyter` — not on `PATH`. Always use the absolute path.
- `pip install datasets tokenizers` may be needed.
- The HuggingFace `datasets` library streams TinyStories — no full download needed (~30s for the first 50k stories).
- The tokenizer is downloaded from raw.githubusercontent.com on the assumption that the file is in the public repo.
- **NN quality is load-bearing.** Step 4 verifies `time` is in top 3 after `'once upon a'`. If not, bump EPOCHS to 7 and re-execute. The deployed model gets `time` reliably.
- Don't push, don't touch other files.
