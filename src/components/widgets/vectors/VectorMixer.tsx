"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";
import { VectorCard } from "./VectorCard";
import {
  ANIMAL_DOMAIN,
  vecDot,
  vecNormalize,
  vecMagnitude,
  itemSimilarityLabel,
} from "./vectorData";

const PROPS = ANIMAL_DOMAIN.properties;
const ANIMALS = ANIMAL_DOMAIN.items;

interface Recipe {
  label: string;
  baseIdx: number;
  modifiers: number[];
}

const RECIPES: Recipe[] = [
  {
    label: "Paddington",
    baseIdx: 0, // Bear
    modifiers: [/* big */ -0.3, /* scary */ -0.4, /* hairy */ 0, /* cuddly */ 0.4, /* fast */ 0, /* fat */ 0],
  },
  {
    label: "Direwolf",
    baseIdx: 8, // Dog
    modifiers: [/* big */ 0.4, /* scary */ 0.4, /* hairy */ 0.1, /* cuddly */ -0.3, /* fast */ 0.1, /* fat */ 0],
  },
  {
    label: "Tiny Eagle",
    baseIdx: 4, // Eagle
    modifiers: [/* big */ -0.3, /* scary */ -0.3, /* hairy */ 0.2, /* cuddly */ 0.3, /* fast */ 0, /* fat */ 0],
  },
];

function vecAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

function vecLerp(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v * (1 - t) + b[i] * t);
}

/** Rank all animals by similarity to a given vector (assumed unit). */
function rankBySimilarity(unitVec: number[]) {
  return ANIMALS.map((animal, idx) => ({
    idx,
    animal,
    similarity: vecDot(unitVec, animal.values),
  })).sort((a, b) => b.similarity - a.similarity);
}

