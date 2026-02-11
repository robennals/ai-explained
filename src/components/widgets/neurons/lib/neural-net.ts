/**
 * Minimal MLP implementation for browser-based training widgets.
 * Supports forward pass, backpropagation, and multiple activation functions.
 */

// --- Activation functions ---

export type ActivationName = "sigmoid" | "relu" | "leaky_relu" | "swish";

export function activate(x: number, fn: ActivationName): number {
  switch (fn) {
    case "sigmoid":
      return 1 / (1 + Math.exp(-x));
    case "relu":
      return x > 0 ? x : 0;
    case "leaky_relu":
      return x > 0 ? x : 0.01 * x;
    case "swish":
      return x / (1 + Math.exp(-x));
  }
}

export function activateDerivative(
  x: number,
  output: number,
  fn: ActivationName
): number {
  switch (fn) {
    case "sigmoid":
      return output * (1 - output);
    case "relu":
      return x > 0 ? 1 : 0;
    case "leaky_relu":
      return x > 0 ? 1 : 0.01;
    case "swish": {
      const sig = 1 / (1 + Math.exp(-x));
      return sig + x * sig * (1 - sig);
    }
  }
}

// --- Network ---

export interface LayerState {
  weights: number[][]; // [neuron][input]
  biases: number[];
  preActivations: number[]; // z values (before activation)
  activations: number[]; // a values (after activation)
}

export interface NetworkState {
  layers: LayerState[];
  inputSize: number;
  outputSize: number;
  activation: ActivationName;
}

/** Create a network with random weights */
export function createNetwork(
  layerSizes: number[],
  activation: ActivationName = "sigmoid"
): NetworkState {
  const layers: LayerState[] = [];
  for (let i = 1; i < layerSizes.length; i++) {
    const inputSize = layerSizes[i - 1];
    const outputSize = layerSizes[i];
    // Xavier initialization
    const scale = Math.sqrt(2 / (inputSize + outputSize));
    const weights: number[][] = [];
    const biases: number[] = [];
    for (let j = 0; j < outputSize; j++) {
      const w: number[] = [];
      for (let k = 0; k < inputSize; k++) {
        w.push((Math.random() * 2 - 1) * scale);
      }
      weights.push(w);
      biases.push(0);
    }
    layers.push({
      weights,
      biases,
      preActivations: new Array(outputSize).fill(0),
      activations: new Array(outputSize).fill(0),
    });
  }
  return {
    layers,
    inputSize: layerSizes[0],
    outputSize: layerSizes[layerSizes.length - 1],
    activation,
  };
}

/** Forward pass — returns output activations, stores intermediates in-place */
export function forward(net: NetworkState, input: number[]): number[] {
  let current = input;
  for (let l = 0; l < net.layers.length; l++) {
    const layer = net.layers[l];
    const isOutput = l === net.layers.length - 1;
    const next: number[] = [];
    for (let j = 0; j < layer.weights.length; j++) {
      let sum = layer.biases[j];
      for (let k = 0; k < current.length; k++) {
        sum += layer.weights[j][k] * current[k];
      }
      layer.preActivations[j] = sum;
      // Output layer always uses sigmoid for classification
      const fn = isOutput ? "sigmoid" : net.activation;
      layer.activations[j] = activate(sum, fn);
      next.push(layer.activations[j]);
    }
    current = next;
  }
  return current;
}

