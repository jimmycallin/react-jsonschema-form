import type { ArrayFieldDescriptionProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { descriptionId, getTemplate, getUiOptions } from '@rjsf/utils';

/** The `ArrayFieldDescriptionTemplate` component renders a `DescriptionFieldTemplate` with an `id` derived from
 * the `fieldPathId`.
 *
 * @param props - The `ArrayFieldDescriptionProps` for the component
 */
export default function ArrayFieldDescriptionTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldDescriptionProps<T, S, F>) {
  const { fieldPathId, description, registry, schema, uiSchema } = props;
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!description || !displayLabel) {
    return null;
  }
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );
  return (
    <DescriptionFieldTemplate
      id={descriptionId(fieldPathId)}
      description={description}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    />
  );
}
