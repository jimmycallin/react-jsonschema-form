import type { FormContextType, MarkdownTemplateProps, RJSFSchema } from '@rjsf/utils';

/** The default `MarkdownTemplate` renders the text as-is, so that no markdown library is bundled unless an application
 * registers the one from `@rjsf/core/markdown` (or its own) instead.
 */
export default function MarkdownTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ children }: MarkdownTemplateProps<T, S, F>) {
  return children;
}
