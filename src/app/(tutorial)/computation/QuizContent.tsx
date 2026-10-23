"use client";

import QuizMDX from "./quiz.mdx";

// Wrapping the MDX in a client component keeps it entirely inside the client
// bundle. That way the MDX-created elements use the actual Choice/Feedback
// function identities (not RSC lazy proxies), so the Question component can
// classify its children by component type.
export function QuizContent() {
  return <QuizMDX />;
}
