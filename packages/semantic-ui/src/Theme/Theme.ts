import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema } from '@rjsf/utils';
import { Form as SuiForm } from 'semantic-ui-react';

import { generateTemplates } from '../Templates';
import { generateWidgets } from '../Widgets';

export function generateTheme<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
    _internalFormWrapper: SuiForm,
  };
}

export default generateTheme();
