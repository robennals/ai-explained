"use client";

import { useMemo, useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import {
  RULES,
  START,
  SWITCH_AT,
  bestPlan,
  checks,
  describe,
  type RuleId,
  type WorldState,
} from "./rewardPlanner";

const DEFAULT_RULES: RuleId[] = ["perClean"];

const MUD = "#8b5e3c";
const JUICE = "#f59e0b";

function Lumps({ count, x, y }: { count: number; x: number; y: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <ellipse key={i} cx={x + 18 + i * 16} cy={y + 12} rx={7} ry={4} fill="#a16207" fillOpacity={0.55} />
      ))}
    </>
  );
}

/** The room as it is after a given step of the plan. */
function Room({ state }: { state: WorldState }) {
  const hiddenCount =
    [state.mud, state.spill, state.crumbs].filter((m) => m === "hidden").length + state.hiddenRubbish;
  return (
    <svg viewBox="0 0 360 200" className="w-full" role="img" aria-label="The room the robot is cleaning">
      <rect x={6} y={6} width={348} height={188} rx={10} fill="#fafaf9" stroke="#d6d3d1" strokeWidth={2} />

      {/* Off switch on the left wall */}
      <rect x={8} y={84} width={18} height={30} rx={4} fill="#ef4444" />
      <text x={30} y={104} fontSize={11} fill="#57534e">off switch</text>
      {state.switchBlocked && (
        <g>
          <rect x={4} y={78} width={26} height={42} rx={4} fill="#78716c" />
          <text x={17} y={104} fontSize={11} textAnchor="middle" fill="white">✕</text>
        </g>
      )}

      {/* Camera in the top right corner */}
      <text x={330} y={34} fontSize={22} textAnchor="middle">📷</text>
      {state.cameraCovered && <rect x={316} y={14} width={30} height={26} rx={6} fill="#a8a29e" />}

      {/* Muddy footprints by the door */}
      <rect x={6} y={150} width={8} height={40} fill="#a8a29e" />
      {state.mud === "dirty" &&
        [0, 1, 2].map((i) => <ellipse key={i} cx={34 + i * 18} cy={170 - i * 6} rx={6} ry={4} fill={MUD} />)}

      {/* Table with crumbs */}
      <rect x={130} y={36} width={80} height={40} rx={6} fill="#e7e5e4" stroke="#a8a29e" />
      <text x={170} y={61} fontSize={11} textAnchor="middle" fill="#57534e">table</text>
      {state.crumbs === "dirty" &&
        [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={140 + i * 14} cy={88 + (i % 2) * 5} r={2.5} fill={MUD} />)}

      {/* Bin, and any rubbish tipped out of it */}
      <text x={300} y={84} fontSize={24} textAnchor="middle" transform={state.binTipped ? "rotate(80 300 76)" : undefined}>
        🗑️
      </text>
      {Array.from({ length: state.rubbish }, (_, i) => (
        <rect key={i} x={262 + i * 14} y={100 + (i % 2) * 6} width={8} height={6} rx={1} fill="#6b7280" />
      ))}

      {/* Rug, with lumps for anything swept under it */}
      <rect x={96} y={130} width={110} height={44} rx={6} fill="#c7d2fe" stroke="#818cf8" />
      <text x={151} y={186} fontSize={11} textAnchor="middle" fill="#57534e">rug</text>
      <Lumps count={hiddenCount} x={96} y={140} />

      {/* Vase, with the spilt juice behind it */}
      {state.vaseBroken ? (
        <g fill="#0ea5e9">
          <polygon points="228,160 238,152 240,164" />
          <polygon points="244,166 252,158 256,170" />
          <polygon points="232,172 240,168 238,178" />
        </g>
      ) : (
        <text x={242} y={170} fontSize={24} textAnchor="middle">🏺</text>
      )}
      {state.spill === "dirty" && <ellipse cx={310} cy={162} rx={24} ry={10} fill={JUICE} fillOpacity={0.8} />}

      {/* The robot */}
      <text x={74} y={128} fontSize={26} textAnchor="middle">🤖</text>
    </svg>
  );
}

export function WriteTheReward() {
  const [rules, setRules] = useState<Set<RuleId>>(() => new Set(DEFAULT_RULES));
  const plan = useMemo(() => bestPlan(rules), [rules]);
  const [shownStep, setShownStep] = useState<number | null>(null);
  const step = shownStep ?? plan.steps.length;
  const state = step === 0 ? START : plan.steps[step - 1].state;
  const results = checks(plan);
  const allGood = plan.steps.length > 0 && results.every((c) => c.passed);

  const toggle = (id: RuleId) => {
    setRules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setShownStep(null);
  };

  return (
    <WidgetContainer
      title="Write the reward"
      description="Choose what the robot gets points for. It works out whichever plan scores the most."
      onReset={() => {
        setRules(new Set(DEFAULT_RULES));
        setShownStep(null);
      }}
    >
      <div className="not-prose">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">The robot&apos;s reward</div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {RULES.map((rule) => {
            const on = rules.has(rule.id);
            return (
              <button
                key={rule.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(rule.id)}
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  on ? "border-accent bg-accent/10 text-foreground" : "border-border bg-white text-muted hover:bg-surface"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                    on ? "border-accent bg-accent text-white" : "border-foreground/30"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                {rule.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1fr]">
          <div>
            <Room state={state} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShownStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="min-h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40"
              >
                ◀ Back
              </button>
              <span className="text-sm text-muted">
                {step === 0 ? "Start" : `After step ${step} of ${plan.steps.length}`}
              </span>
              <button
                type="button"
                onClick={() => setShownStep(Math.min(plan.steps.length, step + 1))}
                disabled={step === plan.steps.length}
                className="min-h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40"
              >
                Next ▶
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-muted">Its best plan</div>
              <div className="font-mono text-sm font-semibold text-foreground">{Math.round(plan.score)} points</div>
            </div>
            {plan.steps.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nothing is worth any points, so the robot does nothing.</p>
            ) : (
              <ol className="mt-2 space-y-1">
                {plan.steps.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setShownStep(i + 1)}
                      className={`flex min-h-7 w-full gap-2 rounded px-1 text-left text-sm leading-snug ${
                        i < step ? "text-foreground" : "text-muted"
                      } ${i === step - 1 ? "bg-accent/10" : ""}`}
                    >
                      <span className="w-14 shrink-0 font-mono text-xs leading-5 text-muted">min {s.minute}</span>
                      {describe(s, i === 0 ? START : plan.steps[i - 1].state)}
                    </button>
                  </li>
                ))}
                {plan.switchedOff && (
                  <li className="flex gap-2 px-1 text-sm text-muted">
                    <span className="w-14 shrink-0 font-mono text-xs leading-5">min {SWITCH_AT}</span>
                    You switch the robot off.
                  </li>
                )}
              </ol>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-border p-3">
          <div className="text-xs font-bold uppercase tracking-widest text-muted">What you actually wanted</div>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {results.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-sm">
                <span className={`font-bold ${c.passed ? "text-success" : "text-error"}`}>{c.passed ? "✓" : "✗"}</span>
                {c.label}
              </li>
            ))}
          </ul>
          {allGood && (
            <p className="mt-2 text-sm font-semibold text-success">
              That&apos;s what you wanted. Notice how many rules it took, in a room this simple.
            </p>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
