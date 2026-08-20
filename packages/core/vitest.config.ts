import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve self-references (e.g. from @rjsf/snapshot-tests) to the source instead of the dist
      // build, so the tests and the code under test share a single module instance
      '@rjsf/core': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/testSetup.ts', '../../testing/testSetup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
