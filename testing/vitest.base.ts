import { defineConfig } from 'vitest/config';

// Shared vitest defaults for every package. Package configs import this and
// extend it via mergeConfig() where they need extra setup files or coverage rules.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../testing/testSetup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
