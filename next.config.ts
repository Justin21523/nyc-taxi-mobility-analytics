import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  serverExternalPackages: ["@duckdb/node-api"],
};

export default nextConfig;
