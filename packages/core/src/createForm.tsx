import type { ComponentType } from 'react';
import { useMemo } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { FormProps, CompleteThemeProps } from './components/Form.tsx';
import Form from './components/Form.tsx';

/** A Higher-Order component that creates a `Form` rendering with the theme's fields, widgets and templates. Props
 * passed to the returned component override the theme's entries of the same name; nothing else is merged in, so a
 * theme lists everything it renders with and only that reaches the bundle.
 * When storing the returned function component in React state, use `useState(() => createForm(theme))`.
 */
export default function createForm<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  themeProps: CompleteThemeProps<T, S, F>,
): ComponentType<FormProps<T, S, F>> {
  return function ThemedForm({
    fields: propFields,
    widgets: propWidgets,
    templates: propTemplates,
    ref,
    ...directProps
  }: FormProps<T, S, F>) {
    // The merged maps must keep their identity between renders: `Form` compares props and registry by reference
    // (shallowly), so a fresh object here would re-render every field on every parent render
    const fields = useMemo(() => ({ ...themeProps.fields, ...propFields }), [propFields]);
    const widgets = useMemo(() => ({ ...themeProps.widgets, ...propWidgets }), [propWidgets]);
    const templates = useMemo(
      () => ({
        ...themeProps.templates,
        ...propTemplates,
        ButtonTemplates: { ...themeProps.templates.ButtonTemplates, ...propTemplates?.ButtonTemplates },
      }),
      [propTemplates],
    );

    return (
      <Form<T, S, F>
        {...themeProps}
        {...directProps}
        fields={fields}
        widgets={widgets}
        templates={templates}
        ref={ref}
      />
    );
  };
}
