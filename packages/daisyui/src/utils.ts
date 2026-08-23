import type { FormContextType, RJSFSchema, UiSchema } from '@rjsf/utils';

import type { DaisyProps } from './types/DaisyProps.ts';

export interface DaisyUiSchema<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends Omit<UiSchema<T, S, F>, 'ui:options'> {
  'ui:options'?: DaisyUiOptions<T, S, F>;
}

type DaisyUiOptions<T, S extends RJSFSchema, F extends FormContextType> = UiSchema<T, S, F>['ui:options'] & {
  daisy?: DaisyProps;
};

interface GetDaisyProps<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType> {
  uiSchema?: DaisyUiSchema<T, S, F>;
}

export function getDaisy<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>({
  uiSchema = {},
}: GetDaisyProps<T, S, F>): DaisyProps {
  const daisyProps = uiSchema['ui:options']?.daisy || {};
  return daisyProps;
}
