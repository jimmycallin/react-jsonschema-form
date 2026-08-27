import { defineConfig } from 'vitest/config';

import { fullCoverage } from './testing/vitest.base';

export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts'],
    // Coverage must live at the root in projects mode (vitest ignores per-project
    // coverage there). This mirrors the packages that enforce 100% coverage in
    // their own configs for standalone runs — same gate, root-relative paths: a
    // 100% aggregate over the included files implies 100% for each package.
    coverage: {
      ...fullCoverage(),
      include: [
        'packages/utils/src/**',
        'packages/validator-ajv8/src/**',
        'packages/validator-ata/src/**',
        'packages/validator-cfworker/src/**',
      ],
      exclude: ['**/tsconfig.json', 'packages/validator-ata/src/types.ts', 'packages/validator-cfworker/src/types.ts'],
    },
  },
});
