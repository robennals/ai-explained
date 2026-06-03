"use client";

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { GlossaryPlainProvider } from "@/components/mdx/G";

// ───────────────────────────────────────────────────────────────────────────
// localStorage-backed persistence (via useSyncExternalStore so it survives the
// react-hooks/set-state-in-effect lint without an escape hatch).
// ───────────────────────────────────────────────────────────────────────────

type QuizState = { current: number; selections: Record<number, number> };
const EMPTY_QUIZ_STATE: QuizState = { current: 0, selections: {} };

const localChangeListeners = new Map<string, Set<() => void>>();

function notifyLocalChange(key: string) {
  localChangeListeners.get(key)?.forEach((fn) => fn());
}

function useQuizStorage(
  key: string
): [QuizState, (next: QuizState) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = localChangeListeners.get(key);
      if (!set) {
        set = new Set();
        localChangeListeners.set(key, set);
      }
      set.add(onChange);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) onChange();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set?.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  }, [key]);

  const getServerSnapshot = useCallback(() => "", []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<QuizState>(() => {
    if (!raw) return EMPTY_QUIZ_STATE;
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.current === "number" &&
        parsed.selections &&
        typeof parsed.selections === "object"
      ) {
        return parsed as QuizState;
      }
    } catch {
      // fall through
    }
    return EMPTY_QUIZ_STATE;
  }, [raw]);

  const setValue = useCallback(
    (next: QuizState) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
      notifyLocalChange(key);
    },
    [key]
  );

  return [value, setValue];
}

// ───────────────────────────────────────────────────────────────────────────
// Markers — Question reads these props/children; the components never render.
// ───────────────────────────────────────────────────────────────────────────

interface ChoiceProps {
  correct?: boolean;
  children: ReactNode;
}

interface FeedbackProps {
  children: ReactNode;
}

export function Choice(props: ChoiceProps) {
  void props;
  return null;
}
Choice.displayName = "Choice";

export function Feedback(props: FeedbackProps) {
  void props;
  return null;
}
Feedback.displayName = "Feedback";

function getMarkerName(el: ReactElement): string | undefined {
  const t = el.type as { displayName?: string; name?: string };
  return t?.displayName ?? t?.name;
}

function isMarker(el: ReactNode, name: string): el is ReactElement {
  return isValidElement(el) && getMarkerName(el) === name;
}

function getCorrectIndex(question: ReactElement): number {
  const { children } = question.props as { children: ReactNode };
  let idx = 0;
  for (const child of Children.toArray(children)) {
    if (isMarker(child, "Choice")) {
      const cp = child.props as ChoiceProps;
      if (cp.correct) return idx;
      idx++;
    }
  }
  return -1;
}

// ───────────────────────────────────────────────────────────────────────────
// Quiz
// ───────────────────────────────────────────────────────────────────────────

interface QuizCtx {
  questionNumber: number;
  selectedIndex: number | null;
  correctIndex: number;
  isCurrent: boolean;
  isExpanded: boolean;
  onSelect: (index: number) => void;
  onToggleExpand: () => void;
}

const QuizContext = createContext<QuizCtx | null>(null);

interface QuizProps {
  slug: string;
  children: ReactNode;
}

