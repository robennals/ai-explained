# Notebook Sync — Unit B / neurons.ipynb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `notebooks/neurons.ipynb` from scratch so it mirrors the `neurons` chapter section by section per `notebook-philosophy.md` principle 5b. The new notebook builds a manual neuron, plots the sigmoid (including sharpness), hardcodes AND/OR/NOT/NAND with truth tables, trains a single neuron on XOR and watches it fail, trains a 2-layer network that succeeds, and constructs a deeper `nn.Sequential` to make depth tangible.

**Architecture:** Build via a one-shot `/tmp/build-neurons-notebook.py` Python script using `nbformat` (same pattern as Unit A's `vectors.ipynb`). The script overwrites the existing `notebooks/neurons.ipynb`. Cells are appended in topical groups; after the final group the script runs once, the notebook executes via `jupyter nbconvert --execute`, outputs are verified sensible, then cleared, then committed.

**Tech Stack:** Python 3 + PyTorch + matplotlib for the notebook content; the `nbformat` library to build the notebook programmatically. Uses existing `pnpm test:notebooks` setup (jupyter at `/Users/robennals/Library/Python/3.9/bin/jupyter`).

**Reference docs:**
- Spec: `docs/plans/notebook-sync-unit-b.md`
- Philosophy: `docs/plans/notebook-philosophy.md` (principle 5b is the structural rule)
- Chapter: `src/app/(tutorial)/neurons/content.mdx`

All commands below assume working directory `/Users/robennals/broomy-repos/ai-explained/meta/colabs` and the `chapter/notebook-rework-unit-b` branch.

---

## Task 1: Builder skeleton — cells 1-4 (title, imports, Building Block)

We build `notebooks/neurons.ipynb` via a one-shot Python script in `/tmp` using `nbformat`. The script overwrites the existing notebook (this is a rework). Subsequent tasks append more cells before we finally run it.

**Files:**
- Create: `/tmp/build-neurons-notebook.py`

- [ ] **Step 1: Write the skeleton**

Write the file `/tmp/build-neurons-notebook.py`:

```python
"""One-shot builder for notebooks/neurons.ipynb. Run once and discard."""

import nbformat as nbf

CELLS = []

def md(text):
    CELLS.append(nbf.v4.new_markdown_cell(text))

def code(text):
    CELLS.append(nbf.v4.new_code_cell(text))

# --- Cell 1: title + links ---
md(
    "# Building a Brain — Try it in PyTorch\n"
    "\n"
    "This is an **optional** hands-on companion to "
    "[Chapter 3: Building a Brain](https://learnai.robennals.org/neurons). "
    "I'll build a single neuron from scratch, plot the sigmoid, hardcode "
    "AND/OR/NOT/NAND gates, watch a single neuron fail on XOR, train a "
    "two-layer network that succeeds, and stack into a deeper architecture.\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# --- Cell 2: imports ---
code(
    "import torch\n"
    "import torch.nn as nn\n"
    "import matplotlib.pyplot as plt"
)

# --- Cell 3: Building Block markdown ---
md(
    "## The Building Block\n"
    "\n"
    "A neuron does two things: a **weighted sum** of its inputs (plus a bias), then "
    "passes the result through an **activation function**. That's it. Let me build one by hand."
)

# --- Cell 4: Building Block code ---
code(
    "def neuron(inputs, weights, bias, activation):\n"
    "    weighted_sum = (inputs * weights).sum() + bias\n"
    "    return activation(weighted_sum)\n"
    "\n"
    "inputs = torch.tensor([0.5, 0.8])\n"
    "weights = torch.tensor([0.7, -0.3])\n"
    "bias = torch.tensor(0.1)\n"
    "\n"
    "output = neuron(inputs, weights, bias, torch.sigmoid)\n"
    "print(f'Inputs:  {inputs.tolist()}')\n"
    "print(f'Weights: {weights.tolist()}, Bias: {bias.item()}')\n"
    "print(f'Output:  {output.item():.4f}')"
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

nbf.write(nb, 'notebooks/neurons.ipynb')
print(f'Wrote notebooks/neurons.ipynb with {len(CELLS)} cells')
```

- [ ] **Step 2: Verify the script parses as valid Python**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-neurons-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 2: Append cells 5-6 (Your First Neuron)

**Files:**
- Modify: `/tmp/build-neurons-notebook.py`

- [ ] **Step 1: Insert First Neuron cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 5: First Neuron markdown ---
md(
    "## Your First Neuron\n"
    "\n"
    "The chapter's `NeuronFreePlayWidget` lets me poke at one neuron with two inputs and "
    "three knobs (two weights + bias). Let me try a few configurations and watch the output change."
)

# --- Cell 6: vary configurations ---
code(
    "configs = [\n"
    "    ('both weights positive, both inputs high', [1.0, 1.0], [2.0, 2.0], -1.0),\n"
    "    ('one weight strongly negative',            [1.0, 1.0], [2.0, -3.0], 0.5),\n"
    "    ('inputs zero, bias +2',                    [0.0, 0.0], [1.0, 1.0], 2.0),\n"
    "    ('inputs zero, bias -2',                    [0.0, 0.0], [1.0, 1.0], -2.0),\n"
    "]\n"
    "\n"
    "for label, ins, ws, b in configs:\n"
    "    inputs = torch.tensor(ins)\n"
    "    weights = torch.tensor(ws)\n"
    "    bias = torch.tensor(b)\n"
    "    out = neuron(inputs, weights, bias, torch.sigmoid)\n"
    "    print(f'{label}:')\n"
    "    print(f'  inputs={ins}, weights={ws}, bias={b} -> output={out.item():.4f}')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-neurons-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 3: Append cells 7-10 (Sigmoid + sharpness)

**Files:**
- Modify: `/tmp/build-neurons-notebook.py`

- [ ] **Step 1: Insert Sigmoid + sharpness cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 7: Sigmoid markdown ---
md(
    "## The Sigmoid\n"
    "\n"
    "The activation function I'm using is the **sigmoid** — an S-shaped curve that smoothly "
    "squashes any number into the range 0 to 1. Large positive inputs become close to 1, "
    "large negative inputs close to 0, with a smooth transition through 0.5 at the middle."
)

# --- Cell 8: Plot sigmoid ---
code(
    "x = torch.linspace(-6, 6, 200)\n"
    "y = torch.sigmoid(x)\n"
    "\n"
    "plt.figure(figsize=(7, 4))\n"
    "plt.plot(x.numpy(), y.numpy())\n"
    "plt.axhline(0.5, color='gray', linewidth=0.5, linestyle=':')\n"
    "plt.axvline(0,   color='gray', linewidth=0.5, linestyle=':')\n"
    "plt.title('Sigmoid: smooth squash into (0, 1)')\n"
    "plt.xlabel('input')\n"
    "plt.ylabel('output')\n"
    "plt.grid(True, alpha=0.3)\n"
    "plt.show()\n"
    "\n"
    "print(f'sigmoid(-100) = {torch.sigmoid(torch.tensor(-100.0)).item():.6f}')\n"
    "print(f'sigmoid(   0) = {torch.sigmoid(torch.tensor(0.0)).item():.6f}')\n"
    "print(f'sigmoid( 100) = {torch.sigmoid(torch.tensor(100.0)).item():.6f}')"
)

# --- Cell 9: Sharpness markdown ---
md(
    "## Sharper or Softer\n"
    "\n"
    "If I scale all the weights and bias by a multiplier, the sigmoid steepens (toward a hard step) "
    "or flattens (toward a gentle slope). The boundary stays in the same place — only the sharpness changes. "
    "Very sharp neurons are harder to train (the slope is nearly zero on the flat parts), which is why "
    "real networks use regularization to keep weights moderate."
)

# --- Cell 10: Plot multiple sharpnesses ---
code(
    "x = torch.linspace(-6, 6, 200)\n"
    "\n"
    "plt.figure(figsize=(7, 4))\n"
    "for sharpness in [0.5, 1.0, 3.0, 10.0]:\n"
    "    y = torch.sigmoid(x * sharpness)\n"
    "    plt.plot(x.numpy(), y.numpy(), label=f'x {sharpness}')\n"
    "plt.title('Sigmoid sharpness — multiplier on the input')\n"
    "plt.xlabel('input')\n"
    "plt.ylabel('output')\n"
    "plt.legend()\n"
    "plt.grid(True, alpha=0.3)\n"
    "plt.show()"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-neurons-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 4: Append cells 11-12 (Smooth Logic Gates)

**Files:**
- Modify: `/tmp/build-neurons-notebook.py`

- [ ] **Step 1: Insert Logic Gate cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 11: Smooth Logic markdown ---
md(
    "## Neurons as Smooth Logic Gates\n"
    "\n"
    "With the right weights, a single neuron can compute AND, OR, NOT, and NAND. "
    "Below I hardcode the weights for each gate and print its truth table — the same input "
    "combinations a real logic gate would handle. Large weights and biases push the sigmoid "
    "almost all the way to 0 or 1, so the truth tables come out crisp."
)

# --- Cell 12: Hardcoded gate weights + truth tables ---
code(
    "gates = {\n"
    "    'AND':  ([20.0, 20.0], -30.0),\n"
    "    'OR':   ([20.0, 20.0], -10.0),\n"
    "    'NAND': ([-20.0, -20.0], 30.0),\n"
    "    'NOT':  ([-20.0],         10.0),\n"
    "}\n"
    "\n"
    "inputs_2 = [(0, 0), (0, 1), (1, 0), (1, 1)]\n"
    "inputs_1 = [(0,), (1,)]\n"
    "\n"
    "for gate, (ws, b) in gates.items():\n"
    "    print(f'--- {gate} (weights={ws}, bias={b}) ---')\n"
    "    weights = torch.tensor(ws)\n"
    "    bias = torch.tensor(b)\n"
    "    cases = inputs_1 if len(ws) == 1 else inputs_2\n"
    "    for ins in cases:\n"
    "        x = torch.tensor([float(v) for v in ins])\n"
    "        out = neuron(x, weights, bias, torch.sigmoid)\n"
    "        rounded = 1 if out.item() > 0.5 else 0\n"
    "        print(f'  {ins} -> {out.item():.4f}  (rounded: {rounded})')\n"
    "    print()"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-neurons-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 5: Append cells 13-14 (XOR — single neuron fails)

**Files:**
- Modify: `/tmp/build-neurons-notebook.py`

- [ ] **Step 1: Insert XOR-fail cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 13: XOR markdown ---
md(
    "## A Single Neuron Can't Do XOR\n"
    "\n"
    "**XOR** (\"exclusive or\") is true when exactly one of the inputs is true. The truth table is:\n"
    "\n"
    "| A | B | XOR |\n"
    "|---|---|-----|\n"
    "| 0 | 0 |  0  |\n"
    "| 0 | 1 |  1  |\n"
    "| 1 | 0 |  1  |\n"
    "| 1 | 1 |  0  |\n"
    "\n"
    "No matter what weights I pick, a single neuron can't get all four cases right at once — "
    "this isn't a training failure, it's a *fundamental architectural limitation*. Let me train "
    "one and watch the loss plateau."
)

# --- Cell 14: Train single neuron, plateau, accuracy 0.75 ---
code(
    "# XOR training data\n"
    "X = torch.tensor([[0., 0.], [0., 1.], [1., 0.], [1., 1.]])\n"
    "y = torch.tensor([[0.], [1.], [1.], [0.]])\n"
    "\n"
    "torch.manual_seed(0)\n"
    "single = nn.Sequential(\n"
    "    nn.Linear(2, 1),\n"
    "    nn.Sigmoid(),\n"
    ")\n"
    "\n"
    "loss_fn = nn.BCELoss()\n"
    "optimizer = torch.optim.Adam(single.parameters(), lr=0.1)\n"
    "\n"
    "losses = []\n"
    "for epoch in range(2000):\n"
    "    pred = single(X)\n"
    "    loss = loss_fn(pred, y)\n"
    "    losses.append(loss.item())\n"
    "    optimizer.zero_grad()\n"
    "    loss.backward()\n"
    "    optimizer.step()\n"
    "\n"
    "plt.figure(figsize=(7, 3.5))\n"
    "plt.plot(losses)\n"
    "plt.title('Single-neuron XOR loss — plateaus, never reaches zero')\n"
    "plt.xlabel('epoch')\n"
    "plt.ylabel('BCE loss')\n"
    "plt.grid(True, alpha=0.3)\n"
    "plt.show()\n"
    "\n"
    "print('Final predictions:')\n"
    "with torch.no_grad():\n"
    "    final = single(X)\n"
    "    correct = 0\n"
    "    for i in range(4):\n"
    "        pred_val = final[i].item()\n"
    "        pred_label = 1 if pred_val > 0.5 else 0\n"
    "        target = int(y[i].item())\n"
    "        ok = pred_label == target\n"
    "        if ok: correct += 1\n"
    "        mark = 'CORRECT' if ok else 'WRONG'\n"
    "        print(f'  {X[i].tolist()} -> {pred_val:.4f} (predict {pred_label}, target {target})  {mark}')\n"
    "    print(f'Accuracy: {correct}/4')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-neurons-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 6: Append cells 15-16 (XOR — two layers solve it)

**Files:**
- Modify: `/tmp/build-neurons-notebook.py`

- [ ] **Step 1: Insert XOR-success cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 15: Two layers solve it markdown ---
md(
    "## Two Layers Solve XOR\n"
    "\n"
    "Add one **hidden layer** with two neurons feeding into an output neuron. The two hidden "
    "neurons compute intermediate things (like \"is at least one input on?\" and \"are they not "
    "both on?\"), and the output neuron combines those into XOR. Same training loop as before — "
    "this time the loss drops to near zero and all four cases come out right."
)

# --- Cell 16: Train 2-layer net, succeed ---
code(
    "torch.manual_seed(0)\n"
    "two_layer = nn.Sequential(\n"
    "    nn.Linear(2, 2),\n"
    "    nn.Sigmoid(),\n"
    "    nn.Linear(2, 1),\n"
    "    nn.Sigmoid(),\n"
    ")\n"
    "\n"
    "optimizer = torch.optim.Adam(two_layer.parameters(), lr=0.1)\n"
    "\n"
    "losses = []\n"
    "for epoch in range(3000):\n"
    "    pred = two_layer(X)\n"
    "    loss = loss_fn(pred, y)\n"
    "    losses.append(loss.item())\n"
    "    optimizer.zero_grad()\n"
    "    loss.backward()\n"
    "    optimizer.step()\n"
    "\n"
    "plt.figure(figsize=(7, 3.5))\n"
    "plt.plot(losses)\n"
    "plt.title('Two-layer XOR loss — drops to near zero')\n"
    "plt.xlabel('epoch')\n"
    "plt.ylabel('BCE loss')\n"
    "plt.grid(True, alpha=0.3)\n"
    "plt.show()\n"
    "\n"
    "print('Final predictions:')\n"
    "with torch.no_grad():\n"
    "    final = two_layer(X)\n"
    "    correct = 0\n"
    "    for i in range(4):\n"
    "        pred_val = final[i].item()\n"
    "        pred_label = 1 if pred_val > 0.5 else 0\n"
    "        target = int(y[i].item())\n"
    "        ok = pred_label == target\n"
    "        if ok: correct += 1\n"
    "        mark = 'CORRECT' if ok else 'WRONG'\n"
    "        print(f'  {X[i].tolist()} -> {pred_val:.4f} (predict {pred_label}, target {target})  {mark}')\n"
    "    print(f'Accuracy: {correct}/4')"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-neurons-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 7: Append cells 17-19 (Deeper Networks + closing)

**Files:**
- Modify: `/tmp/build-neurons-notebook.py`

- [ ] **Step 1: Insert deeper network + closing cells**

Use the Edit tool to replace `# Later tasks append more cells above this line.` with:

```python
# --- Cell 17: Deeper Networks markdown ---
md(
    "## Deeper Networks\n"
    "\n"
    "Real networks stack many layers. PyTorch makes this easy with `nn.Sequential` — pass it a "
    "list of layers and it wires them up in order. Below I build a 4-input, 3-hidden-layer "
    "(8 neurons each), 1-output network. I'm not training it — just constructing it and running "
    "one forward pass to make depth tangible."
)

# --- Cell 18: Build deeper nn.Sequential ---
code(
    "deeper = nn.Sequential(\n"
    "    nn.Linear(4, 8), nn.Sigmoid(),\n"
    "    nn.Linear(8, 8), nn.Sigmoid(),\n"
    "    nn.Linear(8, 8), nn.Sigmoid(),\n"
    "    nn.Linear(8, 1), nn.Sigmoid(),\n"
    ")\n"
    "\n"
    "print(deeper)\n"
    "\n"
    "n_params = sum(p.numel() for p in deeper.parameters())\n"
    "print(f'\\nTotal parameters: {n_params}')\n"
    "\n"
    "# One forward pass with example inputs\n"
    "example = torch.tensor([[0.5, -0.2, 1.1, 0.0]])\n"
    "print(f'\\nForward pass:')\n"
    "print(f'  input shape:  {tuple(example.shape)}')\n"
    "print(f'  output shape: {tuple(deeper(example).shape)}')\n"
    "print(f'  output value: {deeper(example).item():.4f}')"
)

# --- Cell 19: Closing ---
md(
    "---\n"
    "\n"
    "*This notebook accompanies [Chapter 3: Building a Brain](https://learnai.robennals.org/neurons). "
    "Next up: [Chapter 4: Describing the World with Numbers](https://learnai.robennals.org/vectors) — "
    "where I'll see neurons as vector operations and discover why activation functions make depth meaningful.*\n"
    "\n"
    "*New to PyTorch? See the [PyTorch appendix](https://learnai.robennals.org/appendix-pytorch) "
    "for a beginner-friendly introduction.*"
)

# Later tasks append more cells above this line.
```

- [ ] **Step 2: Verify the script still parses**

```bash
python3 -c "import ast; ast.parse(open('/tmp/build-neurons-notebook.py').read()); print('ok')"
```

Expected: `ok`.

---

## Task 8: Build, execute, verify, clear outputs, commit

**Files:**
- Overwrite: `notebooks/neurons.ipynb`

- [ ] **Step 1: Run the builder**

```bash
python3 /tmp/build-neurons-notebook.py
```

Expected: `Wrote notebooks/neurons.ipynb with 19 cells`.

- [ ] **Step 2: Execute the notebook end-to-end**

Use the absolute path to jupyter (it's not on `PATH` in this environment):

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --to notebook --execute notebooks/neurons.ipynb --output neurons.ipynb --ExecutePreprocessor.timeout=300
```

Expected: `[NbConvertApp] Writing ... to notebooks/neurons.ipynb`, no errors. Should complete in well under a minute (no large downloads, no big training).

- [ ] **Step 3: Spot-check the smooth logic gate truth tables**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/neurons.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'gates =' in ''.join(c['source']):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: AND outputs `(0,0)→0`, `(0,1)→0`, `(1,0)→0`, `(1,1)→1`. OR outputs `(0,0)→0`, `(0,1)→1`, `(1,0)→1`, `(1,1)→1`. NAND outputs `(0,0)→1`, `(0,1)→1`, `(1,0)→1`, `(1,1)→0`. NOT outputs `(0,)→1`, `(1,)→0`. The rounded values must match these.

- [ ] **Step 4: Spot-check the XOR single-neuron failure**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/neurons.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'single = nn.Sequential' in ''.join(c['source']):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: an `Accuracy: N/4` line where N is 2 or 3 (NOT 4) — confirming the single neuron cannot solve XOR. If `Accuracy: 4/4` appears, the training somehow succeeded — investigate (probably the seed coincidentally landed on a near-perfect linear separation, which is impossible for XOR; if it really shows 4/4, retune the seed).

- [ ] **Step 5: Spot-check the XOR two-layer success**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/neurons.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'two_layer = nn.Sequential' in ''.join(c['source']):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: `Accuracy: 4/4` and final loss visibly low. If the 2-layer didn't converge to 4/4, increase epochs (3000 → 5000) and re-execute.

- [ ] **Step 6: Spot-check deeper-network construction**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/neurons.ipynb'))
for c in nb['cells']:
    if c['cell_type'] == 'code' and 'deeper = nn.Sequential' in ''.join(c['source']):
        for out in c.get('outputs', []):
            if 'text' in out:
                print(''.join(out['text']))
"
```

Expected: `Sequential(...)` printout listing 4 Linear layers and 4 Sigmoid layers. `Total parameters: 193`. `output shape: (1, 1)`. `output value: <some float in 0-1>`.

- [ ] **Step 7: Clear executed outputs**

Repo convention: notebooks ship with cell outputs cleared.

```bash
/Users/robennals/Library/Python/3.9/bin/jupyter nbconvert --clear-output --inplace notebooks/neurons.ipynb
```

Expected: `[NbConvertApp] Writing ... to notebooks/neurons.ipynb`.

- [ ] **Step 8: Verify outputs are actually cleared**

```bash
python3 -c "
import json
nb = json.load(open('notebooks/neurons.ipynb'))
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
git add notebooks/neurons.ipynb && git commit -m "$(cat <<'EOF'
Rework neurons notebook to mirror chapter section by section

Rebuilds notebooks/neurons.ipynb from scratch under philosophy
principle 5b. Walks the chapter top-to-bottom: a manual neuron from
weighted-sum + activation, vary-the-config exploration, sigmoid plot
and sharpness multipliers, hardcoded AND/OR/NOT/NAND with truth
tables, XOR with a single neuron that trains to plateau (3-of-4
accuracy — the architectural limitation made concrete), the same XOR
solved by a two-layer network, and a deeper nn.Sequential to make
depth tangible. Skips chapter sections that are pure intuition
(Logic Gates intro, What Hidden Layers Compute, Training Deep
Networks). First-person voice throughout.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 10: Verify the commit**

```bash
git log -1 --stat
```

Expected: one file modified — `notebooks/neurons.ipynb`.

---

## Notes for the executing engineer

- `/tmp/build-neurons-notebook.py` is a one-shot builder — intentionally not committed. Future edits to `neurons.ipynb` should go through Jupyter directly.
- `jupyter` is at `/Users/robennals/Library/Python/3.9/bin/jupyter` — not on `PATH`. Use the absolute path.
- The XOR single-neuron failure is the load-bearing demo of the chapter's "fundamental architectural limitation" framing. If it accidentally trains to 4/4 with a different seed, the notebook is wrong — pick a seed (or change `lr`/`epochs`) where 3-of-4 is the stable outcome.
- The 2-layer XOR network sometimes gets stuck at 3-of-4 too (it depends on initialization). With `torch.manual_seed(0)` and `lr=0.1` for 3000 epochs, it should reliably converge. If it doesn't, bump epochs.
- Per repo convention, clear outputs before commit. The commit must show a notebook with `execution_count=None` and `outputs=[]` for every code cell.
- Don't push. The user reviews the branch locally.
