# TypeScript setup migration specification

## Status

Proposed and approved for implementation.

## Objective

Modernize the TypeScript build so that published ESM is checked using Node's module rules, emitted relative imports are valid without post-processing, and the project-reference graph is smaller and easier to understand.

The migration must:

- remove `tsc-alias` and its custom replacers;
- author relative TypeScript imports with their real `.ts` or `.tsx` extensions;
- use TypeScript's `rewriteRelativeImportExtensions` when emitting JavaScript and declarations;
- retain Node 20 compatibility for the current release line;
- prepare `.ts` build scripts for native Node type stripping after the Node 20 support floor is dropped;
- replace package-level solution/build/source config chains with one source config and one test config per published package;
- preserve the current ESM, CommonJS, and UMD package outputs and public APIs.

## Decisions

### Source import style

All relative imports, exports, literal dynamic imports, and relative import types in TypeScript files must name the actual source file:

```ts
import createAjvInstance from './createAjvInstance.ts';
import Form from './components/Form.tsx';
export * from './widgets/index.ts';
```

Do not use output-oriented `.js` extensions in TypeScript source. Do not leave relative specifiers extensionless.

Directory imports must name the index file explicitly:

```ts
// Before
import { CONST_KEY } from './';
import Widgets from './widgets';

// After
import { CONST_KEY } from './index.ts';
import Widgets from './widgets/index.ts';
```

`rewriteRelativeImportExtensions` must produce `.js` specifiers in emitted `.js` and `.d.ts` files. With `jsx: "react-jsx"`, imports of `.tsx` sources must also be emitted as `.js`.

This is intentional future-proofing. Native Node type stripping requires exact `.ts` extensions and does not perform extension or directory-index searching. Using `.js` in source now would require a second repository-wide migration before native execution of `.ts` files.

### Module mode

While the repository supports Node 20, emitted library projects must use:

```jsonc
{
  "compilerOptions": {
    "module": "node20",
    "target": "ES2018",
    "rewriteRelativeImportExtensions": true,
    "verbatimModuleSyntax": true,
  },
}
```

Do not set `moduleResolution` separately; `module: "node20"` selects the corresponding Node resolution behavior.

Keep `target` explicit. Do not accidentally adopt the implied `esnext` target when the repository later switches to `module: "nodenext"`.

When Node 20 support is dropped, changing `module` from `node20` to `nodenext` is a follow-up configuration change. It must not require another source-import migration.

Vite applications are exceptions. The playground should retain `module: "ESNext"` and `moduleResolution: "bundler"`, because its emitted/runtime module graph is owned by Vite. Docusaurus should retain its framework-provided configuration. Published unbundled libraries must not use bundler resolution.

### Native type stripping

Native Node execution is a future goal for `.ts` build scripts, not for React `.tsx` source. Node does not support `.tsx` through native type stripping.

Do not remove `tsx` while Node 20 is supported. Its only direct CLI use currently is `packages/shadcn/build-css.ts`. After the minimum Node version has native type stripping, replace:

```json
"build:css": "tsx build-css.ts"
```

with:

```json
"build:css": "node build-css.ts"
```

and remove the root `tsx` dependency if no new uses have been introduced.

Native stripping was enabled by default in Node 22.18 but was formally marked stable in Node 24.12 and 25.2. If stable support is required, use Node 24.12 or newer as the future minimum.

`erasableSyntaxOnly` is not required for the initial build migration. Before native execution is declared supported broadly, enable it for the relevant config and replace the currently non-erasable enums:

- `TranslatableString` in `packages/utils/src/enums.ts`;
- `AdditionalItemsHandling` in `packages/utils/src/schema/getDefaultFormState.ts`;
- `GridType` in `packages/core/src/components/fields/LayoutGridField.tsx`;
- `Operators` in `packages/core/src/components/fields/LayoutGridField.tsx`.

`verbatimModuleSyntax` is required now so that imports used as types are explicitly written with `import type` or inline `type` modifiers, matching native stripping semantics.

## Target configuration topology

### Root configs

Keep:

- `tsconfig.base.json`: shared compiler options for TypeScript library projects;
- `tsconfig.json`: source/build solution that references actual leaf projects.

Delete:

- root `tsconfig.build.json`.

The root solution must have `files: []`, list each intended leaf project exactly once, and include all packages currently omitted accidentally. In particular, remove the duplicate `snapshot-tests` reference and ensure `mantine`, `primereact`, `validator-ata`, and `validator-cfworker` are represented directly rather than only appearing transitively through the playground.

The root solution should reference source/build projects, not package test projects. If a single root test-typecheck entry point is desired, add a dedicated solution such as `tsconfig.test.json` that references the existing test configs. Do not reintroduce package-level solution wrappers merely to aggregate source and tests.

### Published library packages

For each of these packages:

