# Notebook Sync — Unit B / attention.ipynb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `notebooks/attention.ipynb` from scratch so it mirrors the `attention` chapter section by section. Walks: build single-head Q/K/V attention from scratch with the chapter's exact 4-token toy vocab (cat/dog/blah/it) → load real BERT and visualize the 4 specific heads the chapter highlights → softmax from scratch on the chapter's 4 scenarios → extend toy with values → Q/K/V projections via nn.Linear.

**Architecture:** Build via `/tmp/build-attention-notebook.py`. Final task runs the builder, executes via `jupyter nbconvert`, runs verifications (especially that BERT loads successfully and the "Self / pronoun" head produces visible attention from "it" to nouns), clears outputs, then commits.

**Tech Stack:** Python 3 + PyTorch + matplotlib + HuggingFace `transformers`. BERT (`bert-base-uncased`, ~440MB) downloads on first run.

**Reference docs:**
- Spec: `docs/plans/notebook-sync-unit-b.md` (attention section)
- BERT extraction reference: `scripts/extract-bert-attention.py`
- Philosophy: `docs/plans/notebook-philosophy.md` (especially principle 5b)
- Chapter: `src/app/(tutorial)/attention/content.mdx`

All commands assume working directory `/Users/robennals/broomy-repos/ai-explained/meta/colabs` and the `chapter/notebook-rework-unit-b` branch.

**One-time prerequisites:** the implementer should ensure `transformers` is installed (`pip install transformers`).

---

## Task 1: Builder skeleton — cells 1-2 (title + imports)

**Files:**
- Create: `/tmp/build-attention-notebook.py`

- [ ] **Step 1: Write the skeleton**

