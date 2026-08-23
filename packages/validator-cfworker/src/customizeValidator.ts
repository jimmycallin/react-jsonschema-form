import type { FormContextType, RJSFSchema } from '@rjsf/utils';

import type { CustomValidatorOptionsType } from './types';
import CFWorkerValidator from './validator';

/** Creates a customized cfworker-backed `ValidatorType` implementation. */
export default function customizeValidator<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(options: CustomValidatorOptionsType = {}) {
  return new CFWorkerValidator<T, S, F>(options);
}
