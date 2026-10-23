# Notebook Sync — Unit B / positions.ipynb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `notebooks/positions.ipynb` from scratch (it does not currently exist) so it mirrors the `positions` chapter section by section. Walks: rebuild the toy attention from the attention notebook → demonstrate position-blindness (same tokens in different orders → identical attention) → ALiBi (linear distance penalty) → single 2D-pair RoPE rotation → multi-pair RoPE with attention-distance shape curves → causal masking. Also adds `<TryItInPyTorch notebook="positions">` to the chapter MDX and a `### positions.ipynb` subsection to `pytorch-prerequisites.md`.

**Architecture:** Build via `/tmp/build-positions-notebook.py`. Final task runs the builder, executes via `jupyter nbconvert`, runs verifications (especially that ALiBi swaps the noun winner depending on slope, and that multi-speed RoPE actually produces the chapter's curve shapes), clears outputs, then commits — *and* makes the chapter MDX + prereqs edit in a separate commit.

**Tech Stack:** Python 3 + PyTorch + matplotlib + numpy. No external models — all toy.

**Reference docs:**
- Spec: `docs/plans/notebook-sync-unit-b.md` (positions section)
- Philosophy: `docs/plans/notebook-philosophy.md`
- Chapter: `src/app/(tutorial)/positions/content.mdx`
- Companion notebook: `notebooks/attention.ipynb` (chapter 7 — the toy is reused)

All commands assume working directory `/Users/robennals/broomy-repos/ai-explained/meta/colabs` and the `chapter/notebook-rework-unit-b` branch.

---

## Task 1: Builder skeleton — cells 1-2 (title + imports)

**Files:**
- Create: `/tmp/build-positions-notebook.py`

- [ ] **Step 1: Write the skeleton**

```python
"""One-shot builder for notebooks/positions.ipynb. Run once and discard."""

import nbformat as nbf

CELLS = []

def md(text):
    CELLS.append(nbf.v4.new_markdown_cell(text))

def code(text):
    CELLS.append(nbf.v4.new_code_cell(text))

# --- Cell 1: title + links ---
md(
    "# Where Am I? — Try it in PyTorch\n"
    "\n"
    "This is an **optional** hands-on companion to "
    "[Chapter 8: Where Am I?](https://learnai.robennals.org/positions). "
    "I'll start by re-creating the toy attention from the previous notebook, see that it can't tell "
    "word order apart, then add positions two ways: **ALiBi** (linear distance penalty) and **RoPE** "
    "(rotation by position). I'll explore multi-speed RoPE for different attention-distance shapes, "
    "and finish with **causal masking** to enforce \"only look backward\".\n"
    "\n"
    "*This notebook reuses the chapter 7 attention toy. If you haven't gone through "
    "[Paying Attention](https://learnai.robennals.org/attention) yet, I recommend that first.*\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# --- Cell 2: imports ---
code(
    "import torch\n"
    "import torch.nn.functional as F\n"
    "import matplotlib.pyplot as plt\n"
    "import numpy as np\n"
    "import math"
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

nbf.write(nb, 'notebooks/positions.ipynb')
print(f'Wrote notebooks/positions.ipynb with {len(CELLS)} cells')
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-positions-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 2: Append cells 3-4 (Recap toy attention + show position-blindness)

**Files:**
- Modify: `/tmp/build-positions-notebook.py`

- [ ] **Step 1: Insert recap + position-blindness cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 3: Recap markdown ---
md(
    "## Recap: the toy attention from chapter 7\n"
    "\n"
    "I'll rebuild the same 4-token toy: cat, dog, blah, it. Each token has a 1D key, query, and a "
    "value vector. Then I'll feed the same tokens to attention in two different orders and check "
    "whether the output changes — it shouldn't, because the toy attention is position-blind."
)

# --- Cell 4: Rebuild toy + position-blindness demo ---
code(
    "TOKEN_KEY = {'cat': 3.0, 'dog': 3.0, 'blah': 0.0, 'it': 0.0}\n"
    "TOKEN_QUERY = {'cat': 0.0, 'dog': 0.0, 'blah': 0.0, 'it': 3.0}\n"
    "TOKEN_VALUE = {\n"
    "    'cat':  torch.tensor([1.0, 0.0]),\n"
    "    'dog':  torch.tensor([0.0, 1.0]),\n"
    "    'blah': torch.tensor([0.0, 0.0]),\n"
    "    'it':   torch.tensor([0.0, 0.0]),\n"
    "}\n"
    "\n"
    "def softmax(scores):\n"
    "    scores = torch.tensor(scores, dtype=torch.float32)\n"
    "    m = scores.max()\n"
    "    e = torch.exp(scores - m)\n"
    "    return (e / e.sum()).tolist()\n"
    "\n"
    "def attend(sentence, focus_index):\n"
    "    \"\"\"Compute attention output for sentence[focus_index]. Returns blended value vector.\"\"\"\n"
    "    q = TOKEN_QUERY[sentence[focus_index]]\n"
    "    scores = [q * TOKEN_KEY[tok] for tok in sentence]\n"
    "    weights = softmax(scores)\n"
    "    blended = torch.zeros(2)\n"
    "    for tok, w in zip(sentence, weights):\n"
    "        blended += w * TOKEN_VALUE[tok]\n"
    "    return weights, blended\n"
    "\n"
    "# Same tokens in two different orders, focus on 'it' both times\n"
    "for sent in [\n"
    "    ['cat', 'blah', 'dog', 'it'],\n"
    "    ['dog', 'blah', 'cat', 'it'],\n"
    "]:\n"
    "    weights, blended = attend(sent, len(sent) - 1)\n"
    "    print(f'\\nsentence: {sent}')\n"
    "    print(f'  attention weights: {[round(w, 3) for w in weights]}')\n"
    "    print(f'  blended value:     [cat-ness {blended[0]:.3f}, dog-ness {blended[1]:.3f}]')\n"
    "\n"
    "print('\\nIdentical blended values: position-blindness confirmed.')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-positions-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 3: Append cells 5-6 (ALiBi: linear distance penalty)

**Files:**
- Modify: `/tmp/build-positions-notebook.py`

- [ ] **Step 1: Insert ALiBi cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 5: ALiBi markdown ---
md(
    "## ALiBi: subtract a linear distance penalty\n"
    "\n"
    "The simplest way to give attention a sense of position: subtract a penalty proportional to "
    "distance from each attention score. With slope `m`, the new score is "
    "`(query · key) − m × distance`. At slope 0 the model is position-blind. At higher slopes, "
    "the closer noun gets more attention than the farther one — even when both have the same key."
)

# --- Cell 6: ALiBi demo ---
code(
    "def attend_alibi(sentence, focus_index, slope):\n"
    "    \"\"\"Attention with linear distance penalty (ALiBi).\"\"\"\n"
    "    q = TOKEN_QUERY[sentence[focus_index]]\n"
    "    scores = []\n"
    "    for i, tok in enumerate(sentence):\n"
    "        dot = q * TOKEN_KEY[tok]\n"
    "        distance = abs(focus_index - i)\n"
    "        scores.append(dot - slope * distance)\n"
    "    weights = softmax(scores)\n"
    "    blended = torch.zeros(2)\n"
    "    for tok, w in zip(sentence, weights):\n"
    "        blended += w * TOKEN_VALUE[tok]\n"
    "    return weights, blended\n"
    "\n"
    "sentence = ['cat', 'blah', 'blah', 'dog', 'it']  # cat is far, dog is close to 'it'\n"
    "for slope in [0.0, 0.5, 1.5]:\n"
    "    weights, blended = attend_alibi(sentence, len(sentence) - 1, slope)\n"
    "    print(f'\\nslope={slope}')\n"
    "    for tok, w in zip(sentence, weights):\n"
    "        bar = '#' * int(w * 40)\n"
    "        print(f'  {tok:6s} {w:.3f}  {bar}')\n"
    "    print(f'  blended: cat-ness {blended[0]:.3f}, dog-ness {blended[1]:.3f}')\n"
    "\n"
    "print(\"\\nAt slope 0, cat and dog tie. At higher slope, dog (closer) wins.\")"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-positions-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 4: Append cells 7-9 (RoPE: rotation preserves dot product + single-pair rotation)

**Files:**
- Modify: `/tmp/build-positions-notebook.py`

- [ ] **Step 1: Insert RoPE cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 7: Rotation preserves dot product markdown ---
md(
    "## Rotation Encodes Distance\n"
    "\n"
    "There's a completely different way to encode position. Start with this fact: **rotating two "
    "vectors by the same angle leaves their dot product unchanged**. The dot product only cares "
    "about the *gap* between two vectors' directions, not where they're pointing in absolute terms."
)

# --- Cell 8: Rotation invariance demo ---
code(
    "def rotate_2d(v, angle_rad):\n"
    "    c = math.cos(angle_rad)\n"
    "    s = math.sin(angle_rad)\n"
    "    return torch.tensor([c * v[0] - s * v[1], s * v[0] + c * v[1]])\n"
    "\n"
    "v1 = torch.tensor([1.0, 0.5])\n"
    "v2 = torch.tensor([0.3, 0.8])\n"
    "print(f\"original v1={v1.tolist()}, v2={v2.tolist()}\")\n"
    "print(f\"  dot(v1, v2) = {torch.dot(v1, v2).item():.4f}\\n\")\n"
    "\n"
    "for angle_deg in [30, 90, 137]:\n"
    "    a = math.radians(angle_deg)\n"
    "    r1 = rotate_2d(v1, a)\n"
    "    r2 = rotate_2d(v2, a)\n"
    "    print(f\"both rotated {angle_deg}deg:\")\n"
    "    print(f\"  v1 -> {[round(x.item(), 3) for x in r1]}\")\n"
    "    print(f\"  v2 -> {[round(x.item(), 3) for x in r2]}\")\n"
    "    print(f\"  dot(r1, r2) = {torch.dot(r1, r2).item():.4f}  <-- unchanged\")\n"
    "    print()\n"
    "\n"
    "# Now rotate them by DIFFERENT angles\n"
    "print('Rotating by DIFFERENT angles changes the dot product:')\n"
    "for delta_deg in [0, 30, 90]:\n"
    "    r1 = rotate_2d(v1, 0.0)\n"
    "    r2 = rotate_2d(v2, math.radians(delta_deg))\n"
    "    print(f'  gap={delta_deg}deg: dot = {torch.dot(r1, r2).item():.4f}')"
)

# --- Cell 9: Single-pair RoPE — extend toy keys with 2D noun-x/noun-y ---
md(
    "## Applying Rotation to a Dimension\n"
    "\n"
    "Now connect rotation to attention: take one dimension of each token's key — the \"noun-ness\" "
    "I had before — and split it into two coordinates (`noun-x`, `noun-y`). Then rotate by "
    "`position × speed`. Tokens at similar positions stay similar; tokens far apart get rotated to "
    "different angles. The dot product naturally favors nearby tokens."
)

code(
    "# Each token gets a 2D 'noun pair' key. Same noun-ness as before but represented as (k, 0).\n"
    "TOKEN_KEY_2D = {tok: torch.tensor([TOKEN_KEY[tok], 0.0]) for tok in TOKEN_KEY}\n"
    "TOKEN_QUERY_2D = {tok: torch.tensor([TOKEN_QUERY[tok], 0.0]) for tok in TOKEN_QUERY}\n"
    "\n"
    "def attend_rope_one_pair(sentence, focus_index, speed_deg):\n"
    "    \"\"\"Single-pair RoPE: rotate each token's 2D key by position * speed.\"\"\"\n"
    "    speed_rad = math.radians(speed_deg)\n"
    "    q_focus = rotate_2d(TOKEN_QUERY_2D[sentence[focus_index]], focus_index * speed_rad)\n"
    "    scores = []\n"
    "    for i, tok in enumerate(sentence):\n"
    "        k_rot = rotate_2d(TOKEN_KEY_2D[tok], i * speed_rad)\n"
    "        scores.append(torch.dot(q_focus, k_rot).item())\n"
    "    weights = softmax(scores)\n"
    "    return weights\n"
    "\n"
    "sentence = ['cat', 'blah', 'blah', 'dog', 'it']\n"
    "for speed in [0, 15, 60]:\n"
    "    weights = attend_rope_one_pair(sentence, len(sentence) - 1, speed)\n"
    "    print(f'\\nspeed={speed}deg/position')\n"
    "    for tok, w in zip(sentence, weights):\n"
    "        bar = '#' * int(w * 40)\n"
    "        print(f'  {tok:6s} {w:.3f}  {bar}')\n"
    "\n"
    "print('\\nAt speed 0: position-blind (cat and dog tie).')\n"
    "print('Higher speeds: dog (closer to it) wins, just like ALiBi — but achieved by rotation.')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-positions-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 5: Append cells 10-11 (Multi-speed RoPE — shape curves)

**Files:**
- Modify: `/tmp/build-positions-notebook.py`

- [ ] **Step 1: Insert multi-speed RoPE cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 10: Multi-speed RoPE markdown ---
md(
    "## Multiple Rotation Speeds\n"
    "\n"
    "Real RoPE uses **many** dimension pairs, each rotating at its own speed. Combining different "
    "speeds in different proportions lets the model express many distance-falloff *shapes* — sharp "
    "spikes, broad spreads, two-stage dropoffs, anything in between.\n"
    "\n"
    "Below I implement multi-pair RoPE with 8 dimension pairs at exponentially-decreasing speeds, "
    "then plot the attention-distance curves for the chapter's four configurations."
)

# --- Cell 11: Multi-speed RoPE shape curves ---
code(
    "N_PAIRS = 8\n"
    "MAX_DISTANCE = 32\n"
    "\n"
    "# Speed of pair i: 30 / 2^i degrees per position (exponential decay)\n"
    "speeds_deg = [30.0 / (2 ** i) for i in range(N_PAIRS)]\n"
    "speeds_rad = [math.radians(s) for s in speeds_deg]\n"
    "print(f'Speeds (deg/position): {[round(s, 3) for s in speeds_deg]}')\n"
    "\n"
    "def attention_curve(weights_per_pair):\n"
    "    \"\"\"Compute attention weight as a function of distance.\n"
    "    Each pair's contribution to the dot product is `weight * cos(distance * speed)`,\n"
    "    assuming the query and key for that pair are aligned (so the only thing differing is rotation).\"\"\"\n"
    "    distances = list(range(MAX_DISTANCE))\n"
    "    raw_scores = []\n"
    "    for d in distances:\n"
    "        s = sum(w * math.cos(d * sp) for w, sp in zip(weights_per_pair, speeds_rad))\n"
    "        raw_scores.append(s)\n"
    "    # Softmax across distances to get attention weights\n"
    "    return distances, softmax(raw_scores)\n"
    "\n"
    "# Chapter scenarios from RoPEMultiSpeedWidget\n"
    "configs = [\n"
    "    ('Single fast pair only',  [1.0, 0, 0, 0, 0, 0, 0, 0]),\n"
    "    ('Single slow pair only',  [0, 0, 0, 0, 0, 0, 0, 1.0]),\n"
    "    ('Sharper medium combo',   [0.4, 0.4, 0.2, 0, 0, 0, 0, 0]),\n"
    "    ('Two-stage dropoff',      [0.6, 0, 0, 0, 0, 0, 0, 0.4]),\n"
    "]\n"
    "\n"
    "plt.figure(figsize=(10, 6))\n"
    "for label, weights in configs:\n"
    "    distances, attn = attention_curve(weights)\n"
    "    plt.plot(distances, attn, marker='o', label=label, linewidth=1.5)\n"
    "plt.title('Multi-speed RoPE: attention weight as a function of distance')\n"
    "plt.xlabel('distance (positions)')\n"
    "plt.ylabel('attention weight')\n"
    "plt.legend()\n"
    "plt.grid(True, alpha=0.3)\n"
    "plt.tight_layout()\n"
    "plt.show()"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-positions-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 6: Append cells 12-14 (Causal Masking + closing)

**Files:**
- Modify: `/tmp/build-positions-notebook.py`

- [ ] **Step 1: Insert causal masking + closing cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 12: Causal Masking markdown ---
md(
    "## Causal Masking: Only Look Backward\n"
    "\n"
    "RoPE encodes distance, not direction — the dot product between two rotated vectors is the same "
    "whether token A is 3 positions *before* or 3 positions *after* token B. For generative language "
    "models, direction comes from **causal masking**: when the model generates token *t*, it can only "
    "attend to tokens *0..t* (the future doesn't exist yet). Future positions are masked out by setting "
    "their attention scores to `-inf` before softmax — which makes them contribute zero attention weight."
)

# --- Cell 13: Causal masking demo ---
code(
    "# Build a small attention scores matrix (5 tokens, all attending to all)\n"
    "torch.manual_seed(0)\n"
    "n = 5\n"
    "raw_scores = torch.randn(n, n) * 2.0\n"
    "print('Raw scores (random, no causal mask):')\n"
    "print(raw_scores.round(decimals=2))\n"
    "print()\n"
    "\n"
    "# Causal mask: positions to the right of the diagonal get -inf\n"
    "causal_mask = torch.triu(torch.ones(n, n), diagonal=1).bool()\n"
    "masked = raw_scores.masked_fill(causal_mask, float('-inf'))\n"
    "print('After causal masking (-inf in upper-right triangle):')\n"
    "print(masked.round(decimals=2))\n"
    "print()\n"
    "\n"
    "weights = F.softmax(masked, dim=-1)\n"
    "print('Attention weights (rows sum to 1; upper-right triangle is exactly 0):')\n"
    "print(weights.round(decimals=3))\n"
    "print()\n"
    "\n"
    "# Spot-check: row 2 only attends to columns 0, 1, 2\n"
    "print(f'Row 2 weights:  {[round(w, 3) for w in weights[2].tolist()]}')\n"
    "print(f'Row 2 sum to 3 (positions 0..2): {weights[2, :3].sum().item():.4f}')\n"
    "print(f'Row 2 sum past 3 (positions 3..): {weights[2, 3:].sum().item():.4f}  (should be 0.0)')"
)

# --- Cell 14: Closing ---
md(
    "---\n"
    "\n"
    "*This notebook accompanies [Chapter 8: Where Am I?](https://learnai.robennals.org/positions). "
    "I've now seen the three pieces a transformer needs for attention: what each word *means* "
    "(embeddings), which other words *matter* (Q/K/V scoring), and where each word *is* (RoPE + "
    "causal masking). [Chapter 9: One Architecture to Rule Them All](https://learnai.robennals.org/transformers) "
    "wires them together.*\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-positions-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 7: Build, execute, verify, clear, commit notebook

- [ ] **Step 1: Run the builder**

```bash
python3 /tmp/build-positions-notebook.py
```

Expected: `Wrote notebooks/positions.ipynb with 14 cells`.

- [ ] **Step 2: Execute the notebook end-to-end**

This notebook is fast — no large downloads, no training. Should complete in well under a minute.

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --to notebook --execute notebooks/positions.ipynb --output positions.ipynb --ExecutePreprocessor.timeout=300
```

Expected: completes without error.

- [ ] **Step 3: Spot-check ALiBi output**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/positions.ipynb'))
for c in nb['cells']:
    src = ''.join(c.get('source', '')) if isinstance(c.get('source', ''), list) else c.get('source', '')
    if 'attend_alibi' in src and 'slope=0' in src:
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: at slope=0, cat and dog get equal weight; at slope=1.5, dog (closer) gets noticeably more weight than cat.

- [ ] **Step 4: Spot-check rotation invariance**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/positions.ipynb'))
for c in nb['cells']:
    src = ''.join(c.get('source', '')) if isinstance(c.get('source', ''), list) else c.get('source', '')
    if 'rotate_2d' in src and 'both rotated' in src:
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
                break
"
```

Expected: dot products of both-rotated v1 and v2 are identical (≈0.7) regardless of rotation angle.

- [ ] **Step 5: Spot-check causal mask**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/positions.ipynb'))
for c in nb['cells']:
    src = ''.join(c.get('source', '')) if isinstance(c.get('source', ''), list) else c.get('source', '')
    if 'causal_mask' in src:
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: `Row 2 sum past 3 (positions 3..): 0.0000` — confirming future positions get exactly zero attention weight.

- [ ] **Step 6: Clear executed outputs**

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --clear-output --inplace notebooks/positions.ipynb
```

- [ ] **Step 7: Verify outputs cleared**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/positions.ipynb'))
for c in nb['cells']:
    if c['cell_type'] != 'code': continue
    assert c.get('execution_count') is None
    assert c.get('outputs') == []
print('clean')
"
```

Expected: `clean`.

- [ ] **Step 8: Commit the notebook**

```bash
git add notebooks/positions.ipynb && git commit -m "$(cat <<'EOF'
Add positions notebook (Unit B)

Creates notebooks/positions.ipynb from scratch — chapter 8 had no
companion notebook before. Walks the chapter top-to-bottom under
philosophy principle 5b: rebuild the toy attention from chapter 7
and demonstrate position-blindness, ALiBi linear distance penalty,
rotation preserves the dot product (RoPE foundation), single-pair
RoPE rotation, multi-pair multi-speed RoPE with attention-distance
shape curves, and causal masking. Skips chapter sections that are
pure intuition (Word Order Matters, Limits of ALiBi, You Don't Need
to Double the Dimensions). First-person voice throughout.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: notebook committed.

---

## Task 8: Add `<TryItInPyTorch>` to chapter MDX + prereqs entry

**Files:**
- Modify: `src/app/(tutorial)/positions/content.mdx` (one-line add at end)
- Modify: `docs/plans/pytorch-prerequisites.md` (one new subsection)

- [ ] **Step 1: Add `<TryItInPyTorch>` to chapter MDX**

Use the Edit tool. The chapter ends at the "Words in Order" section; the `<TryItInPyTorch>` block goes at the very end.

- old:
  ```
  Attention now knows three things: what each word *means* (from embeddings), which other words *matter* (from attention scores), and where each word *is* (from rotation). In the next chapter, we'll put all of these pieces together to build the **transformer** — the architecture behind ChatGPT, Claude, and every modern language model.
  ```

- new:
  ```
  Attention now knows three things: what each word *means* (from embeddings), which other words *matter* (from attention scores), and where each word *is* (from rotation). In the next chapter, we'll put all of these pieces together to build the **transformer** — the architecture behind ChatGPT, Claude, and every modern language model.

  <TryItInPyTorch notebook="positions">
  Demonstrate that toy attention is position-blind, build ALiBi from a linear distance penalty, derive RoPE from the rotation-invariance of the dot product, combine multiple rotation speeds for different attention-distance shapes, and apply causal masking with `torch.triu`.
  </TryItInPyTorch>
  ```

- [ ] **Step 2: Verify the MDX edit**

```bash
grep -n "TryItInPyTorch" "src/app/(tutorial)/positions/content.mdx"
```

Expected: a line with `<TryItInPyTorch notebook="positions">`.

- [ ] **Step 3: Add prereqs entry**

Use the Edit tool on `docs/plans/pytorch-prerequisites.md`:

- old:
  ```
  ### attention.ipynb
  ```
- new:
  ```
  ### positions.ipynb

  No forward references. Uses `torch.tensor`, `torch.dot`, `math.cos`/`math.sin` for 2D rotations, `torch.softmax`, `torch.triu`, `masked_fill`, and matplotlib for the multi-speed RoPE curves. Reuses the toy attention setup from `attention.ipynb`.

  ### attention.ipynb
  ```

- [ ] **Step 4: Verify prereqs**

```bash
grep -A2 "### positions.ipynb" docs/plans/pytorch-prerequisites.md
```

Expected: the new subsection header plus the first line of its body.

- [ ] **Step 5: Run lint**

```bash
pnpm lint 2>&1 | tail -10
```

Expected: pre-existing lint errors are unchanged (Unit A confirmed they're not from this branch). No new errors introduced by the MDX edit.

- [ ] **Step 6: Commit the MDX + prereqs edit**

```bash
git add "src/app/(tutorial)/positions/content.mdx" docs/plans/pytorch-prerequisites.md && git commit -m "$(cat <<'EOF'
Link positions chapter to its new notebook + prereqs entry

Adds <TryItInPyTorch notebook="positions"> to the positions chapter
(was previously absent — the chapter had no companion notebook) and
adds the corresponding subsection to pytorch-prerequisites.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: Verify branch state**

```bash
git log --oneline -10
```

Expected: 5 notebook-rework commits (neurons, embeddings, NWP, attention, positions) + 1 positions-MDX commit + spec/philosophy/plan commits = ~10-12 commits ahead of `chapter/vectors-notebook` (which itself is 6 ahead of main). Last commit is the positions MDX one.

---

## Notes for the executing engineer

- This notebook has no large downloads or training — fastest of Unit B.
- `jupyter` is at `/Users/robennals/Library/Python/3.9/bin/jupyter` — not on `PATH`.
- The chapter MDX edit and prereqs edit are a separate commit from the notebook commit (the notebook is the "main" commit; the MDX/prereqs is a small follow-up).
- Don't push.