```python
"""One-shot builder for notebooks/attention.ipynb. Run once and discard."""

import nbformat as nbf

CELLS = []

def md(text):
    CELLS.append(nbf.v4.new_markdown_cell(text))

def code(text):
    CELLS.append(nbf.v4.new_code_cell(text))

# --- Cell 1: title + links ---
md(
    "# Paying Attention — Try it in PyTorch\n"
    "\n"
    "This is an **optional** hands-on companion to "
    "[Chapter 7: Paying Attention](https://learnai.robennals.org/attention). "
    "I'll build single-head attention from scratch using the chapter's exact 4-token toy vocab "
    "(cat, dog, blah, it), implement softmax from scratch, extend with values, then peek inside "
    "real **BERT** to see what its actual attention heads have learned. Finally I'll see how the "
    "Q/K/V vectors come from `nn.Linear` projections of the embedding.\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# --- Cell 2: imports ---
code(
    "import torch\n"
    "import torch.nn as nn\n"
    "import torch.nn.functional as F\n"
    "import matplotlib.pyplot as plt\n"
    "import numpy as np"
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

nbf.write(nb, 'notebooks/attention.ipynb')
print(f'Wrote notebooks/attention.ipynb with {len(CELLS)} cells')
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-attention-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 2: Append cells 3-5 (Building Attention from Scratch — toy vocab + step-by-step attention)

**Files:**
- Modify: `/tmp/build-attention-notebook.py`

- [ ] **Step 1: Insert toy attention cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 3: Building Attention markdown ---
md(
    "## Building Attention from Scratch\n"
    "\n"
    "I'll start with the chapter's tiny toy: a 4-token vocabulary (cat, dog, blah, it) where each "
    "token has a 1D key (\"what I'm advertising\") and a 1D query (\"what I'm looking for\"). The "
    "key for nouns is 3, for filler tokens 0. The query is 3 for \"it\" (looking for nouns) and 0 "
    "for everything else. Attention scores come from the dot product of one token's query with every "
    "other token's key, then softmax to turn scores into percentages."
)

# --- Cell 4: Toy vocab + key/query table ---
code(
    "TOKEN_KEY = {'cat': 3.0, 'dog': 3.0, 'blah': 0.0, 'it': 0.0}\n"
    "TOKEN_QUERY = {'cat': 0.0, 'dog': 0.0, 'blah': 0.0, 'it': 3.0}\n"
    "\n"
    "print(f\"{'token':6s} {'key':>5s} {'query':>5s}\")\n"
    "print('-' * 20)\n"
    "for tok in TOKEN_KEY:\n"
    "    print(f'{tok:6s} {TOKEN_KEY[tok]:5.1f} {TOKEN_QUERY[tok]:5.1f}')"
)

# --- Cell 5: Step-by-step attention computation ---
code(
    "def softmax(scores):\n"
    "    \"\"\"Numerically-stable softmax.\"\"\"\n"
    "    scores = torch.tensor(scores, dtype=torch.float32)\n"
    "    m = scores.max()\n"
    "    exps = torch.exp(scores - m)\n"
    "    return (exps / exps.sum()).tolist()\n"
    "\n"
    "def attention_step(sentence, focus_token_index):\n"
    "    \"\"\"Compute attention from sentence[focus_token_index] to every token.\"\"\"\n"
    "    focus = sentence[focus_token_index]\n"
    "    q = TOKEN_QUERY[focus]\n"
    "    print(f'\\n--- attention from {focus!r} (position {focus_token_index}) ---')\n"
    "    print(f\"  query = {q}\")\n"
    "\n"
    "    print(f\"\\n  {'pos':>3s}  {'token':6s} {'key':>4s} {'q*k':>5s}\")\n"
    "    scores = []\n"
    "    for i, tok in enumerate(sentence):\n"
    "        k = TOKEN_KEY[tok]\n"
    "        score = q * k  # dot product (1D)\n"
    "        scores.append(score)\n"
    "        print(f'  {i:3d}  {tok:6s} {k:4.1f} {score:5.1f}')\n"
    "\n"
    "    weights = softmax(scores)\n"
    "    print(f\"\\n  attention weights (after softmax):\")\n"
    "    for tok, w in zip(sentence, weights):\n"
    "        bar = '#' * int(w * 40)\n"
    "        print(f'    {tok:6s} {w:.3f}  {bar}')\n"
    "    return weights\n"
    "\n"
    "# Chapter examples — focus is always 'it' (the last token in each)\n"
    "for sent in [\n"
    "    ['cat', 'blah', 'blah', 'it'],\n"
    "    ['cat', 'blah', 'dog', 'it'],\n"
    "    ['blah', 'blah', 'blah', 'it'],\n"
    "]:\n"
    "    attention_step(sent, len(sent) - 1)"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-attention-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 3: Append cells 6-7 (Softmax: Dividing Your Attention)

**Files:**
- Modify: `/tmp/build-attention-notebook.py`

- [ ] **Step 1: Insert softmax cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 6: Softmax markdown ---
md(
    "## Softmax: Dividing Your Attention\n"
    "\n"
    "Softmax turns arbitrary scores into positive numbers that add up to 100%. The key dynamic: "
    "**relative loudness wins**. A moderately-high score wins by default if everyone else is silent; "
    "a much-louder score drowns out a moderately-loud one; making all scores equally large changes "
    "nothing. Below I run the chapter's four scenarios."
)

# --- Cell 7: Softmax demo on chapter scenarios ---
code(
    "scenarios = [\n"
    "    ('All equal',                [1.0, 1.0, 1.0, 1.0]),\n"
    "    ('Moderate, rest silent',    [2.0, 0.0, 0.0, 0.0]),\n"
    "    ('Moderate meets loud',      [2.0, 6.0, 0.0, 0.0]),\n"
    "    ('All large but equal',      [8.0, 8.0, 8.0, 8.0]),\n"
    "]\n"
    "\n"
    "for label, scores in scenarios:\n"
    "    weights = softmax(scores)\n"
    "    print(f'\\n--- {label} ---')\n"
    "    print(f'  scores:  {scores}')\n"
    "    print(f'  weights: {[round(w, 3) for w in weights]}')\n"
    "    print(f'  sum:     {sum(weights):.4f}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-attention-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 4: Append cells 8-9 (Values: What Did You Find?)

**Files:**
- Modify: `/tmp/build-attention-notebook.py`

- [ ] **Step 1: Insert values cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 8: Values markdown ---
md(
    "## Values: What Did You Find?\n"
    "\n"
    "Attention so far tells us *where to look*. The third vector — the **value** — is *what gets said*. "
    "I'll give each toy token a value vector that encodes which animal it represents (cat = [1, 0], "
    "dog = [0, 1], filler and it = [0, 0]). Then I blend the values using the attention weights."
)

# --- Cell 9: Values + weighted-sum-of-values ---
code(
    "TOKEN_VALUE = {\n"
    "    'cat':  torch.tensor([1.0, 0.0]),\n"
    "    'dog':  torch.tensor([0.0, 1.0]),\n"
    "    'blah': torch.tensor([0.0, 0.0]),\n"
    "    'it':   torch.tensor([0.0, 0.0]),\n"
    "}\n"
    "\n"
    "def attention_with_values(sentence, focus_index):\n"
    "    focus = sentence[focus_index]\n"
    "    q = TOKEN_QUERY[focus]\n"
    "    scores = [q * TOKEN_KEY[tok] for tok in sentence]\n"
    "    weights = softmax(scores)\n"
    "    blended = torch.zeros(2)\n"
    "    for tok, w in zip(sentence, weights):\n"
    "        blended += w * TOKEN_VALUE[tok]\n"
    "    print(f'\\nFocus token: {focus!r} (position {focus_index})')\n"
    "    for tok, w in zip(sentence, weights):\n"
    "        print(f'  {tok:6s} weight={w:.3f}  value={TOKEN_VALUE[tok].tolist()}')\n"
    "    print(f'  blended value: {blended.tolist()}  (cat-ness {blended[0]:.3f}, dog-ness {blended[1]:.3f})')\n"
    "\n"
    "for sent in [\n"
    "    ['cat', 'blah', 'blah', 'it'],\n"
    "    ['cat', 'blah', 'dog', 'it'],\n"
    "    ['blah', 'blah', 'blah', 'it'],\n"
    "]:\n"
    "    attention_with_values(sent, len(sent) - 1)"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-attention-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 5: Append cells 10-12 (Real BERT attention)

**Files:**
- Modify: `/tmp/build-attention-notebook.py`

- [ ] **Step 1: Insert BERT cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 10: Real BERT markdown ---
md(
    "## Attention in a Real Model\n"
    "\n"
    "Toy attention with 1D scores is fine for getting the mechanism. Real models use vectors with "
    "hundreds of dimensions, multiple heads, and learn different patterns through training. Below I "
    "load **BERT** (`bert-base-uncased`, ~440MB on first download), run a sentence through it, and "
    "extract attention from four specific heads the chapter highlights. Each head has discovered a "
    "different pattern — one looks at the next word, one at the previous word, one resolves pronouns, "
    "and one spreads broadly across context."
)

# --- Cell 11: Load BERT + run a sentence ---
code(
    "from transformers import BertTokenizer, BertModel\n"
    "\n"
    "print('Loading BERT (downloads ~440MB on first run)...')\n"
    "bert_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')\n"
    "bert_model = BertModel.from_pretrained('bert-base-uncased', attn_implementation='eager')\n"
    "bert_model.eval()\n"
    "print('Loaded.')\n"
    "\n"
    "SENTENCE = 'The dog chased the cat because it was angry'\n"
    "inputs = bert_tokenizer(SENTENCE, return_tensors='pt')\n"
    "tokens = bert_tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])\n"
    "print(f'\\nTokens: {tokens}')\n"
    "\n"
    "with torch.no_grad():\n"
    "    outputs = bert_model(**inputs, output_attentions=True)\n"
    "\n"
    "# attentions is a tuple of 12 tensors (one per layer), each (batch, n_heads, seq, seq)\n"
    "print(f'\\nAttentions: {len(outputs.attentions)} layers, '\n"
    "      f'each tensor shape {outputs.attentions[0].shape}')"
)

# --- Cell 12: Visualize 4 specific heads ---
code(
    "# The 4 heads the chapter visualizes — same indices as scripts/extract-bert-attention.py\n"
    "INTERESTING_HEADS = [\n"
    "    (2, 0,  'Next word'),\n"
    "    (3, 5,  'Previous word'),\n"
    "    (4, 3,  'Self / pronoun'),\n"
    "    (6, 11, 'Broad context'),\n"
    "]\n"
    "\n"
    "fig, axes = plt.subplots(2, 2, figsize=(12, 12))\n"
    "for ax, (layer, head, label) in zip(axes.flat, INTERESTING_HEADS):\n"
    "    attn = outputs.attentions[layer][0, head].numpy()  # (seq, seq)\n"
    "    ax.imshow(attn, cmap='Blues', aspect='auto')\n"
    "    ax.set_title(f'Layer {layer} / Head {head}: {label}')\n"
    "    ax.set_xticks(range(len(tokens)))\n"
    "    ax.set_yticks(range(len(tokens)))\n"
    "    ax.set_xticklabels(tokens, rotation=45, ha='right')\n"
    "    ax.set_yticklabels(tokens)\n"
    "    ax.set_xlabel('attended to')\n"
    "    ax.set_ylabel('attending from')\n"
    "plt.tight_layout()\n"
    "plt.show()\n"
    "\n"
    "# Spot-check the 'Self / pronoun' head from the perspective of 'it'\n"
    "it_index = tokens.index('it')\n"
    "layer, head = 4, 3\n"
    "attn_from_it = outputs.attentions[layer][0, head, it_index].numpy()\n"
    "print(f\"\\n'Self / pronoun' head — attention from 'it':\")\n"
    "for tok, w in zip(tokens, attn_from_it):\n"
    "    bar = '#' * int(w * 40)\n"
    "    print(f'  {tok:10s} {w:.3f}  {bar}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-attention-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 6: Append cells 13-15 (Q/K/V from nn.Linear + closing)

**Files:**
- Modify: `/tmp/build-attention-notebook.py`

- [ ] **Step 1: Insert Q/K/V projection + closing cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 13: Q/K/V markdown ---
md(
    "## Where the Vectors Come From\n"
    "\n"
    "Real attention doesn't have hand-picked 1D keys and queries. Each token starts as an embedding, "
    "and the Q/K/V vectors come from feeding that embedding through three separate single-layer "
    "neural networks (`nn.Linear` with no activation function). Below I demonstrate that property: "
    "give the same Q/K/V projections to similar embeddings (cat, dog) and they produce similar Q/K/V; "
    "give them a very different embedding (it) and the projections come out very different."
)

# --- Cell 14: nn.Linear Q/K/V projections ---
code(
    "EMBED_DIM = 4\n"
    "PROJ_DIM = 3\n"
    "\n"
    "# Synthetic embeddings — cat and dog are similar; 'it' is very different\n"
    "EMBEDS = {\n"
    "    'cat': torch.tensor([1.0, 0.0, 0.1, 0.0]),\n"
    "    'dog': torch.tensor([0.9, 0.1, 0.0, 0.05]),\n"
    "    'it':  torch.tensor([0.0, 0.0, 0.5, 0.8]),\n"
    "}\n"
    "\n"
    "torch.manual_seed(0)\n"
    "Q_proj = nn.Linear(EMBED_DIM, PROJ_DIM, bias=False)\n"
    "K_proj = nn.Linear(EMBED_DIM, PROJ_DIM, bias=False)\n"
    "V_proj = nn.Linear(EMBED_DIM, PROJ_DIM, bias=False)\n"
    "\n"
    "with torch.no_grad():\n"
    "    for tok, emb in EMBEDS.items():\n"
    "        q = Q_proj(emb)\n"
    "        k = K_proj(emb)\n"
    "        v = V_proj(emb)\n"
    "        print(f'\\n{tok:5s} embedding={emb.tolist()}')\n"
    "        print(f'         Q={[round(x.item(), 3) for x in q]}')\n"
    "        print(f'         K={[round(x.item(), 3) for x in k]}')\n"
    "        print(f'         V={[round(x.item(), 3) for x in v]}')\n"
    "\n"
    "# Confirm cat and dog produce similar Q vectors\n"
    "with torch.no_grad():\n"
    "    q_cat = Q_proj(EMBEDS['cat'])\n"
    "    q_dog = Q_proj(EMBEDS['dog'])\n"
    "    q_it  = Q_proj(EMBEDS['it'])\n"
    "    sim_cat_dog = F.cosine_similarity(q_cat.unsqueeze(0), q_dog.unsqueeze(0)).item()\n"
    "    sim_cat_it  = F.cosine_similarity(q_cat.unsqueeze(0), q_it.unsqueeze(0)).item()\n"
    "print(f'\\ncos(Q(cat), Q(dog)) = {sim_cat_dog:.3f}')\n"
    "print(f'cos(Q(cat), Q(it))  = {sim_cat_it:.3f}')\n"
    "print('Expected: cat/dog Q similarity > cat/it Q similarity (similar embeddings -> similar projections).')"
)

# --- Cell 15: Closing ---
md(
    "---\n"
    "\n"
    "*This notebook accompanies [Chapter 7: Paying Attention](https://learnai.robennals.org/attention). "
    "Did you notice the toy attention has no idea where words are in the sentence? "
    "[Chapter 8: Where Am I?](https://learnai.robennals.org/positions) fixes that with **rotation**.*\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-attention-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 7: Build, execute, verify, clear outputs, commit

- [ ] **Step 1: Run the builder**

```bash
python3 /tmp/build-attention-notebook.py
```

Expected: `Wrote notebooks/attention.ipynb with 15 cells`.

- [ ] **Step 2: Execute the notebook end-to-end**

Slowest part is BERT load (~30s on first run, downloads ~440MB).

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --to notebook --execute notebooks/attention.ipynb --output attention.ipynb --ExecutePreprocessor.timeout=600
```

