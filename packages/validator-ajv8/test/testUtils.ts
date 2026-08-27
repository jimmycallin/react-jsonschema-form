import { noop } from '@rjsf/utils';

/** Runs `fn` with console.warn stubbed, asserts it warned with `expectedWarning`, and returns the result. */
export function expectWarn<T>(fn: () => T, ...expectedWarning: unknown[]): T {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
  try {
    const result = fn();
    expect(warnSpy).toHaveBeenCalledWith(...expectedWarning);
    return result;
  } finally {
    warnSpy.mockRestore();
  }
}
