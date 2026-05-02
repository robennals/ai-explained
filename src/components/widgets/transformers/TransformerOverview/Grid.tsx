"use client";

import type React from "react";
import { simpleOverviewExample } from "./simple-example";
import type { LayerId } from "@/components/widgets/transformers/TransformerInAction/types";
import { overviewEdges } from "./edges";
import {
  CELL_HEIGHT,
  CELL_ROW_LAYERS,
  CELL_WIDTH,
  COMPACT_FIRST_COL_X,
  COMPACT_LABEL_GUTTER_RIGHT_X,
  COMPACT_VIEW_WIDTH,
  FIRST_COL_X,
  LABEL_GUTTER_RIGHT_X,
  LAYER_ORDER,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  columnLeft,
  columnX,
  layerRowY,
  previousLayer,
} from "./geometry";

/**
 * Split a layer label so it fits in a narrow gutter.
 * Splits on whitespace or hyphen near the midpoint; otherwise returns one line.
 */
function splitLabel(label: string): string[] {
  if (label.length <= 9) return [label];
  const cap = Math.min(label.length - 1, Math.ceil(label.length / 2) + 3);
  const ws = label.lastIndexOf(" ", cap);
  if (ws > 0) return [label.slice(0, ws), label.slice(ws + 1)];
  const hy = label.lastIndexOf("-", cap);
  if (hy > 0) return [label.slice(0, hy + 1), label.slice(hy + 1)];
  return [label];
}

const ATT_COLOR = "#2563eb";
const RES_COLOR = "#ea580c";

interface GridProps {
  compact?: boolean;
  selectedCell: { tokenIndex: number; layer: LayerId } | null;
  selectedLayer: LayerId | null;
  sourceCells: Set<string>;
  onCellClick: (tokenIndex: number, layer: LayerId) => void;
  onLayerLabelClick: (layer: LayerId) => void;
}

