# Live Attention Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live, browser-side transformer attention widget alongside the existing pre-recorded BERT widget in the attention chapter. Reader types any sentence, browses every layer × head of attention, with a curated subset of named "interpretable" heads — chiefly the induction head — surfaced as the headline demo.

**Architecture:** Train a tiny ~6M-param causal transformer (6 layers × 8 heads × 256 embed dim) on TinyStories in PyTorch, export weights into the JSON-config + binary-weights format that the project's existing pure-JS inference engine (`src/components/widgets/transformers/model-inference.ts`) already loads. Quantize to int8 to keep the wire payload under 10 MB. Build a new React widget (`LiveAttention.tsx`) that loads the model, debounce-tokenizes user input, runs the engine's forward pass, and renders `[layer][head]` attention matrices.

**Tech Stack:** PyTorch 2.x for training; the existing pure-JS forward-pass engine for inference; existing TinyStories WordPiece tokenizer at `public/data/tokenizer/ts-tokenizer-4096.json`; existing R2 hosting via `scripts/sync-r2.sh`; React 19 + Tailwind 4 + Next.js 16 App Router for the widget; Playwright for e2e verification.

**Reference spec:** `docs/superpowers/specs/2026-04-27-live-attention-widget-design.md`

---

## File Structure

**Phase 1 (Python — train and inspect)**
- `scripts/train_attention_model.py` — *new*. Trains the transformer, exports weights.
- `scripts/test_weight_roundtrip.py` — *new*. Validates that exported weights reload to bit-exact PyTorch behavior.
- `scripts/inspect_attention_heads.py` — *new*. Probes the trained model, scores heads, renders heatmaps.
- `docs/superpowers/reports/2026-04-27-attention-heads-phase1.md` — *new* at the gate. Phase 1 findings report for the user.
- `docs/superpowers/reports/phase1-heatmaps/*.png` — *new*. Per-head heatmap images embedded in the report.
- `public/data/attention-model/model.json` — *new* output of training (gitignored).
- `public/data/attention-model/model.weights.bin` — *new* output of training (gitignored).

**Phase 2 (TypeScript / MDX — the widget)**
- `src/components/widgets/transformers/model-inference.ts` — *modify*. Extend `loadTransformerModel` to handle `quantization: "int8"`.
- `src/components/widgets/attention/wordpiece-tokenizer.ts` — *new*. Pure-JS WordPiece tokenizer reading the existing `ts-tokenizer-4096.json`.
- `src/components/widgets/attention/LiveAttention.tsx` — *new*. The widget.
- `src/app/(tutorial)/attention/widgets.tsx` — *modify*. Register `LiveAttentionWidget`.
- `src/app/(tutorial)/attention/content.mdx` — *modify*. Append bridging paragraph + `<LiveAttentionWidget>` after the existing BERT call-site.
- `tests/attention.spec.ts` — *new*. Playwright e2e for the live widget.
- `scripts/sync-r2.sh` — *modify*. Add the two new model file paths.

The existing `BertAttention.tsx`, `extract-bert-attention.py`, and BERT-widget MDX prose are **not modified** by this plan.

---

## Phase 1 — Train and inspect

> **Phase 1 produces a trained model and a head-quality report. The user reviews the report at the gate before any Phase 2 work begins.**

### Task 1: Scaffold the training script and define the transformer

**Files:**
- Create: `scripts/train_attention_model.py`

**Reference:** the forward pass in `src/components/widgets/transformers/model-inference.ts` lines 156–326. The PyTorch model must match it exactly: pre-norm, causal mask, GELU activation in FFN, no dropout, scaled dot-product attention with `1/sqrt(head_dim)` factor, and the same parameter shapes for `qkv_weight (3*embed_dim, embed_dim)`, `attn_out_weight (embed_dim, embed_dim)`, `ff1_weight (ff_dim, embed_dim)`, `ff2_weight (embed_dim, ff_dim)`.

- [ ] **Step 1: Write the script header with PEP 723 inline metadata**

```python
#!/usr/bin/env python3
"""Train a tiny causal transformer for the live attention widget.

Architecture matches src/components/widgets/transformers/model-inference.ts
exactly (pre-norm, GELU, causal mask). Trains on TinyStories, exports to the
JSON-config + binary-weights format the JS engine loads.

Usage:
    uv run scripts/train_attention_model.py --smoke   # quick sanity run
    uv run scripts/train_attention_model.py            # full training
"""
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "tokenizers>=0.21",
#     "torch>=2.0",
#     "numpy>=1.24",
#     "datasets>=3.0",
# ]
# ///

import argparse
import json
import math
import struct
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from datasets import load_dataset
from tokenizers import Tokenizer

ROOT = Path(__file__).resolve().parent.parent
TOKENIZER_PATH = ROOT / "public" / "data" / "tokenizer" / "ts-tokenizer-4096.json"
OUTPUT_DIR = ROOT / "public" / "data" / "attention-model"

CONFIG = {
    "vocab_size": 4096,
    "embed_dim": 256,
    "num_heads": 8,
    "num_layers": 6,
    "ff_dim": 1024,
    "context_len": 64,
}
```

- [ ] **Step 2: Implement the transformer block matching the JS engine**

```python
class AttentionBlock(nn.Module):
    def __init__(self, embed_dim: int, num_heads: int):
        super().__init__()
        assert embed_dim % num_heads == 0
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.ln1 = nn.LayerNorm(embed_dim)
        self.qkv = nn.Linear(embed_dim, 3 * embed_dim)
        self.out = nn.Linear(embed_dim, embed_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, T, C)
        B, T, C = x.shape
        h = self.ln1(x)
        qkv = self.qkv(h)  # (B, T, 3C)
        q, k, v = qkv.split(self.embed_dim, dim=-1)
        # (B, T, num_heads, head_dim) -> (B, num_heads, T, head_dim)
        q = q.view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        k = k.view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        v = v.view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        # Scaled dot product with causal mask
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        mask = torch.triu(torch.ones(T, T, device=x.device), diagonal=1).bool()
        scores = scores.masked_fill(mask, float("-inf"))
        attn = F.softmax(scores, dim=-1)
        out = attn @ v  # (B, H, T, head_dim)
        out = out.transpose(1, 2).contiguous().view(B, T, C)
        return self.out(out)


class FFNBlock(nn.Module):
    def __init__(self, embed_dim: int, ff_dim: int):
        super().__init__()
        self.ln2 = nn.LayerNorm(embed_dim)
        self.fc1 = nn.Linear(embed_dim, ff_dim)
        self.fc2 = nn.Linear(ff_dim, embed_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.ln2(x)
        # The JS engine uses the GELU tanh approximation
        h = F.gelu(self.fc1(h), approximate="tanh")
        return self.fc2(h)


class TinyTransformer(nn.Module):
    def __init__(self, cfg: dict):
        super().__init__()
        self.cfg = cfg
        self.token_emb = nn.Embedding(cfg["vocab_size"], cfg["embed_dim"])
        self.pos_emb = nn.Embedding(cfg["context_len"], cfg["embed_dim"])
        self.layers = nn.ModuleList([
            nn.ModuleDict({
                "attn": AttentionBlock(cfg["embed_dim"], cfg["num_heads"]),
                "ffn": FFNBlock(cfg["embed_dim"], cfg["ff_dim"]),
            })
            for _ in range(cfg["num_layers"])
        ])
        self.ln_final = nn.LayerNorm(cfg["embed_dim"])
        self.output = nn.Linear(cfg["embed_dim"], cfg["vocab_size"])

    def forward(self, ids: torch.Tensor) -> torch.Tensor:
        # ids: (B, T)
        B, T = ids.shape
        pos = torch.arange(T, device=ids.device)
        x = self.token_emb(ids) + self.pos_emb(pos)
        for layer in self.layers:
            x = x + layer["attn"](x)
            x = x + layer["ffn"](x)
        x = self.ln_final(x)
        return self.output(x)
```

- [ ] **Step 3: Implement data loading and training loop**

