import type { ArrayFieldTitleProps, RJSFSchema, FormContextType } from '@rjsf/utils';
import { getUiOptions, titleId } from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders the title for an array field
 * using DaisyUI styling with large bold text, with an `id` derived from the `fieldPathId`.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { fieldPathId, title, uiSchema, registry, optionalDataControl } = props;
  const options = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { label: displayLabel = true } = options;
  if (!title || !displayLabel) {
    return null;
  }
  let heading = (
    <h3 id={titleId(fieldPathId)} className='text-2xl font-bold'>
      {title}
    </h3>
  );
  if (optionalDataControl) {
    heading = (
      <>
        <div className='flex flex-col'>{heading}</div>
        <div className='flex justify-end'>{optionalDataControl}</div>
      </>
    );
  }

  return heading;
}
