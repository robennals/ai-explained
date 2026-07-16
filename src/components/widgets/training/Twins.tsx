"use client";

import { useCallback, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { activate, learningStep } from "./neuronMath";

const LR = 0.6;
const TARGET = 0.85;
const START = { w: 0.3, b: 0.0 };

interface N {
  w: number;
  b: number;
}

export function Twins() {
  const [a, setA] = useState<N>({ ...START });
  const [b, setB] = useState<N>({ ...START });
  const [steps, setSteps] = useState(0);
  const [split, setSplit] = useState(false);

  const reset = useCallback(() => {
    setA({ ...START });
    setB({ ...START });
    setSteps(0);
    setSplit(false);
  }, []);

  const step = useCallback(() => {
    setA((p) => learningStep(p.w, p.b, TARGET, "sigmoid", LR));
    setB((p) => learningStep(p.w, p.b, TARGET, "sigmoid", LR));
    setSteps((s) => s + 1);
  }, []);

  const randomize = useCallback(() => {
    setB((p) => ({ w: p.w + (Math.random() - 0.5) * 2.5, b: p.b }));
    setSplit(true);
  }, []);

  const outA = activate(a.w + a.b, "sigmoid");
  const outB = activate(b.w + b.b, "sigmoid");
  const identical = Math.abs(a.w - b.w) < 1e-9 && Math.abs(a.b - b.b) < 1e-9;

  return (
    <WidgetContainer
      title="Twin neurons get stuck"
      description="Two neurons in the same layer, learning the same target. If they start identical, they stay identical forever."
      onReset={reset}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NeuronCard name="Neuron A" color="#3b82f6" n={a} out={outA} />
        <NeuronCard name="Neuron B" color="#a855f7" n={b} out={outB} />
      </div>

      <div className="mt-4 rounded-lg border border-widget-border bg-surface px-4 py-3 text-sm">
        {identical ? (
          <span className="text-muted">
            The two neurons are{" "}
            <span className="font-semibold text-red-500">identical</span>. They
            get the same learning signal every step, so they move in perfect
            lockstep — the layer is really only doing the work of one neuron.
          </span>
        ) : (
          <span className="text-muted">
            The neurons have{" "}
            <span className="font-semibold text-emerald-600">diverged</span>.
            Now they can learn different things and the layer uses its full
            capacity.
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={step}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-dark"
        >
          Take one learning step
        </button>
        <button
          onClick={randomize}
          className="rounded-lg border border-widget-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
        >
          Randomize neuron B
        </button>
        <span className="ml-auto text-xs text-muted">
          Steps: <span className="font-mono text-foreground">{steps}</span>
          {split && " · B was randomized"}
        </span>
      </div>
    </WidgetContainer>
  );
}

function NeuronCard({
  name,
  color,
  n,
  out,
}: {
  name: string;
  color: string;
  n: N;
  out: number;
}) {
  return (
    <div className="rounded-lg border border-widget-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        {name}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="weight" value={n.w} />
        <Stat label="bias" value={n.b} />
        <Stat label="output" value={out} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-foreground/5 py-2">
      <div className="font-mono text-sm text-foreground">{value.toFixed(3)}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}
