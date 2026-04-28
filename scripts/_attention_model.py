"""Shared model definition for the live attention widget.

Importing this module pulls only torch + math (no datasets / tokenizers),
so test scripts can use it without inflating their dep environment.
"""

import math

import torch
import torch.nn as nn
import torch.nn.functional as F

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
        B, T, C = x.shape
        h = self.ln1(x)
        qkv = self.qkv(h)
        q, k, v = qkv.split(self.embed_dim, dim=-1)
        q = q.view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        k = k.view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        v = v.view(B, T, self.num_heads, self.head_dim).transpose(1, 2)
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        mask = torch.triu(torch.ones(T, T, device=x.device), diagonal=1).bool()
        scores = scores.masked_fill(mask, float("-inf"))
        attn = F.softmax(scores, dim=-1)
        out = attn @ v
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
        B, T = ids.shape
        pos = torch.arange(T, device=ids.device)
        x = self.token_emb(ids) + self.pos_emb(pos)
        for layer in self.layers:
            x = x + layer["attn"](x)
            x = x + layer["ffn"](x)
        x = self.ln_final(x)
        return self.output(x)
