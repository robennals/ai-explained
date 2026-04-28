/**
 * Pure-JS transformer inference engine.
 * Loads model weights from a JSON config + binary weights file (same pattern as SimpleNNPredictor).
 * Supports causal-masked multi-head attention, layer norm, residual connections, and feed-forward layers.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransformerConfig {
  vocab_size: number;
  embed_dim: number;
  num_heads: number;
  num_layers: number;
  ff_dim: number;
  context_len: number;
  quantization?: "int8";  // optional; absence = fp32
}

export interface TransformerWeights {
  // Token embeddings: (vocab_size, embed_dim)
  token_embedding: Float32Array;
  // Positional embeddings: (context_len, embed_dim)
  pos_embedding: Float32Array;
  // Per-layer weights
  layers: LayerWeights[];
  // Final layer norm
  ln_final_weight: Float32Array;
  ln_final_bias: Float32Array;
  // Output projection (often tied to token_embedding)
  output_weight: Float32Array; // (vocab_size, embed_dim)
  output_bias: Float32Array; // (vocab_size,)
}

export interface LayerWeights {
  // Attention layer norm
  ln1_weight: Float32Array;
  ln1_bias: Float32Array;
  // QKV projection: (3 * embed_dim, embed_dim)
  qkv_weight: Float32Array;
  qkv_bias: Float32Array;
  // Output projection: (embed_dim, embed_dim)
  attn_out_weight: Float32Array;
  attn_out_bias: Float32Array;
  // FF layer norm
  ln2_weight: Float32Array;
  ln2_bias: Float32Array;
  // FF layer 1: (ff_dim, embed_dim)
  ff1_weight: Float32Array;
  ff1_bias: Float32Array;
  // FF layer 2: (embed_dim, ff_dim)
  ff2_weight: Float32Array;
  ff2_bias: Float32Array;
}

export interface TransformerModel {
  config: TransformerConfig;
  weights: TransformerWeights;
  vocab: string[];
}

export interface InferenceResult {
  logits: Float32Array; // (vocab_size,) for the last position
  probs: Float32Array; // softmax of logits
  // Internals for visualization
  layerAttentions: Float32Array[][]; // [layer][head] = (seq_len, seq_len)
  layerOutputs: Float32Array[]; // [layer] = (embed_dim,) for last token after this layer
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function layerNorm(
  input: Float32Array,
  weight: Float32Array,
  bias: Float32Array,
  dim: number,
  offset: number = 0,
): Float32Array {
  const out = new Float32Array(dim);
  let mean = 0;
  for (let i = 0; i < dim; i++) mean += input[offset + i];
  mean /= dim;
  let variance = 0;
  for (let i = 0; i < dim; i++) {
    const d = input[offset + i] - mean;
    variance += d * d;
  }
  variance /= dim;
  const std = Math.sqrt(variance + 1e-5);
  for (let i = 0; i < dim; i++) {
    out[i] = ((input[offset + i] - mean) / std) * weight[i] + bias[i];
  }
  return out;
}

function matmul(
  a: Float32Array,
  b: Float32Array,
  rows: number,
  inner: number,
  cols: number,
  bias?: Float32Array,
): Float32Array {
  // a: (rows, inner), b: (cols, inner) stored row-major, output: (rows, cols)
  const out = new Float32Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sum = bias ? bias[c] : 0;
      for (let k = 0; k < inner; k++) {
        sum += a[r * inner + k] * b[c * inner + k];
      }
      out[r * cols + c] = sum;
    }
  }
  return out;
}

function gelu(x: number): number {
  // Approximate GELU
  return (
    0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)))
  );
}

export function softmax(logits: Float32Array, temperature: number = 1.0): Float32Array {
  const out = new Float32Array(logits.length);
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > max) max = logits[i];
  }
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    out[i] = Math.exp((logits[i] - max) / Math.max(temperature, 1e-8));
    sum += out[i];
  }
  for (let i = 0; i < logits.length; i++) out[i] /= sum;
  return out;
}

export function sampleFromProbs(probs: Float32Array): number {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) return i;
  }
  return probs.length - 1;
}

// ---------------------------------------------------------------------------
// Forward pass
// ---------------------------------------------------------------------------

export function forward(
  model: TransformerModel,
  tokenIds: number[],
): InferenceResult {
  const { config, weights } = model;
  const { embed_dim, num_heads, num_layers, ff_dim } = config;
  const seqLen = tokenIds.length;
  const headDim = embed_dim / num_heads;

  // 1. Token + position embeddings -> (seqLen, embed_dim)
  const hidden = new Float32Array(seqLen * embed_dim);
  for (let t = 0; t < seqLen; t++) {
    const tokId = tokenIds[t];
    for (let d = 0; d < embed_dim; d++) {
      hidden[t * embed_dim + d] =
        weights.token_embedding[tokId * embed_dim + d] +
        weights.pos_embedding[t * embed_dim + d];
    }
  }

  const layerAttentions: Float32Array[][] = [];
  const layerOutputs: Float32Array[] = [];

  // 2. Transformer layers
  for (let l = 0; l < num_layers; l++) {
    const lw = weights.layers[l];

    // --- Attention sub-layer ---
    // Layer norm
    const normed1 = new Float32Array(seqLen * embed_dim);
    for (let t = 0; t < seqLen; t++) {
      const ln = layerNorm(hidden, lw.ln1_weight, lw.ln1_bias, embed_dim, t * embed_dim);
      normed1.set(ln, t * embed_dim);
    }

    // QKV projection: (seqLen, embed_dim) x (3*embed_dim, embed_dim)^T -> (seqLen, 3*embed_dim)
    const qkv = matmul(normed1, lw.qkv_weight, seqLen, embed_dim, 3 * embed_dim, lw.qkv_bias);

    // Split into Q, K, V and compute attention per head
    const headAttentions: Float32Array[] = [];
    const attnOutput = new Float32Array(seqLen * embed_dim);

    for (let h = 0; h < num_heads; h++) {
      // Extract Q, K, V for this head: each (seqLen, headDim)
      const qOffset = h * headDim;
      const kOffset = embed_dim + h * headDim;
      const vOffset = 2 * embed_dim + h * headDim;

      // Compute attention scores: (seqLen, seqLen)
      const scores = new Float32Array(seqLen * seqLen);
      const scale = 1 / Math.sqrt(headDim);

      for (let i = 0; i < seqLen; i++) {
        for (let j = 0; j < seqLen; j++) {
          if (j > i) {
            scores[i * seqLen + j] = -1e9; // Causal mask
          } else {
            let dot = 0;
            for (let d = 0; d < headDim; d++) {
              dot +=
                qkv[i * 3 * embed_dim + qOffset + d] *
                qkv[j * 3 * embed_dim + kOffset + d];
            }
            scores[i * seqLen + j] = dot * scale;
          }
        }
      }

      // Softmax per row
      const attnWeights = new Float32Array(seqLen * seqLen);
      for (let i = 0; i < seqLen; i++) {
        let max = -Infinity;
        for (let j = 0; j <= i; j++) {
          if (scores[i * seqLen + j] > max) max = scores[i * seqLen + j];
        }
        let sum = 0;
        for (let j = 0; j <= i; j++) {
          attnWeights[i * seqLen + j] = Math.exp(scores[i * seqLen + j] - max);
          sum += attnWeights[i * seqLen + j];
        }
        for (let j = 0; j <= i; j++) {
          attnWeights[i * seqLen + j] /= sum;
        }
      }

      headAttentions.push(attnWeights);

      // Weighted sum of values
      for (let i = 0; i < seqLen; i++) {
        for (let d = 0; d < headDim; d++) {
          let sum = 0;
          for (let j = 0; j <= i; j++) {
            sum +=
              attnWeights[i * seqLen + j] *
              qkv[j * 3 * embed_dim + vOffset + d];
          }
          attnOutput[i * embed_dim + h * headDim + d] = sum;
        }
      }
    }

    layerAttentions.push(headAttentions);

    // Output projection
    const attnProj = matmul(
      attnOutput,
      lw.attn_out_weight,
      seqLen,
      embed_dim,
      embed_dim,
      lw.attn_out_bias,
    );

    // Residual connection
    for (let i = 0; i < seqLen * embed_dim; i++) {
      hidden[i] += attnProj[i];
    }

    // --- Feed-forward sub-layer ---
    // Layer norm
    const normed2 = new Float32Array(seqLen * embed_dim);
    for (let t = 0; t < seqLen; t++) {
      const ln = layerNorm(hidden, lw.ln2_weight, lw.ln2_bias, embed_dim, t * embed_dim);
      normed2.set(ln, t * embed_dim);
    }

    // FF layer 1: (seqLen, embed_dim) -> (seqLen, ff_dim) with GELU
    const ff1 = matmul(normed2, lw.ff1_weight, seqLen, embed_dim, ff_dim, lw.ff1_bias);
    for (let i = 0; i < seqLen * ff_dim; i++) {
      ff1[i] = gelu(ff1[i]);
    }

    // FF layer 2: (seqLen, ff_dim) -> (seqLen, embed_dim)
    const ff2 = matmul(ff1, lw.ff2_weight, seqLen, ff_dim, embed_dim, lw.ff2_bias);

    // Residual connection
    for (let i = 0; i < seqLen * embed_dim; i++) {
      hidden[i] += ff2[i];
    }

    // Save last token's state for visualization
    const lastTokenState = new Float32Array(embed_dim);
    for (let d = 0; d < embed_dim; d++) {
      lastTokenState[d] = hidden[(seqLen - 1) * embed_dim + d];
    }
    layerOutputs.push(lastTokenState);
  }

  // 3. Final layer norm (last token only)
  const finalNormed = layerNorm(
    hidden,
    weights.ln_final_weight,
    weights.ln_final_bias,
    embed_dim,
    (seqLen - 1) * embed_dim,
  );

  // 4. Output projection -> logits
  const logits = new Float32Array(model.config.vocab_size);
  for (let v = 0; v < model.config.vocab_size; v++) {
    let sum = weights.output_bias[v];
    for (let d = 0; d < embed_dim; d++) {
      sum += finalNormed[d] * weights.output_weight[v * embed_dim + d];
    }
    logits[v] = sum;
  }

  const probs = softmax(logits);

  return { logits, probs, layerAttentions, layerOutputs };
}

// ---------------------------------------------------------------------------
// Model loading
// ---------------------------------------------------------------------------

const modelCache = new Map<string, Promise<TransformerModel>>();

export function loadTransformerModel(baseUrl: string): Promise<TransformerModel> {
  const cached = modelCache.get(baseUrl);
  if (cached) return cached;

  const promise = (async () => {
    const configResp = await fetch(`${baseUrl}.json`);
    if (!configResp.ok) throw new Error(`Model config: ${configResp.status}`);
    const json = await configResp.json();
    const config: TransformerConfig = json.config;
    const vocab: string[] = json.vocab;

    const binResp = await fetch(`${baseUrl}.weights.bin`);
    if (!binResp.ok) throw new Error(`Model weights: ${binResp.status}`);
    const buf = await binResp.arrayBuffer();
    const view = new DataView(buf);

    const quantization = (json.config as TransformerConfig).quantization;

    let offset = 0;

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

    const token_embedding = readTensor();
    const pos_embedding = readTensor();

    const layers: LayerWeights[] = [];
    for (let l = 0; l < config.num_layers; l++) {
      layers.push({
        ln1_weight: readTensor(),
        ln1_bias: readTensor(),
        qkv_weight: readTensor(),
        qkv_bias: readTensor(),
        attn_out_weight: readTensor(),
        attn_out_bias: readTensor(),
        ln2_weight: readTensor(),
        ln2_bias: readTensor(),
        ff1_weight: readTensor(),
        ff1_bias: readTensor(),
        ff2_weight: readTensor(),
        ff2_bias: readTensor(),
      });
    }

    const ln_final_weight = readTensor();
    const ln_final_bias = readTensor();
    const output_weight = readTensor();
    const output_bias = readTensor();

    return {
      config,
      weights: {
        token_embedding,
        pos_embedding,
        layers,
        ln_final_weight,
        ln_final_bias,
        output_weight,
        output_bias,
      },
      vocab,
    };
  })();

  modelCache.set(baseUrl, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Tokenization helpers (simple whitespace + lookup for our small models)
// ---------------------------------------------------------------------------

export function tokenize(text: string, vocab: string[]): number[] {
  // Build reverse lookup
  const wordToId = new Map<string, number>();
  for (let i = 0; i < vocab.length; i++) {
    wordToId.set(vocab[i], i);
  }

  const unkId = wordToId.get("<unk>") ?? wordToId.get("[UNK]") ?? 0;

  // Simple whitespace tokenization (for our small models)
  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  return tokens.map((t) => wordToId.get(t) ?? wordToId.get(t.toLowerCase()) ?? unkId);
}

export function topK(
  probs: Float32Array,
  vocab: string[],
  k: number = 10,
): { token: string; prob: number; id: number }[] {
  const indices = Array.from({ length: probs.length }, (_, i) => i);
  indices.sort((a, b) => probs[b] - probs[a]);
  return indices.slice(0, k).map((i) => ({
    token: vocab[i],
    prob: probs[i],
    id: i,
  }));
}
