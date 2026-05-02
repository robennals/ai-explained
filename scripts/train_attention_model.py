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
import struct
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from datasets import load_dataset
from tokenizers import Tokenizer

# Shared model definition lives in _attention_model.py so test scripts can
# import it without pulling in datasets/tokenizers.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _attention_model import CONFIG, TinyTransformer  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TOKENIZER_PATH = ROOT / "public" / "data" / "tokenizer" / "ts-tokenizer-4096.json"
OUTPUT_DIR = ROOT / "public" / "data" / "attention-model"


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


def write_tensor_int8(f, t: torch.Tensor) -> None:
    """Write a tensor in int8 quantized format with per-tensor scale."""
    arr = t.detach().cpu().contiguous().to(torch.float32).numpy()
    f.write(struct.pack("<I", arr.ndim))
    for d in arr.shape:
        f.write(struct.pack("<I", d))
    abs_max = float(np.abs(arr).max())
    scale = abs_max / 127.0 if abs_max > 0 else 1.0
    f.write(struct.pack("<f", scale))
    # Clip to symmetric [-127, 127]; -128 has no positive counterpart and
    # banker's rounding can occasionally emit it, which would overflow int8.
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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--smoke", action="store_true", help="Tiny smoke run.")
    parser.add_argument("--quantize", action="store_true", help="Export int8 quantized.")
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
    vocab = [tok.id_to_token(i) or f"<id_{i}>" for i in range(CONFIG["vocab_size"])]
    if args.quantize:
        export_weights_int8(model, vocab, OUTPUT_DIR)
    else:
        export_weights(model, vocab, OUTPUT_DIR)


if __name__ == "__main__":
    main()
