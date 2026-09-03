// Loads every published package's public entrypoint with Node, both as ESM and as CommonJS.
//
// `pnpm run build` proves TypeScript and the bundlers produced files; it does not prove Node can
// resolve what those files import, and the test suite runs under Vitest, which resolves like a
// bundler. Node's ESM resolver has no extension search and no directory index lookup, so an emitted
// `./foo` or `pkg/subdir` specifier that every bundler accepts still fails at runtime.
//
// Entries in KNOWN_FAILURES are expected to fail and do not fail this check. A known failure that
// starts loading is also reported, so the list cannot rot.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const probeDir = path.join(repoRoot, 'node_modules', '.rjsf-entrypoint-check');

/** Entrypoints Node cannot load today, each with the reason. Keyed as `<package> <esm|cjs>`. */
const KNOWN_FAILURES = {
  '@rjsf/chakra-ui cjs':
    '@emotion/weak-memoize interop in the esbuild CJS bundle: `import_weak_memoize.default` is not a function',
  '@rjsf/daisyui esm': 'react-day-picker imports a raw .css file, which Node cannot load',
  '@rjsf/daisyui cjs': 'react-day-picker imports a raw .css file, which Node cannot load',
  '@rjsf/fluentui-rc esm': '@fluentui/react-icons imports its own extensionless "./icons/chunk-0"',
  '@rjsf/primereact esm':
    'our lib imports the directory subpath `primereact/button`; primereact has no exports map, so ' +
    'each subpath is a directory with a nested package.json that only bundlers read, and picking ' +
    'button.esm.js or button.cjs.js would break the other consumption mode',
};

const packages = fs
  .readdirSync(path.join(repoRoot, 'packages'))
  .map((dir) => ({ dir, manifest: path.join(repoRoot, 'packages', dir, 'package.json') }))
  .filter(({ manifest }) => fs.existsSync(manifest))
  .map(({ dir, manifest }) => ({ dir, pkg: JSON.parse(fs.readFileSync(manifest, 'utf8')) }))
  .filter(({ pkg }) => pkg.exports && !pkg.private)
  .map(({ dir, pkg }) => ({ dir, name: pkg.name }))
  // @rjsf/snapshot-tests is only ever imported from inside a vitest run; it touches `vi` at module
  // scope, so plain Node is not a context it is meant to load in.
  .filter(({ name }) => name !== '@rjsf/snapshot-tests');

// Node resolves bare specifiers upward from the importing file, so give the probe a node_modules
// tree mapping each package name to its workspace directory. Symlinks resolve to their real path,
// so each package's own dependencies still resolve from the pnpm store as usual.
fs.rmSync(probeDir, { recursive: true, force: true });
const scope = path.join(probeDir, 'node_modules', '@rjsf');
fs.mkdirSync(scope, { recursive: true });
for (const { dir, name } of packages) {
  fs.symlinkSync(path.join(repoRoot, 'packages', dir), path.join(scope, name.split('/')[1]), 'dir');
}
fs.writeFileSync(path.join(probeDir, 'package.json'), '{"type":"module"}\n');
fs.writeFileSync(
  path.join(probeDir, 'probe.mjs'),
  `import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const names = ${JSON.stringify(packages.map((p) => p.name))};
const results = [];
for (const name of names) {
  for (const mode of ['esm', 'cjs']) {
    let error = null;
    try {
      const mod = mode === 'esm' ? await import(name) : require(name);
      if (Object.keys(mod).length === 0) { error = 'loaded but exported nothing'; }
    } catch (e) { error = String(e && e.message).split('\\n')[0]; }
    results.push({ key: name + ' ' + mode, error });
  }
}
process.stdout.write(JSON.stringify(results));
`,
);

let results;
try {
  const out = execFileSync(process.execPath, [path.join(probeDir, 'probe.mjs')], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  results = JSON.parse(out.trim().split('\n').pop());
} finally {
  fs.rmSync(probeDir, { recursive: true, force: true });
}

const out = (line) => process.stdout.write(`${line}\n`);
const err = (line) => process.stderr.write(`${line}\n`);

const unexpectedFailures = results.filter((r) => r.error && !(r.key in KNOWN_FAILURES));
const unexpectedPasses = results.filter((r) => !r.error && r.key in KNOWN_FAILURES);

for (const r of results) {
  const known = r.key in KNOWN_FAILURES;
  if (!r.error) {
    out(`${known ? 'PASS?' : 'ok   '} ${r.key}`);
  } else {
    out(`${known ? 'known' : 'FAIL '} ${r.key}: ${r.error}`);
  }
}
if (unexpectedFailures.length) {
  err(`\n${unexpectedFailures.length} entrypoint(s) Node cannot load:`);
  for (const r of unexpectedFailures) {
    err(`  ${r.key}: ${r.error}`);
  }
}
if (unexpectedPasses.length) {
  err(`\n${unexpectedPasses.length} known failure(s) now load; remove from KNOWN_FAILURES:`);
  for (const r of unexpectedPasses) {
    err(`  ${r.key}`);
  }
}
process.exit(unexpectedFailures.length + unexpectedPasses.length ? 1 : 0);
