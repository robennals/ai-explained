# Notebook Sync — Unit A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the GloVe dimensionality bug in `embeddings.ipynb`, create `vectors.ipynb` from scratch, update `pytorch-prerequisites.md`, and add Anthropic to the PyTorch appendix researcher list.

**Architecture:** Three commits on a `chapter/vectors-notebook` branch off `meta/colabs`:
1. GloVe fix in `embeddings.ipynb`.
2. `vectors.ipynb` + `pytorch-prerequisites.md` update.
3. Anthropic copy edit in the appendix MDX.

**Tech Stack:** Python 3 + PyTorch for notebook content; the `nbformat` library to build the new notebook programmatically; Next.js / MDX for the appendix edit. Uses existing `pnpm test:notebooks` and `pnpm lint`.

**Reference docs:**
- Spec: `docs/plans/notebook-sync-unit-a.md`
- Philosophy: `docs/plans/notebook-philosophy.md`
- Overview: `docs/plans/notebook-sync-overview.md`

All commands below assume working directory `/Users/robennals/broomy-repos/ai-explained/meta/colabs`.

---

## Task 1: Create the feature branch

**Files:** none (git operation only)

- [ ] **Step 1: Create and check out the branch**

```bash
git checkout -b chapter/vectors-notebook
git status
```

Expected: `On branch chapter/vectors-notebook`, working tree clean.

---

## Task 2: Fix GloVe dimensionality in `embeddings.ipynb`

**Files:**
- Modify: `notebooks/embeddings.ipynb`

- [ ] **Step 1: Inspect cells that need changes**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/embeddings.ipynb'))
for i, c in enumerate(nb['cells']):
    src = ''.join(c['source'])
    if 'glove' in src.lower() or '50d' in src or '50 dim' in src.lower() or 'Chapter 4' in src:
        print(f'--- cell [{i}] ({c[\"cell_type\"]}) ---')
        print(src)
        print()
"
```

Note the cell indices and the exact strings that contain `50d`, `Chapter 4`, or `glove.6B.50d.txt`.

- [ ] **Step 2: Edit the download cell**

In the download cell (from Step 1), use the Edit tool to replace:
- Every occurrence of `glove.6B.50d.txt` → `glove.6B.300d.txt`
- Any wording mentioning "50d" / "50 dimensions" / "50-dimensional" → "300d" / "300 dimensions" / "300-dimensional"

- [ ] **Step 3: Replace other dimension references**

Search for all other mentions of `50`:

```bash
python3 -c "
import json, re
nb = json.load(open('notebooks/embeddings.ipynb'))
for i, c in enumerate(nb['cells']):
    src = ''.join(c['source'])
    for line in src.split('\n'):
        if re.search(r'\b50\b', line):
            print(f'cell [{i}]: {line}')
