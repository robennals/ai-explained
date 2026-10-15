import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { execSync } from "child_process";
import { resolve } from "path";

function getGitBranch(): string {
  if (process.env.NODE_ENV === "production") return "main";
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "main";
  }
}

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  env: {
    NEXT_PUBLIC_GIT_BRANCH: getGitBranch(),
    // Exposes VERCEL_ENV to client code, which uses it to decide whether
    // Google Analytics is loaded (see src/lib/analytics.ts).
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
};

const withMDX = createMDX({
  options: {
    // Pass plugins as absolute path strings so Turbopack can serialize them
    // and the @next/mdx loader can require() them from its own location.
    remarkPlugins: [
      ["remark-frontmatter", ["yaml"]],
      [resolve(__dirname, "scripts/remark-glossary.cjs"), {}],
    ],
    rehypePlugins: [["rehype-slug", {}]],
  },
});

export default withMDX(nextConfig);
