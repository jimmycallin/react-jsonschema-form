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
>(name: Name, registry: Registry<T, S, F>, uiOptions: UIOptionsType<T, S, F> = {}): TemplatesType<T, S, F>[Name] {
  const { templates } = registry;
  if (name === 'ButtonTemplates') {
    return templates[name];
  }
  const override = uiOptions[name];
  // Allow templates to be customized per-field by using string keys from the registry
  const template = typeof override === 'string' && Object.hasOwn(templates, override) ? templates[override] : override;
  if (typeof template === 'function' || (typeof template === 'object' && template !== null)) {
    // The uiSchema can hold any value under this name and a registry key can name any template, so nothing proves
    // the component takes `Name`'s props; this is the one place the uiSchema is trusted to have picked the right one
    return template;
  }
  return templates[name];
}
