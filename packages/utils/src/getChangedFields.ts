import deepEquals from './deepEquals';

/** Determines whether a `value` can be compared field by field, i.e. it is a non-null object that is not an array.
 * Narrowing to an indexable type is what lets the comparison below read `value[key]` without an assertion.
 *
 * @param value - The value to check
 * @returns - True if the value can be compared field by field
 */
function isComparableObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Compares two objects and returns the names of the fields that have changed.
 * This function iterates over each field of object `a`, using `_.isEqual` to compare the field value
 * with the corresponding field value in object `b`. If the values are different, the field name will
 * be included in the returned array.
 *
 * @param a - The first object, representing the original data to compare.
 * @param b - The second object, representing the updated data to compare.
 * @returns - An array of field names that have changed.
 *
 * @example
 * const a = { name: 'John', age: 30 };
 * const b = { name: 'John', age: 31 };
 * const changedFields = getChangedFields(a, b);
 * console.log(changedFields); // Output: ['age']
 */
export default function getChangedFields(a: unknown, b: unknown): string[] {
  const aIsComparable = isComparableObject(a);
  const bIsComparable = isComparableObject(b);
  if (a === b) {
    return [];
  }
  if (aIsComparable && bIsComparable) {
    const aKeys = Object.keys(a);
    const unequalFields = aKeys.filter((key) => !deepEquals(a[key], b[key]));
    const diffFields = Object.keys(b).filter((key) => !aKeys.includes(key));
    return [...unequalFields, ...diffFields];
  }
  // Only one of them can be compared field by field, so every one of its fields counts as changed
  if (aIsComparable) {
    return Object.keys(a);
  }
  if (bIsComparable) {
    return Object.keys(b);
  }
  return [];
}