export function Quiz({ slug, children }: QuizProps) {
  const questions = useMemo(
    () =>
      Children.toArray(children).filter(isValidElement) as ReactElement[],
    [children]
  );
  const total = questions.length;
  const correctIndices = useMemo(
    () => questions.map(getCorrectIndex),
    [questions]
  );

  const [persisted, setPersisted] = useQuizStorage(`quiz:${slug}:v1`);
  const [sessionId, setSessionId] = useState(0);
  const [expandedSet, setExpandedSet] = useState<Set<number>>(
    () => new Set()
  );

  // Clamp persisted.current in case the question count shrank since last visit.
  const current = Math.min(Math.max(0, persisted.current), total);
  const selections = persisted.selections;

  const handleSelect = (questionIdx: number, optionIdx: number) => {
    if (selections[questionIdx] != null) return;
    setPersisted({
      current,
      selections: { ...selections, [questionIdx]: optionIdx },
    });
  };

  const handleNext = () => {
    // Auto-collapse the just-answered question as we advance.
    setExpandedSet((prev) => {
      if (!prev.has(current)) return prev;
      const next = new Set(prev);
      next.delete(current);
      return next;
    });
    setPersisted({ current: current + 1, selections });
  };

  const handleRetake = () => {
    setPersisted({ current: 0, selections: {} });
    setExpandedSet(new Set());
    setSessionId((s) => s + 1);
  };

  const toggleExpand = (i: number) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // Scroll the newly-active question to the top of the viewport whenever the
  // user advances (or retakes). Skip the first render so resuming a saved
  // session doesn't yank the page around.
  const activeRef = useRef<HTMLDivElement>(null);
  const prevCurrentRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (
      prevCurrentRef.current !== undefined &&
      prevCurrentRef.current !== current
    ) {
      activeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevCurrentRef.current = current;
  }, [current]);

  if (total === 0) return null;

  const numCorrect = Object.entries(selections).filter(
    ([qIdx, sel]) => sel === correctIndices[Number(qIdx)]
  ).length;

  const isDone = current >= total;
  const visibleEnd = isDone ? total : current + 1;
  const currentAnswered =
    !isDone && selections[current] !== undefined;
  const isLast = current === total - 1;

  return (
    <section className="widget-container my-8" aria-label="Chapter quiz">
      <header className="border-b border-widget-border bg-surface px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          Quiz: Check Your Understanding
        </h3>
      </header>
      <div className="space-y-3 p-5">
        {questions.slice(0, visibleEnd).map((q, i) => {
          const isCurrent = !isDone && i === current;
          const isExpanded = isCurrent || expandedSet.has(i);
          return (
            <div
              key={`s${sessionId}-q${i}`}
              ref={isCurrent ? activeRef : undefined}
              style={{ scrollMarginTop: "4rem" }}
            >
              <QuizContext.Provider
                value={{
                  questionNumber: i + 1,
                  selectedIndex: selections[i] ?? null,
                  correctIndex: correctIndices[i],
                  isCurrent,
                  isExpanded,
                  onSelect: (idx) => handleSelect(i, idx),
                  onToggleExpand: () => toggleExpand(i),
                }}
              >
                {q}
              </QuizContext.Provider>
            </div>
          );
        })}
        {currentAnswered && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
            >
              {isLast ? "Finish quiz" : "Next question →"}
            </button>
          </div>
        )}
        {isDone && (
          <QuizSummaryFooter
            numCorrect={numCorrect}
            total={total}
            onRetake={handleRetake}
          />
        )}
      </div>
    </section>
  );
}

