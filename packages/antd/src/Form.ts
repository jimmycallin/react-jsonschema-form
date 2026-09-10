import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import { createForm } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { generateTheme } from './Theme.ts';

export function generateForm<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): ComponentType<FormProps<T, S, F>> {
  return createForm<T, S, F>(generateTheme<T, S, F>());
}

export default generateForm();
