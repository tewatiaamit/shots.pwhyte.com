import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Next doesn't pick up a parent-directory lockfile.
  turbopack: {
    root: __dirname,
  },
  // The age-verification popups push /age-verification into the URL client-side.
  // Serve the landing page there too so a refresh or direct hit doesn't 404.
  async rewrites() {
    return [{ source: "/age-verification", destination: "/" }];
  },
};

export default nextConfig;
