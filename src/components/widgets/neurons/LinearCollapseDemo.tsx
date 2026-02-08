"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { ToggleControl } from "../shared/ToggleControl";
import {
  createNetwork,
  forward,
  trainStep,
  type NetworkState,
} from "./lib/neural-net";

// XOR-like dataset
const DATA: { x: number; y: number; label: number }[] = [
  // Class 0 (blue) - bottom-left and top-right
  { x: 0.15, y: 0.15, label: 0 },
  { x: 0.25, y: 0.2, label: 0 },
  { x: 0.2, y: 0.3, label: 0 },
  { x: 0.85, y: 0.85, label: 0 },
  { x: 0.75, y: 0.8, label: 0 },
  { x: 0.8, y: 0.7, label: 0 },
  // Class 1 (orange) - top-left and bottom-right
  { x: 0.15, y: 0.85, label: 1 },
  { x: 0.25, y: 0.8, label: 1 },
  { x: 0.2, y: 0.7, label: 1 },
  { x: 0.85, y: 0.15, label: 1 },
  { x: 0.75, y: 0.2, label: 1 },
  { x: 0.8, y: 0.3, label: 1 },
];

const SVG_SIZE = 280;
const PAD = 8;
const GRID_RES = 30;
const STEPS_PER_FRAME = 5;

function buildNetwork(depth: number, useActivation: boolean): NetworkState {
  const sizes = [2];
  for (let i = 0; i < depth; i++) sizes.push(6);
  sizes.push(1);
  const net = createNetwork(sizes, useActivation ? "sigmoid" : "sigmoid");
  // If no activation, we'll manually skip it during forward pass
  return net;
}

// Custom forward pass that optionally skips activation for hidden layers
function forwardCustom(
  net: NetworkState,
  input: number[],
  useActivation: boolean
): number[] {
  if (useActivation) {
    return forward(net, input);
  }
  // Linear mode: no activation on hidden layers, sigmoid only on output
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
      if (isOutput) {
        // Sigmoid on output for classification
        layer.activations[j] = 1 / (1 + Math.exp(-sum));
      } else {
        // No activation — pass through linearly
        layer.activations[j] = sum;
      }
      next.push(layer.activations[j]);
    }
    current = next;
  }
  return current;
}