"
```

For each hit, decide: does `50` refer to GloVe dimensions (e.g., `torch.zeros(50)`, `.view(-1, 50)`, `print(\"50-dim vectors\")`) or to something unrelated (limits, counts)? Replace only dimension references with `300`. Use Edit with the full surrounding line so the match is unique.

- [ ] **Step 4: Update the opening markdown cell**

Use Edit to replace:
- old: `companion to [Chapter 4]`
- new: `companion to [Chapter 5]`

(The URL inside the link stays the same — it's already `embeddings`.)

- [ ] **Step 5: Verify all replacements landed**

```bash
python3 -c "
import json, re
nb = json.load(open('notebooks/embeddings.ipynb'))
bad = False
for i, c in enumerate(nb['cells']):
    src = ''.join(c['source'])
    if 'glove.6B.50d' in src or 'Chapter 4' in src:
        print(f'LEAKED: cell [{i}]')
        bad = True
    for line in src.split('\n'):
        if '50d' in line or '50 dim' in line.lower() or '50-dim' in line:
            print(f'CHECK: cell [{i}]: {line}')
            bad = True
print('ok' if not bad else 'issues')
"
```

Expected: `ok`. Any `CHECK:` lines require manual review.

- [ ] **Step 6: Execute the notebook end-to-end**

First run downloads ~376MB zipped; subsequent runs are fast.

```bash
jupyter nbconvert --to notebook --execute notebooks/embeddings.ipynb --output embeddings.ipynb --ExecutePreprocessor.timeout=1200
```

Expected: `[NbConvertApp] Writing ... to notebooks/embeddings.ipynb`, no errors. The analogies section should print sensible completions (e.g., `king - man + woman` close to `queen`).

- [ ] **Step 7: Commit**

```bash
git add notebooks/embeddings.ipynb && git commit -m "$(cat <<'EOF'
Fix GloVe dimensionality in embeddings notebook

Switch from 50d to 300d GloVe embeddings to match the chapter's claim
of 300-dimensional GloVe. Also fix the opening line that referenced
Chapter 4 (embeddings is chapter 5 in the current curriculum).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: one file committed.

---

## Task 3: Start the vectors.ipynb builder — cells 1–4 (skeleton)

We build `vectors.ipynb` via a one-shot Python script in `/tmp` using `nbformat`. Subsequent tasks append more cells before we finally run it. The script is thrown away after use — `vectors.ipynb` is the artifact that gets committed.

**Files:**
- Create: `/tmp/build-vectors-notebook.py`

- [ ] **Step 1: Write the skeleton**

Write the file `/tmp/build-vectors-notebook.py`:

```python
"""One-shot builder for notebooks/vectors.ipynb. Run once and discard."""

import nbformat as nbf

CELLS = []

def md(text):
    CELLS.append(nbf.v4.new_markdown_cell(text))

def code(text):
    CELLS.append(nbf.v4.new_code_cell(text))

# --- Cell 1: title + links ---
md(
    "# Describing the World with Numbers — Try it in PyTorch\n"
    "\n"
    "This is an **optional** hands-on companion to "
    "[Chapter 4: Describing the World with Numbers](https://learnai.robennals.org/vectors). "
    "You'll build vectors in PyTorch, compute dot products, normalize to unit vectors, "
    "and build a simple neuron from scratch.\n"
    "\n"
    "*New to PyTorch? Start with the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a quick intro to tensors.*"
)

# --- Cell 2: imports ---
code("import torch")

# --- Cell 3: toy animals markdown ---
md(
    "## Our Toy Animals\n"
    "\n"
    "We'll use the same nine animals as the chapter. Each is rated from 0 to 1 on six properties: "
    "**big**, **scary**, **hairy**, **cuddly**, **fast**, **fat**. Each animal is a vector — "
    "just a list of six numbers."
)

# --- Cell 4: animals data ---
code(
    "animals = {\n"
    "    'Bear':     torch.tensor([0.90, 0.85, 0.80, 0.50, 0.40, 0.75]),\n"
    "    'Rabbit':   torch.tensor([0.10, 0.02, 0.60, 0.95, 0.70, 0.15]),\n"
    "    'Shark':    torch.tensor([0.80, 0.95, 0.00, 0.00, 0.75, 0.20]),\n"
    "    'Mouse':    torch.tensor([0.02, 0.05, 0.30, 0.40, 0.60, 0.10]),\n"
    "    'Eagle':    torch.tensor([0.35, 0.60, 0.05, 0.02, 0.95, 0.05]),\n"
    "    'Elephant': torch.tensor([0.98, 0.30, 0.05, 0.40, 0.15, 0.95]),\n"
    "    'Snake':    torch.tensor([0.20, 0.85, 0.00, 0.02, 0.50, 0.05]),\n"
    "    'Cat':      torch.tensor([0.15, 0.30, 0.75, 0.85, 0.70, 0.25]),\n"
    "    'Dog':      torch.tensor([0.45, 0.20, 0.70, 0.90, 0.55, 0.45]),\n"
    "}\n"
    "\n"
    "print(animals['Bear'])"
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

nbf.write(nb, 'notebooks/vectors.ipynb')
print(f'Wrote notebooks/vectors.ipynb with {len(CELLS)} cells')
```

- [ ] **Step 2: Verify the script parses as valid Python**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-vectors-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 4: Append cells 5–8 (dot product section)

**Files:**
- Modify: `/tmp/build-vectors-notebook.py`

- [ ] **Step 1: Insert dot-product cells**

Use Edit to replace `# Later tasks append more cells above this line.` with the new cells followed by the same marker:

```python
# --- Cell 5: dot product markdown ---
md(
    "## The Dot Product — A Measure of Similarity\n"
    "\n"
    "To measure how similar two animals are, multiply each matching pair of numbers and add up the results. "
    "This is the **dot product**:\n"
    "\n"
    "`dot(a, b) = a[0]*b[0] + a[1]*b[1] + ... + a[n-1]*b[n-1]`\n"
    "\n"
    "When both animals score high on the same property, that product is big. When one scores high and "
    "the other low, the product is small. Add them up and you get a single number — high if the two "
    "animals agree, low if they don't."
)

# --- Cell 6: dot product code ---
code(
    "bear = animals['Bear']\n"
    "dog = animals['Dog']\n"
    "\n"
    "# Multiply matching pairs and add them up\n"
    "manual = sum(bear[i] * dog[i] for i in range(6))\n"
    "print(f'Manual:    {manual:.3f}')\n"
    "\n"
    "# torch.dot does the same thing in one call\n"
    "print(f'torch.dot: {torch.dot(bear, dog):.3f}')"
)

# --- Cell 7: comparing animals markdown ---
md(
    "### Comparing the Whole Zoo\n"
    "\n"
    "Let's rank every animal by how similar it is to a bear."
)

# --- Cell 8: ranking code ---
code(
    "scores = {name: torch.dot(bear, vec).item() for name, vec in animals.items()}\n"
    "\n"
    "for name, score in sorted(scores.items(), key=lambda x: -x[1]):\n"
    "    print(f'{name:10s} {score:.3f}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-vectors-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 5: Append cells 9–17 (unit vectors and cosine similarity)

**Files:**
- Modify: `/tmp/build-vectors-notebook.py`

- [ ] **Step 1: Insert unit-vector cells**

Use Edit to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 9: raw dot product unfair markdown ---
md(
    "## The Problem with Raw Dot Products\n"
    "\n"
    "The dot product rewards *having big numbers* — not just *agreeing on the right properties*. "
    "An animal that scored high on every property would look similar to everything. "
    "Let's add a fake `MaxAnimal` with 1.0 on every property and see what happens."
)

# --- Cell 10: max animal wins code ---
code(
    "animals_plus_max = {**animals, 'MaxAnimal': torch.ones(6)}\n"
    "scores = {name: torch.dot(bear, vec).item() for name, vec in animals_plus_max.items()}\n"
    "\n"
    "for name, score in sorted(scores.items(), key=lambda x: -x[1]):\n"
    "    print(f'{name:10s} {score:.3f}')"
)

# --- Cell 11: magnitude markdown ---
md(
    "## Magnitude — the Size of a Vector\n"
    "\n"
    "To fix the fairness problem we need to put every vector on equal footing. Step one: measure a "
    "vector's **size**, or **magnitude**. Square each component, add them up, take the square root:\n"
    "\n"
    "`magnitude(v) = sqrt(v[0]**2 + v[1]**2 + ... + v[n-1]**2)`\n"
    "\n"
    "This is the Pythagorean rule, extended to any number of dimensions."
)

# --- Cell 12: compute magnitude ---
code(
    "magnitude_of_bear = torch.sqrt(torch.sum(bear ** 2))\n"
    "print(f'Bear magnitude: {magnitude_of_bear:.3f}')"
)

# --- Cell 13: helper functions ---
code(
    "def magnitude(v):\n"
    "    return torch.sqrt(torch.sum(v ** 2))\n"
    "\n"
    "def normalize(v):\n"
    "    return v / magnitude(v)"
)

# --- Cell 14: unit vector markdown ---
md(
    "## Unit Vectors\n"
    "\n"
    "A **unit vector** has magnitude 1. To turn any vector into its unit vector, divide every "
    "component by the vector's magnitude. The *proportions* stay the same (so a bear is still scarier "
    "than it is fast), but the size is standardized."
)

# --- Cell 15: normalize bear ---
code(
    "bear_unit = normalize(bear)\n"
    "print(f'bear_unit:            {bear_unit}')\n"
    "print(f'magnitude(bear_unit): {magnitude(bear_unit):.3f}')\n"
    "\n"
    "# The decomposition is reversible: unit vector * magnitude == original\n"
    "reconstructed = bear_unit * magnitude(bear)\n"
    "print(f'reconstructed == bear? {torch.allclose(reconstructed, bear)}')"
)

# --- Cell 16: cosine similarity markdown ---
md(
    "## Cosine Similarity\n"
    "\n"
    "The dot product of two *unit vectors* is called **cosine similarity**. It ranges from "
    "−1 (opposite) through 0 (unrelated) to 1 (identical). Because both inputs have magnitude 1, "
    "nobody gets unfair credit for being big.\n"
    "\n"
    "Watch what happens to `MaxAnimal` now."
)

# --- Cell 17: ranking with unit vectors ---
code(
    "animals_unit = {name: normalize(vec) for name, vec in animals_plus_max.items()}\n"
    "bear_unit = animals_unit['Bear']\n"
    "\n"
    "scores = {name: torch.dot(bear_unit, vec).item() for name, vec in animals_unit.items()}\n"
    "\n"
    "for name, score in sorted(scores.items(), key=lambda x: -x[1]):\n"
    "    print(f'{name:10s} {score:.3f}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-vectors-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 6: Append cells 18–21 (blending and modifying)

**Files:**
- Modify: `/tmp/build-vectors-notebook.py`

- [ ] **Step 1: Insert blending and modification cells**

Use Edit to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 18: blending markdown ---
md(
    "## Blending Vectors\n"
    "\n"
    "Add two vectors (component by component) and you get a new vector that mixes both. "
    "Blend a bear and a rabbit — which real animal is the blend closest to?"
)

# --- Cell 19: blend code ---
code(
    "rabbit = animals['Rabbit']\n"
    "blend = normalize(bear + rabbit)\n"
    "\n"
    "animals_unit = {name: normalize(vec) for name, vec in animals.items()}\n"
    "scores = {name: torch.dot(blend, vec).item() for name, vec in animals_unit.items()}\n"
    "\n"
    "print('Closest animals to a bear + rabbit blend:')\n"
    "for name, score in sorted(scores.items(), key=lambda x: -x[1])[:5]:\n"
    "    print(f'{name:10s} {score:.3f}')"
)

# --- Cell 20: modifying markdown ---
md(
    "## Modifying a Vector by Adding a Direction\n"
    "\n"
    "You can also push a vector in a specific direction. Start with a bear and add "
    "*smaller, cuddlier, less scary*. What animal is that?\n"
    "\n"
    "The six properties are ordered: big, scary, hairy, cuddly, fast, fat. "
    "So our direction vector is `[-0.4, -0.5, 0.0, +0.4, 0.0, -0.3]`."
)

# --- Cell 21: modify code ---
code(
    "direction = torch.tensor([-0.4, -0.5, 0.0, 0.4, 0.0, -0.3])\n"
    "modified = normalize(bear + direction)\n"
    "\n"
    "scores = {name: torch.dot(modified, vec).item() for name, vec in animals_unit.items()}\n"
    "\n"
    "print('Closest animals to bear + (smaller, cuddlier, less scary):')\n"
    "for name, score in sorted(scores.items(), key=lambda x: -x[1])[:5]:\n"
    "    print(f'{name:10s} {score:.3f}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-vectors-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 7: Append cells 22–24 (neuron and wrap-up)

**Files:**
- Modify: `/tmp/build-vectors-notebook.py`

- [ ] **Step 1: Insert neuron and wrap-up cells**

Use Edit to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 22: neuron markdown ---
md(
    "## A Neuron Is a Dot Product\n"
    "\n"
    "Here's the punchline. A neuron computes: "
    "`output = activation(dot(weight, input) + bias)`.\n"
    "\n"
    "- The **weight vector's direction** is what the neuron looks for.\n"
    "- The **weight vector's magnitude** is how sensitive the neuron is.\n"
    "- The **bias** shifts where it fires.\n"
    "- The **activation function** squashes the result into a bounded range.\n"
    "\n"
    "Let's build a **bear detector**. Set the weight's direction to the bear unit vector, "
    "scale it up (so the sigmoid makes sharper distinctions), and tune the bias so only "
    "strongly bear-like animals light up."
)

# --- Cell 23: neuron code ---
code(
    "weight = normalize(bear) * 10.0   # direction: bear; magnitude: 10 (sensitivity)\n"
    "bias = -8.0                         # fires only for strong bear-likeness\n"
    "\n"
    "print(f\"{'Animal':10s} {'score':>7s} {'output':>7s}\")\n"
    "print('-' * 28)\n"
    "for name, vec in animals.items():\n"
    "    vec_unit = normalize(vec)\n"
    "    score = torch.dot(weight, vec_unit) + bias\n"
    "    output = torch.sigmoid(score)\n"
    "    print(f'{name:10s} {score:+7.3f} {output:7.3f}')"
)

# --- Cell 24: wrap-up markdown ---
md(
    "## What's Next\n"
    "\n"
    "We've seen vectors as lists of numbers, the dot product as similarity, unit vectors as "
    "fair-comparison scaffolding, vector addition as blending and modification, and a neuron "
    "as a dot product.\n"
    "\n"
    "But we hand-picked the six properties. Next, "
    "[Chapter 5: From Words to Meanings](https://learnai.robennals.org/embeddings) shows how "
    "AI *learns* its own vectors — for things like words, where no human-chosen dimensions "
    "could possibly work."
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-vectors-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 8: Build and execute `vectors.ipynb`

**Files:**
- Create: `notebooks/vectors.ipynb`

- [ ] **Step 1: Run the builder**

```bash
python3 /tmp/build-vectors-notebook.py
```

Expected: `Wrote notebooks/vectors.ipynb with 24 cells`.

- [ ] **Step 2: Execute the notebook end-to-end**

```bash
jupyter nbconvert --to notebook --execute notebooks/vectors.ipynb --output vectors.ipynb
```

Expected: `[NbConvertApp] Writing ... to notebooks/vectors.ipynb`, no errors.

- [ ] **Step 3: Spot-check the bear-detector output**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/vectors.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'sigmoid' in ''.join(c['source']):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: a table showing Bear with the highest `output` (close to 1.0) and low-similarity animals like Rabbit or Mouse with low `output` (close to 0).

- [ ] **Step 4: Spot-check the unit-vector re-ranking**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/vectors.ipynb'))
for i, c in enumerate(nb['cells']):
    if c['cell_type'] == 'code' and 'animals_unit' in ''.join(c['source']) and 'animals_plus_max' in ''.join(c['source']):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(f'cell {i} output:')
                print(''.join(out['text']))
"
```

Expected: Bear at the top (score 1.000), MaxAnimal somewhere in the middle — confirming that normalization fixed the fairness bug.

---

## Task 9: Update `docs/plans/pytorch-prerequisites.md`

**Files:**
- Modify: `docs/plans/pytorch-prerequisites.md`

- [ ] **Step 1: Insert the new subsection**

`vectors.ipynb` is for chapter 4, between `neurons.ipynb` (chapter 3) and `embeddings.ipynb` (chapter 5). Use the Edit tool with:

- old:
  ```
  ### embeddings.ipynb
  ```
- new:
  ```
  ### vectors.ipynb

  No forward references. Uses `torch.tensor`, `torch.dot`, basic arithmetic, and `torch.sigmoid` — all covered in earlier chapters or the PyTorch appendix. Assumes appendix-level tensor familiarity.

  ### embeddings.ipynb
  ```

- [ ] **Step 2: Verify**

```bash
grep -A2 "### vectors.ipynb" docs/plans/pytorch-prerequisites.md
```

Expected: the new subsection header plus the first line of its body.

---

## Task 10: Commit `vectors.ipynb` + `pytorch-prerequisites.md`

**Files:** git staging

- [ ] **Step 1: Stage and commit**

```bash
git add notebooks/vectors.ipynb docs/plans/pytorch-prerequisites.md && git commit -m "$(cat <<'EOF'
Add vectors.ipynb (chapter 4 companion) + prereqs entry

Creates the companion notebook that the vectors chapter's
<TryItInPyTorch> block already links to. Covers vectors as tensors,
dot product, unit vectors via magnitude, cosine similarity, blending
and modifying via vector addition, and a bear-detector neuron built
as a dot product. Links to the PyTorch appendix for tensor basics per
notebook-philosophy principle 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2: Verify the commit**

```bash
git log -1 --stat
```

Expected: two files — `notebooks/vectors.ipynb` (new) and `docs/plans/pytorch-prerequisites.md` (modified).

---

## Task 11: Add Anthropic to the PyTorch appendix researcher list

**Files:**
- Modify: `src/app/(tutorial)/appendix-pytorch/content.mdx` (line 9)

- [ ] **Step 1: Edit the researcher list**

Use the Edit tool:
- old: `It's what researchers at OpenAI, Meta, Google DeepMind, and most universities use to train neural networks.`
- new: `It's what researchers at Anthropic, OpenAI, Meta, Google DeepMind, and most universities use to train neural networks.`

- [ ] **Step 2: Verify**

```bash
grep -n "researchers at" "src/app/(tutorial)/appendix-pytorch/content.mdx"
```

Expected: a line at or near line 9 that starts with "Anthropic".

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: no errors. (If lint flags unrelated existing issues, focus only on the edited file.)

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tutorial)/appendix-pytorch/content.mdx" && git commit -m "$(cat <<'EOF'
Add Anthropic to PyTorch appendix researcher list

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Final verification

**Files:** none (running tests)

- [ ] **Step 1: Run the full notebook test suite**

```bash
pnpm test:notebooks
```

Expected: all notebooks execute successfully, including the updated `embeddings.ipynb` (with 300d GloVe) and the new `vectors.ipynb`. Note: this can take 10+ minutes on a fresh machine because of the 300d GloVe download.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: passes.

- [ ] **Step 3: Verify the branch state**

```bash
git log --oneline meta/colabs..chapter/vectors-notebook
```

Expected: three commits ahead of `meta/colabs`:
1. `Fix GloVe dimensionality in embeddings notebook`
2. `Add vectors.ipynb (chapter 4 companion) + prereqs entry`
3. `Add Anthropic to PyTorch appendix researcher list`

- [ ] **Step 4: Stop. Do NOT push.**

The user will review the branch locally and open the PR manually (or request a push at that point).

---

## Notes for the executing engineer

- `/tmp/build-vectors-notebook.py` is a one-shot builder — it's intentionally not committed. Future edits to `vectors.ipynb` should go through Jupyter directly.
- If `pnpm test:notebooks` times out because the 300d GloVe download is slow, the fallback is to gate the download behind an environment variable (e.g., `SKIP_GLOVE_DOWNLOAD`). Only do this if the test actually fails — the spec explicitly says try it as-is first.
- If the bear-detector output doesn't differentiate well (all scores close to 0.5), the weight magnitude or bias in Task 7 Cell 23 may need retuning. Expected: Bear close to 1.0, Rabbit/Mouse/Snake close to 0.
- Commit messages use a HEREDOC per the repo convention.
