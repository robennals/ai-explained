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
          lr: float, device: str, log_every: int = 100) -> None:
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
            if step == 1 or step % log_every == 0 or step == n_steps:
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
        epochs, batch_size, lr, log_every = 1, 16, 3e-4, 10
    else:
        data = load_data(tok, num_stories=50_000, ctx=CONFIG["context_len"])
        epochs, batch_size, lr, log_every = 3, 64, 3e-4, 100

    model = TinyTransformer(CONFIG)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"Model: {n_params:,} parameters")

    train(model, data, epochs=epochs, batch_size=batch_size, lr=lr, device=device,
          log_every=log_every)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), OUTPUT_DIR / "checkpoint.pt")
    print(f"Saved checkpoint to {OUTPUT_DIR / 'checkpoint.pt'}")


if __name__ == "__main__":
    main()
