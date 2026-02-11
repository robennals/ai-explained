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
    // Xavier init — appropriate for sigmoid activation
    const scale = Math.sqrt(1 / nIn);
    const weights: number[][] = [];
    for (let j = 0; j < nOut; j++) {
      const row: number[] = [];
      for (let i = 0; i < nIn; i++) {
        row.push((Math.random() * 2 - 1) * scale);
      }
      weights.push(row);
    }
    const biases = new Array(nOut).fill(0).map(() => (Math.random() * 2 - 1) * 0.5);
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

// Full-batch gradient descent: compute gradient over all data, then update once
function trainBatchStep(
  network: Layer[],
  data: { x: number; y: number; label: number }[],
  lr: number
): number {
  const n = data.length;
  if (n === 0) return 0;

  const grads = network.map((layer) => ({
    weights: layer.weights.map((row) => row.map(() => 0)),
    biases: layer.biases.map(() => 0),
  }));

  let totalLoss = 0;

  for (const pt of data) {
    const { activations } = forward(network, [pt.x, pt.y]);
    const output = activations[activations.length - 1][0];
    const error = output - pt.label;
    totalLoss += error * error;

    const deltas: number[][] = [[2 * error * sigmoidDeriv(output)]];
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

    for (let l = 0; l < network.length; l++) {
      const layerDelta = deltas[l];
      const layerInput = activations[l];
      for (let j = 0; j < network[l].biases.length; j++) {
        for (let i = 0; i < layerInput.length; i++) {
          grads[l].weights[j][i] += layerDelta[j] * layerInput[i];
        }
        grads[l].biases[j] += layerDelta[j];
      }
    }
  }

  for (let l = 0; l < network.length; l++) {
    for (let j = 0; j < network[l].biases.length; j++) {
      for (let i = 0; i < network[l].weights[j].length; i++) {
        network[l].weights[j][i] -= lr * grads[l].weights[j][i] / n;
      }
      network[l].biases[j] -= lr * grads[l].biases[j] / n;
    }
  }

  return totalLoss / n;
}

// ---- Color: red/green heatmap (matches TwoLayerPlayground) ----

function outputColorRGB(v: number): [number, number, number] {
  if (v <= 0.5) {
    const t = v / 0.5;
    return [
      Math.round(239 + (160 - 239) * t),
      Math.round(68 + (160 - 68) * t),
      Math.round(68 + (160 - 68) * t),
    ];
  } else {
    const t = (v - 0.5) / 0.5;
    return [
      Math.round(160 + (16 - 160) * t),
      Math.round(160 + (185 - 160) * t),
      Math.round(160 + (129 - 160) * t),
    ];
  }
}

// ---- Data Generation ----

type PatternName = "XOR" | "Circle" | "Spirals";

