"use client";

import { VectorCard } from "../vectors/VectorCard";

const TOKENS = [
  {
    label: "cat",
    emoji: "🐱",
    key: [3],
    query: [0],
    value: [1, 0],
    keyMeaning: "I'm a noun",
    queryMeaning: "I'm not looking",
    valueMeaning: "cat",
    color: "#d97706",
  },
  {
    label: "dog",
    emoji: "🐶",
    key: [3],
    query: [0],
    value: [0, 1],
    keyMeaning: "I'm a noun",
    queryMeaning: "I'm not looking",
    valueMeaning: "dog",
    color: "#2563eb",
  },
  {
    label: "bla",
    emoji: "💬",
    key: [0],
    query: [0],
    value: [0, 0],
    keyMeaning: "I'm not a noun",
    queryMeaning: "I'm not looking",
    valueMeaning: "I don't provide anything",
    color: "#9ca3af",
  },
  {
    label: "it",
    emoji: "👉",
    key: [0],
    query: [3],
    value: [0, 0],
    keyMeaning: "I'm not a noun",
    queryMeaning: "I want a noun",
    valueMeaning: "I don't provide anything",
    color: "#9333ea",
  },
];

const KEY_QUERY_PROPS = ["noun"];
const VALUE_PROPS = ["cat", "dog"];

export function ToyVocabTable() {
  return (
    <div className="my-6 space-y-4">
      {/* Column headers */}
      <div className="grid grid-cols-3 gap-3 pl-[72px]">
        <div className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
          Key <span className="font-normal">(advertises)</span>
        </div>
        <div className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
          Query <span className="font-normal">(looks for)</span>
        </div>
        <div className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
          Value <span className="font-normal">(contributes)</span>
        </div>
      </div>

      {/* One row per token */}
      {TOKENS.map((tok) => (
        <div key={tok.label} className="flex items-center gap-3">
          {/* Row label */}
          <div
            className="w-[60px] shrink-0 text-right text-sm font-bold"
            style={{ color: tok.color }}
          >
            {tok.emoji} {tok.label}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-3 flex-1 min-w-0 items-start">
            <VectorCard
              name={`${tok.label} key`}
              emoji=""
              properties={KEY_QUERY_PROPS}
              values={tok.key}
              barColor={tok.color}
              barMax={3}
              animate={false}
              labelWidth="w-10"
              barWidth="w-12"
              className="text-xs"
              footer={tok.keyMeaning}
            />
            <VectorCard
              name={`${tok.label} query`}
              emoji=""
              properties={KEY_QUERY_PROPS}
              values={tok.query}
              barColor={tok.color}
              barMax={3}
              labelWidth="w-10"
              barWidth="w-12"
              animate={false}
              className="text-xs"
              footer={tok.queryMeaning}
            />
            <VectorCard
              name={`${tok.label} value`}
              emoji=""
              properties={VALUE_PROPS}
              values={tok.value}
              barColor={tok.color}
              barMax={1}
              labelWidth="w-10"
              barWidth="w-12"
              animate={false}
              className="text-xs"
              footer={tok.valueMeaning}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
