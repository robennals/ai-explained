"use client";

import { useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

interface Example {
  id: string;
  label: string;
  inputHuman: string;
  inputNumbers: string;
  functionLabel: string;
  outputNumbers: string;
  outputHuman: string;
}

const EXAMPLES: Example[] = [
  {
    id: "recognize",
    label: "Recognize an image",
    inputHuman: "Photo of a cat",
    inputNumbers: "[142, 87, 203, 55, 191, 12, 88, ...]  (786,432 pixel values)",
    functionLabel: "f(pixels) \u2192 label",
    outputNumbers: "[0.97, 0.02, 0.01, ...]",
    outputHuman: '"Cat" (97% confident)',
  },
  {
    id: "translate",
    label: "Translate text",
    inputHuman: '"Hello, how are you?"',
    inputNumbers: "[72, 101, 108, 108, 111, 44, 32, 104, ...]",
    functionLabel: "f(english) \u2192 french",
    outputNumbers: "[66, 111, 110, 106, 111, 117, 114, ...]",
    outputHuman: '"Bonjour, comment allez-vous?"',
  },
  {
    id: "answer",
    label: "Answer a question",
    inputHuman: '"What is the capital of France?"',
    inputNumbers: "[87, 104, 97, 116, 32, 105, 115, ...]",
    functionLabel: "f(question) \u2192 answer",
    outputNumbers: "[80, 97, 114, 105, 115, ...]",
    outputHuman: '"Paris"',
  },
  {
    id: "generate",
    label: "Generate an image",
    inputHuman: '"A sunset over the ocean"',
    inputNumbers: "[65, 32, 115, 117, 110, 115, 101, 116, ...]",
    functionLabel: "f(text) \u2192 pixels",
    outputNumbers: "[255, 147, 41, 252, 139, 38, ...]  (786,432 values)",
    outputHuman: "A beautiful sunset image (512\u00d7512 pixels)",
  },
];

function Arrow() {
  return (
    <div className="flex shrink-0 items-center text-muted">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="hidden sm:block"
      >
        <path
          d="M5 12h14m0 0l-4-4m4 4l-4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="block sm:hidden"
      >
        <path
          d="M12 5v14m0 0l-4-4m4 4l4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function FunctionMachine() {
  const [selected, setSelected] = useState(EXAMPLES[0]);

  return (
    <WidgetContainer
      title="The Function Machine"
      description="Every kind of 'thinking' is turning one array of numbers into another"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelected(ex)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selected.id === ex.id
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-2">
        {/* Input */}
        <div className="w-full flex-1 rounded-lg border border-border bg-surface p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Input
          </p>
          <p className="mb-2 text-sm font-medium text-foreground">
            {selected.inputHuman}
          </p>
          <p className="break-all font-mono text-[11px] leading-relaxed text-muted">
            {selected.inputNumbers}
          </p>
        </div>

        <Arrow />

        {/* Function box */}
        <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Function
          </p>
          <p className="font-mono text-sm font-semibold text-accent">
            {selected.functionLabel}
          </p>
          <p className="mt-1 text-[10px] text-accent/60">
            (this is what we need to build)
          </p>
        </div>

        <Arrow />

        {/* Output */}
        <div className="w-full flex-1 rounded-lg border border-border bg-surface p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Output
          </p>
          <p className="mb-2 text-sm font-medium text-foreground">
            {selected.outputHuman}
          </p>
          <p className="break-all font-mono text-[11px] leading-relaxed text-muted">
            {selected.outputNumbers}
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}
