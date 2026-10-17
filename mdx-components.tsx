import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";
import { Ch } from "@/components/mdx/Ch";
import { G } from "@/components/mdx/G";
import { KeyInsight } from "@/components/mdx/KeyInsight";
import { NoG } from "@/components/mdx/NoG";
import { TensorDisplay } from "@/components/mdx/TensorDisplay";
import { TryIt } from "@/components/mdx/TryIt";
import { TryItInPyTorch } from "@/components/mdx/TryItInPyTorch";
import { Choice, Feedback, Question, Quiz } from "@/components/quiz/Quiz";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    Ch,
    G,
    g: G,
    KeyInsight,
    NoG,
    nog: NoG,
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
