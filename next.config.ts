import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows isolated verification builds without replacing the running dev app.
  distDir: process.env.PICO_BUILD_DIR || ".next",
};

export default nextConfig;
