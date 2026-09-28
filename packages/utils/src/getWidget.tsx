import getSchemaType from './getSchemaType.ts';
import type { FormContextType, RJSFSchema, Widget, RegistryWidgetsType, StrictRJSFSchema } from './types.ts';

/** The map of schema types to widget type to widget name. `as const` so its keys and values stay literal types,
 * letting `WidgetAliasFor` derive a per-type alias union from it directly instead of a hand-copied one that can
 * drift out of sync.
 */
const widgetMap = {
  boolean: {
    checkbox: 'CheckboxWidget',
    radio: 'RadioWidget',
    select: 'SelectWidget',
    hidden: 'HiddenWidget',
  },
  string: {
    text: 'TextWidget',
    password: 'PasswordWidget',
    email: 'EmailWidget',
    hostname: 'TextWidget',
    ipv4: 'TextWidget',
    ipv6: 'TextWidget',
    uri: 'URLWidget',
    'data-url': 'FileWidget',
    radio: 'RadioWidget',
    select: 'SelectWidget',
    textarea: 'TextareaWidget',
    hidden: 'HiddenWidget',
    date: 'DateWidget',
    datetime: 'DateTimeWidget',
    'date-time': 'DateTimeWidget',
    'iso-date-time': 'DateTimeWidget',
    'alt-date': 'AltDateWidget',
    'alt-datetime': 'AltDateTimeWidget',
    time: 'TimeWidget',
    'iso-time': 'TimeWidget',
    color: 'ColorWidget',
    file: 'FileWidget',
  },
  number: {
    text: 'TextWidget',
    select: 'SelectWidget',
    updown: 'UpDownWidget',
    range: 'RangeWidget',
    radio: 'RadioWidget',
    hidden: 'HiddenWidget',
  },
  integer: {
    text: 'TextWidget',
    select: 'SelectWidget',
    updown: 'UpDownWidget',
    range: 'RangeWidget',
    radio: 'RadioWidget',
    hidden: 'HiddenWidget',
  },
  array: {
    select: 'SelectWidget',
    checkboxes: 'CheckboxesWidget',
    files: 'FileWidget',
    hidden: 'HiddenWidget',
  },
} as const;

/** The lowercase `ui:widget` alias names `getWidget` accepts for a given JSON Schema primitive `type`, e.g.
 * `WidgetAliasFor<'string'>` is `'text' | 'textarea' | 'password' | ...`. Used to keep a type-safe widget vocabulary
 * (like `@rjsf/core`'s `CoreUiOptionsChecks`) in sync with the aliases `getWidget` actually resolves.
 */
export type WidgetAliasFor<Type extends keyof typeof widgetMap> = keyof (typeof widgetMap)[Type];

/** Returns the key in `registeredWidgets` of the widget named `widget`: `widget` itself when it is registered under
 * that name, otherwise the registered name its alias maps to for the schema type (e.g. `select` → `SelectWidget`).
 * Reading the widget out of the registry by this key keeps a field's widget a lookup React can see is not a component
 * created during render.
 *
 * @param schema - The schema for the field
 * @param widget - The name or alias of the widget
 * @param [registeredWidgets={}] - A registry of widget name to `Widget` implementation
 * @returns - The name the widget is registered under
 * @throws - An error if no registered name matches `widget` for the schema type
 */
export function getWidgetName<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: RJSFSchema, widget: string, registeredWidgets: RegistryWidgetsType<T, S, F> = {}): string {
  if (widget in registeredWidgets) {
    return widget;
  }

  const type = getSchemaType(schema);
  if (typeof type === 'string') {
    if (!(type in widgetMap)) {
      throw new Error(`No widget for type '${type}' in schema: ${JSON.stringify(schema)}`);
    }

    const widgetsForType = widgetMap[type as keyof typeof widgetMap];
    if (widget in widgetsForType) {
      return widgetsForType[widget as keyof typeof widgetsForType];
    }
  }

  throw new Error(`No widget '${widget}' for type '${type}' in schema: ${JSON.stringify(schema)}`);
}

/** Given a schema representing a field to render and either the name or actual `Widget` implementation, returns the
 * React component that is used to render the widget. If the `widget` is already a React component, it is returned
 * as-is. Otherwise an attempt is made to look up the widget inside of the `registeredWidgets` map based on the
 * schema type and `widget` name. If no widget component can be found an `Error` is thrown.
 *
 * @param schema - The schema for the field
 * @param [widget] - Either the name of the widget OR a `Widget` implementation to use
 * @param [registeredWidgets={}] - A registry of widget name to `Widget` implementation
 * @returns - The `Widget` component to use
 * @throws - An error if there is no `Widget` component that can be returned
 */
export default function getWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: RJSFSchema,
  widget?: Widget<T, S, F> | string,
  registeredWidgets: RegistryWidgetsType<T, S, F> = {},
): Widget<T, S, F> {
  if (widget && typeof widget !== 'string') {
    return widget;
  }

  if (typeof widget !== 'string') {
    throw new Error(`Unsupported widget definition: ${typeof widget} in schema: ${JSON.stringify(schema)}`);
  }

  return getWidget<T, S, F>(
    schema,
    registeredWidgets[getWidgetName<T, S, F>(schema, widget, registeredWidgets)],
    registeredWidgets,
  );
}
