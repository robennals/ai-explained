"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

/* ------------------------------------------------------------------ */
/*  Data — same toy tokens as ToyAttention                            */
/* ------------------------------------------------------------------ */

const S = 3; // base key/query strength

interface Token {
  label: string;
  key: [number, number];
  query: [number, number];
  color: string;
}

const CAT: Token = {
  label: "cat",
  key: [S, 0],
  query: [S, 0],
  color: "#d97706", // amber-600
};
const DOG: Token = {
  label: "dog",
  key: [S, 0],
  query: [S, 0],
  color: "#2563eb", // blue-600
};
const BLA: Token = {
  label: "bla",
  key: [0, S],
  query: [0, S],
  color: "#9ca3af", // gray-400
};
const IT: Token = {
  label: "it",
  key: [0, 0],
  query: [S, 0],
  color: "#9333ea", // purple-600
};

interface Sentence {
  label: string;
  tokens: Token[];
}

const SENTENCES: Sentence[] = [
  { label: "dog bla cat it", tokens: [DOG, BLA, CAT, IT] },
  { label: "cat bla dog it", tokens: [CAT, BLA, DOG, IT] },
  { label: "dog cat bla it", tokens: [DOG, CAT, BLA, IT] },
  { label: "bla dog cat it", tokens: [BLA, DOG, CAT, IT] },
];

/* ------------------------------------------------------------------ */
/*  Math                                                              */
/* ------------------------------------------------------------------ */

function rotateVec(
  v: [number, number],
  angleDeg: number
): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos];
}

function dot(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ------------------------------------------------------------------ */
/*  Mini SVG showing two rotated vectors                              */
/* ------------------------------------------------------------------ */

function MiniVectorSVG({
  queryAngle,
  keyAngle,
  queryColor,
  keyColor,
}: {
  queryAngle: number;
  keyAngle: number;
  queryColor: string;
  keyColor: string;
}) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 44;

  const qRad = (-queryAngle * Math.PI) / 180;
  const kRad = (-keyAngle * Math.PI) / 180;

  const qx = cx + Math.cos(qRad) * r;
  const qy = cy + Math.sin(qRad) * r;
  const kx = cx + Math.cos(kRad) * r;
  const ky = cy + Math.sin(kRad) * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.5}
        opacity={0.15}
      />
      <line
        x1={cx}
        y1={cy}
        x2={qx}
        y2={qy}
        stroke={queryColor}
        strokeWidth={2}
      />
      <circle cx={qx} cy={qy} r={3} fill={queryColor} />
      <line
        x1={cx}
        y1={cy}
        x2={kx}
        y2={ky}
        stroke={keyColor}
        strokeWidth={2}
      />
      <circle cx={kx} cy={ky} r={3} fill={keyColor} />
      <circle cx={cx} cy={cy} r={2} fill="currentColor" opacity={0.3} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                       */
/* ------------------------------------------------------------------ */