function generateData(pattern: PatternName, n: number = 200): { x: number; y: number; label: number }[] {
  const data: { x: number; y: number; label: number }[] = [];

  switch (pattern) {
    case "XOR": {
      data.push({ x: 0, y: 0, label: 0 });
      data.push({ x: 1, y: 0, label: 1 });
      data.push({ x: 0, y: 1, label: 1 });
      data.push({ x: 1, y: 1, label: 0 });
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

  if (network) {
    const res = 2;
    const imageData = ctx.createImageData(w, h);
    for (let py = 0; py < h; py += res) {
      for (let px = 0; px < w; px += res) {
        const x = bounds.minX + (px / w) * (bounds.maxX - bounds.minX);
        const y = bounds.minY + ((h - py) / h) * (bounds.maxY - bounds.minY);
        const { activations } = forward(network, [x, y]);
        const out = activations[activations.length - 1][0];
        const [r, g, b] = outputColorRGB(out);
        for (let dy = 0; dy < res && py + dy < h; dy++) {
          for (let dx = 0; dx < res && px + dx < w; dx++) {
            const idx = ((py + dy) * w + (px + dx)) * 4;
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = 180;
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

  for (const pt of data) {
    const px = ((pt.x - bounds.minX) / (bounds.maxX - bounds.minX)) * w;
    const py = h - ((pt.y - bounds.minY) / (bounds.maxY - bounds.minY)) * h;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = pt.label === 1 ? "#10b981" : "#ef4444";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ---- Network diagram mini-visualization ----

function NetworkDiagram({ layers, neurons }: { layers: number; neurons: number }) {
  const sizes = [2, ...Array(layers).fill(neurons), 1];
  const numCols = sizes.length;
  const maxNodes = Math.max(...sizes);
  const W = 180;
  const H = Math.max(60, maxNodes * 18 + 10);
  const colGap = W / (numCols + 1);

  const nodePos = sizes.map((n, col) => {
    const x = colGap * (col + 1);
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const y = (H / (n + 1)) * (i + 1);
      positions.push({ x, y });
    }
    return positions;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Edges */}
      {nodePos.map((col, colIdx) =>
        colIdx < nodePos.length - 1
          ? col.map((from, fi) =>
              nodePos[colIdx + 1].map((to, ti) => (
                <line
                  key={`${colIdx}-${fi}-${ti}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#d1d5db"
                  strokeWidth={0.5}
                />
              ))
            )
          : null
      )}
      {/* Nodes */}
      {nodePos.map((col, colIdx) =>
        col.map((pos, i) => (
          <circle
            key={`n-${colIdx}-${i}`}
            cx={pos.x}
            cy={pos.y}
            r={colIdx === 0 || colIdx === nodePos.length - 1 ? 5 : 4}
            fill={colIdx === 0 ? "#3b82f6" : colIdx === nodePos.length - 1 ? "#10b981" : "#6b7280"}
            stroke="white"
            strokeWidth={1}
          />
        ))
      )}
      {/* Layer labels */}
      {sizes.map((n, colIdx) => (
        <text
          key={`label-${colIdx}`}
          x={colGap * (colIdx + 1)}
          y={H - 2}
          textAnchor="middle"
          className="fill-muted"
          fontSize={8}
        >
          {n}
        </text>
      ))}
    </svg>
  );
}

// Smallest reliably-converging architectures for each preset
const PATTERN_ANSWERS: Record<PatternName, { layers: number; neurons: number }> = {
  "XOR": { layers: 1, neurons: 2 },
  "Circle": { layers: 1, neurons: 4 },
  "Spirals": { layers: 2, neurons: 8 },
};

const PATTERNS: PatternName[] = ["XOR", "Circle", "Spirals"];

export function NetworkTrainer() {
  const [activePreset, setActivePreset] = useState<PatternName | null>("XOR");
  const [numLayers, setNumLayers] = useState(2);
  const [neuronsPerLayer, setNeuronsPerLayer] = useState(4);
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [dotCount, setDotCount] = useState(0);

  const networkRef = useRef<Layer[] | null>(null);
  const dataRef = useRef<{ x: number; y: number; label: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const trainingRef = useRef(false);
  const retryCountRef = useRef(0); // how many retries we've done (max 2)

  const boundsRef = useRef({ minX: -0.3, maxX: 1.3, minY: -0.3, maxY: 1.3 });

  const buildNetwork = useCallback((layers: number, neurons: number) => {
    const sizes = [2];
    for (let i = 0; i < layers; i++) sizes.push(neurons);
    sizes.push(1);
    return createNetwork(sizes);
  }, []);

  const redraw = useCallback(() => {
    if (!canvasRef.current) return;
    renderCanvas(canvasRef.current, networkRef.current, dataRef.current, boundsRef.current);
  }, []);

  useEffect(() => {
    dataRef.current = generateData("XOR");
    setDotCount(dataRef.current.length);
    networkRef.current = buildNetwork(numLayers, neuronsPerLayer);
    const t = setTimeout(redraw, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTraining = useCallback(() => {
    trainingRef.current = false;
    setIsTraining(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  const resetNetwork = useCallback(() => {
    stopTraining();
    networkRef.current = buildNetwork(numLayers, neuronsPerLayer);
    setEpoch(0);
    setLossHistory([]);
    setTimeout(redraw, 0);
  }, [numLayers, neuronsPerLayer, buildNetwork, stopTraining, redraw]);

  const handlePresetSelect = useCallback(
    (pat: PatternName) => {
      stopTraining();
      setActivePreset(pat);
      dataRef.current = generateData(pat);
      setDotCount(dataRef.current.length);
      networkRef.current = buildNetwork(numLayers, neuronsPerLayer);
      setEpoch(0);
      setLossHistory([]);
      setTimeout(redraw, 0);
    },
    [numLayers, neuronsPerLayer, buildNetwork, stopTraining, redraw]
  );

  const handleClearDots = useCallback(() => {
    stopTraining();
    setActivePreset(null);
    dataRef.current = [];
    setDotCount(0);
    networkRef.current = buildNetwork(numLayers, neuronsPerLayer);
    setEpoch(0);
    setLossHistory([]);
    setTimeout(redraw, 0);
  }, [numLayers, neuronsPerLayer, buildNetwork, stopTraining, redraw]);

  const startTrainingLoop = useCallback((lr: number, startEpoch: number, startLoss: number[], layers: number, neurons: number) => {
    trainingRef.current = true;
    setIsTraining(true);

    let localEpoch = startEpoch;
    const localLossHistory = [...startLoss];

    const animate = () => {
      if (!trainingRef.current || !networkRef.current) return;
      const data = dataRef.current;
      if (data.length === 0) { trainingRef.current = false; setIsTraining(false); return; }

      const stepsPerFrame = 10;
      let frameLoss = 0;
      for (let s = 0; s < stepsPerFrame; s++) {
        frameLoss = trainBatchStep(networkRef.current!, data, lr);
      }

      localEpoch++;
      localLossHistory.push(frameLoss);
      if (localLossHistory.length > 300) localLossHistory.shift();

      setEpoch(localEpoch);
      setLossHistory([...localLossHistory]);
      redraw();

      if (localEpoch >= 2000) {
        // If loss is still high and we have retries left, try fresh weights
        if (frameLoss > 0.05 && retryCountRef.current < 2) {
          retryCountRef.current++;
          const sizes = [2, ...Array(layers).fill(neurons), 1];
          networkRef.current = createNetwork(sizes);
          setEpoch(0);
          setLossHistory([]);
          localEpoch = 0;
          localLossHistory.length = 0;
          animRef.current = requestAnimationFrame(animate);
          return;
        }
        trainingRef.current = false;
        setIsTraining(false);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [redraw]);

  const handleShowAnswer = useCallback(() => {
    if (!activePreset) return;
    const answer = PATTERN_ANSWERS[activePreset];
    if (!answer) return;
    stopTraining();
    setNumLayers(answer.layers);
    setNeuronsPerLayer(answer.neurons);
    dataRef.current = generateData(activePreset);
    setDotCount(dataRef.current.length);
    networkRef.current = buildNetwork(answer.layers, answer.neurons);
    setEpoch(0);
    setLossHistory([]);
    retryCountRef.current = 0;
    setTimeout(() => startTrainingLoop(2.0, 0, [], answer.layers, answer.neurons), 0);
  }, [activePreset, stopTraining, buildNetwork, startTrainingLoop]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const bounds = boundsRef.current;
      const x = bounds.minX + (px / rect.width) * (bounds.maxX - bounds.minX);
      const y = bounds.minY + ((rect.height - py) / rect.height) * (bounds.maxY - bounds.minY);
      const label = e.shiftKey ? 0 : 1;
      dataRef.current.push({ x, y, label });
      setDotCount(dataRef.current.length);
      setActivePreset(null);
      redraw();
    },
    [redraw]
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const bounds = boundsRef.current;
      const x = bounds.minX + (px / rect.width) * (bounds.maxX - bounds.minX);
      const y = bounds.minY + ((rect.height - py) / rect.height) * (bounds.maxY - bounds.minY);
      dataRef.current.push({ x, y, label: 0 });
      setDotCount(dataRef.current.length);
      setActivePreset(null);
      redraw();
    },
    [redraw]
  );

  const handleLayersChange = useCallback(
    (n: number) => {
      stopTraining();
      setNumLayers(n);
      const sizes = [2];
      for (let i = 0; i < n; i++) sizes.push(neuronsPerLayer);
      sizes.push(1);
      networkRef.current = createNetwork(sizes);
      setEpoch(0);
      setLossHistory([]);
      setTimeout(redraw, 0);
    },
    [neuronsPerLayer, stopTraining, redraw]
  );

  const handleNeuronsChange = useCallback(
    (n: number) => {
      stopTraining();
      setNeuronsPerLayer(n);
      const sizes = [2];
      for (let i = 0; i < numLayers; i++) sizes.push(n);
      sizes.push(1);
      networkRef.current = createNetwork(sizes);
      setEpoch(0);
      setLossHistory([]);
      setTimeout(redraw, 0);
    },
    [numLayers, stopTraining, redraw]
  );

  const toggleTraining = useCallback(() => {
    if (isTraining) {
      stopTraining();
      return;
    }
    if (dataRef.current.length < 2) return;
    if (!networkRef.current) {
      networkRef.current = buildNetwork(numLayers, neuronsPerLayer);
    }
    retryCountRef.current = 0;
    startTrainingLoop(2.0, epoch, lossHistory, numLayers, neuronsPerLayer);
  }, [isTraining, epoch, lossHistory, numLayers, neuronsPerLayer, buildNetwork, stopTraining, startTrainingLoop]);

  const handleReset = useCallback(() => {
    stopTraining();
    setActivePreset("XOR");
    dataRef.current = generateData("XOR");
    setDotCount(dataRef.current.length);
    networkRef.current = buildNetwork(2, 4);
    setNumLayers(2);
    setNeuronsPerLayer(4);
    setEpoch(0);
    setLossHistory([]);
    setTimeout(redraw, 0);
  }, [buildNetwork, stopTraining, redraw]);

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

  const hasAnswer = activePreset != null && PATTERN_ANSWERS[activePreset] != null;

  return (
    <WidgetContainer
      title="Network Trainer"
      description="Can you find the smallest network that solves each pattern? Click to place green dots, shift-click or right-click for red."
      onReset={handleReset}
    >
      {/* Preset buttons + Clear */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {PATTERNS.map((p) => (
          <button
            key={p}
            onClick={() => handlePresetSelect(p)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
              activePreset === p
                ? "bg-accent text-white"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={handleClearDots}
          className="px-2.5 py-1 text-[11px] font-medium rounded bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
        >
          Clear Dots
        </button>
      </div>

      {/* Architecture controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
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
        <div className="flex gap-2">
          <button
            onClick={toggleTraining}
            disabled={dotCount < 2}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isTraining
                ? "bg-error text-white hover:bg-error/80"
                : dotCount < 2
                ? "bg-foreground/10 text-muted cursor-not-allowed"
                : "bg-accent text-white hover:bg-accent/80"
            }`}
          >
            {isTraining ? "Stop" : "Train"}
          </button>
          <button
            onClick={resetNetwork}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
          >
            Reset Network
          </button>
          {hasAnswer && (
            <button
              onClick={handleShowAnswer}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
            >
              Show Optimal
            </button>
          )}
        </div>
      </div>

      {/* Visualization row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Classification canvas */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-muted mb-1">
            Classification Region {epoch > 0 && `(epoch ${epoch})`}
            {dotCount > 0 && ` · ${dotCount} dots`}
          </div>
          <div className="relative aspect-square w-full max-w-[400px] rounded-lg overflow-hidden border border-border">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="w-full h-full cursor-crosshair"
              onClick={handleCanvasClick}
              onContextMenu={handleCanvasContextMenu}
            />
          </div>
          <div className="text-[9px] text-muted mt-1">
            Click = green dot · Shift-click or right-click = red dot
          </div>
        </div>

        {/* Right column: network diagram, loss curve, architecture */}
        <div className="md:w-56 flex-shrink-0">
          {/* Network diagram */}
          <div className="text-[10px] font-medium text-muted mb-1">Network</div>
          <div className="border border-border rounded-lg bg-surface p-2 mb-3">
            <NetworkDiagram layers={numLayers} neurons={neuronsPerLayer} />
          </div>

          {/* Loss curve */}
          <div className="text-[10px] font-medium text-muted mb-1">Training Loss</div>
          <svg viewBox="0 0 200 55" className="w-full border border-border rounded-lg bg-surface">
            {lossCurvePath && (
              <path d={lossCurvePath} fill="none" stroke="#10b981" strokeWidth={1.5} />
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
            <div>
              {numLayers} hidden layer{numLayers > 1 ? "s" : ""} &times; {neuronsPerLayer} neurons
              {" · "}
              {(() => {
                let p = 0;
                const sizes = [2, ...Array(numLayers).fill(neuronsPerLayer), 1];
                for (let i = 1; i < sizes.length; i++) {
                  p += sizes[i] * sizes[i - 1] + sizes[i];
                }
                return p;
              })()}{" "}
              params
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
