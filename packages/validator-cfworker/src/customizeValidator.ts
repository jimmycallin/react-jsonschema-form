import type { FormContextType, RJSFSchema, RJSFValidationError, StrictRJSFSchema } from '@rjsf/utils';

import type { CustomValidatorOptionsType } from './types.ts';
import CFWorkerValidator from './validator.ts';

/** Creates a customized cfworker-backed `ValidatorType` implementation. */
export default function customizeValidator<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
  E extends RJSFValidationError = RJSFValidationError,
>(options: CustomValidatorOptionsType = {}) {
  return new CFWorkerValidator<S, F, E>(options);
}
