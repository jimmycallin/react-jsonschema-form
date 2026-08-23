import isObject from './isObject';
import type { FormContextType, RJSFSchema, UiSchema } from './types';

/** Determines whether `value` is a `UiSchema`. Because a `UiSchema` supports arbitrary user-defined keys, reading a
 * nested uiSchema out of a parent one (or out of a `formContext`) yields an `unknown`; anything that is not an object
 * cannot be a uiSchema, so this guard is how such a value is narrowed before use.
 *
 * @param value - The value to check to see whether it is a `UiSchema`
 * @returns - True if `value` is a non-null, non-array, non-File object
 */
export default function isUiSchema<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(value: unknown): value is UiSchema<T, S, F> {
  return isObject(value);
}
