// Shared math for the Chapter 11 "learning neuron" playgrounds.
// A neuron has a single input x (fixed at 1 unless stated), a weight w, a bias
// b, and an activation. Learning is one gradient-descent step on the squared
// error between the neuron's output and a target.

export type Activation = "sigmoid" | "relu";

export function activate(z: number, act: Activation): number {
  if (act === "relu") return Math.max(0, z);
  return 1 / (1 + Math.exp(-z));
}

// Derivative of the activation with respect to its pre-activation input z.
export function activateDerivative(z: number, act: Activation): number {
  if (act === "relu") return z > 0 ? 1 : 0;
  const s = 1 / (1 + Math.exp(-z));
  return s * (1 - s);
}

// One gradient-descent step on a single neuron (input x, params w, b) toward a
// target, minimising E = 0.5 * (output - target)^2. Returns the updated params.
export function learningStep(
  w: number,
  b: number,
  target: number,
  act: Activation,
  lr: number,
  x = 1,
): { w: number; b: number } {
  const z = w * x + b;
  const out = activate(z, act);
  const dOut = out - target; // dE/dout
  const dz = activateDerivative(z, act);
  const gradW = dOut * dz * x;
  const gradB = dOut * dz;
  return { w: w - lr * gradW, b: b - lr * gradB };
}

export interface ChainNeuron {
  w: number;
  b: number;
}

export interface ChainState {
  zs: number[]; // pre-activation at each neuron
  as: number[]; // activation (output) at each neuron
  input: number; // input fed to the first neuron
}

// Forward pass through a chain of neurons. With `residual`, each neuron adds
// its input back to its output (a skip connection).
export function chainForward(
  neurons: ChainNeuron[],
  act: Activation,
  residual: boolean,
  input = 1,
): ChainState {
  const zs: number[] = [];
  const as: number[] = [];
  let prev = input;
  for (const n of neurons) {
    const z = n.w * prev + n.b;
    const f = activate(z, act);
    const a = residual ? prev + f : f;
    zs.push(z);
    as.push(a);
    prev = a;
  }
  return { zs, as, input };
}

// Backprop through the chain. Returns, for each neuron, the magnitude of the
// gradient of the loss with respect to that neuron's weight — i.e. how much the
// neuron actually learns this step. Early neurons in a plain chain get tiny
// gradients (vanishing); residual skips keep them alive.
export function chainWeightGradients(
  neurons: ChainNeuron[],
  state: ChainState,
  target: number,
  act: Activation,
  residual: boolean,
): number[] {
  const n = neurons.length;
  const { zs, as, input } = state;
  const grads = new Array<number>(n).fill(0);
  // delta_i = dL/da_i
  let delta = as[n - 1] - target; // dL/da_N
  for (let i = n - 1; i >= 0; i--) {
    const prevA = i === 0 ? input : as[i - 1];
    const fPrime = activateDerivative(zs[i], act);
    // dL/dw_i = delta_i * (d a_i / d w_i) = delta_i * f'(z_i) * prevA
    grads[i] = delta * fPrime * prevA;
    if (i > 0) {
      // propagate to a_{i-1}: d a_i / d a_{i-1} = w_i * f'(z_i) (+1 if residual)
      const throughLayer = neurons[i].w * fPrime;
      delta = delta * (residual ? 1 + throughLayer : throughLayer);
    }
  }
  return grads.map((g) => Math.abs(g));
}
