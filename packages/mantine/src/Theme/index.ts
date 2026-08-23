import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema } from '@rjsf/utils';

import { generateTemplates } from '../templates/index.ts';
import { generateWidgets } from '../widgets/index.ts';

export function generateTheme<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
  };
}

export default generateTheme();
