import deepEquals from './deepEquals';
import isPlainObject from './isPlainObject';
import { getByPath } from './pathUtils';
import type { GenericObjectType } from './types';

/**
 * Compares two objects and returns the names of the fields that have changed.
 * This function iterates over each field of object `a`, using `deepEquals` to compare the field value
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
  const aIsPlainObject = isPlainObject(a);
  const bIsPlainObject = isPlainObject(b);
  // If strictly equal or neither of them is a plainObject returns an empty array
  if (a === b || (!aIsPlainObject && !bIsPlainObject)) {
    return [];
  }
  if (aIsPlainObject && !bIsPlainObject) {
    return Object.keys(a as object);
  }
  if (!aIsPlainObject && bIsPlainObject) {
    return Object.keys(b as object);
  }
  const aKeys = Object.keys(a as object);
  const aKeySet = new Set(aKeys);
  const unequalFields = aKeys.filter((key) => !deepEquals((a as GenericObjectType)[key], getByPath(b, key)));
  const diffFields = Object.keys(b as object).filter((key) => !aKeySet.has(key));
  return [...unequalFields, ...diffFields];
}
