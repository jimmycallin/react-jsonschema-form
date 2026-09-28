import getTemplate from './getTemplate.ts';
import type { FormContextType, TemplatesType, Registry, UIOptionsType, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** Returns every template in the `registry`, with each one that `uiOptions` overrides resolved the way `getTemplate`
 * resolves it. Destructure the templates a component renders from the result so they are read from a map rather than
 * returned by a call made during render, which React's static-components rule treats as a component created there.
 *
 * @param registry - The `Registry` from which to read the templates
 * @param [uiOptions={}] - The `UIOptionsType` from which to read alternate templates
 * @returns - The templates from either the `uiSchema` or `registry`
 */
export default function getTemplates<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(registry: Registry<T, S, F>, uiOptions: UIOptionsType<T, S, F> = {}): TemplatesType<T, S, F> {
  const templates = { ...registry.templates };
  for (const name of Object.keys(uiOptions)) {
    if (Object.hasOwn(templates, name)) {
      templates[name] = getTemplate(name, registry, uiOptions);
    }
  }
  return templates;
}
