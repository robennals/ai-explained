"use client";

import { useCallback, useMemo, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { ToggleControl } from "../shared/ToggleControl";
import { formatCount } from "./cost";
import {
  blocksNeeded,
  pagedWaste,
  contiguousWaste,
  sharedBlocks,
} from "./paging";

/* ------------------------------------------------------------------ */
/*  Toy constants — a small block size (4 word-slots) so a block's     */
/*  contents are visible at a glance, and a small physical pool so the */
/*  scattering of blocks across memory is easy to see. Fake data only, */
/*  driven entirely by paging.ts — no model behind these numbers.      */
/* ------------------------------------------------------------------ */

const BLOCK_SIZE = 4;
const POOL_SIZE = 20; // total physical blocks available
const MAX_LEN = 16; // 4 blocks — cap so "Add word" can't outrun the pool
const RESERVED_PER_SEQ = MAX_LEN; // naive scheme reserves the max length up front
const PREFIX_LEN = 8; // shared-prompt demo: 2 blocks held in common
const MAX_SEQS = 3;

// Physical block ids are handed out in this scrambled order (not 0, 1, 2, ...)
// so that a sequence's logical blocks visibly land on scattered physical
// blocks, the way PagedAttention actually places them.
const ALLOCATION_ORDER = [
  6, 1, 11, 4, 14, 8, 2, 13, 0, 9, 17, 15, 3, 19, 7, 12, 5, 16, 10, 18,
];

type SeqColor = "accent" | "warning" | "success";

const COLOR_CLASSES: Record<SeqColor, { bg: string; border: string; text: string }> = {
  accent: { bg: "bg-accent", border: "border-accent", text: "text-accent" },
  warning: { bg: "bg-warning", border: "border-warning", text: "text-warning" },
  success: { bg: "bg-success", border: "border-success", text: "text-success" },
};

interface Seq {
  id: string;
  name: string;
  color: SeqColor;
  len: number;
  blocks: number[]; // physical block id for each logical block, in order
}

interface PagingState {
  sequences: Seq[];
  allocPointer: number;
  shared: boolean;
  contiguous: boolean;
}

function nextPhysicalBlock(pointer: number): number {
  return ALLOCATION_ORDER[pointer % ALLOCATION_ORDER.length];
}

function initialState(): PagingState {
  const aLen = 5;
  const bLen = 3;
  const aBlocks = Array.from({ length: blocksNeeded(aLen, BLOCK_SIZE) }, (_, i) => nextPhysicalBlock(i));
  const bBlocks = Array.from(
    { length: blocksNeeded(bLen, BLOCK_SIZE) },
    (_, i) => nextPhysicalBlock(aBlocks.length + i)
  );
  return {
    sequences: [
      { id: "a", name: "Conversation A", color: "accent", len: aLen, blocks: aBlocks },
      { id: "b", name: "Conversation B", color: "warning", len: bLen, blocks: bBlocks },
    ],
    allocPointer: aBlocks.length + bBlocks.length,
    shared: false,
    contiguous: false,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PagedCache() {
  const [state, setState] = useState<PagingState>(initialState);
  const { sequences, shared, contiguous } = state;

  const handleReset = useCallback(() => {
    setState(initialState());
  }, []);

  const growSeq = useCallback((id: string) => {
    setState((prev) => {
      const seq = prev.sequences.find((s) => s.id === id);
      if (!seq || seq.len >= MAX_LEN) return prev;
      const newLen = seq.len + 1;
      const neededBlocks = blocksNeeded(newLen, BLOCK_SIZE);
      let blocks = seq.blocks;
      let allocPointer = prev.allocPointer;
      if (neededBlocks > blocks.length) {
        blocks = [...blocks, nextPhysicalBlock(allocPointer)];
        allocPointer += 1;
      }
      return {
        ...prev,
        allocPointer,
        sequences: prev.sequences.map((s) => (s.id === id ? { ...s, len: newLen, blocks } : s)),
      };
    });
  }, []);

  const addSequence = useCallback(() => {
    setState((prev) => {
      if (prev.sequences.length >= MAX_SEQS) return prev;
      const startLen = 2;
      const blocks = Array.from(
        { length: blocksNeeded(startLen, BLOCK_SIZE) },
        (_, i) => nextPhysicalBlock(prev.allocPointer + i)
      );
      return {
        ...prev,
        allocPointer: prev.allocPointer + blocks.length,
        sequences: [
          ...prev.sequences,
          { id: "c", name: "Conversation C", color: "success", len: startLen, blocks },
        ],
      };
    });
  }, []);

  const shareCommonPrompt = useCallback(() => {
    setState((prev) => {
      if (prev.sequences.length < 2) return prev;
      const prefixBlockCount = blocksNeeded(PREFIX_LEN, BLOCK_SIZE);
      let allocPointer = prev.allocPointer;
      const sharedIds = Array.from({ length: prefixBlockCount }, () => {
        const id = nextPhysicalBlock(allocPointer);
        allocPointer += 1;
        return id;
      });

      function applyShared(seq: Seq): Seq {
        const newLen = Math.max(seq.len, PREFIX_LEN);
        const extraNeeded = blocksNeeded(newLen, BLOCK_SIZE) - prefixBlockCount;
        let extra = seq.blocks.slice(prefixBlockCount, prefixBlockCount + extraNeeded);
        while (extra.length < extraNeeded) {
          extra = [...extra, nextPhysicalBlock(allocPointer)];
          allocPointer += 1;
        }
        return { ...seq, len: newLen, blocks: [...sharedIds, ...extra] };
      }

      const [first, second, ...rest] = prev.sequences;
      return {
        ...prev,
        allocPointer,
        shared: true,
        sequences: [applyShared(first), applyShared(second), ...rest],
      };
    });
  }, []);

  const setContiguous = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, contiguous: value }));
  }, []);

  const seqLens = useMemo(() => sequences.map((s) => s.len), [sequences]);
  const pagedWasteVal = useMemo(() => pagedWaste(seqLens, BLOCK_SIZE), [seqLens]);
  const contiguousWasteVal = useMemo(
    () => contiguousWaste(seqLens, RESERVED_PER_SEQ),
    [seqLens]
  );
  const sharedBlocksVal = shared ? sharedBlocks(PREFIX_LEN, 2, BLOCK_SIZE) : 0;

  // Which physical block ids are in use, and by which sequences.
  const physicalOwners = useMemo(() => {
    const owners = new Map<number, SeqColor[]>();
    for (const seq of sequences) {
      for (const pid of seq.blocks) {
        const list = owners.get(pid) ?? [];
        if (!list.includes(seq.color)) list.push(seq.color);
        owners.set(pid, list);
      }
    }
    return owners;
  }, [sequences]);

  const canAddSequence = sequences.length < MAX_SEQS;

  return (
    <WidgetContainer
      title="Memory in pages"
      description="Split the KV cache into small fixed blocks and keep a table pointing to where each one physically lives."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-6">
        {/* Sequences: colored strips of tokens, with an Add word button each */}
        <div className="flex flex-col gap-3">
          {sequences.map((seq) => {
            const c = COLOR_CLASSES[seq.color];
            return (
              <div
                key={seq.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${c.text}`}>{seq.name}</span>
                  <button
                    onClick={() => growSeq(seq.id)}
                    disabled={seq.len >= MAX_LEN}
                    className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add word
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: seq.len }, (_, i) => (
                    <span
                      key={i}
                      className={`h-4 w-4 rounded-sm ${c.bg} ${
                        i > 0 && i % BLOCK_SIZE === 0 ? "ml-1.5" : ""
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted">
                  {seq.len} words · {blocksNeeded(seq.len, BLOCK_SIZE)} block
                  {blocksNeeded(seq.len, BLOCK_SIZE) === 1 ? "" : "s"}
                </p>
              </div>
            );
          })}
          <div className="flex gap-2">
            <button
              onClick={addSequence}
              disabled={!canAddSequence}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Add conversation
            </button>
            <button
              onClick={shareCommonPrompt}
              className="rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              Share a common prompt
            </button>
          </div>
        </div>

        {/* Naive vs. paged toggle */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <ToggleControl
            label="Reserve one big contiguous chunk per sequence (naive scheme)"
            checked={contiguous}
            onChange={setContiguous}
          />
        </div>

        {contiguous ? (
          /* Naive scheme: each sequence reserves its max length up front */
          <div className="flex flex-col gap-3">
            {sequences.map((seq) => {
              const c = COLOR_CLASSES[seq.color];
              return (
                <div key={seq.id} className="flex flex-col gap-1">
                  <span className={`text-xs font-semibold ${c.text}`}>{seq.name}</span>
                  <div className="flex flex-wrap gap-0.5 rounded-md border border-border bg-surface p-1.5">
                    {Array.from({ length: RESERVED_PER_SEQ }, (_, i) => (
                      <span
                        key={i}
                        className={`h-3.5 w-3.5 rounded-sm ${
                          i < seq.len ? c.bg : "bg-foreground/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-error">
                Wasted slots reserved but unused
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-error">
                {formatCount(contiguousWasteVal)}
              </p>
            </div>
          </div>
        ) : (
          /* Paged scheme: physical block pool + logical-to-physical table */
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs text-muted">
                Physical memory — {BLOCK_SIZE} word-slots per block, {POOL_SIZE} blocks
                in the pool
              </p>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {Array.from({ length: POOL_SIZE }, (_, pid) => {
                  const owners = physicalOwners.get(pid);
                  return (
                    <div
                      key={pid}
                      className={`flex flex-col items-center rounded-md border p-1 ${
                        owners ? "border-foreground/20" : "border-border bg-foreground/5"
                      }`}
                      title={owners ? `Physical block ${pid}` : "free"}
                    >
                      <div className="grid grid-cols-2 gap-0.5">
                        {Array.from({ length: BLOCK_SIZE }, (_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-1.5 rounded-[1px] ${
                              owners
                                ? COLOR_CLASSES[owners[0]].bg
                                : "bg-foreground/10"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="mt-0.5 text-[9px] text-muted">
                        {pid}
                        {owners && owners.length > 1 ? "*" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              {shared && (
                <p className="mt-1 text-[11px] text-muted">* shared by two sequences</p>
              )}
            </div>

            {/* Block table: logical block -> physical block, per sequence */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sequences.map((seq) => {
                const c = COLOR_CLASSES[seq.color];
                return (
                  <div
                    key={seq.id}
                    className="rounded-lg border border-border bg-surface p-3"
                  >
                    <p className={`mb-2 text-xs font-semibold ${c.text}`}>{seq.name}</p>
                    <div className="flex flex-col gap-1">
                      {seq.blocks.map((pid, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-sm bg-white px-2 py-0.5 text-[11px]"
                        >
                          <span className="text-muted">Logical block {i}</span>
                          <span className="font-mono font-semibold text-foreground">
                            → physical #{pid}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-accent">
                  Wasted slots (last block only)
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-accent">
                  {formatCount(pagedWasteVal)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Blocks saved by sharing
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                  {shared ? formatCount(sharedBlocksVal) : "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