/** Backpropagation — compute gradients and update weights in-place */
export function trainStep(
  net: NetworkState,
  inputs: number[][],
  targets: number[][],
  learningRate: number
): number {
  const numLayers = net.layers.length;
  // Accumulate gradients
  const dWeights: number[][][] = net.layers.map((l) =>
    l.weights.map((w) => w.map(() => 0))
  );
  const dBiases: number[][] = net.layers.map((l) => l.biases.map(() => 0));

  let totalLoss = 0;

  for (let s = 0; s < inputs.length; s++) {
    const input = inputs[s];
    const target = targets[s];
    const output = forward(net, input);

    // Compute loss (binary cross-entropy)
    for (let i = 0; i < output.length; i++) {
      const o = Math.max(1e-7, Math.min(1 - 1e-7, output[i]));
      totalLoss -= target[i] * Math.log(o) + (1 - target[i]) * Math.log(1 - o);
    }

    // Backprop
    const deltas: number[][] = [];

    // Output layer deltas
    const outputLayer = net.layers[numLayers - 1];
    const outputDeltas: number[] = [];
    for (let j = 0; j < outputLayer.weights.length; j++) {
      // For sigmoid output with cross-entropy, delta = output - target
      outputDeltas.push(outputLayer.activations[j] - target[j]);
    }
    deltas[numLayers - 1] = outputDeltas;

    // Hidden layer deltas
    for (let l = numLayers - 2; l >= 0; l--) {
      const layer = net.layers[l];
      const nextLayer = net.layers[l + 1];
      const layerDeltas: number[] = [];
      for (let j = 0; j < layer.weights.length; j++) {
        let error = 0;
        for (let k = 0; k < nextLayer.weights.length; k++) {
          error += deltas[l + 1][k] * nextLayer.weights[k][j];
        }
        const dAct = activateDerivative(
          layer.preActivations[j],
          layer.activations[j],
          net.activation
        );
        layerDeltas.push(error * dAct);
      }
      deltas[l] = layerDeltas;
    }

    // Accumulate gradients
    for (let l = 0; l < numLayers; l++) {
      const prevActivations =
        l === 0 ? input : net.layers[l - 1].activations;
      for (let j = 0; j < net.layers[l].weights.length; j++) {
        for (let k = 0; k < prevActivations.length; k++) {
          dWeights[l][j][k] += deltas[l][j] * prevActivations[k];
        }
        dBiases[l][j] += deltas[l][j];
      }
    }
  }

  // Update weights
  const n = inputs.length;
  for (let l = 0; l < numLayers; l++) {
    for (let j = 0; j < net.layers[l].weights.length; j++) {
      for (let k = 0; k < net.layers[l].weights[j].length; k++) {
        net.layers[l].weights[j][k] -= (learningRate * dWeights[l][j][k]) / n;
      }
      net.layers[l].biases[j] -= (learningRate * dBiases[l][j]) / n;
    }
  }

  return totalLoss / n;
}

/** Get gradient magnitudes per layer (for visualization) */
export function getLayerGradientMagnitudes(
  net: NetworkState,
  inputs: number[][],
  targets: number[][]
): number[] {
  const numLayers = net.layers.length;
  const magnitudes: number[] = new Array(numLayers).fill(0);

  for (let s = 0; s < inputs.length; s++) {
    const input = inputs[s];
    const target = targets[s];
    forward(net, input);

    const deltas: number[][] = [];

    // Output layer
    const outputLayer = net.layers[numLayers - 1];
    const outputDeltas: number[] = [];
    for (let j = 0; j < outputLayer.weights.length; j++) {
      outputDeltas.push(outputLayer.activations[j] - target[j]);
    }
    deltas[numLayers - 1] = outputDeltas;

    // Hidden layers
    for (let l = numLayers - 2; l >= 0; l--) {
      const layer = net.layers[l];
      const nextLayer = net.layers[l + 1];
      const layerDeltas: number[] = [];
      for (let j = 0; j < layer.weights.length; j++) {
        let error = 0;
        for (let k = 0; k < nextLayer.weights.length; k++) {
          error += deltas[l + 1][k] * nextLayer.weights[k][j];
        }
        const dAct = activateDerivative(
          layer.preActivations[j],
          layer.activations[j],
          net.activation
        );
        layerDeltas.push(error * dAct);
      }
      deltas[l] = layerDeltas;
    }

    // Sum gradient magnitudes per layer
    for (let l = 0; l < numLayers; l++) {
      let sum = 0;
      for (let j = 0; j < deltas[l].length; j++) {
        sum += Math.abs(deltas[l][j]);
      }
      magnitudes[l] += sum / deltas[l].length;
    }
  }

  // Average over samples
  for (let l = 0; l < numLayers; l++) {
    magnitudes[l] /= inputs.length;
  }

  return magnitudes;
}

/** Predict class for a 2D point (single output neuron) */
export function predict(net: NetworkState, x: number, y: number): number {
  const output = forward(net, [x, y]);
  return output[0];
}