export function Grid({ compact, selectedCell, selectedLayer, sourceCells, onCellClick, onLayerLabelClick }: GridProps) {
  const tokens = simpleOverviewExample.tokens;
  const lastIdx = tokens.length - 1;
  const presentLayerIds = new Set(simpleOverviewExample.layers.map((l) => l.id));
  const cellRowLayers = CELL_ROW_LAYERS.filter((l) => presentLayerIds.has(l));

  const labelGutterX = compact ? COMPACT_LABEL_GUTTER_RIGHT_X : LABEL_GUTTER_RIGHT_X;
  const firstColX = compact ? COMPACT_FIRST_COL_X : FIRST_COL_X;
  const viewWidth = compact ? COMPACT_VIEW_WIDTH : VIEW_WIDTH;

  function activateOnKey<T>(handler: (arg: T) => void, arg: T) {
    return (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler(arg);
      }
    };
  }

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${VIEW_HEIGHT}`}
      className="block w-full max-w-[960px] mx-auto"
      role="img"
      aria-label="Stacked transformer layers showing attention and residual edges across the sentence."
    >
      <defs>
        <marker id="ov-att" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={ATT_COLOR} />
        </marker>
        <marker id="ov-res" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={RES_COLOR} />
        </marker>
      </defs>

      {/* Layer labels in the left gutter */}
      {LAYER_ORDER.slice().reverse().filter((layer) => presentLayerIds.has(layer)).map((layer) => {
        const layerDef = simpleOverviewExample.layers.find((l) => l.id === layer);
        const label = layerDef ? layerDef.label : "Tokens";
        const lines = compact ? splitLabel(label) : [label];
        const labelLineH = 14;
        // Center the label block (lines + layer-id row) vertically against the cell row.
        const totalH = lines.length * labelLineH + 14;
        const yTop = layerRowY(layer) + (CELL_HEIGHT - totalH) / 2 + labelLineH;
        const isSelected = selectedLayer === layer;
        return (
          <g key={`label-${layer}`}>
            <text
              x={labelGutterX}
              y={yTop}
              textAnchor="end"
              fontSize={14}
              fontWeight={layer === "L0" ? 600 : 400}
              fill={isSelected ? "#92400e" : "#374151"}
              style={{ cursor: "pointer" }}
              onClick={() => onLayerLabelClick(layer)}
              onKeyDown={activateOnKey(onLayerLabelClick, layer)}
              role="button"
              tabIndex={0}
              aria-label={`${label} — click to see what this layer does`}
            >
              {lines.map((line, idx) => (
                <tspan key={idx} x={labelGutterX} dy={idx === 0 ? 0 : labelLineH}>
                  {line}
                </tspan>
              ))}
            </text>
            <text x={labelGutterX} y={yTop + lines.length * labelLineH} textAnchor="end" fontSize={11} fill="#9ca3af">
              {layer}
            </text>
          </g>
        );
      })}

      {/* Residual edges */}
      {overviewEdges.residuals.map((e, i) => {
        const x = columnX(e.tokenIndex, firstColX);
        const yEnd = layerRowY(e.toLayer) + CELL_HEIGHT + 1; // arrow tip at bottom of consumer cell
        const fromLayer = previousLayer(e.toLayer);
        if (!fromLayer) return null;
        const yStart = layerRowY(fromLayer); // top of source cell
        return (
          <line
            key={`res-${i}`}
            x1={x}
            y1={yStart}
            x2={x}
            y2={yEnd}
            stroke={RES_COLOR}
            strokeWidth={1.8}
            markerEnd="url(#ov-res)"
          />
        );
      })}

      {/* Attention edges */}
      {overviewEdges.attention.map((e, i) => {
        const xFrom = columnX(e.fromTokenIndex, firstColX);
        const xTo = columnX(e.toTokenIndex, firstColX);
        const fromLayer = previousLayer(e.toLayer);
        if (!fromLayer) return null;
        const yStart = layerRowY(fromLayer);
        const yEnd = layerRowY(e.toLayer) + CELL_HEIGHT + 1;
        const yMid = (yStart + yEnd) / 2 - 8;
        const path = `M ${xFrom} ${yStart} C ${xFrom} ${yMid}, ${xTo} ${yMid}, ${xTo} ${yEnd}`;
        return (
          <path
            key={`att-${i}`}
            d={path}
            stroke={ATT_COLOR}
            strokeWidth={Math.max(1, e.weight * 2.4)}
            fill="none"
            markerEnd="url(#ov-att)"
          />
        );
      })}

      {/* Cells — only layers present in the example data */}
      {cellRowLayers.map((layer) =>
        tokens.map((tok, i) => {
          const isSelected = selectedCell?.tokenIndex === i && selectedCell?.layer === layer;
          const isSourceCell = sourceCells.has(`${layer}:${i}`);
          const isInputRow = layer === "L0";
          return (
            <g key={`cell-${layer}-${i}`}>
              <rect
                x={columnLeft(i, firstColX)}
                y={layerRowY(layer)}
                width={CELL_WIDTH}
                height={CELL_HEIGHT}
                rx={4}
                fill={isSelected ? "#fde68a" : isSourceCell ? "#fef3c7" : isInputRow ? "#eef2ff" : "#fafafa"}
                stroke={isSelected ? "#b45309" : isSourceCell ? "#d97706" : isInputRow ? "#c7d2fe" : "#d1d5db"}
                strokeWidth={isSelected ? 2 : isSourceCell ? 1.5 : 1}
                style={{ cursor: "pointer" }}
                onClick={() => onCellClick(i, layer)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCellClick(i, layer);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${tok.token} at ${layer}`}
              />
              <text
                x={columnX(i, firstColX)}
                y={layerRowY(layer) + 23}
                textAnchor="middle"
                fontSize={15}
                fontWeight={isInputRow || isSelected ? 600 : 400}
                fill={isSelected ? "#92400e" : isInputRow ? "#1e3a8a" : "#374151"}
                pointerEvents="none"
              >
                {tok.token}
              </text>
            </g>
          );
        })
      )}

      {/* Predict cell (last token's column only) — shows the model's top next-word guess. */}
      <rect
        x={columnLeft(lastIdx, firstColX)}
        y={layerRowY("Predict")}
        width={CELL_WIDTH}
        height={CELL_HEIGHT}
        rx={4}
        fill={selectedCell?.layer === "Predict" ? "#fde68a" : "#dbeafe"}
        stroke={selectedCell?.layer === "Predict" ? "#b45309" : "#2563eb"}
        strokeWidth={1.5}
        style={{ cursor: "pointer" }}
        onClick={() => onCellClick(lastIdx, "Predict")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCellClick(lastIdx, "Predict");
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Predict next word: ${simpleOverviewExample.predictions[0]?.token ?? "?"}`}
      />
      <text
        x={columnX(lastIdx, firstColX)}
        y={layerRowY("Predict") + 23}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="#1e3a8a"
        pointerEvents="none"
      >
        {simpleOverviewExample.predictions[0]?.token ?? "?"}
      </text>
    </svg>
  );
}
