import type { ArrayFieldTitleProps, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `ArrayFieldTitleTemplate` component renders the title for an array field
 * using DaisyUI styling with large bold text.
 *
 * @param props - The `ArrayFieldTitleProps` for the component
 */
export default function ArrayFieldTitleTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTitleProps<T, S, F>) {
  const { title, optionalDataControl } = props;
  let heading = <h3 className='text-2xl font-bold'>{title}</h3>;
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
