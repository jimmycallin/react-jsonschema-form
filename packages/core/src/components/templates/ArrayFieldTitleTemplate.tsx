import type { ArrayFieldTitleProps, FormContextType, RJSFSchema, TemplatesType } from '@rjsf/utils';
import { getTemplate, getUiOptions, titleId } from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders a `TitleFieldTemplate` with an `id` derived from
 * the `fieldPathId`.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { fieldPathId, title, schema, uiSchema, required, registry, optionalDataControl } = props;
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!title || !displayLabel) {
    return null;
  }
  const TitleFieldTemplate: TemplatesType<T, S, F>['TitleFieldTemplate'] = getTemplate<'TitleFieldTemplate', T, S, F>(
    'TitleFieldTemplate',
    registry,
    options,
  );
  return (
    <TitleFieldTemplate
      id={titleId(fieldPathId)}
      title={title}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      optionalDataControl={optionalDataControl}
    />
  );
}