```python
def load_data(tokenizer: Tokenizer, num_stories: int, ctx: int) -> torch.Tensor:
    print(f"Loading TinyStories ({num_stories:,} stories)...")
    ds = load_dataset("roneneldan/TinyStories", split="train", streaming=True)
    all_ids: list[int] = []
    bos = tokenizer.token_to_id("[BOS]") or 1
    eos = tokenizer.token_to_id("[EOS]") or 2
    for i, row in enumerate(ds):
        if i >= num_stories:
            break
        ids = tokenizer.encode(row["text"]).ids
        all_ids.extend([bos, *ids, eos])
    flat = torch.tensor(all_ids, dtype=torch.long)
    n_blocks = (flat.numel() - 1) // ctx
    flat = flat[: n_blocks * ctx + 1]
    print(f"  → {flat.numel():,} tokens, {n_blocks:,} training blocks")
    return flat


def train(model: TinyTransformer, data: torch.Tensor, *, epochs: int, batch_size: int,
          lr: float, device: str) -> None:
    model.to(device)
    model.train()
    ctx = model.cfg["context_len"]
    n_blocks = (data.numel() - 1) // ctx
    opt = torch.optim.AdamW(model.parameters(), lr=lr, betas=(0.9, 0.95), weight_decay=0.1)
    n_steps = epochs * (n_blocks // batch_size)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=n_steps, eta_min=lr * 0.1)

    step = 0
    for ep in range(epochs):
        # Shuffle block start positions
        starts = torch.randperm(n_blocks)[: (n_blocks // batch_size) * batch_size]
        starts = starts.view(-1, batch_size)
        for batch_starts in starts:
            xs = torch.stack([data[s * ctx : s * ctx + ctx] for s in batch_starts]).to(device)
            ys = torch.stack([data[s * ctx + 1 : s * ctx + ctx + 1] for s in batch_starts]).to(device)
            logits = model(xs)
            loss = F.cross_entropy(logits.view(-1, model.cfg["vocab_size"]), ys.reshape(-1))
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            sched.step()
            step += 1
            if step % 100 == 0:
                print(f"epoch {ep} step {step}/{n_steps}  loss={loss.item():.3f}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--smoke", action="store_true", help="Tiny smoke run.")
    args = parser.parse_args()

    device = "cuda" if torch.cuda.is_available() else (
        "mps" if torch.backends.mps.is_available() else "cpu"
    )
    print(f"Using device: {device}")

    tok = Tokenizer.from_file(str(TOKENIZER_PATH))
    if args.smoke:
        data = load_data(tok, num_stories=200, ctx=CONFIG["context_len"])
        epochs, batch_size, lr = 1, 16, 3e-4
    else:
        data = load_data(tok, num_stories=50_000, ctx=CONFIG["context_len"])
        epochs, batch_size, lr = 3, 64, 3e-4

    model = TinyTransformer(CONFIG)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"Model: {n_params:,} parameters")

    train(model, data, epochs=epochs, batch_size=batch_size, lr=lr, device=device)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), OUTPUT_DIR / "checkpoint.pt")
    print(f"Saved checkpoint to {OUTPUT_DIR / 'checkpoint.pt'}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run smoke test to confirm pipeline**

Run: `uv run scripts/train_attention_model.py --smoke`

Expected: prints model size (~6.0M parameters), loads ~50K tokens, runs ~10 steps showing loss decreasing from ~8.3 to ~7.something, saves `checkpoint.pt`. No exceptions.

- [ ] **Step 5: Commit**

```bash
git add scripts/train_attention_model.py
git commit -m "Add training script for live attention model"
```

---

### Task 2: Export weights in the JS engine's format and round-trip-test

**Files:**
- Modify: `scripts/train_attention_model.py` (add `export_weights` function)
- Create: `scripts/test_weight_roundtrip.py`

**Reference:** the binary format that `loadTransformerModel` reads in `src/components/widgets/transformers/model-inference.ts` lines 350–404. Each tensor is `[ndims: u32 LE][dim_0: u32 LE]…[dim_n-1: u32 LE][n_elements * float32 LE]`. Tensor order: `token_embedding, pos_embedding`, then per layer `[ln1_w, ln1_b, qkv_w, qkv_b, attn_out_w, attn_out_b, ln2_w, ln2_b, ff1_w, ff1_b, ff2_w, ff2_b]`, then `ln_final_weight, ln_final_bias, output_weight, output_bias`. The JS engine stores `qkv_weight` row-major as `(3*embed_dim, embed_dim)` and uses `output[c] = sum_k a[r,k] * b[c,k] + bias[c]` — i.e. it does `a · bᵀ`. PyTorch's `nn.Linear.weight` is already shaped `(out_features, in_features)`, so no transpose is needed; just dump `.weight` directly.

- [ ] **Step 1: Add `export_weights` to the training script**

Append to `scripts/train_attention_model.py` (above `main`):

```python
def write_tensor(f, t: torch.Tensor) -> None:
    """Write a tensor in the JS engine's format: [ndims][dims...][float32 data]."""
    arr = t.detach().cpu().contiguous().to(torch.float32).numpy()
    f.write(struct.pack("<I", arr.ndim))
    for d in arr.shape:
        f.write(struct.pack("<I", d))
    f.write(arr.tobytes(order="C"))


def export_weights(model: TinyTransformer, vocab: list[str], out_dir: Path) -> None:
    """Write model.json + model.weights.bin in the format model-inference.ts loads."""
    out_dir.mkdir(parents=True, exist_ok=True)
    config_path = out_dir / "model.json"
    bin_path = out_dir / "model.weights.bin"

    with open(bin_path, "wb") as f:
        write_tensor(f, model.token_emb.weight)
        write_tensor(f, model.pos_emb.weight)
        for layer in model.layers:
            attn = layer["attn"]
            ffn = layer["ffn"]
            write_tensor(f, attn.ln1.weight)
            write_tensor(f, attn.ln1.bias)
            write_tensor(f, attn.qkv.weight)
            write_tensor(f, attn.qkv.bias)
            write_tensor(f, attn.out.weight)
            write_tensor(f, attn.out.bias)
            write_tensor(f, ffn.ln2.weight)
            write_tensor(f, ffn.ln2.bias)
            write_tensor(f, ffn.fc1.weight)
            write_tensor(f, ffn.fc1.bias)
            write_tensor(f, ffn.fc2.weight)
            write_tensor(f, ffn.fc2.bias)
        write_tensor(f, model.ln_final.weight)
        write_tensor(f, model.ln_final.bias)
        write_tensor(f, model.output.weight)
        write_tensor(f, model.output.bias)

    with open(config_path, "w") as f:
        json.dump({"config": model.cfg, "vocab": vocab}, f)
    print(f"Wrote {config_path} and {bin_path} ({bin_path.stat().st_size / 1e6:.1f} MB)")
```

In `main`, replace the `torch.save(...)` line with:

```python
    vocab = [tok.id_to_token(i) or f"<id_{i}>" for i in range(CONFIG["vocab_size"])]
    export_weights(model, vocab, OUTPUT_DIR)
```

- [ ] **Step 2: Create round-trip test script**

```python
#!/usr/bin/env python3
"""Round-trip test: load exported weights into a fresh PyTorch model and confirm
that running the same forward pass on a fixed input produces matching logits."""
# /// script
# requires-python = ">=3.11"
# dependencies = ["torch>=2.0", "numpy>=1.24"]
# ///

import json
import struct
import sys
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from train_attention_model import CONFIG, TinyTransformer  # noqa: E402

MODEL_DIR = ROOT / "public" / "data" / "attention-model"


def read_tensor(f) -> np.ndarray:
    raw = f.read(4)
    (ndims,) = struct.unpack("<I", raw)
    dims = [struct.unpack("<I", f.read(4))[0] for _ in range(ndims)]
    n = int(np.prod(dims))
    arr = np.frombuffer(f.read(n * 4), dtype=np.float32).reshape(dims)
    return arr.copy()  # break the read-only bind so torch can use it


def load_into_model(model: TinyTransformer, bin_path: Path) -> None:
    with open(bin_path, "rb") as f:
        model.token_emb.weight.data.copy_(torch.from_numpy(read_tensor(f)))
        model.pos_emb.weight.data.copy_(torch.from_numpy(read_tensor(f)))
        for layer in model.layers:
            attn = layer["attn"]
            ffn = layer["ffn"]
            for name in [
                ("attn", "ln1", "weight"), ("attn", "ln1", "bias"),
                ("attn", "qkv", "weight"), ("attn", "qkv", "bias"),
                ("attn", "out", "weight"), ("attn", "out", "bias"),
                ("ffn", "ln2", "weight"), ("ffn", "ln2", "bias"),
                ("ffn", "fc1", "weight"), ("ffn", "fc1", "bias"),
                ("ffn", "fc2", "weight"), ("ffn", "fc2", "bias"),
            ]:
                root = attn if name[0] == "attn" else ffn
                getattr(getattr(root, name[1]), name[2]).data.copy_(
                    torch.from_numpy(read_tensor(f))
                )
        model.ln_final.weight.data.copy_(torch.from_numpy(read_tensor(f)))
        model.ln_final.bias.data.copy_(torch.from_numpy(read_tensor(f)))
        model.output.weight.data.copy_(torch.from_numpy(read_tensor(f)))
        model.output.bias.data.copy_(torch.from_numpy(read_tensor(f)))
        # Verify file is fully consumed
        leftover = f.read()
        assert len(leftover) == 0, f"Leftover bytes: {len(leftover)}"


