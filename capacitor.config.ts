import type { CapacitorConfig } from '@capacitor/cli';

import { createNativeConfig } from './scripts/native-config.mjs';

const config = createNativeConfig(process.env) satisfies CapacitorConfig;

export default config;
