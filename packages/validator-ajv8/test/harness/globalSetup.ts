import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Vitest globalSetup: regenerates the gitignored superSchema*.cjs harness files
 * before this package's tests run, no matter how vitest was invoked (root run,
 * package run, --project filter, watch mode, IDE runner). Runs the script in a
 * subprocess because globalSetup module resolution does not apply the project's
 * resolve.conditions, so it cannot import @rjsf/utils source directly.
 */
export default function setup() {
  execFileSync('pnpm', ['run', 'compileSchemas'], {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    stdio: 'inherit',
  });
}
