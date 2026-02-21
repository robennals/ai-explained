"use client";

export function PropBar({
  value,
  color = "var(--color-accent)",
  highlight,
  animate = true,
  max = 1,
  barWidth,
}: {
  value: number;
  color?: string;
  highlight?: "match" | "diff" | "none";
  animate?: boolean;
  max?: number;
  barWidth?: string;
}) {
  const bg =
    highlight === "match"
      ? "#4ade80"
      : highlight === "diff"
        ? "#f87171"
        : color;
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2.5 ${barWidth ?? "w-16"} rounded-full bg-foreground/5`}>
        <div
          className={`h-2.5 rounded-full ${animate ? "transition-all duration-200" : ""}`}
          style={{ width: `${pct}%`, backgroundColor: bg }}
        />
      </div>
      <span className="w-7 text-right font-mono text-[10px] text-muted">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

/** Bar for signed values. Center line, left = negative (red), right = positive (green). */
function SignedPropBar({ value, animate = true, max = 1 }: { value: number; animate?: boolean; max?: number }) {
  const clamped = Math.max(-max, Math.min(max, value));
  const pct = (Math.abs(clamped) / max) * 50;
  const isNeg = clamped < 0;
  const barColor = isNeg ? "#f87171" : "#4ade80";

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-2.5 w-16 rounded-full bg-foreground/5">
        {/* Center dotted line */}
        <div
          className="absolute top-0 bottom-0 w-px border-l border-dashed border-foreground/25"
          style={{ left: "50%" }}
        />
        {/* Value bar */}
        <div
          className={`absolute top-0 h-2.5 rounded-full ${animate ? "transition-all duration-200" : ""}`}
          style={{
            backgroundColor: barColor,
            width: `${pct}%`,
            ...(isNeg
              ? { right: "50%" }
              : { left: "50%" }),
          }}
        />
      </div>
      <span className="w-11 text-right font-mono text-[10px] text-muted">
        {value >= 0 ? "\u00A0" : ""}{value.toFixed(2)}
      </span>
    </div>
  );
}

export function VectorCard({
  name,
  emoji,
  properties,
  values,
  barColor,
  label,
  labelColor,
  highlight,
  className,
  signed,
  signedMax,
  animate = true,
  labelWidth,
  barMax,
  barWidth,
}: {
  name: string;
  emoji: string;
  properties: string[];
  values: number[];
  barColor?: string;
  label?: string;
  labelColor?: string;
  highlight?: (index: number) => "match" | "diff" | "none";
  className?: string;
  signed?: boolean;
  signedMax?: number;
  animate?: boolean;
  labelWidth?: string;
  barMax?: number;
  barWidth?: string;
}) {
  return (
    <div className={`rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden shrink-0 ${className ?? ""}`}>
      <div className="py-2 px-3 text-sm font-medium text-foreground border-b border-foreground/10 bg-foreground/[0.02]">
        {label && (
          <span
            className="text-[10px] font-bold uppercase tracking-widest mr-2"
            style={{ color: labelColor }}
          >
            {label}
          </span>
        )}
        {emoji} {name}
      </div>
      {properties.map((prop, i) => (
        <div
          key={prop}
          className="flex items-center gap-2 py-1.5 px-3 border-b border-foreground/5 last:border-b-0 min-h-[28px]"
        >
          <span className={`${labelWidth ?? "w-16"} text-xs font-medium capitalize text-muted shrink-0 truncate`}>
            {prop}
          </span>
          {signed ? (
            <SignedPropBar value={values[i] ?? 0} animate={animate} max={signedMax} />
          ) : (
            <PropBar
              value={values[i] ?? 0}
              color={barColor}
              highlight={highlight ? highlight(i) : undefined}
              animate={animate}
              max={barMax}
              barWidth={barWidth}
            />
          )}
        </div>
      ))}
    </div>
  );
}
