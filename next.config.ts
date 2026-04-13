import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  // Bake CF_BUILD into the bundle at build time so the blog repository factory
  // in src/lib/blog.ts can tree-shake the unused implementation. When CF_BUILD
  // is 'true' (set by the cf:* scripts), the manifest-based repository is used
  // and the fs-based one is eliminated from the Worker bundle entirely.
  env: {
    CF_BUILD: process.env.CF_BUILD ?? '',
  },
};

export default nextConfig;