function SimilarityRanking({ unitVec }: { unitVec: number[] }) {
  const ranked = useMemo(() => rankBySimilarity(unitVec), [unitVec]);
  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
      <div className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-foreground/10 bg-foreground/[0.02]">
        Closest match
      </div>
      {ranked.slice(0, 5).map(({ animal, similarity }, i) => {
        const { color } = itemSimilarityLabel(similarity);
        return (
          <div
            key={animal.name}
            className="flex items-center gap-2 py-1.5 px-3 border-b border-foreground/5 last:border-b-0"
          >
            <span className="text-sm">{animal.emoji}</span>
            <span className={`text-xs font-medium ${i === 0 ? "text-foreground" : "text-muted"}`}>
              {animal.name}
            </span>
            <span className="ml-auto font-mono text-[10px]" style={{ color }}>
              {similarity.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AnimalSelector({
  label,
  selectedIdx,
  onSelect,
  color,
}: {
  label: string;
  selectedIdx: number;
  onSelect: (idx: number) => void;
  color: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {ANIMALS.map((item, i) => (
          <button
            key={item.name}
            onClick={() => onSelect(i)}
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
              i === selectedIdx
                ? "text-white"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
            style={i === selectedIdx ? { backgroundColor: color } : undefined}
          >
            {item.emoji} {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Blend Tab ---

function BlendTab() {
  const [idxA, setIdxA] = useState(0); // Bear
  const [idxB, setIdxB] = useState(1); // Rabbit
  const [blend, setBlend] = useState(0.5);

  const animalA = ANIMALS[idxA];
  const animalB = ANIMALS[idxB];
  const blended = vecLerp(animalA.values, animalB.values, blend);
  const blendedUnit = vecNormalize(blended);
  const mag = vecMagnitude(blended);

  return (
    <div>
      <p className="text-sm text-muted mb-3">
        Pick two animals and blend their vectors. The result is normalized back to a unit vector. Check the similarity ranking to see which animal the blend is closest to.
      </p>
      <div className="space-y-2 mb-3">
        <AnimalSelector label="Animal A" selectedIdx={idxA} onSelect={setIdxA} color="#3b82f6" />
        <AnimalSelector label="Animal B" selectedIdx={idxB} onSelect={setIdxB} color="#f59e0b" />
      </div>
      <SliderControl
        label={
          <span>
            <span style={{ color: "#3b82f6" }}>{animalA.emoji}</span>
            {" / "}
            <span style={{ color: "#f59e0b" }}>{animalB.emoji}</span>
            {" blend"}
          </span>
        }
        value={blend}
        min={0}
        max={1}
        step={0.01}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        ticks={[0.5]}
        onChange={setBlend}
      />
      <div className="grid gap-2 mt-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <VectorCard
          name={animalA.name}
          emoji={animalA.emoji}
          properties={PROPS}
          values={animalA.values}
          barColor="#3b82f6"
          label="A"
          labelColor="#3b82f6"
        />
        <VectorCard
          name={animalB.name}
          emoji={animalB.emoji}
          properties={PROPS}
          values={animalB.values}
          barColor="#f59e0b"
          label="B"
          labelColor="#f59e0b"
        />
        <VectorCard
          name="Blend"
          emoji="?"
          properties={PROPS}
          values={blendedUnit}
          barColor="#8b5cf6"
          label="result"
          labelColor="#8b5cf6"
          footer={`magnitude before normalizing: ${mag.toFixed(2)}`}
        />
      </div>
      <div className="mt-2">
        <SimilarityRanking unitVec={blendedUnit} />
      </div>
    </div>
  );
}

// --- Recipe Tab ---

function RecipeTab() {
  const [baseIdx, setBaseIdx] = useState(0);
  const [modifiers, setModifiers] = useState<number[]>(() => PROPS.map(() => 0));
  const [recipeName, setRecipeName] = useState("");

  const base = ANIMALS[baseIdx];
  const modified = vecAdd(base.values, modifiers);
  // Clamp negatives to 0 before normalizing — properties can't go below zero
  const clamped = modified.map((v) => Math.max(0, v));
  const result = vecNormalize(clamped);
  const allZero = clamped.every((v) => v < 0.001);

  const applyRecipe = useCallback((recipe: Recipe) => {
    setBaseIdx(recipe.baseIdx);
    setModifiers([...recipe.modifiers]);
    setRecipeName(recipe.label);
  }, []);

  const handleReset = useCallback(() => {
    setModifiers(PROPS.map(() => 0));
    setRecipeName("");
  }, []);

  return (
    <div>
      <p className="text-sm text-muted mb-3">
        Pick a base animal, then use the sliders to add or subtract properties. The result is clamped to positive values and normalized. Try a preset recipe, or invent your own creature.
      </p>
      <div className="mb-3">
        <AnimalSelector label="Base animal" selectedIdx={baseIdx} onSelect={(i) => { setBaseIdx(i); setRecipeName(""); }} color="#3b82f6" />
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted self-center mr-1">Presets:</span>
        {RECIPES.map((recipe) => (
          <button
            key={recipe.label}
            onClick={() => applyRecipe(recipe)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              recipeName === recipe.label
                ? "bg-purple-500 text-white"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            {recipe.label}
          </button>
        ))}
        <button
          onClick={handleReset}
          className="rounded-md px-2 py-0.5 text-[11px] font-medium bg-foreground/5 text-muted hover:bg-foreground/10 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Modifications to add</div>
      <div className="space-y-1 mb-3">
        {PROPS.map((prop, i) => (
          <SliderControl
            key={prop}
            label={<span className="capitalize">{prop}</span>}
            value={modifiers[i]}
            min={-0.5}
            max={0.5}
            step={0.01}
            formatValue={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
            ticks={[0]}
            onChange={(v) => {
              setModifiers((prev) => {
                const next = [...prev];
                next[i] = v;
                return next;
              });
              setRecipeName("");
            }}
          />
        ))}
      </div>
      <div className="grid gap-2 mt-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <VectorCard
          name={base.name}
          emoji={base.emoji}
          properties={PROPS}
          values={base.values}
          barColor="#3b82f6"
          label="base"
          labelColor="#3b82f6"
        />
        <VectorCard
          name="Modifier"
          emoji="+"
          properties={PROPS}
          values={modifiers}
          signed
          signedMax={0.5}
          label="add"
          labelColor="#f59e0b"
        />
        <VectorCard
          name={recipeName || "Result"}
          emoji="?"
          properties={PROPS}
          values={allZero ? PROPS.map(() => 0) : result}
          barColor="#8b5cf6"
          label="result"
          labelColor="#8b5cf6"
        />
      </div>
      {!allZero && (
        <div className="mt-2">
          <SimilarityRanking unitVec={result} />
        </div>
      )}
    </div>
  );
}

// --- Main Widget ---

type Tab = "blend" | "recipe";

const TABS: { id: Tab; label: string }[] = [
  { id: "blend", label: "Blend" },
  { id: "recipe", label: "Modify" },
];

export function VectorMixer() {
  const [tab, setTab] = useState<Tab>("blend");

  const handleReset = useCallback(() => {
    setTab("blend");
  }, []);

  return (
    <WidgetContainer
      title="Combining Vectors"
      description="Add vectors together to create new ones"
      onReset={handleReset}
    >
      <WidgetTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />
      {tab === "blend" ? <BlendTab /> : <RecipeTab />}
    </WidgetContainer>
  );
}
