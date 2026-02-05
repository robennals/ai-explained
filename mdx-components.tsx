import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";
import { KeyInsight } from "@/components/mdx/KeyInsight";
import { TryIt } from "@/components/mdx/TryIt";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    KeyInsight,
    TryIt,
    ...components,
  };
}
