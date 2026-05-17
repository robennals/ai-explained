import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/Callout";
import { G } from "@/components/mdx/G";
import { KeyInsight } from "@/components/mdx/KeyInsight";
import { Lead } from "@/components/mdx/Lead";
import { NoG } from "@/components/mdx/NoG";
import { TensorDisplay } from "@/components/mdx/TensorDisplay";
import { TryIt } from "@/components/mdx/TryIt";
import { TryItInPyTorch } from "@/components/mdx/TryItInPyTorch";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    G,
    g: G,
    KeyInsight,
    Lead,
    NoG,
    nog: NoG,
    TensorDisplay,
    TryIt,
    TryItInPyTorch,
    ...components,
  };
}
