import isPlainObject from 'lodash/isPlainObject';

import { ERRORS_KEY } from './constants';
import type { ErrorSchema, GenericObjectType, RJSFValidationError } from './types';

/** Determines whether `value` is a nested `ErrorSchema` node (any plain object child qualifies)
 */
function isErrorSchemaNode<T>(value: unknown): value is ErrorSchema<T> {
  return isPlainObject(value);
}

/** Converts an `errorSchema` into a list of `RJSFValidationErrors`
 *
 * @param errorSchema - The `ErrorSchema` instance to convert
 * @param [fieldPath=[]] - The current field path, defaults to [] if not specified
 * @returns - The list of `RJSFValidationErrors` extracted from the `errorSchema`
 */
export default function toErrorList<T = unknown>(
  errorSchema?: ErrorSchema<T>,
  fieldPath: string[] = [],
): RJSFValidationError[] {
  if (!errorSchema) {
    return [];
  }
  let errorList: RJSFValidationError[] = [];
  if (ERRORS_KEY in errorSchema) {
    errorList = errorList.concat(
      errorSchema[ERRORS_KEY]!.map((message: string) => {
        const property = `.${fieldPath.join('.')}`;
        return {
          property,
          message,
          stack: `${property} ${message}`,
        };
      }),
    );
  }
  return Object.keys(errorSchema).reduce((currentList, key) => {
    if (key !== ERRORS_KEY) {
      const childSchema = (errorSchema as GenericObjectType)[key];
      if (isErrorSchemaNode<T>(childSchema)) {
        return currentList.concat(toErrorList(childSchema, [...fieldPath, key]));
      }
    }
    return currentList;
  }, errorList);
}
