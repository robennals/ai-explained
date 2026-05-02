#!/usr/bin/env python3
"""Round-trip test: load exported weights into a fresh PyTorch model and confirm
that running the same forward pass on a fixed input produces matching logits."""
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "torch>=2.0",
#     "numpy>=1.24",
# ]
# ///

import json
import struct
import sys
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from _attention_model import CONFIG, TinyTransformer  # noqa: E402

MODEL_DIR = ROOT / "public" / "data" / "attention-model"


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
    quantized = cfg.get("quantization") == "int8"
    cfg_no_quant = {k: v for k, v in cfg.items() if k != "quantization"}
    assert cfg_no_quant == CONFIG, f"Config mismatch: {cfg_no_quant} vs {CONFIG}"

    # Build a fresh model and load weights from disk
    reloaded = TinyTransformer(CONFIG)
    reloaded.eval()
    load_into_model(reloaded, bin_path, quantized=quantized)

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
        if quantized:
            tol = 0.5
            assert max_diff < tol, f"Quantized round-trip exceeded tolerance {tol}: {max_diff}"
            print(f"Round-trip OK (int8, max diff {max_diff:.3f})")
        else:
            assert max_diff == 0.0, f"Expected bit-identical round-trip, got {max_diff}"
            print("Round-trip OK (bit-identical)")
    else:
        print(f"No {ckpt_path} found — shape check only.")
        print("Round-trip OK (shapes consistent)")


if __name__ == "__main__":
    main()
