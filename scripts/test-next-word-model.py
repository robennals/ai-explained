#!/usr/bin/env python3
"""Quick test: load exported model and run inference."""
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "tokenizers>=0.21",
#     "torch>=2.0",
#     "numpy>=1.24",
# ]
# ///

import json
import struct
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from tokenizers import Tokenizer

ROOT = Path(__file__).resolve().parent.parent
TOKENIZER_PATH = ROOT / "public" / "data" / "tokenizer" / "ts-tokenizer-4096.json"
MODEL_DIR = ROOT / "public" / "data" / "next-word-model"


class NextWordModel(nn.Module):
    def __init__(self, vocab_size, embed_dim, context_len, hidden_dim):
        super().__init__()
        self.context_len = context_len
        self.embed_dim = embed_dim
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.fc1 = nn.Linear(context_len * embed_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x):
        e = self.embedding(x)
        e = e.view(e.size(0), -1)
        h = F.relu(self.fc1(e))
        return self.fc2(h)


def load_model(name: str):
    config_path = MODEL_DIR / f"{name}.json"
    bin_path = MODEL_DIR / f"{name}.weights.bin"

    with open(config_path) as f:
        data = json.load(f)

    cfg = data["config"]
    model = NextWordModel(cfg["vocab_size"], cfg["embed_dim"], cfg["context_len"], cfg["hidden_dim"])

    # Load binary weights
    state = {}
    weight_names = [
        ("embedding.weight", None),
        ("fc1.weight", None),
        ("fc1.bias", None),
        ("fc2.weight", None),
        ("fc2.bias", None),
    ]

    with open(bin_path, "rb") as f:
        for key, _ in weight_names:
            ndims = struct.unpack("<I", f.read(4))[0]
            shape = tuple(struct.unpack("<I", f.read(4))[0] for _ in range(ndims))
            n_elements = 1
            for d in shape:
                n_elements *= d
            arr = np.frombuffer(f.read(n_elements * 4), dtype=np.float32).reshape(shape)
            state[key] = torch.from_numpy(arr.copy())

    model.load_state_dict(state)
    model.eval()
    return model, data["vocab"], cfg


def main():
    tok = Tokenizer.from_file(str(TOKENIZER_PATH))

    for name in ["next-word-ctx2", "next-word-ctx3", "next-word-best"]:
        print(f"\n{'='*60}")
        print(f"Model: {name}")
        print(f"{'='*60}")

        model, vocab, cfg = load_model(name)
        ctx_len = cfg["context_len"]
        id_to_token = {i: t for i, t in enumerate(vocab)}

        demo_phrases = [
            "once upon",
            "once upon a",
            "the little",
            "the little girl",
            "she was",
            "she was very",
            "he said",
            "they went to",
            "the cat sat",
            "it was a",
        ]

        for phrase in demo_phrases:
            encoded = tok.encode(phrase)
            ids = encoded.ids[-ctx_len:]
            if len(ids) < ctx_len:
                continue

            tokens_used = [id_to_token.get(i, "?") for i in ids]
            x = torch.tensor([ids], dtype=torch.long)
            with torch.no_grad():
                logits = model(x)
                probs = F.softmax(logits, dim=-1)
                top5 = probs.topk(5, dim=-1)

            preds = []
            for prob, idx in zip(top5.values[0], top5.indices[0]):
                token = id_to_token.get(idx.item(), "[UNK]")
                preds.append(f"{token}({prob.item():.1%})")

            print(f"  [{', '.join(tokens_used)}] → {', '.join(preds)}")

        # Test generalization: similar words should give similar predictions
        print(f"\n  Generalization test (similar words → similar predictions):")
        word_groups = [
            ["cat", "dog", "bird"],
            ["boy", "girl", "child"],
            ["happy", "sad", "angry"],
        ]

        for group in word_groups:
            print(f"  Group: {group}")
            for word in group:
                # Pad context: "the {word}"
                prefix_ids = tok.encode(f"the {word}").ids
                ids = prefix_ids[-ctx_len:]
                if len(ids) < ctx_len:
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

                print(f"    the {word} → {', '.join(preds)}")


if __name__ == "__main__":
    main()
