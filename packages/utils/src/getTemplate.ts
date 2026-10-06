import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, TemplatesType, UIOptionsType } from './types.ts';

/** Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
 * otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.
 *
 * @param name - The name of the template to fetch, either a named template or one registered under a custom name
 * @param registry - The `Registry` from which to read the template
 * @param [uiOptions={}] - The `UIOptionsType` from which to read an alternate template
 * @returns - The template from either the `uiSchema` or `registry` for the `name`
 */
export default function getTemplate<
  Name extends keyof TemplatesType<T, S, F>,
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(name: Name, registry: Registry<T, S, F>, uiOptions?: UIOptionsType<T, S, F>): TemplatesType<T, S, F>[Name];
// The uiSchema can hold any value under this name and a registry key can name any template, so nothing proves the
// component takes `Name`'s props; the overload above is the one place the uiSchema is trusted to have picked the right
// one. Both are read through string-keyed views since indexing them by a generic `Name` overflows TS's union limit
export default function getTemplate<T, S extends StrictRJSFSchema, F extends FormContextType>(
  name: string,
  registry: Registry<T, S, F>,
  uiOptions: UIOptionsType<T, S, F> = {},
): unknown {
  const templates: Record<string, unknown> = registry.templates;
  if (name === 'ButtonTemplates') {
    return templates[name];
  }
  const uiOverrides: Record<string, unknown> = uiOptions;
  const override = uiOverrides[name];
  // Allow templates to be customized per-field by using string keys from the registry
  const template = typeof override === 'string' && Object.hasOwn(templates, override) ? templates[override] : override;
  if (typeof template === 'function' || (typeof template === 'object' && template !== null)) {
    return template;
  }
  return templates[name];
}
