"use client";

const TOKENS = [
  {
    label: "cat",
    key: "[3, 0]",
    query: "[3, 0]",
    advertises: "I'm a noun",
    looksFor: "Other nouns",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "dog",
    key: "[3, 0]",
    query: "[3, 0]",
    advertises: "I'm a noun",
    looksFor: "Other nouns",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "bla",
    key: "[0, 3]",
    query: "[0, 3]",
    advertises: "I'm filler",
    looksFor: "Other filler",
    color: "text-foreground/40",
  },
  {
    label: "it",
    key: "[0, 0]",
    query: "[3, 0]",
    advertises: "Nothing",
    looksFor: "Nouns",
    color: "text-purple-600 dark:text-purple-400",
  },
];

export function ToyVocabTable() {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="px-3 py-2 text-left font-semibold text-foreground">Token</th>
            <th className="px-3 py-2 text-left font-semibold text-foreground">
              Key <span className="font-normal text-muted">(what it advertises)</span>
            </th>
            <th className="px-3 py-2 text-left font-semibold text-foreground">
              Query <span className="font-normal text-muted">(what it looks for)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {TOKENS.map((tok) => (
            <tr key={tok.label} className="border-b border-border">
              <td className="px-3 py-2.5">
                <span className={`font-bold ${tok.color}`}>{tok.label}</span>
              </td>
              <td className="px-3 py-2.5">
                <span className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-xs">
                  {tok.key}
                </span>
                <span className="ml-2 text-muted">{tok.advertises}</span>
              </td>
              <td className="px-3 py-2.5">
                <span className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-xs">
                  {tok.query}
                </span>
                <span className="ml-2 text-muted">{tok.looksFor}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