Expected: completes without error.

- [ ] **Step 3: Spot-check the toy attention outputs**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/attention.ipynb'))
for c in nb['cells']:
    src = ''.join(c.get('source', '')) if isinstance(c.get('source', ''), list) else c.get('source', '')
    if 'attention_step' in src and 'cat' in src:
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text'])[:1500])
                break
"
```

Expected: For `['cat', 'blah', 'blah', 'it']`, attention from `it` puts most weight on `cat` (≈0.95+) and very little on the blahs. For `['cat', 'blah', 'dog', 'it']`, attention splits between cat and dog (each ~0.45-0.5).

- [ ] **Step 4: Spot-check the BERT 'Self / pronoun' head**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/attention.ipynb'))
for c in nb['cells']:
    src = ''.join(c.get('source', '')) if isinstance(c.get('source', ''), list) else c.get('source', '')
    if 'INTERESTING_HEADS' in src and 'attn_from_it' in src:
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
                break
"
```

Expected: from `it`, the Self/pronoun head puts notable weight on `dog` and/or `cat` (the candidate antecedents). If the visualization fails or the head puts all weight on `it` itself, BERT may not have downloaded properly.

- [ ] **Step 5: Spot-check the Q/K/V projection similarity**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/attention.ipynb'))
for c in nb['cells']:
    src = ''.join(c.get('source', '')) if isinstance(c.get('source', ''), list) else c.get('source', '')
    if 'cos(Q(cat), Q(dog))' in src:
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text'])[-400:])
"
```

Expected: `cos(Q(cat), Q(dog))` is larger than `cos(Q(cat), Q(it))`. (Both can be in any sign range; the inequality is what matters.)

- [ ] **Step 6: Clear executed outputs**

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --clear-output --inplace notebooks/attention.ipynb
```

