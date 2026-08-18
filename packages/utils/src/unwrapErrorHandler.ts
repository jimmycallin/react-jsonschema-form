import isObject from './isObject';
import type { ErrorSchema, FormValidation } from './types';

/** Unwraps the `errorHandler` structure into the associated `ErrorSchema`, stripping the `addError()` functions from it
 *
 * @param errorHandler - The `FormValidation` error handling structure
 * @returns - The `ErrorSchema` resulting from the stripping of the `addError()` function
 */
export default function unwrapErrorHandler<T = any>(errorHandler: FormValidation<T>): ErrorSchema<T> {
  return Object.keys(errorHandler).reduce<ErrorSchema<T>>((acc, key) => {
    if (key === 'addError') {
      return acc;
    }
    // `key` came from `errorHandler`, so it indexes it; `Object.keys()` just cannot say so in the type system
    const childHandler = errorHandler[key as keyof FormValidation<T>];
    if (isObject(childHandler)) {
      // `FormValidation<T>[K]` will not reduce while `T` is an unresolved type parameter, so the recursive arm of the
      // union it yields has to be named here. `isObject()` has already ruled out the `__errors` array arm.
      return { ...acc, [key]: unwrapErrorHandler(childHandler as FormValidation<T[keyof T]>) };
    }
    return { ...acc, [key]: childHandler };
  }, {});
}
