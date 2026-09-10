import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { ThemeProps } from './components/Form.tsx';
import createForm from './createForm.tsx';
import { generateTheme } from './Theme.ts';

/** Creates a themed form by merging partial overrides over the core theme.
 * Returns a plain function component. When storing it in React state, use a lazy initializer:
 * `useState(() => withTheme(theme))`.
 */
export default function withTheme<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  theme: ThemeProps<T, S, F>,
) {
  const defaults = generateTheme<T, S, F>();
  return createForm<T, S, F>({
    ...theme,
    fields: { ...defaults.fields, ...theme.fields },
    widgets: { ...defaults.widgets, ...theme.widgets },
    templates: {
      ...defaults.templates,
      ...theme.templates,
      ButtonTemplates: { ...defaults.templates.ButtonTemplates, ...theme.templates?.ButtonTemplates },
    },
  });
}