- [ ] **Step 7: Verify outputs cleared**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/attention.ipynb'))
for c in nb['cells']:
    if c['cell_type'] != 'code': continue
    assert c.get('execution_count') is None
    assert c.get('outputs') == []
print('clean')
"
```

Expected: `clean`.

- [ ] **Step 8: Commit**

```bash
git add notebooks/attention.ipynb && git commit -m "$(cat <<'EOF'
Rework attention notebook to mirror chapter section by section

Rebuilds notebooks/attention.ipynb from scratch under philosophy
principle 5b. Walks the chapter top-to-bottom: build single-head
attention from scratch with the chapter's exact 4-token toy
(cat/dog/blah/it) using 1D keys and queries with the "advertising /
looking for" framing, implement softmax from scratch on the
chapter's four scenarios (relative-loudness framing), extend the
toy with value vectors, load real BERT (bert-base-uncased) and
visualize the four specific attention heads the chapter highlights
(layer/head pairs match scripts/extract-bert-attention.py), and
demonstrate Q/K/V projections from nn.Linear by showing similar
embeddings produce similar Q/K/V outputs. Skips chapter sections
that are pure intuition (Why Attention Matters). First-person
voice throughout.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Verify commit**

```bash
git log -1 --stat
```

Expected: one file modified — `notebooks/attention.ipynb`.

---

## Notes for the executing engineer

- `jupyter` is at `/Users/robennals/Library/Python/3.9/bin/jupyter` — not on `PATH`. Always use the absolute path.
- `pip install transformers` may be needed.
- BERT downloads ~440MB on first run; subsequent runs use the cached model from `~/.cache/huggingface`. Don't be surprised if step 2 takes 1-2 min the first time.
- The `attn_implementation='eager'` argument matches `scripts/extract-bert-attention.py` and is necessary for `output_attentions=True` to work properly.
- Don't push, don't touch other files.
