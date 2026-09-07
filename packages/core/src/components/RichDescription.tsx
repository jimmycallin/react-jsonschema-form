import type { ReactElement } from 'react';
import type { FormContextType, Registry, RJSFSchema, UiSchema } from '@rjsf/utils';
import { getTestIds, getUiOptions } from '@rjsf/utils';
import { Markdown } from 'markdown-to-jsx/react';

const TEST_IDS = getTestIds();

export interface RichDescriptionProps<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The description text for a field, potentially containing markdown */
  description: string | ReactElement;
  /** The uiSchema object for this base component */
  uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  registry: Registry<T, S, F>;
}

/** Renders the given `description` in the props as
 *
 * @param props - The `RichDescriptionProps` for this component
 */
export default function RichDescription<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ description, registry, uiSchema = {} }: RichDescriptionProps<T, S, F>) {
  const { globalUiOptions } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);

  if (uiOptions.enableMarkdownInDescription && typeof description === 'string') {
    return (
      <Markdown options={{ disableParsingRawHTML: true }} data-testid={TEST_IDS.markdown}>
        {description}
      </Markdown>
    );
  }
  return description;
}

RichDescription.TEST_IDS = TEST_IDS;
