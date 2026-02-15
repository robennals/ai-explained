interface TensorDisplayProps {
  /** Flat array for 1D, nested array for 2D */
  data: number[][] | number[];
  /** Optional label shown above the tensor */
  label?: string;
}

export function TensorDisplay({ data, label }: TensorDisplayProps) {
  const is2D = Array.isArray(data[0]);
  const rows: number[][] = is2D
    ? (data as number[][])
    : [data as number[]];

  return (
    <div className="not-prose my-3 flex flex-col items-start gap-1">
      {label && (
        <span className="text-xs font-medium text-muted">
          {label}
        </span>
      )}
      <div className="inline-grid rounded-lg border-2 border-indigo-300/60 bg-indigo-50/50 gap-1 p-1.5"
        style={{ gridTemplateColumns: `repeat(${rows[0].length}, 1fr)` }}
      >
        {rows.flat().map((val, i) => (
          <span
            key={i}
            className="flex h-8 min-w-[2.5rem] items-center justify-center rounded bg-indigo-500 px-2 font-mono text-sm font-semibold text-white"
          >
            {Number.isInteger(val) ? val.toFixed(1) : val}
          </span>
        ))}
      </div>
    </div>
  );
}
