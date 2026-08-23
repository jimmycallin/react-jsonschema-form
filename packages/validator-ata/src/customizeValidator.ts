import type { FormContextType, RJSFSchema } from '@rjsf/utils';

import type { CustomValidatorOptionsType, Localizer } from './types';
import ATAValidator from './validator';

/** Build an `ATAValidator` instance, optionally customized with format
 * checkers, validator overrides, an extender hook, or a localizer. Mirrors
 * `@rjsf/validator-ajv8`'s `customizeValidator`.
 */
export default function customizeValidator<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(options: CustomValidatorOptionsType = {}, localizer?: Localizer) {
  return new ATAValidator<T, S, F>(options, localizer);
}
