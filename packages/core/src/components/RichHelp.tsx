import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplate, getUiOptions, getTestIds } from '@rjsf/utils';

import type { RichDescriptionProps } from './RichDescription.tsx';

export interface RichHelpProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> extends Omit<RichDescriptionProps<T, S, F>, 'description'> {
  help: RichDescriptionProps<T, S, F>['description'];
}

/** Renders help with the registered renderer when its markdown option is enabled. */
export default function RichHelp<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  help,
  registry,
  uiSchema = {},
}: RichHelpProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  if (typeof help !== 'string' || !uiOptions.enableMarkdownInHelp) {
    return help;
  }
  const MarkdownTemplate = getTemplate<'MarkdownTemplate', T, S, F>('MarkdownTemplate', registry, uiOptions);
  return <MarkdownTemplate>{help}</MarkdownTemplate>;
}

RichHelp.TEST_IDS = getTestIds();
