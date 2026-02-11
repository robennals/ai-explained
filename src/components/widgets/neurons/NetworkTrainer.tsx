"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

// ---- MLP Implementation ----

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function sigmoidDeriv(out: number): number {
  return out * (1 - out);
}

type Layer = {
  weights: number[][]; // [neuronsOut][neuronsIn]
  biases: number[];
};

function createNetwork(layerSizes: number[]): Layer[] {
  const layers: Layer[] = [];
  for (let l = 1; l < layerSizes.length; l++) {
    const nIn = layerSizes[l - 1];
    const nOut = layerSizes[l];
    const scale = Math.sqrt(2 / nIn);
    const weights: number[][] = [];
    for (let j = 0; j < nOut; j++) {
      const row: number[] = [];
      for (let i = 0; i < nIn; i++) {
        row.push((Math.random() * 2 - 1) * scale);
      }
      weights.push(row);
    }
    const biases = new Array(nOut).fill(0).map(() => (Math.random() * 2 - 1) * 0.1);
    layers.push({ weights, biases });
  }
  return layers;
}

function forward(network: Layer[], input: number[]): { activations: number[][] } {
  const activations: number[][] = [input];
  let current = input;
  for (let l = 0; l < network.length; l++) {
    const layer = network[l];
    const next: number[] = [];
    for (let j = 0; j < layer.biases.length; j++) {
      let sum = layer.biases[j];
      for (let i = 0; i < current.length; i++) {
        sum += layer.weights[j][i] * current[i];
      }
      next.push(sigmoid(sum));
    }
    current = next;
    activations.push(current);
  }
  return { activations };
}

function backpropAndUpdate(network: Layer[], input: number[], target: number, lr: number): number {
  const { activations } = forward(network, input);
  const output = activations[activations.length - 1][0];
  const error = output - target;
  const loss = error * error;

  // Compute deltas layer by layer from output to first hidden
  const deltas: number[][] = [];
  // Output layer delta
  const outputDelta = [2 * error * sigmoidDeriv(output)];
  deltas.push(outputDelta);

  // Hidden layers
  for (let l = network.length - 2; l >= 0; l--) {
    const nextLayer = network[l + 1];
    const nextDelta = deltas[0];
    const currentAct = activations[l + 1];
    const delta: number[] = [];
    for (let j = 0; j < currentAct.length; j++) {
      let sum = 0;
      for (let k = 0; k < nextDelta.length; k++) {
        sum += nextDelta[k] * nextLayer.weights[k][j];
      }
      delta.push(sum * sigmoidDeriv(currentAct[j]));
    }
    deltas.unshift(delta);
  }

  // Update weights and biases
  for (let l = 0; l < network.length; l++) {
    const layerDelta = deltas[l];
    const layerInput = activations[l];
    for (let j = 0; j < network[l].biases.length; j++) {
      for (let i = 0; i < layerInput.length; i++) {
        network[l].weights[j][i] -= lr * layerDelta[j] * layerInput[i];
      }
      network[l].biases[j] -= lr * layerDelta[j];
    }
  }

  return loss;
}

// ---- Data Generation ----

type PatternName = "XOR" | "Circle" | "Two Moons" | "Spirals";

function generateData(pattern: PatternName, n: number = 200): { x: number; y: number; label: number }[] {
  const data: { x: number; y: number; label: number }[] = [];

  switch (pattern) {
    case "XOR": {
      // Clustered XOR with noise
      for (let i = 0; i < n; i++) {
        const cx = Math.random() > 0.5 ? 1 : 0;
        const cy = Math.random() > 0.5 ? 1 : 0;
        const x = cx + (Math.random() - 0.5) * 0.5;
        const y = cy + (Math.random() - 0.5) * 0.5;
        const label = cx ^ cy;
        data.push({ x, y, label });
      }
      break;
    }
    case "Circle": {
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() > 0.5 ? Math.random() * 0.4 : 0.6 + Math.random() * 0.4;
        const x = 0.5 + r * Math.cos(angle);
        const y = 0.5 + r * Math.sin(angle);
        data.push({ x, y, label: r < 0.5 ? 1 : 0 });
      }
      break;
    }
    case "Two Moons": {
      for (let i = 0; i < n; i++) {
        if (i < n / 2) {
          const angle = Math.PI * Math.random();
          const x = Math.cos(angle) * 0.5 + 0.5 + (Math.random() - 0.5) * 0.15;
          const y = Math.sin(angle) * 0.5 + 0.35 + (Math.random() - 0.5) * 0.15;
          data.push({ x, y, label: 0 });
        } else {
          const angle = Math.PI + Math.PI * Math.random();
          const x = Math.cos(angle) * 0.5 + 0.5 + (Math.random() - 0.5) * 0.15;
          const y = Math.sin(angle) * 0.5 + 0.65 + (Math.random() - 0.5) * 0.15;
          data.push({ x, y, label: 1 });
        }
      }
      break;
    }
    case "Spirals": {
      const halfN = Math.floor(n / 2);
      for (let cls = 0; cls < 2; cls++) {
        for (let i = 0; i < halfN; i++) {
          const t = (i / halfN) * 2 * Math.PI + (cls * Math.PI);
          const r = 0.1 + 0.35 * (i / halfN);
          const noise = (Math.random() - 0.5) * 0.08;
          const x = 0.5 + (r + noise) * Math.cos(t);
          const y = 0.5 + (r + noise) * Math.sin(t);
          data.push({ x, y, label: cls });
        }
      }
      break;
    }
  }
  return data;
}

