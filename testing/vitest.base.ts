import { defineConfig } from 'vitest/config';

// Shared vitest defaults for every package. Package configs import this and
// extend it via mergeConfig() where they need extra setup files or coverage rules.
export default defineConfig({
  // Resolve @rjsf/* workspace imports to TypeScript source via the custom
  // "source" export condition, so tests run against current code with no
  // prerequisite build. The custom name (rather than "development") keeps
  // consumers' dev servers on the published lib/ output.
  resolve: {
    conditions: ['@rjsf/source'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../testing/testSetup.ts'],
  },
});

// 100%-coverage gate shared by the packages that enforce it and mirrored
// (with root-relative paths) in the root vitest.config.ts.
export function fullCoverage(extraExclude: string[] = []) {
  return {
    enabled: true,
    reportsDirectory: 'coverage',
    include: ['src/**'],
    exclude: ['node_modules/**', 'test/**', '**/tsconfig.json', ...extraExclude],
    thresholds: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  };
}
