import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "");
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  serverExternalPackages: ["@duckdb/node-api", "@duckdb/node-bindings"],
  ...(isGitHubPages ? { output: "export" as const, images: { unoptimized: true } } : {}),
};

export default nextConfig;