def main() -> None:
    config_path = MODEL_DIR / "model.json"
    bin_path = MODEL_DIR / "model.weights.bin"
    assert config_path.exists(), f"Run training first: {config_path} not found"

    with open(config_path) as f:
        meta = json.load(f)
    cfg = meta["config"]
    assert cfg == CONFIG, f"Config mismatch: {cfg} vs {CONFIG}"

    # Build a fresh model and load weights from disk
    reloaded = TinyTransformer(CONFIG)
    reloaded.eval()
    load_into_model(reloaded, bin_path)

    # The training script must save its trained model to checkpoint.pt as well
    # so we can compare. If that file doesn't exist, just sanity-check shapes.
    ckpt_path = MODEL_DIR / "checkpoint.pt"
    if ckpt_path.exists():
        original = TinyTransformer(CONFIG)
        original.load_state_dict(torch.load(ckpt_path, map_location="cpu"))
        original.eval()
        ids = torch.randint(0, cfg["vocab_size"], (1, 16))
        with torch.no_grad():
            logits_orig = original(ids)
            logits_round = reloaded(ids)
        max_diff = (logits_orig - logits_round).abs().max().item()
        print(f"Max logit diff: {max_diff:.2e}")
        assert max_diff < 1e-4, "Round-trip failed!"
        print("Round-trip OK")
    else:
        print(f"No {ckpt_path} found — shape check only.")
        print("Round-trip OK (shapes consistent)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Update training script to also save `checkpoint.pt` for the round-trip test**

In `main` of `train_attention_model.py`, before the `export_weights` call:

```python
    torch.save(model.state_dict(), OUTPUT_DIR / "checkpoint.pt")
```

- [ ] **Step 4: Run smoke training + round-trip test**

```bash
uv run scripts/train_attention_model.py --smoke
uv run scripts/test_weight_roundtrip.py
```

Expected output of round-trip: `Max logit diff: <1e-5>` and `Round-trip OK`. If the diff is large, the export order or shape is wrong — fix before proceeding.

- [ ] **Step 5: Commit**

```bash
git add scripts/train_attention_model.py scripts/test_weight_roundtrip.py
git commit -m "Add weight export and round-trip test"
```

---

### Task 3: Run full training

Training runs ~2–4 hours on Apple Silicon MPS, ~1–2 hours on a CUDA GPU, or ~10+ hours on CPU. Run via `run_in_background: true` so the agent stays responsive and gets notified on completion.

- [ ] **Step 1: Kick off training in the background**

```bash
uv run scripts/train_attention_model.py
```

Run with `run_in_background: true`. The script auto-detects MPS / CUDA / CPU. While it runs, the agent can move on to Task 4 (drafting the head-inspection script). Wait for the completion notification before proceeding to Step 2.

- [ ] **Step 2: Verify training succeeded**

Check the background task's output for the final loss line and the `Wrote ... model.json and ... model.weights.bin` message. Final loss should land in the 3.5–4.5 range. If loss is much higher (>5.5) or NaN, training failed — diagnose before continuing.

- [ ] **Step 3: Run the round-trip test on the trained model**

```bash
uv run scripts/test_weight_roundtrip.py
```

Expected: `Max logit diff: <1e-4>` and `Round-trip OK`.

- [ ] **Step 4: Commit any script tweaks made during training**

If training-time issues showed up (OOM, missing dep, MPS-specific bug), fix and:

```bash
git add scripts/train_attention_model.py
git commit -m "Tweak training script: <reason>"
```

(If no tweaks were needed, skip this step.)

---

### Task 4: Implement head-inspection script

**Files:**
- Create: `scripts/inspect_attention_heads.py`

This script loads the trained model, runs forward passes on a battery of probe sentences while capturing attention matrices, scores each (layer, head) against template patterns (previous-token, induction, first-token, repeated-token, punctuation, content-token), and renders heatmap PNGs for the top candidates.

- [ ] **Step 1: Create the script with model-loading and probe sentences**

```python
#!/usr/bin/env python3
"""Inspect attention heads in the trained tiny transformer.

For each (layer, head) and each probe sentence, score how well the head's
attention matrix matches a set of interpretable templates.
"""
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "tokenizers>=0.21",
#     "torch>=2.0",
#     "numpy>=1.24",
#     "matplotlib>=3.8",
# ]
# ///

import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
from tokenizers import Tokenizer

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from train_attention_model import CONFIG, TinyTransformer  # noqa: E402
from test_weight_roundtrip import load_into_model  # noqa: E402

MODEL_DIR = ROOT / "public" / "data" / "attention-model"
TOKENIZER_PATH = ROOT / "public" / "data" / "tokenizer" / "ts-tokenizer-4096.json"
OUT_DIR = ROOT / "docs" / "superpowers" / "reports" / "phase1-heatmaps"

PROBE_SENTENCES = [
    # Induction probes — repeated phrases
    "Bob said hi. Bob said",
    "the cat sat on the mat. the cat sat",
    "red apple green apple blue apple",
    "Mary had a lamb. Mary had a",
    # Boundary probes — multiple sentences
    "She picked up the book. The book was heavy.",
    "Once upon a time, there was a little girl.",
    # Plain narrative
    "The dog chased the cat because it was angry.",
    "The boy gave the girl a book.",
]


def load_model() -> tuple[TinyTransformer, Tokenizer]:
    config_path = MODEL_DIR / "model.json"
    bin_path = MODEL_DIR / "model.weights.bin"
    assert config_path.exists(), "Run training first."
    with open(config_path) as f:
        meta = json.load(f)
    model = TinyTransformer(meta["config"])
    load_into_model(model, bin_path)
    model.eval()
    tok = Tokenizer.from_file(str(TOKENIZER_PATH))
    return model, tok
```

- [ ] **Step 2: Patch the model to capture attention matrices during forward**

The `TinyTransformer` defined in Task 1 doesn't return attention. Add a debug forward-with-attention helper to the inspection script:

```python
def forward_with_attentions(
    model: TinyTransformer, ids: torch.Tensor
) -> tuple[torch.Tensor, list[torch.Tensor]]:
    """Run forward, returning logits and a list of per-layer attention tensors,
    each shaped (num_heads, T, T)."""
    cfg = model.cfg
    B, T = ids.shape
    assert B == 1, "Inspection only supports batch size 1"
    pos = torch.arange(T, device=ids.device)
    x = model.token_emb(ids) + model.pos_emb(pos)
    attentions: list[torch.Tensor] = []
    for layer in model.layers:
        attn = layer["attn"]
        # Replicate AttentionBlock.forward but capture the softmax
        h = attn.ln1(x)
        qkv = attn.qkv(h)
        q, k, v = qkv.split(attn.embed_dim, dim=-1)
        q = q.view(B, T, attn.num_heads, attn.head_dim).transpose(1, 2)
        k = k.view(B, T, attn.num_heads, attn.head_dim).transpose(1, 2)
        v = v.view(B, T, attn.num_heads, attn.head_dim).transpose(1, 2)
        scores = (q @ k.transpose(-2, -1)) / (attn.head_dim ** 0.5)
        mask = torch.triu(torch.ones(T, T, device=x.device), diagonal=1).bool()
        scores = scores.masked_fill(mask, float("-inf"))
        a = torch.softmax(scores, dim=-1)
        attentions.append(a[0].detach())  # (num_heads, T, T)
        out = a @ v
        out = out.transpose(1, 2).contiguous().view(B, T, attn.embed_dim)
        x = x + attn.out(out)
        x = x + layer["ffn"](x)
    x = model.ln_final(x)
    logits = model.output(x)
    return logits, attentions
```

- [ ] **Step 3: Implement the template scoring functions**

Each template returns a scalar in [0, 1] saying how strongly an attention matrix `A` (shape `T × T`, lower-triangular due to causal mask) matches that template on a given sentence:

```python
def score_previous_token(A: np.ndarray, *, _ids=None) -> float:
    """Diagonal-shifted-by-1: A[i, i-1] should be ~1 for i >= 1."""
    T = A.shape[0]
    if T < 2:
        return 0.0
    return float(A[np.arange(1, T), np.arange(0, T - 1)].mean())


def score_first_token(A: np.ndarray, *, _ids=None) -> float:
    """Every row should put most weight on column 0."""
    return float(A[:, 0].mean())


def score_self_attention(A: np.ndarray, *, _ids=None) -> float:
    """Diagonal: A[i, i] ~1."""
    return float(np.diag(A).mean())


def score_induction(A: np.ndarray, *, _ids: list[int]) -> float:
    """For each occurrence of a token X at position i where X also appeared at
    position j < i-1, attention from i should put weight on j+1 (the token
    that followed the earlier X)."""
    if _ids is None:
        return 0.0
    T = len(_ids)
    hits = 0
    n = 0
    for i in range(2, T):
        x = _ids[i]
        # Find previous occurrence of x at j < i-1 (so j+1 < i is in scope)
        for j in range(i - 2, -1, -1):
            if _ids[j] == x:
                hits += float(A[i, j + 1])
                n += 1
                break
    return hits / n if n > 0 else 0.0


def score_repeated_token(A: np.ndarray, *, _ids: list[int]) -> float:
    """For each token, attention should put weight on earlier same-token positions."""
    if _ids is None:
        return 0.0
    T = len(_ids)
    hits = 0.0
    n = 0
    for i in range(1, T):
        same = [j for j in range(i) if _ids[j] == _ids[i]]
        if same:
            hits += float(A[i, same].sum())
            n += 1
    return hits / n if n > 0 else 0.0


TEMPLATES = {
    "previous_token": score_previous_token,
    "first_token": score_first_token,
    "self_attention": score_self_attention,
    "induction": score_induction,
    "repeated_token": score_repeated_token,
}
```

- [ ] **Step 4: Score every head over all probes and rank candidates**

```python
def score_all_heads(model: TinyTransformer, tok: Tokenizer) -> dict:
    cfg = model.cfg
    L, H = cfg["num_layers"], cfg["num_heads"]
    # Accumulate scores: results[template][L][H] = mean across probes
    sums = {name: np.zeros((L, H)) for name in TEMPLATES}
    counts = 0
    captured: dict[tuple[int, int, str], np.ndarray] = {}
    for sent in PROBE_SENTENCES:
        ids = tok.encode(sent).ids
        ids_t = torch.tensor([ids], dtype=torch.long)
        _, attentions = forward_with_attentions(model, ids_t)
        for l, layer_attn in enumerate(attentions):
            for h in range(H):
                A = layer_attn[h].cpu().numpy()
                for name, fn in TEMPLATES.items():
                    sums[name][l, h] += fn(A, _ids=ids)
                # Capture matrix on the first probe for visualization
                if sent == PROBE_SENTENCES[0]:
                    captured[(l, h, sent)] = A
        counts += 1

    means = {name: sums[name] / counts for name in TEMPLATES}

    ranked = {}
    for name, mat in means.items():
        flat = [(float(mat[l, h]), l, h) for l in range(L) for h in range(H)]
        flat.sort(reverse=True)
        ranked[name] = flat[:5]

    return {"means": means, "ranked": ranked, "captured": captured}


def render_heatmap(A: np.ndarray, sentence_tokens: list[str], out_path: Path,
                   title: str) -> None:
    fig, ax = plt.subplots(figsize=(max(4, len(sentence_tokens) * 0.5),
                                     max(4, len(sentence_tokens) * 0.5)))
    im = ax.imshow(A, cmap="Blues", vmin=0, vmax=1)
    ax.set_xticks(range(len(sentence_tokens)))
    ax.set_yticks(range(len(sentence_tokens)))
    ax.set_xticklabels(sentence_tokens, rotation=45, ha="right", fontsize=8)
    ax.set_yticklabels(sentence_tokens, fontsize=8)
    ax.set_xlabel("Attended-to (key)")
    ax.set_ylabel("Attending-from (query)")
    ax.set_title(title)
    fig.colorbar(im, ax=ax, fraction=0.046)
    fig.tight_layout()
    fig.savefig(out_path, dpi=120, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    model, tok = load_model()
    print("Scoring heads against templates over probe sentences...")
    results = score_all_heads(model, tok)

    summary_path = ROOT / "docs" / "superpowers" / "reports" / "phase1-rankings.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary = {name: results["ranked"][name] for name in TEMPLATES}
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Wrote rankings to {summary_path}")

    # Render heatmap of the top-3 heads per template, on the first probe
    first_sent = PROBE_SENTENCES[0]
    ids = tok.encode(first_sent).ids
    tokens = tok.encode(first_sent).tokens
    for name, top in results["ranked"].items():
        for rank, (score, l, h) in enumerate(top[:3]):
            A = results["captured"][(l, h, first_sent)]
            out = OUT_DIR / f"{name}_rank{rank + 1}_L{l}H{h}.png"
            render_heatmap(A, tokens,
                           out_path=out,
                           title=f"{name} — L{l}H{h} (score={score:.3f})\n{first_sent}")
            print(f"  wrote {out.name}")

    print("\nTop heads per template:")
    for name, top in results["ranked"].items():
        print(f"  {name}:")
        for score, l, h in top:
            print(f"    L{l}H{h}: {score:.3f}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Run inspection and verify outputs**

```bash
uv run scripts/inspect_attention_heads.py
```

Expected: prints rankings, writes `docs/superpowers/reports/phase1-rankings.json` and ~15 heatmap PNGs into `docs/superpowers/reports/phase1-heatmaps/`. The PNGs should be visually inspectable (open them).

- [ ] **Step 6: Commit**

```bash
git add scripts/inspect_attention_heads.py
git add docs/superpowers/reports/phase1-rankings.json
git add docs/superpowers/reports/phase1-heatmaps/
git commit -m "Add head-inspection script and Phase 1 rankings/heatmaps"
```

---

### Task 5: Generate Phase 1 report and present to user

**Files:**
- Create: `docs/superpowers/reports/2026-04-27-attention-heads-phase1.md`

The report distills the head-inspection output into a human-readable assessment. It must answer the gate question: *are these heads interesting enough to ship a widget around?*

- [ ] **Step 1: Write the report template**

```markdown
# Phase 1 Report — Trained Attention Heads

**Model:** 6L × 8H × 256 (≈6M parameters), trained on ~50K TinyStories for ~3 epochs.
**Final training loss:** [fill from training logs]

## Top heads per template

| Template | L,H | Score | Notes |
|---|---|---|---|
| Previous token | L_,H_ | _ | [one line — clean? noisy?] |
| First token | L_,H_ | _ | |
| Induction | L_,H_ | _ | **[critical — must be clean for the headline demo]** |
| Repeated token | L_,H_ | _ | |
| Self-attention | L_,H_ | _ | |

(Pull values from `phase1-rankings.json`.)

## Heatmap evidence

For each named-candidate head, embed its heatmap and write a 1–2 sentence
read on the pattern.

![Previous token candidate](phase1-heatmaps/previous_token_rank1_L_H_.png)

[Continue for each.]

## Subjective assessment

- **Does induction work?** [yes / weak / no — explain]
- **Are the patterns clean enough to be visually compelling on novel sentences?** [yes / no]
- **Any unexpected interesting patterns?** [list any]

## Recommendation

One of:
- **Proceed to Phase 2.** The model has at least induction + 2 other named heads.
- **Iterate.** [Specific change to try: different seed / longer training / 8L × 8H × 320]
- **Abandon.** [Why — heads are unsalvageable at this scale]
```

- [ ] **Step 2: Fill in the report from the actual rankings + heatmaps**

The implementer reads `phase1-rankings.json` and looks at the PNGs in `phase1-heatmaps/`, then fills in scores and writes the subjective assessment.

- [ ] **Step 3: Commit and STOP — the user reviews this report at the gate**

```bash
git add docs/superpowers/reports/2026-04-27-attention-heads-phase1.md
git commit -m "Phase 1 report: trained attention heads"
```

> 🛑 **GATE — STOP HERE.** Do not proceed to Phase 2 until the user has reviewed the report and explicitly approved continuing. If the user requests iteration, return to Task 3 with the agreed changes (different seed, longer training, larger model). If the user requests abandonment, close out this plan.

---

## Phase 2 — Build the widget

> **Phase 2 only begins after the gate in Task 5 has passed.** Each task in Phase 2 assumes you have a trained model with at least one clear induction head and a clear previous-token head.

### Task 6: Add int8 quantization support to the JS engine's loader

**Files:**
- Modify: `src/components/widgets/transformers/model-inference.ts` (specifically the `loadTransformerModel` function around lines 334–408)
- Modify: `scripts/train_attention_model.py` (add a `--quantize` flag and an `export_weights_int8` function)
- Modify: `scripts/test_weight_roundtrip.py` (add a quantized round-trip mode)

**Format extension:** when `config.quantization === "int8"`, each tensor in the binary file is laid out as `[ndims: u32 LE][dim_0: u32 LE]…[dim_n-1: u32 LE][scale: float32 LE][n_elements * int8 LE]`. The dequantized value is `f32 = i8 * scale`. Per-tensor scale chosen as `max(abs(t)) / 127`.

- [ ] **Step 1: Extend the JS loader to switch on `quantization` field**

Modify the `readTensor` closure inside `loadTransformerModel` (`src/components/widgets/transformers/model-inference.ts:352–363`):

```ts
    const quantization = (json.config as TransformerConfig & { quantization?: string }).quantization;

    function readTensor(): Float32Array {
      const ndims = view.getUint32(offset, true);
      offset += 4;
      let nElements = 1;
      for (let i = 0; i < ndims; i++) {
        nElements *= view.getUint32(offset, true);
        offset += 4;
      }
      if (quantization === "int8") {
        const scale = view.getFloat32(offset, true);
        offset += 4;
        const out = new Float32Array(nElements);
        for (let i = 0; i < nElements; i++) {
          out[i] = view.getInt8(offset + i) * scale;
        }
        offset += nElements;
        return out;
      } else {
        const data = new Float32Array(buf, offset, nElements);
        offset += nElements * 4;
        return data;
      }
    }
```

(Note: when reading int8 we cannot use a typed-array-over-shared-buffer trick because the buffer alignment is not int8-typed; we read scalar-by-scalar and copy into a fresh `Float32Array`. That is fine — model load happens once.)

Also extend the `TransformerConfig` interface near the top of the file:

```ts
export interface TransformerConfig {
  vocab_size: number;
  embed_dim: number;
  num_heads: number;
  num_layers: number;
  ff_dim: number;
  context_len: number;
  quantization?: "int8";  // optional; absence = fp32
}
```

- [ ] **Step 2: Add quantized export to the training script**

Append to `scripts/train_attention_model.py`:

```python
def write_tensor_int8(f, t: torch.Tensor) -> None:
    """Write a tensor in int8 quantized format with per-tensor scale."""
    arr = t.detach().cpu().contiguous().to(torch.float32).numpy()
    f.write(struct.pack("<I", arr.ndim))
    for d in arr.shape:
        f.write(struct.pack("<I", d))
    abs_max = float(np.abs(arr).max())
    scale = abs_max / 127.0 if abs_max > 0 else 1.0
    f.write(struct.pack("<f", scale))
    quantized = np.clip(np.round(arr / scale), -127, 127).astype(np.int8)
    f.write(quantized.tobytes(order="C"))


def export_weights_int8(model: TinyTransformer, vocab: list[str], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    config_path = out_dir / "model.json"
    bin_path = out_dir / "model.weights.bin"

    with open(bin_path, "wb") as f:
        write_tensor_int8(f, model.token_emb.weight)
        write_tensor_int8(f, model.pos_emb.weight)
        for layer in model.layers:
            attn = layer["attn"]
            ffn = layer["ffn"]
            for tensor in [
                attn.ln1.weight, attn.ln1.bias,
                attn.qkv.weight, attn.qkv.bias,
                attn.out.weight, attn.out.bias,
                ffn.ln2.weight, ffn.ln2.bias,
                ffn.fc1.weight, ffn.fc1.bias,
                ffn.fc2.weight, ffn.fc2.bias,
            ]:
                write_tensor_int8(f, tensor)
        write_tensor_int8(f, model.ln_final.weight)
        write_tensor_int8(f, model.ln_final.bias)
        write_tensor_int8(f, model.output.weight)
        write_tensor_int8(f, model.output.bias)

    config_with_quant = {**model.cfg, "quantization": "int8"}
    with open(config_path, "w") as f:
        json.dump({"config": config_with_quant, "vocab": vocab}, f)
    print(f"Wrote int8 model: {bin_path.stat().st_size / 1e6:.1f} MB")
```

In `main`, add the flag and dispatch:

```python
    parser.add_argument("--quantize", action="store_true", help="Export int8 quantized.")
    # ...
    if args.quantize:
        export_weights_int8(model, vocab, OUTPUT_DIR)
    else:
        export_weights(model, vocab, OUTPUT_DIR)
```

- [ ] **Step 3: Add quantized round-trip test mode**

Modify `scripts/test_weight_roundtrip.py` to read the int8 format when `meta["config"].get("quantization") == "int8"`:

```python
def read_tensor_quantized(f, quantized: bool) -> np.ndarray:
    raw = f.read(4)
    (ndims,) = struct.unpack("<I", raw)
    dims = [struct.unpack("<I", f.read(4))[0] for _ in range(ndims)]
    n = int(np.prod(dims))
    if quantized:
        (scale,) = struct.unpack("<f", f.read(4))
        ints = np.frombuffer(f.read(n), dtype=np.int8).reshape(dims)
        return (ints.astype(np.float32) * scale).copy()
    else:
        arr = np.frombuffer(f.read(n * 4), dtype=np.float32).reshape(dims)
        return arr.copy()
```

Update `load_into_model` to accept and propagate the `quantized` flag:

```python
def load_into_model(model: TinyTransformer, bin_path: Path, quantized: bool = False) -> None:
    with open(bin_path, "rb") as f:
        model.token_emb.weight.data.copy_(torch.from_numpy(read_tensor_quantized(f, quantized)))
        model.pos_emb.weight.data.copy_(torch.from_numpy(read_tensor_quantized(f, quantized)))
        for layer in model.layers:
            attn = layer["attn"]
            ffn = layer["ffn"]
            for name in [
                ("attn", "ln1", "weight"), ("attn", "ln1", "bias"),
                ("attn", "qkv", "weight"), ("attn", "qkv", "bias"),
                ("attn", "out", "weight"), ("attn", "out", "bias"),
                ("ffn", "ln2", "weight"), ("ffn", "ln2", "bias"),
                ("ffn", "fc1", "weight"), ("ffn", "fc1", "bias"),
                ("ffn", "fc2", "weight"), ("ffn", "fc2", "bias"),
            ]:
                root = attn if name[0] == "attn" else ffn
                getattr(getattr(root, name[1]), name[2]).data.copy_(
                    torch.from_numpy(read_tensor_quantized(f, quantized))
                )
        model.ln_final.weight.data.copy_(torch.from_numpy(read_tensor_quantized(f, quantized)))
        model.ln_final.bias.data.copy_(torch.from_numpy(read_tensor_quantized(f, quantized)))
        model.output.weight.data.copy_(torch.from_numpy(read_tensor_quantized(f, quantized)))
        model.output.bias.data.copy_(torch.from_numpy(read_tensor_quantized(f, quantized)))
        leftover = f.read()
        assert len(leftover) == 0, f"Leftover bytes: {len(leftover)}"
```

(The fp32 case used `read_tensor`; the new helper `read_tensor_quantized` handles both modes via the `quantized` flag, so the original `read_tensor` function can be deleted.)

In `main`, route the flag:

```python
    quantized = meta["config"].get("quantization") == "int8"
    reloaded = TinyTransformer(CONFIG)
    reloaded.eval()
    load_into_model(reloaded, bin_path, quantized=quantized)
    # ...
    # Compare logits — if quantized, accept a larger tolerance
    tol = 0.5 if quantized else 1e-4
    assert max_diff < tol, f"Round-trip failed (tol={tol}): {max_diff}"
```

Also update the call from `inspect_attention_heads.py` (which calls `load_into_model`) to pass the `quantized` flag — read it from `meta["config"].get("quantization") == "int8"` in `load_model()` there.

- [ ] **Step 4: Re-export the trained model as int8 and test the round-trip**

```bash
uv run scripts/train_attention_model.py --smoke --quantize  # smoke check first
uv run scripts/test_weight_roundtrip.py
```

Then on the real model:

```bash
# Re-export without retraining: load checkpoint and export
python -c "
import sys; sys.path.insert(0, 'scripts')
import torch
from train_attention_model import CONFIG, TinyTransformer, export_weights_int8
from tokenizers import Tokenizer
m = TinyTransformer(CONFIG)
m.load_state_dict(torch.load('public/data/attention-model/checkpoint.pt', map_location='cpu'))
tok = Tokenizer.from_file('public/data/tokenizer/ts-tokenizer-4096.json')
vocab = [tok.id_to_token(i) or f'<id_{i}>' for i in range(CONFIG['vocab_size'])]
from pathlib import Path
export_weights_int8(m, vocab, Path('public/data/attention-model'))
"
uv run scripts/test_weight_roundtrip.py
ls -lh public/data/attention-model/
```

Expected: `model.weights.bin` is about ~6 MB. Round-trip max diff is in the 0.05–0.4 range (large because of int8 quantization, but small relative to logit magnitudes). If diff exceeds 0.5, the per-tensor scale strategy is too coarse — escalate to per-row scaling (out of scope for this plan; flag to user).

- [ ] **Step 5: Manual browser sanity check**

Since the JS engine's int8 path has no unit test, we sanity-check it in a browser. Add a temporary test page or use the dev server:

```bash
pnpm dev
```

In the browser at `http://localhost:3000`, open DevTools and run:

```js
const m = await fetch("/data/attention-model/model.json").then(r => r.json());
console.log(m.config);  // should show quantization: "int8"
```

Then visit any page that imports `model-inference.ts` (any transformer chapter page) and confirm no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/transformers/model-inference.ts
git add scripts/train_attention_model.py scripts/test_weight_roundtrip.py
git commit -m "Add int8 quantization support to the JS inference engine"
```

---

### Task 7: Upload the quantized model to R2

**Files:**
- Modify: `scripts/sync-r2.sh`

- [ ] **Step 1: Append the new files to the sync list**

In `scripts/sync-r2.sh`, locate the `FILES=( ... )` array (around line 28) and add:

```bash
  "attention-model/model.json"
  "attention-model/model.weights.bin"
```

- [ ] **Step 2: Run a dry-run to confirm the script picks up the new files**

```bash
pnpm sync-r2
```

Expected: lists `attention-model/model.json` and `attention-model/model.weights.bin` as files that would be uploaded.

- [ ] **Step 3: User runs the apply step (requires `npx wrangler login`)**

```bash
pnpm sync-r2:apply
```

Expected: uploads both files to R2. Total transfer ~6 MB.

- [ ] **Step 4: Verify the public URL is reachable**

```bash
curl -sI "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/attention-model/model.json" | head -1
curl -sI "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/attention-model/model.weights.bin" | head -1
```

Expected: both return `HTTP/2 200`.

- [ ] **Step 5: Commit the sync-script change**

```bash
git add scripts/sync-r2.sh
git commit -m "Sync attention-model files to R2"
```

---

### Task 8: Implement WordPiece tokenizer in TypeScript

**Files:**
- Create: `src/components/widgets/attention/wordpiece-tokenizer.ts`

The model expects tokens encoded by the WordPiece scheme stored in `public/data/tokenizer/ts-tokenizer-4096.json`. The existing `tokenize()` in `model-inference.ts` is whitespace-only and won't produce the right IDs. We implement a small WordPiece tokenizer in TS.

- [ ] **Step 1: Create the tokenizer module**

```ts
/**
 * Minimal WordPiece tokenizer for the TinyStories 4096-vocab tokenizer
 * stored at public/data/tokenizer/ts-tokenizer-4096.json.
 *
 * Implements: lowercase normalization, basic punctuation splitting,
 * greedy longest-match WordPiece, with special tokens [BOS] [EOS] [UNK].
 */

interface TokenizerJson {
  added_tokens: Array<{ id: number; content: string; special: boolean }>;
  model: {
    type: string;
    unk_token: string;
    continuing_subword_prefix?: string;
    vocab: Record<string, number>;
  };
  // tokenizers also has normalizer/pre_tokenizer fields we ignore at our scale
}

export interface WordPieceTokenizer {
  vocab: Record<string, number>;
  idToToken: string[];
  unkId: number;
  bosId: number;
  eosId: number;
  prefix: string;
  encode(text: string): { ids: number[]; tokens: string[] };
}

export async function loadTokenizer(url: string): Promise<WordPieceTokenizer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Tokenizer load failed: ${resp.status}`);
  const data: TokenizerJson = await resp.json();

  const vocab = data.model.vocab;
  const prefix = data.model.continuing_subword_prefix ?? "##";
  const size = Object.keys(vocab).length;
  const idToToken: string[] = new Array(size);
  for (const [tok, id] of Object.entries(vocab)) idToToken[id] = tok;

  const lookup = (token: string): number =>
    vocab[token] ?? vocab[token.toLowerCase()] ?? -1;

  const unkId = lookup(data.model.unk_token);
  const bosId = vocab["[BOS]"] ?? unkId;
  const eosId = vocab["[EOS]"] ?? unkId;

  const PUNCT = /[\.\,\!\?\;\:\(\)\[\]\{\}\"\'\-]/;

  function preTokenize(text: string): string[] {
    // Lowercase, then split on whitespace and isolate punctuation as separate tokens.
    const lower = text.toLowerCase();
    const result: string[] = [];
    let cur = "";
    for (const ch of lower) {
      if (/\s/.test(ch)) {
        if (cur) { result.push(cur); cur = ""; }
      } else if (PUNCT.test(ch)) {
        if (cur) { result.push(cur); cur = ""; }
        result.push(ch);
      } else {
        cur += ch;
      }
    }
    if (cur) result.push(cur);
    return result;
  }

  function wordPiece(word: string): { ids: number[]; tokens: string[] } {
    const out: number[] = [];
    const tokens: string[] = [];
    let start = 0;
    while (start < word.length) {
      let end = word.length;
      let matchedToken: string | null = null;
      while (start < end) {
        let candidate = word.slice(start, end);
        if (start > 0) candidate = prefix + candidate;
        if (vocab[candidate] !== undefined) {
          matchedToken = candidate;
          break;
        }
        end -= 1;
      }
      if (matchedToken === null) {
        // Whole word is unknown → emit a single [UNK] for the word
        return { ids: [unkId], tokens: ["[UNK]"] };
      }
      out.push(vocab[matchedToken]);
      tokens.push(matchedToken);
      start = end;
    }
    return { ids: out, tokens };
  }

  function encode(text: string): { ids: number[]; tokens: string[] } {
    const words = preTokenize(text);
    const ids: number[] = [];
    const tokens: string[] = [];
    for (const w of words) {
      const r = wordPiece(w);
      ids.push(...r.ids);
      tokens.push(...r.tokens);
    }
    return { ids, tokens };
  }

  return { vocab, idToToken, unkId, bosId, eosId, prefix, encode };
}
```

- [ ] **Step 2: Verify the tokenizer matches Python on a few sentences**

Add a tiny Python helper at the bottom of `scripts/inspect_attention_heads.py` (or as a one-off script) that prints token IDs for a probe sentence:

```python
# Quick test (run interactively):
# uv run python -c "from tokenizers import Tokenizer; \
#   t = Tokenizer.from_file('public/data/tokenizer/ts-tokenizer-4096.json'); \
#   for s in ['Bob said hi', 'red apple', 'The cat sat']: print(s, t.encode(s).ids)"
```

Then in the browser DevTools:

```js
import("/src/components/widgets/attention/wordpiece-tokenizer.ts").then(async (m) => {
  const t = await m.loadTokenizer("/data/tokenizer/ts-tokenizer-4096.json");
  console.log(t.encode("Bob said hi"));
  console.log(t.encode("red apple"));
  console.log(t.encode("The cat sat"));
});
```

The IDs should match. If they don't, the pre-tokenization rules disagree with the HF tokenizer's default; check normalizer/pre-tokenizer fields in the JSON and adjust `preTokenize`.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/attention/wordpiece-tokenizer.ts
git commit -m "Add minimal WordPiece tokenizer for live attention widget"
```

---

### Task 9: Scaffold `LiveAttention.tsx` with model loading and skeleton states

**Files:**
- Create: `src/components/widgets/attention/LiveAttention.tsx`
- Modify: `src/app/(tutorial)/attention/widgets.tsx` (add export)

- [ ] **Step 1: Create the component scaffold**

```tsx
"use client";

import { useEffect, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import {
  loadTransformerModel,
  type TransformerModel,
} from "../transformers/model-inference";
import { loadTokenizer, type WordPieceTokenizer } from "./wordpiece-tokenizer";

const MODEL_BASE =
  "https://pub-0f0bc2e5708e4f6b87d02e38956b7b72.r2.dev/data/attention-model/model";
const TOKENIZER_URL = "/data/tokenizer/ts-tokenizer-4096.json";

interface LoadState {
  model: TransformerModel | null;
  tokenizer: WordPieceTokenizer | null;
  loading: boolean;
  error: string | null;
}

export function LiveAttention() {
  const [state, setState] = useState<LoadState>({
    model: null,
    tokenizer: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadTransformerModel(MODEL_BASE), loadTokenizer(TOKENIZER_URL)])
      .then(([model, tokenizer]) => {
        if (cancelled) return;
        setState({ model, tokenizer, loading: false, error: null });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setState({ model: null, tokenizer: null, loading: false, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <WidgetContainer
        title="Live Attention Heads"
        description="A tiny transformer running in your browser"
      >
        <div className="flex items-center justify-center py-12 text-sm text-muted">
          Loading attention model…
        </div>
      </WidgetContainer>
    );
  }

  if (state.error || !state.model || !state.tokenizer) {
    return (
      <WidgetContainer
        title="Live Attention Heads"
        description="A tiny transformer running in your browser"
      >
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
          Couldn&apos;t load the live model: {state.error ?? "unknown error"}.
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Live Attention Heads"
      description="A tiny transformer running in your browser — type any sentence and watch attention happen."
    >
      <div className="text-sm text-muted">
        Model loaded: {state.model.config.num_layers} layers ×{" "}
        {state.model.config.num_heads} heads, vocab {state.model.config.vocab_size}.
      </div>
    </WidgetContainer>
  );
}
```

- [ ] **Step 2: Register the widget in `widgets.tsx`**

Add to `src/app/(tutorial)/attention/widgets.tsx` next to the other dynamic imports:

```tsx
const LiveAttention = dynamic(
  () =>
    import("@/components/widgets/attention/LiveAttention").then(
      (m) => m.LiveAttention
    ),
  { ssr: false }
);
```

And at the bottom of the exports:

```tsx
export function LiveAttentionWidget({ children }: { children?: React.ReactNode }) {
  return (
    <WidgetSlot tryIt={children} label="Try it">
      <LiveAttention />
    </WidgetSlot>
  );
}
```

- [ ] **Step 3: Add a temporary call-site to the MDX so we can browse to it**

In `src/app/(tutorial)/attention/content.mdx`, immediately after the existing `</BertAttentionNoPositionWidget>` line (around line 56), add:

```mdx
<LiveAttentionWidget />
```

(This is a temporary placement — it will be replaced with the final bridging paragraph in Task 13. We add it now so we can test the widget loads.)

- [ ] **Step 4: Run the dev server and verify**

```bash
pnpm dev
```

Visit `http://localhost:3000/attention`. Scroll to the BertAttention widget. The new "Live Attention Heads" widget should appear directly below it. It should briefly show "Loading attention model…" then either "Model loaded: 6 layers × 8 heads, vocab 4096." (success) or an amber error (failure — investigate).

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/attention/LiveAttention.tsx
git add src/app/(tutorial)/attention/widgets.tsx
git add src/app/(tutorial)/attention/content.mdx
git commit -m "Scaffold LiveAttention widget with loading/error states"
```

---

### Task 10: Wire input → tokenization → forward pass → token chips

**Files:**
- Modify: `src/components/widgets/attention/LiveAttention.tsx`

- [ ] **Step 1: Add input state, debounced forward pass, and token chips**

Replace the body of `LiveAttention` (after the `if` guards) with:

```tsx
import { forward, type InferenceResult } from "../transformers/model-inference";

// ... inside LiveAttention, after the loaded checks ...

const DEFAULT_SENTENCE = "Bob said hi. Bob said";

function LiveAttentionLoaded({
  model,
  tokenizer,
}: {
  model: TransformerModel;
  tokenizer: WordPieceTokenizer;
}) {
  const [input, setInput] = useState(DEFAULT_SENTENCE);
  const [result, setResult] = useState<{
    tokens: string[];
    inference: InferenceResult;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);

  // Debounce + run forward pass
  useEffect(() => {
    const handle = setTimeout(() => {
      setRunning(true);
      try {
        const enc = tokenizer.encode(input);
        const ids = [tokenizer.bosId, ...enc.ids].slice(0, model.config.context_len);
        const tokens = ["[BOS]", ...enc.tokens].slice(0, model.config.context_len);
        const inference = forward(model, ids);
        setResult({ tokens, inference });
        setSelectedToken(null);
      } finally {
        setRunning(false);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [input, model, tokenizer]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Type a sentence
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono"
          placeholder="Type something…"
        />
      </div>

      {result && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted">
            Tokens ({result.tokens.length}){running ? " · running…" : ""}
          </div>
          <div className="flex flex-wrap gap-1">
            {result.tokens.map((tok, i) => (
              <button
                key={`${i}-${tok}`}
                onClick={() => setSelectedToken(i === selectedToken ? null : i)}
                className={`rounded px-2 py-0.5 font-mono text-xs ${
                  i === selectedToken
                    ? "bg-accent text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {tok}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

And update the success branch of the outer `LiveAttention` to delegate:

```tsx
  return (
    <WidgetContainer
      title="Live Attention Heads"
      description="A tiny transformer running in your browser — type any sentence and watch attention happen."
    >
      <LiveAttentionLoaded model={state.model} tokenizer={state.tokenizer} />
    </WidgetContainer>
  );
```

- [ ] **Step 2: Verify in browser**

Reload `/attention`. The widget should now show a textarea pre-populated with `Bob said hi. Bob said`, and a row of token chips below it. Type into the textarea — chips should update after a brief debounce.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/attention/LiveAttention.tsx
git commit -m "Wire input + forward pass + token chips in LiveAttention"
```

---

### Task 11: Add named-head chips and attention readout

**Files:**
- Modify: `src/components/widgets/attention/LiveAttention.tsx`

The named heads come from the Phase 1 report (Task 5). The implementer fills in actual `(layer, head)` coordinates and explanations from the report.

- [ ] **Step 1: Define the curated head config at the top of `LiveAttention.tsx`**

```tsx
interface NamedHead {
  label: string;
  layer: number;
  head: number;
  explanation: string;
}

// IMPORTANT: Fill these from the Phase 1 report. Coordinates and copy
// must match what the trained model actually does.
const NAMED_HEADS: NamedHead[] = [
  // Example shape (replace with real coordinates from Phase 1):
  // { label: "Previous token", layer: 0, head: 2,
  //   explanation: "Each token attends to the one immediately before it." },
  // { label: "Induction", layer: 1, head: 5,
  //   explanation: "When a phrase repeats, attention jumps back to whatever followed the earlier occurrence." },
  // { label: "First token", layer: 0, head: 7,
  //   explanation: "Every token attends back to the first token — a 'default sink'." },
];
```

- [ ] **Step 2: Add head selection state and named-head chip row**

Inside `LiveAttentionLoaded`:

```tsx
const [selectedHead, setSelectedHead] = useState<{ layer: number; head: number }>(
  NAMED_HEADS.length > 0
    ? { layer: NAMED_HEADS[0].layer, head: NAMED_HEADS[0].head }
    : { layer: 0, head: 0 }
);

const namedHeadMatch = NAMED_HEADS.find(
  (h) => h.layer === selectedHead.layer && h.head === selectedHead.head
);
```

Add a chip row above the token row:

```tsx
{NAMED_HEADS.length > 0 && (
  <div>
    <div className="mb-1 text-xs font-medium text-muted">Named heads</div>
    <div className="flex flex-wrap gap-1.5">
      {NAMED_HEADS.map((h) => {
        const active = h.layer === selectedHead.layer && h.head === selectedHead.head;
        return (
          <button
            key={h.label}
            onClick={() => setSelectedHead({ layer: h.layer, head: h.head })}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "border-border text-muted hover:border-foreground/20 hover:text-foreground"
            }`}
          >
            {h.label} <span className="opacity-50">L{h.layer}H{h.head}</span>
          </button>
        );
      })}
    </div>
    {namedHeadMatch && (
      <div className="mt-2 rounded-lg border border-border bg-foreground/[0.02] px-3 py-2 text-xs text-muted">
        {namedHeadMatch.explanation}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Add the attention readout**

Right below the token-chip row, render attention weights from the selected token under the selected head:

```tsx
{result && selectedToken !== null && (() => {
  const { layerAttentions } = result.inference;
  const attn = layerAttentions[selectedHead.layer]?.[selectedHead.head];
  const seqLen = result.tokens.length;
  if (!attn) return null;
  const row: number[] = [];
  for (let j = 0; j < seqLen; j++) row.push(attn[selectedToken * seqLen + j]);
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted">
        Attention from <span className="font-mono">{result.tokens[selectedToken]}</span>{" "}
        in head L{selectedHead.layer}H{selectedHead.head}
      </div>
      <div className="flex flex-wrap items-end gap-x-1 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3">
        {result.tokens.map((tok, j) => {
          const w = row[j] ?? 0;
          const alpha = w < 0.02 ? 0 : Math.min(0.12 + w * 0.73, 0.85);
          return (
            <span key={j} className="inline-flex flex-col items-center">
              <span className="mb-0.5 font-mono text-[10px] leading-none text-muted">
                {w >= 0.02 ? `${Math.round(w * 100)}%` : ""}
              </span>
              <span
                className="rounded px-1 py-0.5 font-mono text-xs"
                style={
                  alpha > 0
                    ? {
                        backgroundColor: `rgba(99,102,241,${alpha})`,
                        color: w > 0.4 ? "white" : undefined,
                      }
                    : undefined
                }
              >
                {tok}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
})()}
```

- [ ] **Step 4: Verify in browser**

Reload `/attention`. The widget now has:
- Textarea with "Bob said hi. Bob said"
- A row of named-head chips (assuming `NAMED_HEADS` has been populated)
- The clicked head's explanation
- Token chips
- Click a token chip → see attention weights laid out across the sentence

If `NAMED_HEADS` is still empty (because Phase 1 hasn't filled it in), the chip row is hidden and the user can still click the textarea + tokens but won't see anything until a head is selected. Implementer must fill `NAMED_HEADS` before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/attention/LiveAttention.tsx
git commit -m "Add named-head chips and attention readout to LiveAttention"
```

---

### Task 12: Add curated sentence tabs and the layer × head grid view

**Files:**
- Modify: `src/components/widgets/attention/LiveAttention.tsx`

- [ ] **Step 1: Define curated sentences at the top of the file**

Each sentence is a starter the user can switch to with one click. Coordinates point at the named head most relevant to the sentence — fill from the Phase 1 report.

```tsx
interface Example {
  label: string;
  text: string;
  defaultHeadLabel?: string;
  defaultSelectedToken?: number;
  hint: string;
}

const EXAMPLES: Example[] = [
  {
    label: "Induction (long)",
    text: "Bob said hi. Bob said",
    defaultHeadLabel: "Induction",
    defaultSelectedToken: 5,  // index of the second "Bob"
    hint: "Click the second 'Bob' on the Induction head — attention should jump to 'said' or 'hi' from earlier.",
  },
  {
    label: "Repeated tokens",
    text: "red apple green apple blue apple",
    defaultHeadLabel: "Repeated token",
    hint: "Click any 'apple' — see how the head connects identical tokens across the sentence.",
  },
  {
    label: "Two sentences",
    text: "She picked up the book. The book was heavy.",
    defaultHeadLabel: "Punctuation",
    hint: "Click a token after the period — does the model 'remember' the period boundary?",
  },
  {
    label: "Plain narrative",
    text: "Once upon a time, there was a little girl",
    defaultHeadLabel: "First token",
    hint: "A baseline sentence — flip through heads to see which ones light up.",
  },
];
```

- [ ] **Step 2: Add a sentence-tab row above the textarea**

```tsx
<div className="flex flex-wrap gap-1.5">
  {EXAMPLES.map((ex) => (
    <button
      key={ex.label}
      onClick={() => {
        setInput(ex.text);
        if (ex.defaultHeadLabel) {
          const h = NAMED_HEADS.find((nh) => nh.label === ex.defaultHeadLabel);
          if (h) setSelectedHead({ layer: h.layer, head: h.head });
        }
        if (ex.defaultSelectedToken !== undefined) {
          setSelectedToken(ex.defaultSelectedToken);
        } else {
          setSelectedToken(null);
        }
      }}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        input === ex.text
          ? "bg-accent text-white"
          : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
      }`}
    >
      {ex.label}
    </button>
  ))}
</div>
```

Place this row at the top of the inner `flex flex-col gap-4`.

Also surface the active example's hint below the head explanation:

```tsx
{(() => {
  const active = EXAMPLES.find((ex) => ex.text === input);
  if (!active) return null;
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-xs text-muted">
      <strong className="text-foreground">Try this:</strong> {active.hint}
    </div>
  );
})()}
```

- [ ] **Step 3: Add a "Show all heads" toggle and the layer × head grid**

```tsx
const [viewMode, setViewMode] = useState<"named" | "grid">("named");
```

Below the named-head chip row, render either the named explanation (in `named` mode) or the grid (in `grid` mode):

```tsx
<div className="flex items-center gap-2">
  <button
    onClick={() => setViewMode(viewMode === "named" ? "grid" : "named")}
    className="text-xs text-accent underline"
  >
    {viewMode === "named" ? "Show all heads" : "Show named heads"}
  </button>
</div>

{viewMode === "grid" && result && (
  <div>
    <div className="mb-1 text-xs font-medium text-muted">
      All heads ({model.config.num_layers} × {model.config.num_heads})
    </div>
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${model.config.num_heads}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: model.config.num_layers }, (_, l) =>
        Array.from({ length: model.config.num_heads }, (_, h) => {
          const named = NAMED_HEADS.find((nh) => nh.layer === l && nh.head === h);
          const active = selectedHead.layer === l && selectedHead.head === h;
          // Sparkline: weights from selectedToken in this head
          const seqLen = result.tokens.length;
          const attn = result.inference.layerAttentions[l]?.[h];
          const row: number[] = attn && selectedToken !== null
            ? Array.from({ length: seqLen }, (_, j) => attn[selectedToken * seqLen + j])
            : [];
          return (
            <button
              key={`${l}-${h}`}
              onClick={() => setSelectedHead({ layer: l, head: h })}
              title={named ? `${named.label} (L${l}H${h})` : `L${l}H${h}`}
              className={`relative flex h-10 flex-col rounded border p-0.5 ${
                active
                  ? "border-indigo-500"
                  : named
                  ? "border-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/20"
                  : "border-border"
              }`}
            >
              <span className="text-[8px] text-muted">L{l}H{h}</span>
              <div className="flex h-full items-end gap-px">
                {row.map((w, j) => (
                  <div
                    key={j}
                    className="w-px flex-1"
                    style={{
                      height: `${Math.min(100, w * 100)}%`,
                      backgroundColor: "rgb(99,102,241)",
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
            </button>
          );
        })
      )}
    </div>
  </div>
)}
```

- [ ] **Step 4: Verify in browser**

Reload `/attention`. The widget now has:
- Sentence tabs at the top — click each to see input + head + token-selection update.
- "Try this" hint banner.
- Toggle "Show all heads" at the right of the head chip row.
- In grid mode, a 6×8 grid of cells, named heads highlighted; click any to inspect.

Click each tab and verify hints make sense, sparklines visibly differ between heads, and grid clicks work.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/attention/LiveAttention.tsx
git commit -m "Add sentence tabs and layer×head grid view"
```

---

### Task 13: Finalize chapter prose and place the widget

**Files:**
- Modify: `src/app/(tutorial)/attention/content.mdx`

- [ ] **Step 1: Replace the temporary call-site with the bridging paragraph + widget**

In `src/app/(tutorial)/attention/content.mdx`, find the temporary `<LiveAttentionWidget />` added in Task 9 (right after `</BertAttentionNoPositionWidget>`). Replace it with:

```mdx
The BERT weights above are pre-recorded — extracted from a 110-million-parameter model in Python and shipped as a fixed table. Here's the other side of that trade-off: a tiny transformer running live in your browser, trained on a small collection of children's stories. Its heads aren't as sophisticated as BERT's, but they're real, computed on whatever sentence you type, on demand.

<LiveAttentionWidget>
Try one of the repeated-phrase examples and switch to the "Induction" head. When the model sees a phrase it's seen before, attention jumps back to whatever followed the earlier occurrence — that's a simple form of in-context learning, emerging from training without anyone designing it.
</LiveAttentionWidget>
```

(If the Phase 1 report indicated something other than induction is the most striking demo, replace "Induction" in this hint with the actual most striking head, and adjust the framing.)

- [ ] **Step 2: Make sure `LiveAttentionWidget` accepts hint children**

Confirm in `src/app/(tutorial)/attention/widgets.tsx` that the export already passes children to `WidgetSlot` (it does, from Task 9 — the `tryIt={children}` line).

- [ ] **Step 3: Verify in browser**

Reload `/attention`. The "Attention in a Real Model" section should now read: BERT widget → bridging paragraph → live widget. The live widget shows its hint copy in the "Try it" panel.

- [ ] **Step 4: Commit**

```bash
git add src/app/(tutorial)/attention/content.mdx
git commit -m "Place live attention widget after BERT widget with bridging prose"
```

---

### Task 14: Add a Playwright e2e test

**Files:**
- Create: `tests/attention.spec.ts`

The test exercises the widget end-to-end: model loads, default sentence runs, clicking a token + head produces attention output.

- [ ] **Step 1: Create the test**

```ts
import { test, expect } from "@playwright/test";

test.describe("Attention chapter — Live Attention widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attention");
  });

  test("live model loads, runs a forward pass, and renders attention from a clicked token", async ({
    page,
  }) => {
    const widget = page
      .locator(".widget-container")
      .filter({ hasText: "Live Attention Heads" });

    // Wait for model to finish loading (up to 30s on a cold network)
    await expect(widget.getByText("Loading attention model…")).toBeVisible();
    await expect(widget.getByText("Loading attention model…")).not.toBeVisible({
      timeout: 30_000,
    });

    // The default sentence's tokens should render as chips
    await expect(widget.locator("textarea")).toHaveValue(/Bob/);

    // Click the second "Bob" token chip (last token chip with text "bob")
    const bobChips = widget.getByRole("button", { name: /^bob$/i });
    await expect(bobChips.first()).toBeVisible();
    await bobChips.last().click();

    // Attention readout should appear
    await expect(widget.getByText(/Attention from/)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test**

```bash
pnpm dev   # in another terminal
npx playwright test tests/attention.spec.ts
```

Expected: 1 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/attention.spec.ts
git commit -m "Add e2e test for live attention widget"
```

---

### Task 15: Final polish — refine examples and copy from observed behavior

**Files:**
- Modify: `src/components/widgets/attention/LiveAttention.tsx`
- Modify: `src/app/(tutorial)/attention/content.mdx`

This task is intentionally short on prescription because it depends on what the trained model actually does. The implementer plays with the deployed widget and refines.

- [ ] **Step 1: Play with the widget for ~15 minutes and note rough edges**

Visit each tab. Click the suggested token. Does the named head do something visibly compelling? Does the hint copy actually describe what the user sees?

If a tab's promise doesn't pay off (e.g. "Induction (long)" doesn't actually surface induction visually), either:
- Pick a different sentence that does work
- Delete the tab
- Reword the hint to match observed behavior

- [ ] **Step 2: Update `EXAMPLES` and `NAMED_HEADS` based on what works**

Make the changes inline. Keep the curated set tight: it's better to have 3 great tabs than 6 lukewarm ones.

- [ ] **Step 3: Re-read the chapter prose for the new section**

Open `/attention` and read from the top of "Attention in a Real Model" through to the next section. Does the bridging paragraph land? Does the hint inside `<LiveAttentionWidget>` correctly describe the headline demo? Tweak if needed.

- [ ] **Step 4: Run lint and tests one more time**

```bash
pnpm lint
npx playwright test tests/attention.spec.ts
```

Both should pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/attention/LiveAttention.tsx
git add src/app/(tutorial)/attention/content.mdx
git commit -m "Polish live attention examples and chapter prose"
```

---

## Done

The chapter now has two attention widgets side by side: the curated BERT pre-recording (unchanged) and a live tiny transformer the reader can interact with. The `notebooks/attention.ipynb` companion notebook is intentionally unchanged in this plan; if the user wants the notebook to load the same trained weights, that's a follow-up.
