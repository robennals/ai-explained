"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Real BERT attention data (pre-computed from bert-base-uncased)     */
/* ------------------------------------------------------------------ */

interface HeadData {
  label: string;
  attention: number[][];
}

interface SentenceData {
  words: string[];
  heads: HeadData[];
  /** What the reader should look for in this sentence */
  guide: string;
  /** Per-head hints for this sentence */
  headGuides: Record<string, string>;
}

const SENTENCES: SentenceData[] = [
  {
    words: ["The","dog","chased","the","cat","because","it","was","angry"],
    guide: 'Try clicking "it" on each head. The "Self / pronoun" head attends to "dog" and "cat" — it\'s trying to resolve the pronoun. Other heads just look at adjacent words.',
    headGuides: {
      "Next word": "Every word attends almost 100% to the word that follows it. This head builds a simple chain: each word passes information forward to its neighbor.",
      "Previous word": "The mirror image — each word looks back at the one before it. Together with the next-word head, this gives every word its immediate context.",
      "Self / pronoun": 'Most words attend to themselves. But click "it" — it splits attention between "dog" (34%) and "cat" (30%), trying to figure out which noun the pronoun refers to.',
      "Broad context": 'Words attend to key structural anchors. Click "because" — it attends to "cat" (61%) and itself, connecting the reason clause to the main action.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,1],[0,0,0,0,.008,0,.796,.137,.057]]},
      {label:"Previous word",attention:[[.898,.012,.018,0,0,.003,0,0,.066],[.971,.009,.009,.006,0,.005,0,0,0],[.049,.804,.117,.018,.008,.002,.002,.002,0],[0,.002,.996,.001,0,0,0,0,0],[.001,.001,.256,.72,.006,.012,0,0,.002],[.001,.001,.005,.008,.938,.043,.003,.001,.001],[0,0,.001,0,.011,.962,.002,0,.024],[0,0,0,0,.002,.009,.986,.002,.001],[0,.001,.001,.001,.001,.001,.01,.977,.009]]},
      {label:"Self / pronoun",attention:[[.431,.006,.001,.54,.008,.001,.007,.002,.005],[.001,.597,.001,.001,.394,0,.001,0,.004],[.001,.001,.972,0,.001,.002,0,.001,.022],[.372,.012,.001,.608,.005,0,.001,0,.001],[0,.152,0,0,.848,0,0,0,0],[.004,.001,.015,.001,0,.968,0,.001,.01],[.162,.337,.018,.066,.296,0,.105,.014,.002],[.004,.005,.022,.003,.008,.002,.004,.95,.003],[.003,.004,.015,.001,.002,.007,.001,.001,.967]]},
      {label:"Broad context",attention:[[.703,.059,.074,.006,.006,.014,.001,0,.136],[.898,.055,.009,.031,.002,.001,0,0,.004],[.036,.844,.058,.025,.033,.002,.001,0,.002],[.014,.031,.807,.105,.018,.02,.001,0,.005],[.09,.014,.051,.801,.017,.022,.001,.001,.004],[.001,.008,.059,.014,.605,.285,.016,.008,.006],[.001,0,.004,.002,.002,.976,.005,.001,.01],[0,.006,.001,0,.01,.04,.931,.006,.005],[.009,.003,.002,.002,.006,.239,.236,.398,.106]]},
    ],
  },
  {
    words: ["The","chef","who","won","the","competition","opened","a","restaurant"],
    guide: 'Click "opened" — see how the "Self / pronoun" head attends to itself (97%), but "Broad context" splits between "competition" (20%) and "a" (22%). Click "who" to see it resolve back to "chef."',
    headGuides: {
      "Next word": "The familiar forward chain. Every word passes its information to the next.",
      "Previous word": '"who" attends strongly to "chef" (98%) — it knows the relative pronoun refers to the chef. "opened" attends to "competition" (93%), linking across the clause.',
      "Self / pronoun": '"chef" attends to itself (82%) and to "restaurant" (16%) — connecting the subject to its eventual object. Most other words attend to themselves.',
      "Broad context": '"who" attends to "chef" (93%). "opened" splits between itself (45%), "a" (22%), and "competition" (20%) — gathering context from across the whole sentence.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,1],[.001,0,0,.002,.017,.001,.055,.018,.906]]},
      {label:"Previous word",attention:[[.88,.016,.009,.035,.001,.004,.001,0,.054],[.925,.05,.012,.007,.002,.003,0,0,.001],[.009,.977,.01,.004,0,.001,0,0,0],[.005,.051,.878,.029,.007,.028,.002,.001,.001],[0,.002,.004,.983,.002,.001,.003,0,.006],[.002,.003,.002,.293,.639,.038,.007,.005,.012],[.001,.002,.007,.005,.028,.931,.008,.006,.011],[0,0,0,.001,0,.001,.992,.001,.004],[0,0,.003,.002,.009,.003,.007,.929,.046]]},
      {label:"Self / pronoun",attention:[[.918,.001,.005,0,.04,.007,.002,.018,.008],[.005,.82,.006,.001,0,.003,.003,.002,.16],[.016,.003,.96,0,.001,.012,.001,.004,.004],[.003,0,0,.962,0,.002,.028,.002,.002],[.385,.004,.003,.001,.548,.014,.004,.017,.025],[.023,.003,.016,.002,.005,.936,.003,.001,.012],[.001,0,0,.017,0,.001,.967,.002,.012],[.067,.001,.003,.001,.012,.001,.006,.899,.009],[.005,.021,.001,.001,.001,.004,.015,.001,.952]]},
      {label:"Broad context",attention:[[.464,.057,.037,.013,0,.006,.023,.005,.395],[.912,.021,.031,.007,.004,.004,.001,.005,.016],[.013,.931,.031,.007,.002,.014,0,0,.001],[.001,.024,.94,.024,.005,.006,0,0,0],[.001,.022,.064,.854,.029,.007,.021,.001,.001],[.013,.006,.033,.147,.668,.006,.017,.108,.003],[.003,.002,.006,.014,.007,.201,.447,.216,.104],[0,0,0,.003,0,.001,.967,.004,.025],[.004,0,0,.001,.004,.005,.058,.848,.079]]},
    ],
  },
  {
    words: ["The","movie","was","not","great","but","I","loved","it","anyway"],
    guide: 'Click "it" on the "Self / pronoun" head — it attends to "movie" (55%!) across the whole sentence. Click "not" to see heads react differently to negation.',
    headGuides: {
      "Next word": "The standard forward chain. Notice even the last word, \"anyway\", mostly attends to itself (99%) — there's no next word to look at.",
      "Previous word": '"loved" attends to "but" (10%) and "I" (79%) — gathering its subject and the contrast signal. "not" attends strongly to "was" (98%).',
      "Self / pronoun": '"it" attends to "movie" (55%) and "The" (15%) — pronoun resolution spanning 7 words. "anyway" splits attention between "not" (23%), "but" (24%), and itself (35%) — gathering the contrast signals.',
      "Broad context": '"but" attends to "great" (76%) — connecting the contrast word to what\'s being contrasted. "angry" in the previous sentence showed similar structural awareness.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0],[0,0,0,.998,.001,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,1],[0,0,0,0,0,.003,0,.002,.001,.994]]},
      {label:"Previous word",attention:[[.912,.038,.005,.002,.001,.003,.001,0,0,.038],[.939,.048,.01,.001,0,.001,0,0,0,0],[.132,.782,.068,.001,.008,.003,.005,0,0,0],[.001,.013,.982,.002,.001,.001,0,0,0,0],[.002,.001,.028,.968,.001,.001,0,0,0,0],[.002,.003,.008,.002,.879,.097,.004,.001,.004,.001],[.003,.001,.002,0,.001,.985,.003,.003,.001,.002],[.002,.003,.019,.011,.003,.097,.789,.067,.009,.001],[0,0,0,0,0,.002,0,.996,.001,.001],[0,0,0,0,.001,.002,.001,.203,.777,.016]]},
      {label:"Self / pronoun",attention:[[.883,.043,.002,0,0,.002,.001,.002,.061,.006],[.028,.932,.004,.001,0,.004,.004,.001,.019,.008],[.001,.001,.941,.044,0,.001,.001,.003,.001,.007],[0,0,.014,.97,.002,.001,.001,.007,.001,.004],[.002,.001,.002,.052,.895,.006,.006,.032,.001,.003],[0,0,.003,.038,.001,.937,.001,0,0,.02],[.019,.017,.031,.067,.016,.008,.821,.004,.004,.016],[.001,.001,.003,.029,.033,.001,0,.931,0,0],[.148,.548,.024,.018,.001,.001,0,.001,.257,.001],[.004,.015,.131,.234,.015,.244,.002,.003,.004,.348]]},
      {label:"Broad context",attention:[[.658,.183,.019,.003,.019,.008,.001,.005,.004,.101],[.963,.012,.01,.001,.01,.001,0,.001,.001,.001],[.025,.892,.067,.013,.004,0,0,0,0,0],[.005,.049,.819,.113,.014,0,0,0,0,0],[.009,.01,.063,.865,.038,.013,.001,.001,.001,0],[.001,.018,.022,.006,.762,.179,.006,.001,.006,0],[.004,.006,.003,.007,.02,.932,.006,.014,.008,.002],[0,.001,.001,.003,.001,.008,.971,.011,.003,.001],[.001,.001,0,0,.006,.008,.001,.879,.096,.008],[.001,.002,0,0,.006,0,.006,.034,.907,.044]]},
    ],
  },
  {
    words: ["The","old","cat","sat","on","the","warm","mat","and","slept"],
    guide: 'Click "mat" on "Self / pronoun" — it attends to "cat" (8%) and itself (87%). Click "slept" — it attends to "sat" (10%) and itself (77%), connecting the two verbs.',
    headGuides: {
      "Next word": "The standard chain. Notice \"slept\" (the last word) mostly attends to itself (91%) — there's nothing after it.",
      "Previous word": '"cat" attends to "old" (65%) and "The" (34%) — gathering its modifiers. "slept" attends to "and" (99%), the word just before it.',
      "Self / pronoun": '"mat" attends to itself (87%) and "cat" (8%) — linking the object to the subject. "slept" attends to itself (77%) and "sat" (10%) — connecting the two actions of the same subject.',
      "Broad context": '"sat" attends to "cat" (91%) — connecting a verb to its subject. "warm" attends to "the" (87%) before it. The pattern is clearly structural.',
    },
    heads: [
      {label:"Next word",attention:[[0,1,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0],[0,0,0,.999,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,1],[0,.001,0,0,.007,.043,0,.002,.034,.913]]},
      {label:"Previous word",attention:[[.931,.012,.004,.001,.018,.001,0,0,.001,.032],[.994,.005,0,0,0,0,0,0,0,0],[.336,.654,.002,.001,.004,.002,.001,0,0,0],[.056,.037,.856,.024,.003,.011,.005,.001,.009,0],[0,0,.001,.998,.001,0,0,0,0,0],[.001,0,0,.003,.971,.017,.001,.001,.001,.006],[.006,.002,.005,.002,.127,.822,.02,.006,.007,.003],[.001,.007,.005,.001,.013,.208,.741,.005,.015,.004],[0,.001,.003,.008,.006,.011,.065,.451,.441,.015],[0,0,0,0,0,0,0,.003,.992,.004]]},
      {label:"Self / pronoun",attention:[[.893,.009,.003,.001,.002,.081,.002,0,.002,.006],[.001,.982,.002,0,0,0,.008,0,.001,.006],[0,0,.998,0,0,0,0,.001,0,0],[.001,0,.003,.911,.001,.001,0,.005,.002,.078],[.002,0,0,.002,.991,.003,0,0,0,.002],[.202,.001,.017,.028,.019,.722,.002,.001,.004,.006],[.005,.01,.005,.001,0,.001,.963,.003,.001,.011],[.001,0,.081,.036,0,0,.001,.865,.001,.013],[.029,.008,.081,.101,.001,.006,.003,.002,.758,.011],[.009,.008,.027,.103,.001,.002,.046,.031,.003,.773]]},
      {label:"Broad context",attention:[[.422,.285,.074,.032,.009,.001,.001,.002,.004,.171],[.916,.073,.001,.005,.001,.002,.001,0,.001,.002],[.027,.948,.013,.005,0,0,.007,0,0,.001],[.007,.041,.911,.031,0,0,0,.005,.001,.003],[.001,.003,.05,.927,.009,.003,.002,.003,0,.003],[.008,.03,.061,.044,.736,.093,.007,.004,.003,.015],[.029,.017,.002,.001,.012,.874,.051,.002,.008,.007],[0,.005,.001,0,.001,.001,.991,0,0,.001],[0,0,.003,.001,0,.001,.008,.965,.013,.009],[.001,.002,.003,.002,.001,.001,.003,.008,.947,.033]]},
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

function weightToBg(w: number): React.CSSProperties {
  if (w < 0.02) return {};
  const alpha = Math.min(0.12 + w * 0.73, 0.85);
  return {
    backgroundColor: `rgba(99, 102, 241, ${alpha})`,
    color: w > 0.4 ? "white" : undefined,
    borderRadius: 4,
  };
}

const selectedStyle: React.CSSProperties = {
  borderRadius: 4,
  outline: "2.5px solid var(--color-accent)",
  outlineOffset: 2,
  fontWeight: 700,
};

export function BertAttention() {
  const [sentIdx, setSentIdx] = useState(0);
  const [headIdx, setHeadIdx] = useState(2); // Start on "Self / pronoun"
  const [selected, setSelected] = useState<number | null>(null);

  const sentence = SENTENCES[sentIdx];
  const head = sentence.heads[headIdx];
  const attnRow = selected !== null ? head.attention[selected] : null;
  const headGuide = sentence.headGuides[head.label];

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setHeadIdx(2);
    setSelected(null);
  }, []);

  return (
    <WidgetContainer
      title="Real Attention Heads (BERT)"
      description="Attention weights from a real language model. Different heads learn to look for different things."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Sentence tabs */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => { setSentIdx(i); setSelected(null); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === sentIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.words.slice(0, 3).join(" ")}...
            </button>
          ))}
        </div>

        {/* Head selector */}
        <div className="flex flex-wrap gap-1.5">
          {sentence.heads.map((h, i) => (
            <button
              key={i}
              onClick={() => { setHeadIdx(i); setSelected(null); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                i === headIdx
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-border text-muted hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>

        {/* Words */}
        <div className="flex flex-wrap items-end gap-x-1 gap-y-4 rounded-lg border border-border bg-surface px-5 py-5">
          {sentence.words.map((word, i) => {
            const isSelected = selected === i;
            const weight = attnRow?.[i] ?? 0;

            return (
              <span key={`${sentIdx}-${headIdx}-${i}`} className="relative inline-flex flex-col items-center">
                {/* Percentage above */}
                {attnRow != null && !isSelected && weight >= 0.02 && (
                  <span
                    className="mb-1 font-mono text-[10px] font-bold leading-none"
                    style={{ color: weight > 0.3 ? "rgb(99, 102, 241)" : "var(--color-muted)" }}
                  >
                    {Math.round(weight * 100)}%
                  </span>
                )}
                {isSelected && (
                  <span className="mb-1 font-mono text-[10px] font-bold leading-none text-accent">
                    query
                  </span>
                )}
                {attnRow != null && !isSelected && weight < 0.02 && (
                  <span className="mb-1 text-[10px] leading-none text-transparent">·</span>
                )}
                {attnRow == null && (
                  <span className="mb-1 text-[10px] leading-none text-transparent">·</span>
                )}
                <button
                  onClick={() => setSelected(isSelected ? null : i)}
                  className="cursor-pointer px-1.5 py-1 text-lg transition-all"
                  style={isSelected ? selectedStyle : weightToBg(weight)}
                >
                  {word}
                </button>
              </span>
            );
          })}
        </div>

        {/* Per-head guide */}
        <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-sm text-foreground">
          {headGuide}
        </div>

        {/* Per-sentence guide */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted">
          <strong className="text-foreground">Try this:</strong> {sentence.guide}
        </div>
      </div>
    </WidgetContainer>
  );
}
