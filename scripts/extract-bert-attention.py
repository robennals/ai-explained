"""
Extract attention weights from BERT for specific sentences.
Outputs JSON for the attention widgets.

Usage: python scripts/extract-bert-attention.py
"""

import json
import torch
from transformers import BertTokenizer, BertModel

SENTENCES = [
    # Original sentences with pronouns
    "The dog chased the cat because it was angry",
    "The movie was not great but I loved it anyway",
    # New sentences — all have pronouns whose referent is in the sentence
    "The teacher praised the student because she was proud",
    "The ball hit the window and it broke",
    "The cat knocked the vase off the table and it shattered",
    "The boy gave the girl a book because she wanted it",
    # Kept for multi-head demo later (no pronouns but interesting structure)
    "The chef who won the competition opened a restaurant",
    "The old cat sat on the warm mat and slept",
]

# The 4 heads used in BertAttention.tsx
INTERESTING_HEADS = [
    (2, 0, "Next word"),      # attends to following word
    (3, 5, "Previous word"),  # attends to preceding word
    (4, 3, "Self / pronoun"), # self-attention, but resolves pronouns
    (6, 11, "Broad context"), # wider attention spread
]


def extract_attention(model, tokenizer, sentence):
    inputs = tokenizer(sentence, return_tensors="pt")
    tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
    with torch.no_grad():
        outputs = model(**inputs, output_attentions=True)
    return tokens, outputs.attentions


def merge_subword_attention(tokens, attn_matrix, sentence):
    """Merge subword tokens back into whole words."""
    words = sentence.split()
    word_to_token_indices = []
    tok_idx = 1  # skip [CLS]
    for word in words:
        indices = [tok_idx]
        tok_idx += 1
        while tok_idx < len(tokens) - 1 and tokens[tok_idx].startswith("##"):
            indices.append(tok_idx)
            tok_idx += 1
        word_to_token_indices.append(indices)

    n_words = len(words)
    merged = torch.zeros(n_words, n_words)
    for i, src_indices in enumerate(word_to_token_indices):
        for j, tgt_indices in enumerate(word_to_token_indices):
            total = sum(
                attn_matrix[si, tj].item()
                for si in src_indices
                for tj in tgt_indices
            )
            merged[i, j] = total / (len(src_indices) * len(tgt_indices))

    row_sums = merged.sum(dim=1, keepdim=True)
    merged = merged / row_sums.clamp(min=1e-9)
    return words, merged


def main():
    print("Loading BERT...")
    tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    model = BertModel.from_pretrained(
        "bert-base-uncased", attn_implementation="eager"
    )
    model.eval()

    all_results = []

    for sentence in SENTENCES:
        print(f"\n--- {sentence} ---")
        tokens, attentions = extract_attention(model, tokenizer, sentence)

        heads_data = []
        for layer, head, label in INTERESTING_HEADS:
            attn = attentions[layer][0, head]
            words, merged = merge_subword_attention(tokens, attn, sentence)

            # Print summary
            print(f"  {label} (L{layer}H{head}):")
            for wi, word in enumerate(words):
                row = merged[wi].tolist()
                top = sorted(range(len(row)), key=lambda j: row[j], reverse=True)[:3]
                targets = ", ".join(f"{words[j]}({row[j]:.0%})" for j in top)
                print(f"    {word:>15} → {targets}")

            heads_data.append({
                "layer": layer,
                "head": head,
                "label": label,
                "attention": [[round(v, 3) for v in row] for row in merged.tolist()],
            })

        all_results.append({
            "sentence": sentence,
            "words": words,
            "heads": heads_data,
        })

    output_path = "scripts/bert-attention-data.json"
    with open(output_path, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"\nWrote {output_path}")


if __name__ == "__main__":
    main()