- `antd`
- `chakra-ui`
- `core`
- `daisyui`
- `fluentui-rc`
- `mantine`
- `mui`
- `primereact`
- `react-bootstrap`
- `semantic-ui`
- `shadcn`
- `utils`
- `validator-ajv8`
- `validator-ata`
- `validator-cfworker`

replace the current package/source/build chain with:

```text
packages/<name>/
├── tsconfig.json       # actual source emit project
└── test/tsconfig.json  # test project
```

The package `tsconfig.json` must:

- extend `../../tsconfig.base.json`;
- include only `src`;
- set `rootDir` to `src` and `outDir` to `lib`;
- be the composite project referenced by dependent packages;
- declare only its direct package dependencies in `references`;
- retain genuine package-specific options such as Node types or documented `skipLibCheck` exceptions.

Conceptual example:

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"],
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib",
  },
  "references": [{ "path": "../utils" }, { "path": "../validator-ajv8" }],
}
```

Delete each package's:

- `src/tsconfig.json`;
- `tsconfig.build.json`.

Update test references from `../src` to `..`, because the package root config becomes the source leaf project. Preserve the special `utils/test` emitted helper project and the validator test references to it until that arrangement is redesigned separately.

Normalize `daisyui`, whose package and test configs currently differ structurally from the other libraries.

`snapshot-tests` already has a single source config and does not need the same collapse. It must use the shared Node-oriented settings and should add `"type": "module"` to its `package.json`, because it emits and publishes ESM `.js` files.

### Shared compiler options

Merge the meaningful settings from the current base and build configs into `tsconfig.base.json`. The result should have one deliberate value for each option across emitted libraries.

At minimum it should contain:

```jsonc
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2018",
    "module": "node20",
    "lib": ["DOM", "ESNext"],
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "rewriteRelativeImportExtensions": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
  },
}
```

Notes:

- `strict` already enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, `noImplicitThis`, and `alwaysStrict`; do not repeat them.
- Remove `allowJs`; no emitted package currently contains JavaScript under `src`.
- Remove redundant `allowSyntheticDefaultImports` and `esModuleInterop` unless a verified package-specific interop workaround requires them. Node module modes imply the relevant interop checking.
- Retain `noUnusedParameters: false` only as a narrow package override where existing source requires it, rather than weakening all packages.
- Keep `lib: ["DOM", "ESNext"]` during this migration to avoid combining module-system work with an API/runtime-baseline change. Reconciling `lib` with the ES2018 target is a separate follow-up.
- Keep test-only settings such as `types: ["vitest/globals", "node"]`, `resolveJsonModule`, and `noEmit` in test configs rather than the library base.

## Import migration

Use an AST-aware codemod or TypeScript module resolution, not a blind regular expression.

For every relative specifier in package TypeScript source and tests:

1. If it resolves to `name.ts`, write `name.ts`.
2. If it resolves to `name.tsx`, write `name.tsx`.
3. If it resolves to `name/index.ts`, write `name/index.ts`.
4. If it resolves to `name/index.tsx`, write `name/index.tsx`.
5. Preserve already explicit non-TypeScript assets such as `.json`, `.css`, images, and declarations for arbitrary assets.
6. Do not add TypeScript extensions to bare package specifiers.
7. Update static imports, exports, type-only imports/exports, literal `import()` expressions, and literal import types.
8. Audit computed dynamic imports separately; TypeScript cannot safely rewrite arbitrary computed strings.

The current repository contains roughly 1,631 affected lines under package `src` directories and another 457 under package tests. Treat this as a mechanical migration and review the codemod's unresolved/ambiguous report manually.

## Removing `tsc-alias`

All 15 published library `build:ts` scripts should build their package-root config directly, for example:

```json
"build:ts": "rimraf ./lib && tsc -b ."
```

Use a consistent clean build across packages unless an existing incremental-build requirement is documented.

Remove:

- every `tsc-alias` invocation;
- the root `tsc-alias` dev dependency;
- the `tsc-alias` blocks in package configs;
- `packages/antd/tsconfig.replacer.json`;
- `packages/validator-ajv8/tsconfig.replacer.json`;
- the `compileReplacer` package scripts;
- the `tsc-alias-replacer/` directory;
- generated replacer `.cjs` files, if present;
- `move-file-cli`, provided a final repository search confirms it has no other use.

### Former custom-replacer cases

The AJV replacer must become an explicit source import:

```ts
import standaloneCode from 'ajv/dist/standalone/index.js';
```

This remains `.js`, not `.ts`, because it targets JavaScript in an external package and `rewriteRelativeImportExtensions` intentionally does not rewrite bare package specifiers.

The Ant Design icons replacer currently appears stale because source imports `@ant-design/icons` through its package export. Remove the replacer. If direct icon subpath imports are present by implementation time, use the subpaths exported by the installed package rather than rewriting emitted strings.

Node-oriented checking currently also rejects this directory subpath:

```ts
import type { DefaultOptionType } from 'antd/es/select';
```

Change it to the explicit entrypoint supported by the installed package, expected to be:

```ts
import type { DefaultOptionType } from 'antd/es/select/index.js';
```

Verify this against the installed Ant Design version and its package metadata.

## AJV CommonJS declaration interop

Switching `validator-ajv8` from bundler resolution to Node module checking exposes existing interop errors for `ajv` and `ajv-formats`: default imports are seen as module namespaces rather than constructable/callable values.

The implementation must resolve these errors explicitly. Acceptable approaches include a small typed compatibility module local to `validator-ajv8` or narrowly scoped imports/casts that model the actual CommonJS runtime exports. Requirements:

- no global weakening of strictness;
- no `any` added to the public validator API merely to silence resolution errors;
- preserve support for a caller-provided `AjvClass`;
- preserve the runtime behavior of `new Ajv(...)`, `addFormats(...)`, and standalone-code generation;
- add or retain runtime tests covering the ESM package output under Node;
- do not restore post-emit string rewriting.

The build is not considered complete while Node-oriented type checking reports these interop errors, even if the current emitted JS happens to run.

## Package scripts and project references

Update package references so that source builds depend only on dependency source builds. For example, building `core` must build `utils`, `validator-ajv8`, and `core`; it must not pull `utils/test` or `validator-ajv8/test` into the graph.

After restructuring, verify with:

```sh
tsc -b packages/core --dry --verbose
```

The listed graph must not contain dependency test projects.

Review package-specific typecheck scripts after `tsconfig.json` changes. In particular, ensure the `chakra-ui` and `validator-cfworker` scripts still check their intended scope rather than silently changing from source-plus-tests to source-only or vice versa.

## Validation

Run validation from a clean checkout state, not against stale `lib`, `dist`, or build-info output.

Required checks:

1. Install succeeds with the updated lockfile.
2. Formatting and linting pass.
3. Every published package's TypeScript build passes.
4. The full Nx build passes from clean output directories.
5. The full test suite passes.
6. `knip` passes and reports no removed-tool remnants.
7. A repository search finds no `tsc-alias`, replacer config, or `compileReplacer` usage outside historical changelog text.
8. A repository search finds no extensionless relative TypeScript import/export specifiers in active source, tests, configs, or build scripts.
9. Emitted `lib/**/*.js` relative imports end in `.js` and resolve to existing emitted files.
10. Emitted `lib/**/*.d.ts` relative imports end in `.js` and resolve through TypeScript extension substitution to existing declarations.
11. Node can import each package's public ESM entrypoint from its built output.
12. Node can require each package's public CommonJS entrypoint.
13. Existing esbuild ESM/CJS bundles and Rollup UMD bundles are still generated at the paths declared by package metadata.
14. Test at least one representative consumer using `module: "node20"` and one using `moduleResolution: "bundler"` against packed package tarballs.
15. `git status` contains no generated replacer files, unexpected build-info files, or package-manager store directories.

Recommended commands, adjusted to the package manager environment as necessary:

```sh
pnpm run format-check
pnpm run lint
pnpm run knip
pnpm run clean-build
pnpm run test
```

Do not rely only on `pnpm run build`: the current Nx graph and package scripts do not by themselves prove that every declaration can be consumed under Node module resolution.

## Acceptance criteria

The migration is complete when all of the following are true:

- no build or config depends on `tsc-alias`;
- all active relative TypeScript specifiers use actual `.ts`/`.tsx` source extensions and explicit index filenames;
- emitted ESM and declaration specifiers use `.js` without a post-processing step;
- published library source projects use Node 20 module semantics;
- Vite/Docusaurus projects retain tool-appropriate module resolution;
- each published library has one source config at its package root and one test config, with documented exceptions only;
- source dependency builds no longer pull dependency test projects into their project-reference graph;
- `core` and all other emitted libraries share the same deliberate target/build options except documented package overrides;
- AJV and external package subpath imports pass Node-oriented type checking and runtime smoke tests;
- all existing build formats, exports, tests, linting, formatting, and package-consumer checks pass;
- the repository is ready to switch from `module: "node20"` to `module: "nodenext"` later without changing relative imports.

## Out of scope

- Dropping Node 20 in this migration.
- Removing `tsx` before the Node minimum supports native stripping.
- Native execution of `.tsx` React source.
- Publishing raw TypeScript for execution from `node_modules`; Node intentionally refuses type stripping there.
- Replacing esbuild or Rollup, redesigning dual ESM/CJS output, or changing package export paths.
- Changing the browser/API compatibility baseline implied by `target` and `lib`.
- Redesigning the shared validator test-helper package beyond preserving its current behavior.

## References

- [Node.js: Modules — TypeScript](https://nodejs.org/api/typescript.html)
- [TypeScript 5.7: Path rewriting for relative paths](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html#path-rewriting-for-relative-paths)
- [TypeScript 5.9: `--module node20`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html#support-for---module-node20)
- [TypeScript: Choosing compiler options for libraries](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options)
- [TypeScript: Project references](https://www.typescriptlang.org/docs/handbook/project-references)
