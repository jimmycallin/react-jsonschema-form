import { defineConfig } from 'vitest/config';

// Shared vitest defaults for every package. Package configs import this and
// extend it via mergeConfig() where they need extra setup files or coverage rules.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../testing/testSetup.ts'],
  },
});

// The packages that enforce the 100%-coverage gate, with per-package excludes.
// Single source of truth for both the package-local gate (fullCoverage, used by
// each package's own config for standalone runs) and the root-level gate
// (rootCoverage — required because vitest ignores per-project coverage in
// projects mode). A 100% aggregate over the included files implies 100% per
// package, so the two gates are equivalent.
const coverageGatedPackages: Record<string, string[]> = {
  utils: [],
  'validator-ajv8': [],
  'validator-ata': ['src/types.ts'],
  'validator-cfworker': ['src/types.ts'],
};

const fullThresholds = {
  branches: 100,
  functions: 100,
  lines: 100,
  statements: 100,
};

export function fullCoverage(pkg: keyof typeof coverageGatedPackages) {
  return {
    enabled: true,
    reportsDirectory: 'coverage',
    include: ['src/**'],
    exclude: ['node_modules/**', 'test/**', '**/tsconfig.json', ...coverageGatedPackages[pkg]],
    thresholds: fullThresholds,
  };
}

export function rootCoverage() {
  const entries = Object.entries(coverageGatedPackages);
  return {
    enabled: true,
    include: entries.map(([pkg]) => `packages/${pkg}/src/**`),
    exclude: ['**/tsconfig.json', ...entries.flatMap(([pkg, excludes]) => excludes.map((e) => `packages/${pkg}/${e}`))],
    thresholds: fullThresholds,
  };
}
