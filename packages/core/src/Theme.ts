import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { generateFields } from './components/fields/index.ts';
import type { CompleteThemeProps } from './components/Form.tsx';
import { generateTemplates } from './components/templates/index.ts';
import { generateWidgets } from './components/widgets/index.ts';

/** The core theme: every field, widget and template `@rjsf/core` implements */
export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): CompleteThemeProps<T, S, F> {
  return {
    fields: generateFields<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
    templates: generateTemplates<T, S, F>(),
  };
}

export default generateTheme();
