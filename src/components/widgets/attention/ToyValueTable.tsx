"use client";

import { VectorCard } from "../vectors/VectorCard";

const TOKENS = [
  {
    label: "cat",
    emoji: "🐱",
    value: [1, 0],
    footer: "I provide \"cat\"",
    color: "#d97706",
  },
  {
    label: "dog",
    emoji: "🐶",
    value: [0, 1],
    footer: "I provide \"dog\"",
    color: "#2563eb",
  },
  {
    label: "bla",
    emoji: "💬",
    value: [0, 0],
    footer: "I don't provide anything",
    color: "#9ca3af",
  },
  {
    label: "it",
    emoji: "👉",
    value: [0, 0],
    footer: "I don't provide anything",
    color: "#9333ea",
  },
];

const VALUE_PROPS = ["cat", "dog"];

export function ToyValueTable() {
  return (
    <div className="my-6 flex flex-wrap justify-center gap-3">
      {TOKENS.map((tok) => (
        <div key={tok.label} className="flex flex-col items-center gap-1.5">
          <div className="text-sm font-bold" style={{ color: tok.color }}>
            {tok.emoji} {tok.label}
          </div>
          <VectorCard
            name=""
            emoji=""
            properties={VALUE_PROPS}
            values={tok.value}
            barColor={tok.color}
            barMax={1}
            animate={false}
            labelWidth="w-10"
            barWidth="w-12"
            className="text-xs"
            label="VALUE"
            footer={tok.footer}
          />
        </div>
      ))}
    </div>
  );
}
