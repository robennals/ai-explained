"use client";

import QuizMDX from "./quiz.mdx";

// Client wrapper so MDX-created Choice/Feedback elements use the real
// component identities (not RSC lazy proxies). See Quiz.tsx for context.
export function QuizContent() {
  return <QuizMDX />;
}