function QuizSummaryFooter({
  numCorrect,
  total,
  onRetake,
}: {
  numCorrect: number;
  total: number;
  onRetake: () => void;
}) {
  const message =
    numCorrect === total
      ? "Perfect score."
      : numCorrect >= total - 1
      ? "Almost perfect."
      : numCorrect >= total / 2
      ? "Solid — worth a re-read of the parts you missed."
      : "Worth another pass through the chapter.";

  return (
    <div className="mt-2 flex flex-col items-center gap-3 rounded-lg border border-widget-border bg-surface p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">
        Quiz complete
      </p>
      <p className="text-3xl font-semibold text-foreground">
        {numCorrect} <span className="text-muted">/</span> {total}
      </p>
      <p className="text-sm text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetake}
        className="mt-1 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
      >
        Retake quiz
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Question
// ───────────────────────────────────────────────────────────────────────────

interface QuestionProps {
  children: ReactNode;
}

export function Question({ children }: QuestionProps) {
  const ctx = useContext(QuizContext);
  if (!ctx) return null;

  const childArray = Children.toArray(children);
  const choices: ReactElement[] = [];
  let feedback: ReactElement | null = null;
  const stem: ReactNode[] = [];

  for (const child of childArray) {
    if (isMarker(child, "Choice")) {
      choices.push(child);
      continue;
    }
    if (isMarker(child, "Feedback")) {
      feedback = child;
      continue;
    }
    stem.push(child);
  }

  const {
    questionNumber,
    selectedIndex,
    correctIndex,
    isCurrent,
    isExpanded,
    onSelect,
    onToggleExpand,
  } = ctx;

  const isAnswered = selectedIndex !== null;
  const isCorrect = isAnswered && selectedIndex === correctIndex;
  const statusLabel = isCorrect ? "✓ Correct" : "✗ Not quite";
  const statusColor = isCorrect ? "text-success" : "text-warning";

  // Past + collapsed → single-row clickable summary.
  if (!isCurrent && !isExpanded) {
    return (
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded="false"
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-widget-border bg-widget-bg px-4 py-2.5 text-left transition-colors hover:border-accent hover:bg-accent/5"
      >
        <span className="flex items-center gap-3">
          <span className="text-xs text-muted">▶</span>
          <span className="text-sm font-medium text-foreground">
            Question {questionNumber}
          </span>
        </span>
        <span className={`text-xs font-semibold ${statusColor}`}>
          {statusLabel}
        </span>
      </button>
    );
  }

  const body = (
    <>
      <div className="prose prose-lg max-w-none [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        <GlossaryPlainProvider>{stem}</GlossaryPlainProvider>
      </div>
      <ul className="mt-5 list-none space-y-2 p-0">
        {choices.map((choice, i) => {
          const cp = choice.props as ChoiceProps;
          const label = String.fromCharCode(65 + i);
          const isThisCorrect = i === correctIndex;
          const isThisPicked = i === selectedIndex;

          let buttonClass =
            "flex w-full items-center gap-3 rounded-lg border bg-widget-bg px-4 py-3 text-left text-sm text-foreground transition-colors";
          let badgeClass =
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold";

          if (!isAnswered) {
            buttonClass +=
              " border-widget-border cursor-pointer hover:border-accent hover:bg-accent/5";
            badgeClass += " border-widget-border text-muted";
          } else if (isThisCorrect) {
            buttonClass += " border-success bg-success/10";
            badgeClass += " border-success bg-success text-white";
          } else if (isThisPicked) {
            buttonClass += " border-error bg-error/10";
            badgeClass += " border-error bg-error text-white";
          } else {
            buttonClass += " border-widget-border opacity-50";
            badgeClass += " border-widget-border text-muted";
          }

          let badgeContent: ReactNode = label;
          if (isAnswered && isThisCorrect) badgeContent = "✓";
          else if (isAnswered && isThisPicked) badgeContent = "✗";

          return (
            <li key={i} className="m-0">
              <button
                type="button"
                onClick={() => !isAnswered && onSelect(i)}
                disabled={isAnswered}
                className={buttonClass}
                aria-pressed={isThisPicked}
              >
                <span className={badgeClass}>{badgeContent}</span>
                <span className="flex-1">
                  <GlossaryPlainProvider>{cp.children}</GlossaryPlainProvider>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {isAnswered && feedback && (
        <div
          className={`mt-5 rounded-lg border-l-4 p-4 ${
            isCorrect
              ? "border-success bg-success/5"
              : "border-warning bg-warning/5"
          }`}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-widest">
            <span className={statusColor}>{isCorrect ? "Correct" : "Not quite"}</span>
          </p>
          <div className="prose max-w-none [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
            {(feedback.props as FeedbackProps).children}
          </div>
        </div>
      )}
    </>
  );

  // Past + expanded → bordered card with collapsible header.
  if (!isCurrent) {
    return (
      <div className="overflow-hidden rounded-lg border border-widget-border">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded="true"
          className="flex w-full items-center justify-between gap-3 border-b border-widget-border bg-surface px-4 py-2.5 text-left transition-colors hover:bg-foreground/5"
        >
          <span className="flex items-center gap-3">
            <span className="text-xs text-muted">▼</span>
            <span className="text-sm font-medium text-foreground">
              Question {questionNumber}
            </span>
          </span>
          <span className={`text-xs font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
        </button>
        <div className="p-4">{body}</div>
      </div>
    );
  }

  // Current (active) question → plain inline rendering.
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
        Question {questionNumber}
      </p>
      {body}
    </div>
  );
}
