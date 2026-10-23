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
from _attention_model import TinyTransformer  # noqa: E402
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
    load_into_model(model, bin_path, quantized=meta["config"].get("quantization") == "int8")
    model.eval()
    tok = Tokenizer.from_file(str(TOKENIZER_PATH))
    return model, tok


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
        attentions.append(a[0].detach())
        out = a @ v
        out = out.transpose(1, 2).contiguous().view(B, T, attn.embed_dim)
        x = x + attn.out(out)
        x = x + layer["ffn"](x)
    x = model.ln_final(x)
    logits = model.output(x)
    return logits, attentions


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
    """For each occurrence of a token X at position i with at least one prior
    occurrence at j <= i-2, score the attention A[i, j+1] from i to whatever
    followed the *most recent* prior X. This is the canonical induction-head
    behavior: look up the most recent past occurrence and attend to its
    successor."""
    if _ids is None:
        return 0.0
    T = len(_ids)
    hits = 0.0
    n = 0
    for i in range(2, T):
        x = _ids[i]
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


def score_all_heads(model: TinyTransformer, tok: Tokenizer) -> dict:
    """Run every probe through the model and return both the cross-probe
    template means and the per-(probe, layer, head) attention matrices,
    plus the per-(template, probe) per-head scores so heatmaps can pick the
    most-relevant probe for each named head."""
    cfg = model.cfg
    L, H = cfg["num_layers"], cfg["num_heads"]
    sums = {name: np.zeros((L, H)) for name in TEMPLATES}
    # per_probe_scores[name][probe_idx] = (L, H) matrix of per-head scores
    # on that probe
    per_probe_scores: dict[str, list[np.ndarray]] = {name: [] for name in TEMPLATES}
    captured: dict[str, dict[tuple[int, int], np.ndarray]] = {}
    counts = 0
    for sent in PROBE_SENTENCES:
        ids = tok.encode(sent).ids
        ids_t = torch.tensor([ids], dtype=torch.long)
        with torch.no_grad():
            _, attentions = forward_with_attentions(model, ids_t)
        per_head_score = {name: np.zeros((L, H)) for name in TEMPLATES}
        captured[sent] = {}
        for l, layer_attn in enumerate(attentions):
            for h in range(H):
                A = layer_attn[h].cpu().numpy()
                captured[sent][(l, h)] = A
                for name, fn in TEMPLATES.items():
                    s = fn(A, _ids=ids)
                    sums[name][l, h] += s
                    per_head_score[name][l, h] = s
        for name in TEMPLATES:
            per_probe_scores[name].append(per_head_score[name])
        counts += 1

    means = {name: sums[name] / counts for name in TEMPLATES}

    ranked = {}
    for name, mat in means.items():
        flat = [(float(mat[l, h]), l, h) for l in range(L) for h in range(H)]
        flat.sort(reverse=True)
        ranked[name] = flat[:5]

    return {
        "means": means,
        "ranked": ranked,
        "captured": captured,
        "per_probe_scores": per_probe_scores,
    }


def best_probe_for(per_probe_scores: list[np.ndarray], layer: int, head: int) -> int:
    """Return the probe index where (layer, head) scored highest under this template."""
    scores = [m[layer, head] for m in per_probe_scores]
    return int(np.argmax(scores))


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

    # Render top-3 heatmap per template on whichever probe best exercises it
    # for that specific head, not always the first probe.
    for name, top in results["ranked"].items():
        for rank, (mean_score, l, h) in enumerate(top[:3]):
            probe_idx = best_probe_for(results["per_probe_scores"][name], l, h)
            sent = PROBE_SENTENCES[probe_idx]
            enc = tok.encode(sent)
            A = results["captured"][sent][(l, h)]
            local_score = float(results["per_probe_scores"][name][probe_idx][l, h])
            out = OUT_DIR / f"{name}_rank{rank + 1}_L{l}H{h}.png"
            render_heatmap(A, enc.tokens,
                           out_path=out,
                           title=(f"{name} — L{l}H{h}  "
                                  f"(mean={mean_score:.3f}, probe={local_score:.3f})\n{sent}"))
            print(f"  wrote {out.name}  ({sent[:40]}…)")

    print("\nTop heads per template:")
    for name, top in results["ranked"].items():
        print(f"  {name}:")
        for score, l, h in top:
            print(f"    L{l}H{h}: {score:.3f}")


if __name__ == "__main__":
    main()
