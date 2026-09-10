import { execFileSync } from 'node:child_process';
import type { NextConfig } from "next";

import { assertEnvironment } from './scripts/environment-guard.mjs';
assertEnvironment();

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_PICO_VERSION: process.env.PICO_BUILD_VERSION || execFileSync('git', ['rev-parse','--short=12','HEAD'], {encoding:'utf8'}).trim() },
  async redirects() {
    return [{ source: '/:path*', has: [{ type: 'host', value: 'pico-internal.vercel.app' }], destination: 'https://pico-app-sepia.vercel.app/:path*', permanent: false }];
  },
  async headers() { return [{source:'/:path*',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'X-Content-Type-Options',value:'nosniff'}]}]; },
  // Allows isolated verification builds without replacing the running dev app.
  distDir: process.env.PICO_BUILD_DIR || ".next",
};

export default nextConfig;
