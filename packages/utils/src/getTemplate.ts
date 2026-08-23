import type { FormContextType, GenericObjectType, TemplatesType, Registry, UIOptionsType, RJSFSchema } from './types';

/** Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
 * otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.
 *
 * @param name - The name of the template to fetch, restricted to the keys of `TemplatesType`
 * @param registry - The `Registry` from which to read the template
 * @param [uiOptions={}] - The `UIOptionsType` from which to read an alternate template
 * @returns - The template from either the `uiSchema` or `registry` for the `name`
 */
export default function getTemplate<
  Name extends keyof TemplatesType<T, S, F>,
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(name: Name, registry: Registry<T, S, F>, uiOptions: UIOptionsType<T, S, F> = {}): TemplatesType<T, S, F>[Name] {
  const { templates } = registry;
  if (name === 'ButtonTemplates') {
    return templates[name];
  }
  // Allow templates to be customized per-field by using string keys from the registry
  if (
    Object.hasOwn(uiOptions, name) &&
    typeof uiOptions[name] === 'string' &&
    Object.hasOwn(templates, uiOptions[name] as string)
  ) {
    const key = uiOptions[name] as string;
    // Evaluating templates[key] results in TS2590: Expression produces a union type that is too complex to represent.
    // To avoid that, the lookup goes through the index signature instead of the named keys
    return (templates as GenericObjectType)[key] as TemplatesType<T, S, F>[Name];
  }
  return (
    // Evaluating uiOptions[name] results in TS2590: Expression produces a union type that is too complex to represent.
    // To avoid that, the lookup goes through the index signature instead of the named keys
    ((uiOptions as GenericObjectType)[name] as TemplatesType<T, S, F>[Name]) || templates[name]
  );
}
