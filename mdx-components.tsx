import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";
import { KeyInsight } from "@/components/mdx/KeyInsight";
import { Lead } from "@/components/mdx/Lead";
import { TensorDisplay } from "@/components/mdx/TensorDisplay";
import { TryIt } from "@/components/mdx/TryIt";
import { TryItInPyTorch } from "@/components/mdx/TryItInPyTorch";
import { Choice, Feedback, Question, Quiz } from "@/components/quiz/Quiz";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    KeyInsight,
    Lead,
    TensorDisplay,
    TryIt,
    TryItInPyTorch,
    Quiz,
    Question,
    Choice,
    Feedback,
    ...components,
  };
}
