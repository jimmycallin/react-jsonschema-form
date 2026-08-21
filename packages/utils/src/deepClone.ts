/** The inner recursion for `deepClone`, tracking already-cloned objects in `seen` so circular
 * references are preserved rather than looping forever
 */
function cloneInternal<T>(value: T, seen: Map<object, unknown>): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const existing = seen.get(value);
  if (existing !== undefined) {
    return existing as T;
  }
  if (Array.isArray(value)) {
    const clone: unknown[] = [];
    seen.set(value, clone);
    for (const item of value) {
      clone.push(cloneInternal(item, seen));
    }
    return clone as T;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    // A class instance or other exotic object: copy by reference, preserving its prototype and
    // behavior (e.g. Date, File, or a Luxon DateTime that a custom widget stored in the form data)
    return value;
  }
  const clone: Record<string, unknown> = {};
  seen.set(value, clone);
  for (const [key, item] of Object.entries(value)) {
    clone[key] = cloneInternal(item, seen);
  }
  return clone as T;
}

/** Deeply clones form data: plain objects and arrays are cloned recursively, while everything else —
 * functions, class instances, React elements — is copied by reference. Unlike `structuredClone`,
 * this never throws on such values and never strips their prototypes, which keeps cloning safe for
 * form data that custom widgets have populated with them. Circular references are preserved.
 *
 * @param value - The value to clone
 * @returns - A deep clone of `value`
 */
export default function deepClone<T>(value: T): T {
  return cloneInternal(value, new Map());
}
