import type { FormContextType, RJSFSchema, StrictRJSFSchema, SchemaUtilsType } from '@rjsf/utils';

import BaseForm from './components/Form.tsx';
import type { FormProps } from './components/Form.tsx';
import getDefaultRegistry from './getDefaultRegistry.ts';

/** The core form includes the default fields, widgets and templates. */
export default class Form<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> extends BaseForm<T, S, F> {
  static getRegistry<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    props: FormProps<T, S, F>,
    schema: S,
    schemaUtils: SchemaUtilsType<T, S, F>,
  ) {
    const defaults = getDefaultRegistry<T, S, F>();
    return super.getRegistry<T, S, F>(
      {
        ...props,
        fields: { ...defaults.fields, ...props.fields },
        widgets: { ...defaults.widgets, ...props.widgets },
        templates: {
          ...defaults.templates,
          ...props.templates,
          ButtonTemplates: { ...defaults.templates.ButtonTemplates, ...props.templates?.ButtonTemplates },
        },
      },
      schema,
      schemaUtils,
    );
  }
}

/** Returns the core form with custom data, schema and context types. */
export function generateForm<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): typeof Form<T, S, F> {
  return Form<T, S, F>;
}
