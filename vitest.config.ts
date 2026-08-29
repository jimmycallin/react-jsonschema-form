import { defineConfig } from 'vitest/config';

import { rootCoverage } from './testing/vitest.base';

export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts'],
    coverage: rootCoverage(),
  },
});
