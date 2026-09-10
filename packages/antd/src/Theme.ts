import type { CompleteThemeProps } from '@rjsf/core';
import { generateFields } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { generateTemplates } from './templates/index.ts';
import { generateWidgets } from './widgets/index.ts';

export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): CompleteThemeProps<T, S, F> {
  return {
    fields: generateFields<T, S, F>(),
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
  };
}

export default generateTheme();
