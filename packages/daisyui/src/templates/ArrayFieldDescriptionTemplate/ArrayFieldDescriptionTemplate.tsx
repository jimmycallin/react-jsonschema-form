import type { FormContextType, RJSFSchema, ArrayFieldDescriptionProps } from '@rjsf/utils';
import { descriptionId, getUiOptions } from '@rjsf/utils';

/** The `ArrayFieldDescriptionTemplate` component renders the description for an array field
 * with DaisyUI styling, displaying it as a small text with accent color, with an `id` derived
 * from the `fieldPathId`.
 *
 * @param props - The `ArrayFieldDescriptionProps` for the component
 */
export default function ArrayFieldDescriptionTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldDescriptionProps<T, S, F>) {
  const { fieldPathId, description, uiSchema, registry } = props;
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!description || !displayLabel) {
    return null;
  }
  return (
    <div>
      <div id={descriptionId(fieldPathId)} className='text-sm text-accent'>
        {description}
      </div>
    </div>
  );
}