export function LinearCollapseDemo() {
  const [depth, setDepth] = useState(2);
  const [useActivation, setUseActivation] = useState(true);
  const [training, setTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const [heatmap, setHeatmap] = useState<string[]>([]);

  const netRef = useRef<NetworkState | null>(null);
  const animRef = useRef<number>(0);
  const trainingRef = useRef(false);

  const buildAndReset = useCallback(() => {
    const net = buildNetwork(depth, useActivation);
    netRef.current = net;
    setEpoch(0);
    setLoss(null);
    setTraining(false);
    trainingRef.current = false;
    cancelAnimationFrame(animRef.current);

    // Generate initial heatmap
    const cells: string[] = [];
    for (let i = 0; i < GRID_RES; i++) {
      for (let j = 0; j < GRID_RES; j++) {
        const x = (i + 0.5) / GRID_RES;
        const y = 1 - (j + 0.5) / GRID_RES;
        const out = forwardCustom(net, [x, y], useActivation)[0];
        const v = Math.max(0, Math.min(1, out));
        const r = Math.round(59 + (251 - 59) * v);
        const g = Math.round(130 + (146 - 130) * v);
        const b = Math.round(246 + (20 - 246) * v);
        cells.push(`rgb(${r},${g},${b})`);
      }
    }
    setHeatmap(cells);
  }, [depth, useActivation]);

  useEffect(() => {
    buildAndReset();
  }, [buildAndReset]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const updateHeatmap = useCallback((net: NetworkState, activation: boolean) => {
    const cells: string[] = [];
    for (let i = 0; i < GRID_RES; i++) {
      for (let j = 0; j < GRID_RES; j++) {
        const x = (i + 0.5) / GRID_RES;
        const y = 1 - (j + 0.5) / GRID_RES;
        const out = forwardCustom(net, [x, y], activation)[0];
        const v = Math.max(0, Math.min(1, out));
        const r = Math.round(59 + (251 - 59) * v);
        const g = Math.round(130 + (146 - 130) * v);
        const b = Math.round(246 + (20 - 246) * v);
        cells.push(`rgb(${r},${g},${b})`);
      }
    }
    setHeatmap(cells);
  }, []);

  const train = useCallback(() => {
    if (trainingRef.current) {
      trainingRef.current = false;
      setTraining(false);
      return;
    }

    trainingRef.current = true;
    setTraining(true);

    const inputs = DATA.map((d) => [d.x, d.y]);
    const targets = DATA.map((d) => [d.label]);
    const lr = useActivation ? 2 : 0.5;

    let currentEpoch = 0;

    function step() {
      if (!trainingRef.current || !netRef.current) return;

      let l = 0;
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        if (useActivation) {
          l = trainStep(netRef.current, inputs, targets, lr);
        } else {
          // For linear mode, we still use the standard trainStep
          // (it will compute gradients through the activations that are stored)
          l = trainStep(netRef.current, inputs, targets, lr);
        }
        currentEpoch++;
      }

      setEpoch(currentEpoch);
      setLoss(l);

      if (currentEpoch % 5 === 0) {
        updateHeatmap(netRef.current, useActivation);
      }

      if (currentEpoch < 2000 && trainingRef.current) {
        animRef.current = requestAnimationFrame(step);
      } else {
        trainingRef.current = false;
        setTraining(false);
        if (netRef.current) updateHeatmap(netRef.current, useActivation);
      }
    }

    animRef.current = requestAnimationFrame(step);
  }, [useActivation, updateHeatmap]);

  const cellSize = (SVG_SIZE - 2 * PAD) / GRID_RES;

  return (
    <WidgetContainer
      title="Linear Collapse Demo"
      description="See what happens when you remove the activation function"
      onReset={buildAndReset}
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Controls */}
        <div className="flex flex-col gap-3 lg:w-52">
          <SliderControl
            label="Depth"
            value={depth}
            min={1}
            max={5}
            step={1}
            onChange={(v) => setDepth(Math.round(v))}
            formatValue={(v) => `${v} layers`}
          />
          <ToggleControl
            label="Activation function"
            checked={useActivation}
            onChange={setUseActivation}
          />

          <button
            onClick={train}
            className={`mt-2 rounded-md px-4 py-2 text-xs font-medium transition-colors ${
              training
                ? "bg-error/10 text-error hover:bg-error/20"
                : "bg-accent/10 text-accent hover:bg-accent/20"
            }`}
          >
            {training ? "Stop" : "Train"}
          </button>

          {epoch > 0 && (
            <div className="text-xs text-muted space-y-1">
              <div>
                Epoch: <span className="font-mono font-bold text-foreground">{epoch}</span>
              </div>
              {loss !== null && (
                <div>
                  Loss: <span className="font-mono font-bold text-foreground">{loss.toFixed(4)}</span>
                </div>
              )}
            </div>
          )}

          {!useActivation && (
            <div className="mt-2 rounded-md bg-warning/10 px-3 py-2 text-[10px] text-warning leading-relaxed">
              <strong>No activation:</strong> No matter how many layers, the decision boundary stays straight — all layers collapse to one.
            </div>
          )}
        </div>

        {/* Visualization */}
        <div className="flex-1">
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full max-w-[320px] rounded-lg border border-border"
          >
            {/* Heatmap */}
            {heatmap.map((color, idx) => {
              const i = Math.floor(idx / GRID_RES);
              const j = idx % GRID_RES;
              return (
                <rect
                  key={idx}
                  x={PAD + i * cellSize}
                  y={PAD + j * cellSize}
                  width={cellSize + 0.5}
                  height={cellSize + 0.5}
                  fill={color}
                />
              );
            })}

            {/* Data points */}
            {DATA.map((d, i) => (
              <circle
                key={i}
                cx={PAD + d.x * (SVG_SIZE - 2 * PAD)}
                cy={PAD + (1 - d.y) * (SVG_SIZE - 2 * PAD)}
                r={6}
                fill={d.label === 1 ? "#fb923c" : "#3b82f6"}
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <div className="mt-1 text-center text-[10px] text-muted">
            Blue = class 0, Orange = class 1. Background shows network prediction.
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
