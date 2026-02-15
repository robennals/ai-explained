#!/usr/bin/env python3
"""Train a small next-word prediction model for the tutorial.

Uses the TinyStories WordPiece tokenizer (4096 vocab) and trains a simple
embedding → dense → softmax model that predicts the next token from the
previous N tokens.

Usage:
    uv run scripts/train-next-word-model.py

Tries multiple configurations (context sizes, embedding widths) and exports
the best one to TensorFlow.js format.
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

import json
import math
import os
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
OUTPUT_DIR = ROOT / "public" / "data" / "next-word-model"


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
class NextWordModel(nn.Module):
    """Simple next-word predictor: embed context tokens → flatten → dense → vocab."""

    def __init__(self, vocab_size: int, embed_dim: int, context_len: int, hidden_dim: int):
        super().__init__()
        self.context_len = context_len
        self.embed_dim = embed_dim
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.fc1 = nn.Linear(context_len * embed_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, context_len) of token ids
        e = self.embedding(x)  # (batch, context_len, embed_dim)
        e = e.view(e.size(0), -1)  # (batch, context_len * embed_dim)
        h = F.relu(self.fc1(e))
        return self.fc2(h)  # (batch, vocab_size)


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
def load_tokenizer() -> Tokenizer:
    tok = Tokenizer.from_file(str(TOKENIZER_PATH))
    return tok


def tokenize_stories(tok: Tokenizer, num_stories: int = 50_000) -> list[list[int]]:
    """Load TinyStories and tokenize into lists of token ids."""
    print(f"Loading TinyStories ({num_stories} stories)...")
    ds = load_dataset("roneneldan/TinyStories", split="train", streaming=True)

    all_ids: list[list[int]] = []
    for i, row in enumerate(ds):
        if i >= num_stories:
            break
        text = row["text"]
        encoded = tok.encode(text)
        ids = encoded.ids
        if len(ids) >= 4:  # need at least context + 1 target
            all_ids.append(ids)
        if (i + 1) % 10000 == 0:
            print(f"  Tokenized {i + 1} stories...")

    print(f"  Done: {len(all_ids)} stories, {sum(len(s) for s in all_ids)} total tokens")
    return all_ids


def make_training_data(
    stories: list[list[int]], context_len: int
) -> tuple[torch.Tensor, torch.Tensor]:
    """Create (context, target) pairs from tokenized stories."""
    xs, ys = [], []
    for story in stories:
        for i in range(len(story) - context_len):
            xs.append(story[i : i + context_len])
            ys.append(story[i + context_len])

    return torch.tensor(xs, dtype=torch.long), torch.tensor(ys, dtype=torch.long)


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train_model(
    model: NextWordModel,
    X: torch.Tensor,
    Y: torch.Tensor,
    epochs: int = 3,
    batch_size: int = 512,
    lr: float = 0.001,
    device: str = "cpu",
) -> float:
    model = model.to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    n = len(X)
    n_batches = math.ceil(n / batch_size)

    # Shuffle once
    perm = torch.randperm(n)
    X = X[perm]
    Y = Y[perm]

    # Split 95/5 for train/val
    split = int(n * 0.95)
    X_train, X_val = X[:split], X[split:]
    Y_train, Y_val = Y[:split], Y[split:]

    best_val_loss = float("inf")

    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        n_train_batches = math.ceil(len(X_train) / batch_size)

        # Shuffle training data each epoch
        perm = torch.randperm(len(X_train))
        X_train = X_train[perm]
        Y_train = Y_train[perm]

        for i in range(n_train_batches):
            start = i * batch_size
            end = min(start + batch_size, len(X_train))
            xb = X_train[start:end].to(device)
            yb = Y_train[start:end].to(device)

            logits = model(xb)
            loss = criterion(logits, yb)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        # Validation
        model.eval()
        val_loss = 0.0
        n_val_batches = math.ceil(len(X_val) / batch_size)
        correct = 0
        top5_correct = 0
        total_val = 0

        with torch.no_grad():
            for i in range(n_val_batches):
                start = i * batch_size
                end = min(start + batch_size, len(X_val))
                xb = X_val[start:end].to(device)
                yb = Y_val[start:end].to(device)

                logits = model(xb)
                val_loss += criterion(logits, yb).item()

                preds = logits.argmax(dim=-1)
                correct += (preds == yb).sum().item()

                top5 = logits.topk(5, dim=-1).indices
                top5_correct += (top5 == yb.unsqueeze(-1)).any(dim=-1).sum().item()
                total_val += len(yb)

        avg_train = total_loss / n_train_batches
        avg_val = val_loss / n_val_batches
        acc = correct / total_val * 100
        top5_acc = top5_correct / total_val * 100

        if avg_val < best_val_loss:
            best_val_loss = avg_val

        print(
            f"  Epoch {epoch + 1}/{epochs}: "
            f"train_loss={avg_train:.4f}  val_loss={avg_val:.4f}  "
            f"top1_acc={acc:.1f}%  top5_acc={top5_acc:.1f}%"
        )

    return best_val_loss


# ---------------------------------------------------------------------------
# Export to a simple JSON format for browser inference
# ---------------------------------------------------------------------------
def export_model(model: NextWordModel, tok: Tokenizer, output_dir: Path, name: str):
    """Export model weights as JSON + binary for browser inference."""
    output_dir.mkdir(parents=True, exist_ok=True)

    model.eval()
    state = model.state_dict()

    # Build vocab lookup (id → token string)
    vocab = tok.get_vocab()
    id_to_token = {v: k for k, v in vocab.items()}
    vocab_list = [id_to_token.get(i, "[UNK]") for i in range(len(vocab))]

    # Export as JSON with float32 arrays
    model_data = {
        "config": {
            "vocab_size": len(vocab),
            "embed_dim": model.embed_dim,
            "context_len": model.context_len,
            "hidden_dim": model.fc1.out_features,
        },
        "weights": {
            "embedding": state["embedding.weight"].cpu().numpy().tolist(),
            "fc1_weight": state["fc1.weight"].cpu().numpy().tolist(),
            "fc1_bias": state["fc1.bias"].cpu().numpy().tolist(),
            "fc2_weight": state["fc2.weight"].cpu().numpy().tolist(),
            "fc2_bias": state["fc2.bias"].cpu().numpy().tolist(),
        },
        "vocab": vocab_list,
    }

    json_path = output_dir / f"{name}.json"
    print(f"  Exporting to {json_path}...")

    with open(json_path, "w") as f:
        json.dump(model_data, f)

    file_size = json_path.stat().st_size
    print(f"  Model size: {file_size / 1024 / 1024:.1f} MB")

    return json_path


def export_model_binary(model: NextWordModel, tok: Tokenizer, output_dir: Path, name: str):
    """Export model with binary weight files for smaller size."""
    output_dir.mkdir(parents=True, exist_ok=True)

    model.eval()
    state = model.state_dict()

    vocab = tok.get_vocab()
    id_to_token = {v: k for k, v in vocab.items()}
    vocab_list = [id_to_token.get(i, "[UNK]") for i in range(len(vocab))]

    # Save config + vocab as JSON
    config = {
        "config": {
            "vocab_size": len(vocab),
            "embed_dim": model.embed_dim,
            "context_len": model.context_len,
            "hidden_dim": model.fc1.out_features,
        },
        "vocab": vocab_list,
        "weight_files": [f"{name}.weights.bin"],
    }

    config_path = output_dir / f"{name}.json"
    with open(config_path, "w") as f:
        json.dump(config, f)

    # Save weights as a single binary file (float32)
    bin_path = output_dir / f"{name}.weights.bin"
    with open(bin_path, "wb") as f:
        for key in ["embedding.weight", "fc1.weight", "fc1.bias", "fc2.weight", "fc2.bias"]:
            arr = state[key].cpu().numpy().astype(np.float32)
            # Write shape: ndims (uint32), then each dim (uint32)
            f.write(struct.pack("<I", len(arr.shape)))
            for d in arr.shape:
                f.write(struct.pack("<I", d))
            f.write(arr.tobytes())

    total_size = config_path.stat().st_size + bin_path.stat().st_size
    print(f"  JSON: {config_path.stat().st_size / 1024:.0f} KB")
    print(f"  Weights: {bin_path.stat().st_size / 1024:.0f} KB")
    print(f"  Total: {total_size / 1024:.0f} KB")

    return config_path, bin_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Using device: {device}")

    tok = load_tokenizer()
    vocab_size = tok.get_vocab_size()
    print(f"Vocab size: {vocab_size}")

    # Load and tokenize stories
    stories = tokenize_stories(tok, num_stories=50_000)

    # Try different configurations
    configs = [
        # (context_len, embed_dim, hidden_dim, name)
        (2, 32, 128, "ctx2_e32_h128"),
        (2, 64, 128, "ctx2_e64_h128"),
        (2, 64, 256, "ctx2_e64_h256"),
        (3, 32, 128, "ctx3_e32_h128"),
        (3, 64, 128, "ctx3_e64_h128"),
        (3, 64, 256, "ctx3_e64_h256"),
        (3, 128, 256, "ctx3_e128_h256"),
    ]

    results = []

    for context_len, embed_dim, hidden_dim, name in configs:
        print(f"\n{'='*60}")
        print(f"Config: {name} (context={context_len}, embed={embed_dim}, hidden={hidden_dim})")
        print(f"{'='*60}")

        X, Y = make_training_data(stories, context_len)
        print(f"Training samples: {len(X):,}")

        model = NextWordModel(vocab_size, embed_dim, context_len, hidden_dim)
        n_params = sum(p.numel() for p in model.parameters())
        print(f"Parameters: {n_params:,}")

        t0 = time.time()
        val_loss = train_model(model, X, Y, epochs=5, batch_size=1024, device=device)
        elapsed = time.time() - t0
        print(f"Training time: {elapsed:.1f}s")

        results.append((name, context_len, embed_dim, hidden_dim, n_params, val_loss, model))

    # Summary
    print(f"\n{'='*60}")
    print("RESULTS SUMMARY")
    print(f"{'='*60}")
    print(f"{'Name':<20} {'Params':>10} {'Val Loss':>10}")
    print("-" * 42)
    for name, ctx, emb, hid, params, loss, _ in results:
        print(f"{name:<20} {params:>10,} {loss:>10.4f}")

    # Export the best model for each context length
    for ctx_len in [2, 3]:
        ctx_results = [(n, c, e, h, p, l, m) for n, c, e, h, p, l, m in results if c == ctx_len]
        if not ctx_results:
            continue
        best = min(ctx_results, key=lambda x: x[5])
        name, _, _, _, params, loss, model = best
        print(f"\nBest context-{ctx_len} model: {name} (loss={loss:.4f}, params={params:,})")

        export_model_binary(model, tok, OUTPUT_DIR, f"next-word-ctx{ctx_len}")

    # Also export the overall best
    best_overall = min(results, key=lambda x: x[5])
    name, ctx, emb, hid, params, loss, model = best_overall
    print(f"\nOverall best: {name} (loss={loss:.4f}, params={params:,})")
    export_model_binary(model, tok, OUTPUT_DIR, "next-word-best")

    # Quick demo of the best model
    print(f"\n{'='*60}")
    print("DEMO: Top-5 predictions")
    print(f"{'='*60}")
    model = best_overall[6]
    model.eval()

    demo_phrases = [
        "once upon",
        "the little",
        "she was",
        "he said",
        "they went",
    ]

    vocab = tok.get_vocab()
    id_to_token = {v: k for k, v in vocab.items()}

    for phrase in demo_phrases:
        encoded = tok.encode(phrase)
        ids = encoded.ids[-best_overall[1]:]  # last context_len tokens
        if len(ids) < best_overall[1]:
            continue

        x = torch.tensor([ids], dtype=torch.long)
        with torch.no_grad():
            logits = model(x)
            probs = F.softmax(logits, dim=-1)
            top5 = probs.topk(5, dim=-1)

        preds = []
        for prob, idx in zip(top5.values[0], top5.indices[0]):
            token = id_to_token.get(idx.item(), "[UNK]")
            preds.append(f"{token}({prob.item():.1%})")

        print(f"  '{phrase}' → {', '.join(preds)}")


if __name__ == "__main__":
    main()
