"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SelectControl } from "../shared/SelectControl";
import { SliderControl } from "../shared/SliderControl";
import { ToggleControl } from "../shared/ToggleControl";
import { formatCount } from "./cost";
import { HAYSTACK, QUERIES } from "./haystack";
import { scoreTokens, topK, indexShareLayers, flops } from "./indexer";

/* ------------------------------------------------------------------ */
/*  Toy demo constants — the haystack and its k-slider are a small,    */
/*  readable stand-in for the mechanism, not a realistic scale.        */
/* ------------------------------------------------------------------ */

const DEFAULT_QUERY_INDEX = 0;
const DEFAULT_K = 7; // covers every author query's full ground truth at reset
const MIN_K = 1;
const MAX_K = 12;
const N_LAYERS = 8;
const REUSE_EVERY = 4;

/* ------------------------------------------------------------------ */
/*  FLOP meter constants — a realistic scale (a million words), so the */
/*  comparison lands in the same ballpark the chapter quotes for real  */
/*  systems. indexerCost is tuned (not the ratio itself) so that       */
/*  IndexShare's saving lands near the ~2.9x figure reported for       */
/*  GLM-5.2 — the displayed ratio below is always computed from        */
/*  flops(), never hardcoded.                                         */
/* ------------------------------------------------------------------ */

const FLOP_SEQ_LEN = 1_000_000;
const FLOP_K = 2048; // DeepSeek DSA's real shortlist size
// The indexer has to score every word in the context, every time it runs.
// That per-word scan is cheap per word (low precision, few heads), but at a
// million words the scan itself is what FLOP_INDEXER_COST stands for — it
// represents that full-context scan, which is why it dominates the sparse
// total below. That's exactly why reusing one scan's picks across several
// layers (IndexShare) saves so much: it's cutting the biggest cost, not a
// rounding error.
const FLOP_INDEXER_COST = 14150;

const DENSE_FLOPS = flops(FLOP_SEQ_LEN, FLOP_K, N_LAYERS, {
  sparse: false,
  share: false,
  reuseEvery: REUSE_EVERY,
  indexerCost: FLOP_INDEXER_COST,
});
const SPARSE_FLOPS = flops(FLOP_SEQ_LEN, FLOP_K, N_LAYERS, {
  sparse: true,
  share: false,
  reuseEvery: REUSE_EVERY,
  indexerCost: FLOP_INDEXER_COST,
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SparseIndexer() {
  const [queryIndex, setQueryIndex] = useState(DEFAULT_QUERY_INDEX);
  const [k, setK] = useState(DEFAULT_K);
  const [share, setShare] = useState(false);

  const query = QUERIES[queryIndex];

  const handleReset = useCallback(() => {
    setQueryIndex(DEFAULT_QUERY_INDEX);
    setK(DEFAULT_K);
    setShare(false);
  }, []);

  // The third meter bar is live: it reflects the IndexShare toggle above, so
  // flipping the switch visibly moves this number instead of a fixed constant.
  const sparseShareFlops = useMemo(
    () =>
      flops(FLOP_SEQ_LEN, FLOP_K, N_LAYERS, {
        sparse: true,
        share,
        reuseEvery: REUSE_EVERY,
        indexerCost: FLOP_INDEXER_COST,
      }),
    [share]
  );
  const shareRatio = SPARSE_FLOPS / sparseShareFlops;

  const scores = useMemo(() => scoreTokens(query, HAYSTACK), [query]);
  const shortlist = useMemo(() => new Set(topK(scores, k)), [scores, k]);

  const caught = query.relevant.filter((id) => shortlist.has(id)).length;
  const allCaught = caught === query.relevant.length;

  const layerComputes = useMemo(
    () => indexShareLayers(N_LAYERS, share ? REUSE_EVERY : 1),
    [share]
  );

  return (
    <WidgetContainer
      title="Pick the words that matter"
      description="A cheap indexer scores every word, then full attention only runs on the shortlist it keeps."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-6">
        {/* Query picker */}
        <SelectControl
          label="What is the model looking for?"
          value={query.id}
          options={QUERIES.map((q) => ({ value: q.id, label: q.label }))}
          onChange={(value) => {
            const i = QUERIES.findIndex((q) => q.id === value);
            if (i >= 0) setQueryIndex(i);
          }}
        />

        {/* Haystack grid */}
        <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap gap-2">
            {HAYSTACK.map((token) => {
              const kept = shortlist.has(token.id);
              return (
                <motion.span
                  key={token.id}
                  layout
                  animate={{
                    backgroundColor: kept
                      ? "var(--color-accent)"
                      : "var(--color-surface)",
                    color: kept ? "#fff" : "var(--color-muted)",
                    opacity: kept ? 1 : 0.45,
                    scale: kept ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.35 }}
                  className="inline-block rounded-md border border-border px-3 py-1.5 text-base font-semibold sm:text-lg"
                >
                  {token.text}
                </motion.span>
              );
            })}
          </div>
        </div>

        {/* Relevance readout */}
        <div
          className={`rounded-lg border px-4 py-2 text-center text-sm font-semibold ${
            allCaught
              ? "border-success/30 bg-success/5 text-success"
              : "border-error/30 bg-error/5 text-error"
          }`}
        >
          {caught} of {query.relevant.length} answer words kept
          {allCaught ? " — the shortlist has everything it needs." : " — some of the answer got left out."}
        </div>

        {/* k slider */}
        <SliderControl
          label="Words kept (k)"
          value={k}
          min={MIN_K}
          max={MAX_K}
          step={1}
          onChange={setK}
          formatValue={(v) => `${v}`}
        />

        {/* Layer stack + IndexShare toggle */}
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <ToggleControl
            label="Share the shortlist (IndexShare)"
            checked={share}
            onChange={setShare}
          />
          <div className="flex flex-col gap-1.5">
            {layerComputes.map((computes, i) => {
              const lastComputed = (() => {
                for (let j = i; j >= 0; j--) {
                  if (layerComputes[j]) return j;
                }
                return i;
              })();
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    computes
                      ? "border-accent/40 bg-accent/10"
                      : "border-border bg-transparent"
                  }`}
                >
                  <span className="font-medium text-muted">Layer {i + 1}</span>
                  <span
                    className={`font-semibold ${
                      computes ? "text-accent" : "text-muted"
                    }`}
                  >
                    {computes
                      ? "Computing indexer"
                      : `Reusing layer ${lastComputed + 1}'s picks`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* FLOP meter — Dense and Sparse are fixed reference points; the third
            bar is live and tracks the IndexShare toggle above. */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-error">
                Dense
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-error">
                {formatCount(DENSE_FLOPS)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Sparse
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">
                {formatCount(SPARSE_FLOPS)}
              </p>
            </div>
            <motion.div
              animate={{ scale: share ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg border px-4 py-3 text-center transition-colors ${
                share
                  ? "border-accent bg-accent/10"
                  : "border-accent/30 bg-accent/5"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                Sparse + IndexShare {share ? "(on)" : "(off)"}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-accent">
                {formatCount(sparseShareFlops)}
              </p>
            </motion.div>
          </div>
          <p className="text-center text-xs text-muted">
            Computations at a {formatCount(FLOP_SEQ_LEN)}-word context, top {formatCount(FLOP_K)}
            {" "}words kept, across {N_LAYERS} layers
          </p>
          <p className="text-center text-sm font-semibold text-accent">
            {share
              ? `IndexShare is ~${shareRatio.toFixed(1)}x cheaper than recomputing the indexer every layer.`
              : "Switch on IndexShare to reuse one shortlist across layers and drop this number."}
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}
