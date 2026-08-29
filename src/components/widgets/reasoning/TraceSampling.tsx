"use client";

import { useState } from "react";
import { ChatMessage } from "@/components/widgets/shared/ChatMessage";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { attempts, check, correctAnswer, problem } from "./trainingAttempts";

export function TraceSampling() {
  const [attemptId, setAttemptId] = useState(attempts[0].id);
  const attempt = attempts.find((a) => a.id === attemptId) ?? attempts[0];

  return (
    <WidgetContainer
      title="How the working gets trained"
      description="The same problem, attempted three times. Only the final answer is checked."
      onReset={() => setAttemptId(attempts[0].id)}
    >
      <WidgetTabs
        tabs={attempts.map((a, i) => ({ id: a.id, label: `Attempt ${i + 1}` }))}
        activeTab={attemptId}
        onTabChange={setAttemptId}
      />

      <div className="space-y-3">
        <ChatMessage sender="Human" kind="human" hidden={false} text={problem} />
        <ChatMessage
          sender="Model, thinking"
          kind="model"
          hidden
          text={attempt.trace.join("\n")}
        />
        <ChatMessage
          sender="Model"
          kind="model"
          hidden={false}
          text={attempt.answer}
        />
      </div>

      <div
        className={`mt-5 overflow-hidden rounded-lg border-2 ${
          attempt.correct
            ? "border-success bg-success/10"
            : "border-error bg-error/10"
        }`}
      >
        <div
          className={`px-4 py-3 text-lg font-bold ${
            attempt.correct ? "text-success" : "text-error"
          }`}
        >
          <span aria-hidden className="mr-2">
            {attempt.correct ? "✓" : "✕"}
          </span>
          {attempt.correct ? "Correct" : "Wrong"}
          <span className="ml-2 text-base font-medium text-foreground">
            {attempt.correct
              ? `the answer is ${correctAnswer}`
              : `the answer should be ${correctAnswer}`}
          </span>
        </div>
        <p className="border-t border-widget-border/60 px-4 py-3 text-base leading-relaxed text-foreground">
          {attempt.note}
        </p>
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground">
        The checker never reads the thinking messages. It does one thing:{" "}
        {check} Finding the number takes a search, and checking it takes a
        moment, which is what makes this cheap enough to do millions of times.
      </p>
    </WidgetContainer>
  );
}
