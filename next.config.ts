import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { execSync } from "child_process";

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
  },
};

const withMDX = createMDX({
  options: {},
});

export default withMDX(nextConfig);
