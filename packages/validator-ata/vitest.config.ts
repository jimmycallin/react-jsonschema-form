import { mergeConfig } from 'vitest/config';

import base from '../../testing/vitest.base';

export default mergeConfig(base, {
  test: {
    coverage: {
      enabled: true,
      reportsDirectory: 'coverage',
      include: ['src/**'],
      exclude: ['node_modules/**', 'test/**', 'src/types.ts', '**/tsconfig.json'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
