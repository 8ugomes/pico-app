import type { NextConfig } from "next";

import { assertEnvironment } from './scripts/environment-guard.mjs';
assertEnvironment();

const nextConfig: NextConfig = {
  // Allows isolated verification builds without replacing the running dev app.
  distDir: process.env.PICO_BUILD_DIR || ".next",
};

export default nextConfig;
