import isPlainObject from 'lodash/isPlainObject';

import type { ErrorSchema, FormValidation, GenericObjectType } from './types';

/** Determines whether `value` is a nested `FormValidation` node (any plain object child qualifies)
 */
function isFormValidationNode<T>(value: unknown): value is FormValidation<T> {
  return isPlainObject(value);
}

/** Unwraps the `errorHandler` structure into the associated `ErrorSchema`, stripping the `addError()` functions from it
 *
 * @param errorHandler - The `FormValidation` error handling structure
 * @returns - The `ErrorSchema` resulting from the stripping of the `addError()` function
 */
export default function unwrapErrorHandler<T = unknown>(errorHandler: FormValidation<T>): ErrorSchema<T> {
  return Object.keys(errorHandler).reduce<ErrorSchema<T>>((acc, key) => {
    if (key === 'addError') {
      return acc;
    }
    const childSchema = (errorHandler as GenericObjectType)[key];
    if (isFormValidationNode<T>(childSchema)) {
      return {
        ...acc,
        [key]: unwrapErrorHandler(childSchema),
      };
    }
    return { ...acc, [key]: childSchema };
  }, {});
}