// ---- Visualization Canvas ----

function renderCanvas(
  canvas: HTMLCanvasElement,
  network: Layer[] | null,
  data: { x: number; y: number; label: number }[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Render classification regions
  if (network) {
    const res = 2; // pixel step
    const imageData = ctx.createImageData(w, h);
    for (let py = 0; py < h; py += res) {
      for (let px = 0; px < w; px += res) {
        const x = bounds.minX + (px / w) * (bounds.maxX - bounds.minX);
        const y = bounds.minY + ((h - py) / h) * (bounds.maxY - bounds.minY);
        const { activations } = forward(network, [x, y]);
        const out = activations[activations.length - 1][0];
        // Blue (class 1) to Orange (class 0)
        const r = Math.round(59 + (249 - 59) * (1 - out));
        const g = Math.round(130 + (115 - 130) * (1 - out));
        const b = Math.round(246 + (22 - 246) * (1 - out));
        for (let dy = 0; dy < res && py + dy < h; dy++) {
          for (let dx = 0; dx < res && px + dx < w; dx++) {
            const idx = ((py + dy) * w + (px + dx)) * 4;
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = 80;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  } else {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);
  }

  // Draw data points
  for (const pt of data) {
    const px = ((pt.x - bounds.minX) / (bounds.maxX - bounds.minX)) * w;
    const py = h - ((pt.y - bounds.minY) / (bounds.maxY - bounds.minY)) * h;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = pt.label === 1 ? "#3b82f6" : "#f97316";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

const PATTERNS: PatternName[] = ["XOR", "Circle", "Two Moons", "Spirals"];

export function NetworkTrainer() {
  const [pattern, setPattern] = useState<PatternName>("XOR");
  const [numLayers, setNumLayers] = useState(2);
  const [neuronsPerLayer, setNeuronsPerLayer] = useState(4);
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);

  const networkRef = useRef<Layer[] | null>(null);
  const dataRef = useRef<{ x: number; y: number; label: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const trainingRef = useRef(false);

  const boundsRef = useRef({ minX: -0.3, maxX: 1.3, minY: -0.3, maxY: 1.3 });

  // Initialize data on pattern change
  const initData = useCallback(
    (pat: PatternName) => {
      const data = generateData(pat);
      dataRef.current = data;
      return data;
    },
    []
  );

  const initNetwork = useCallback(() => {
    const sizes = [2];
    for (let i = 0; i < numLayers; i++) {
      sizes.push(neuronsPerLayer);
    }
    sizes.push(1);
    networkRef.current = createNetwork(sizes);
    setEpoch(0);
    setLossHistory([]);
  }, [numLayers, neuronsPerLayer]);

  const redraw = useCallback(() => {
    if (!canvasRef.current) return;
    renderCanvas(canvasRef.current, networkRef.current, dataRef.current, boundsRef.current);
  }, []);

  // Init on mount
  useEffect(() => {
    initData(pattern);
    initNetwork();
    // Small delay to ensure canvas is mounted
    const t = setTimeout(redraw, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = useCallback(() => {
    trainingRef.current = false;
    setIsTraining(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    initData(pattern);
    initNetwork();
    setTimeout(redraw, 0);
  }, [pattern, initData, initNetwork, redraw]);

  const handlePatternChange = useCallback(
    (pat: PatternName) => {
      trainingRef.current = false;
      setIsTraining(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setPattern(pat);
      initData(pat);
      // rebuild network
      const sizes = [2];
      for (let i = 0; i < numLayers; i++) sizes.push(neuronsPerLayer);
      sizes.push(1);
      networkRef.current = createNetwork(sizes);
      setEpoch(0);
      setLossHistory([]);
      setTimeout(redraw, 0);
    },
    [numLayers, neuronsPerLayer, initData, redraw]
  );

  const handleLayersChange = useCallback(
    (n: number) => {
      trainingRef.current = false;
      setIsTraining(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setNumLayers(n);
      const sizes = [2];
      for (let i = 0; i < n; i++) sizes.push(neuronsPerLayer);
      sizes.push(1);
      networkRef.current = createNetwork(sizes);
      setEpoch(0);
      setLossHistory([]);
      setTimeout(redraw, 0);
    },
    [neuronsPerLayer, redraw]
  );

  const handleNeuronsChange = useCallback(
    (n: number) => {
      trainingRef.current = false;
      setIsTraining(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setNeuronsPerLayer(n);
      const sizes = [2];
      for (let i = 0; i < numLayers; i++) sizes.push(n);
      sizes.push(1);
      networkRef.current = createNetwork(sizes);
      setEpoch(0);
      setLossHistory([]);
      setTimeout(redraw, 0);
    },
    [numLayers, redraw]
  );

  const toggleTraining = useCallback(() => {
    if (isTraining) {
      trainingRef.current = false;
      setIsTraining(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    if (!networkRef.current) {
      initNetwork();
    }

    trainingRef.current = true;
    setIsTraining(true);

    let localEpoch = epoch;
    const localLossHistory = [...lossHistory];
    const lr = 0.3;

    const animate = () => {
      if (!trainingRef.current || !networkRef.current) return;

      const data = dataRef.current;
      const stepsPerFrame = 50;
      let frameLoss = 0;

      for (let s = 0; s < stepsPerFrame; s++) {
        const idx = Math.floor(Math.random() * data.length);
        const pt = data[idx];
        const loss = backpropAndUpdate(networkRef.current, [pt.x, pt.y], pt.label, lr);
        frameLoss += loss;
      }

      localEpoch++;
      const avgLoss = frameLoss / stepsPerFrame;
      localLossHistory.push(avgLoss);
      // Keep only recent history
      if (localLossHistory.length > 300) localLossHistory.shift();

      setEpoch(localEpoch);
      setLossHistory([...localLossHistory]);
      redraw();

      if (localEpoch >= 2000) {
        trainingRef.current = false;
        setIsTraining(false);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isTraining, epoch, lossHistory, initNetwork, redraw]);

  // Loss curve mini chart
  const lossCurvePath = lossHistory.length > 1
    ? lossHistory
        .map((l, i) => {
          const x = (i / (lossHistory.length - 1)) * 200;
          const maxL = Math.max(0.5, ...lossHistory);
          const y = 50 - (l / maxL) * 48;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ")
    : "";

  return (
    <WidgetContainer
      title="Network Trainer"
      description="Train a multi-layer network on different patterns."
      onReset={handleReset}
    >
      {/* Controls row */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        {/* Pattern selector */}
        <div>
          <div className="text-[10px] font-medium text-muted mb-1">Pattern</div>
          <div className="flex gap-1">
            {PATTERNS.map((p) => (
              <button
                key={p}
                onClick={() => handlePatternChange(p)}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  pattern === p
                    ? "bg-accent text-white"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div>
          <div className="text-[10px] font-medium text-muted mb-1">Layers: {numLayers}</div>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={numLayers}
            onChange={(e) => handleLayersChange(parseInt(e.target.value))}
            className="w-20 h-1.5 accent-accent"
          />
        </div>

        {/* Neurons per layer */}
        <div>
          <div className="text-[10px] font-medium text-muted mb-1">Neurons/layer: {neuronsPerLayer}</div>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={neuronsPerLayer}
            onChange={(e) => handleNeuronsChange(parseInt(e.target.value))}
            className="w-20 h-1.5 accent-accent"
          />
        </div>

        {/* Train / Reset */}
        <div className="flex gap-2">
          <button
            onClick={toggleTraining}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isTraining
                ? "bg-error text-white hover:bg-error/80"
                : "bg-accent text-white hover:bg-accent/80"
            }`}
          >
            {isTraining ? "Stop" : "Train"}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Visualization row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Classification canvas */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-muted mb-1">
            Classification Region {epoch > 0 && `(epoch ${epoch})`}
          </div>
          <div className="relative aspect-square w-full max-w-[400px] rounded-lg overflow-hidden border border-border">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Loss curve */}
        <div className="md:w-56 flex-shrink-0">
          <div className="text-[10px] font-medium text-muted mb-1">Training Loss</div>
          <svg viewBox="0 0 200 55" className="w-full border border-border rounded-lg bg-surface">
            {lossCurvePath && (
              <path d={lossCurvePath} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
            )}
            {lossHistory.length === 0 && (
              <text x={100} y={30} textAnchor="middle" className="fill-muted text-[8px]">
                Press Train to start
              </text>
            )}
          </svg>
          {lossHistory.length > 0 && (
            <div className="text-[10px] font-mono text-muted mt-1">
              Loss: {lossHistory[lossHistory.length - 1].toFixed(4)}
            </div>
          )}

          {/* Architecture summary */}
          <div className="mt-3 text-[10px] text-muted">
            <div className="font-medium text-foreground mb-1">Architecture</div>
            <div>2 inputs</div>
            {Array.from({ length: numLayers }).map((_, i) => (
              <div key={i}>{neuronsPerLayer} neurons (hidden {i + 1})</div>
            ))}
            <div>1 output</div>
            <div className="mt-1 font-medium">
              Total params:{" "}
              {(() => {
                let p = 0;
                const sizes = [2, ...Array(numLayers).fill(neuronsPerLayer), 1];
                for (let i = 1; i < sizes.length; i++) {
                  p += sizes[i] * sizes[i - 1] + sizes[i];
                }
                return p;
              })()}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