export function RoPEToyTokens() {
  const [sentIdx, setSentIdx] = useState(0);
  const [degPerPos, setDegPerPos] = useState(0);

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setDegPerPos(0);
  }, []);

  const sentence = SENTENCES[sentIdx];
  const itIdx = sentence.tokens.length - 1; // "it" is always last

  // Compute attention scores for "it"
  const { scores, weights } = useMemo(() => {
    const itQuery = sentence.tokens[itIdx].query;
    const itPos = itIdx;
    const rotatedQuery = rotateVec(itQuery, itPos * degPerPos);

    const rawScores = sentence.tokens.map((tok, i) => {
      const rotatedKey = rotateVec(tok.key, i * degPerPos);
      return dot(rotatedQuery, rotatedKey);
    });

    return { scores: rawScores, weights: softmax(rawScores) };
  }, [sentence, itIdx, degPerPos]);

  // Find which nouns are present and their distances
  const nounInfo = useMemo(() => {
    return sentence.tokens
      .map((tok, i) => ({
        label: tok.label,
        idx: i,
        distance: itIdx - i,
        isNoun: tok.label === "cat" || tok.label === "dog",
      }))
      .filter((t) => t.isNoun);
  }, [sentence, itIdx]);

  const closerNoun = nounInfo.reduce((a, b) =>
    a.distance < b.distance ? a : b
  );

  return (
    <WidgetContainer
      title="RoPE with Our Toy Tokens"
      description="Drag the rotation speed from 0° to see how RoPE makes closer nouns win"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Sentence selector */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => setSentIdx(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sentIdx === i
                  ? "bg-accent text-white"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Rotation speed slider — the key control */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Rotation speed (degrees per position)
          </div>
          <SliderControl
            label=""
            value={degPerPos}
            min={0}
            max={30}
            step={1}
            onChange={setDegPerPos}
            formatValue={(v) => `${v}°`}
          />
          <div className="mt-1 text-[11px] text-amber-700/70 dark:text-amber-400/70">
            {degPerPos === 0
              ? "No rotation — attention is position-blind. Both nouns get equal scores."
              : `Each position rotates by ${degPerPos}°. Closer words have smaller angle difference → higher dot product.`}
          </div>
        </div>

        {/* Token sentence display */}
        <div className="flex items-center justify-center gap-1">
          {sentence.tokens.map((tok, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-muted">pos {i}</span>
              <span
                className="rounded-md px-2.5 py-1 text-sm font-bold"
                style={{
                  backgroundColor:
                    tok.label === "it"
                      ? "#f3e8ff"
                      : tok.label === "cat"
                        ? "#fef3c7"
                        : tok.label === "dog"
                          ? "#dbeafe"
                          : "#f3f4f6",
                  color: tok.color,
                }}
              >
                {tok.label}
              </span>
              <span className="text-[10px] text-muted">
                rot {i * degPerPos}°
              </span>
            </div>
          ))}
        </div>

        {/* Score table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center font-mono text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted">
                <th className="pb-1.5 text-left font-medium">Token</th>
                <th className="pb-1.5 font-medium">Distance</th>
                <th className="pb-1.5 font-medium">Angle diff</th>
                <th className="pb-1.5 font-medium">Dot product</th>
                <th className="pb-1.5 font-medium">Attention</th>
              </tr>
            </thead>
            <tbody>
              {sentence.tokens.map((tok, i) => {
                const dist = itIdx - i;
                const angleDiff = Math.abs(dist * degPerPos);
                const pct = (weights[i] * 100).toFixed(1);
                const isNoun =
                  tok.label === "cat" || tok.label === "dog";
                return (
                  <tr
                    key={i}
                    className={
                      isNoun ? "font-semibold" : "text-muted"
                    }
                  >
                    <td className="py-1 text-left">
                      <span style={{ color: tok.color }}>
                        {tok.label}
                      </span>
                    </td>
                    <td className="py-1">{dist}</td>
                    <td className="py-1">{angleDiff}°</td>
                    <td className="py-1">{scores[i].toFixed(2)}</td>
                    <td className="py-1">
                      <span
                        className="inline-block rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: isNoun
                            ? `${tok.color}18`
                            : undefined,
                        }}
                      >
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mini SVG for "it" query vs each noun key */}
        <div className="flex justify-center gap-6">
          {nounInfo.map((noun) => (
            <div key={noun.idx} className="flex flex-col items-center gap-1">
              <MiniVectorSVG
                queryAngle={itIdx * degPerPos}
                keyAngle={noun.idx * degPerPos}
                queryColor={IT.color}
                keyColor={
                  sentence.tokens[noun.idx].color
                }
              />
              <span className="text-[10px] text-muted">
                <span style={{ color: IT.color }}>it</span>
                {" → "}
                <span
                  style={{
                    color: sentence.tokens[noun.idx].color,
                  }}
                >
                  {noun.label}
                </span>
                {" ("}
                {noun.distance} apart{")"}
              </span>
            </div>
          ))}
        </div>

        {/* Insight callout */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
          {degPerPos === 0 ? (
            <>
              With no rotation, both nouns get <strong>identical</strong>{" "}
              attention scores — the model can&apos;t tell which is closer.
              Drag the rotation speed up to see RoPE break the tie.
            </>
          ) : (
            <>
              <strong style={{ color: sentence.tokens[closerNoun.idx].color }}>
                {closerNoun.label}
              </strong>{" "}
              is closer ({closerNoun.distance} position
              {closerNoun.distance !== 1 ? "s" : ""} away) so its key is rotated
              closer to <strong>it</strong>&apos;s query → higher dot product →
              more attention. The further noun loses out.
            </>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
