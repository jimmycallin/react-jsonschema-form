import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import type { FormContextType, RJSFSchema } from '@rjsf/utils';

import { generateTheme } from '../Theme';

export function generateForm<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ComponentType<FormProps<T, S, F>> {
  return withTheme<T, S, F>(generateTheme<T, S, F>());
}

export default generateForm();
