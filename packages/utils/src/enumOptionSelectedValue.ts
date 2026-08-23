import enumOptionsIndexForValue from './enumOptionsIndexForValue';
import type { EnumOptionsType, OptionValueFormat, RJSFSchema } from './types';

/** Computes the value to pass to a select element's `value` attribute.
 *
 * When `format` is `'realValue'`, converts form data values to strings.
 * When `format` is `'indexed'` (the default), resolves to index-based values via
 * `enumOptionsIndexForValue`. Returns `emptyValue` when the current value is empty.
 *
 * @param value - The current form data value
 * @param enumOptions - The available enum options
 * @param multiple - Whether the select allows multiple selections
 * @param [format='indexed'] - How option values are encoded on the DOM
 * @param emptyValue - The value to return when the selection is empty
 * @returns The value to use for the select element's `value` attribute
 */
/** The value of an enum-backed select: a single option value or, for a multi-select, a list of them */
type SelectValue<S extends RJSFSchema> = EnumOptionsType<S>['value'] | EnumOptionsType<S>['value'][];

export default function enumOptionSelectedValue<S extends RJSFSchema = RJSFSchema>(
  value: SelectValue<S>,
  enumOptions: EnumOptionsType<S>[] | undefined,
  multiple: boolean,
  format: OptionValueFormat = 'indexed',
  emptyValue?: string | string[],
): string | string[] | undefined {
  const isEmpty =
    typeof value === 'undefined' ||
    (multiple && Array.isArray(value) && value.length < 1) ||
    (!multiple && value === emptyValue);

  if (isEmpty) {
    return emptyValue;
  }

  if (format === 'realValue') {
    return Array.isArray(value) ? value.map(String) : String(value);
  }

  const indexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  return typeof indexes === 'undefined' ? emptyValue : indexes;
}
