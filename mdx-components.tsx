import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";
import { KeyInsight } from "@/components/mdx/KeyInsight";
import { Lead } from "@/components/mdx/Lead";
import { TryIt } from "@/components/mdx/TryIt";
import { TryItInPyTorch } from "@/components/mdx/TryItInPyTorch";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    KeyInsight,
    Lead,
    TryIt,
    TryItInPyTorch,
    ...components,
  };
}
