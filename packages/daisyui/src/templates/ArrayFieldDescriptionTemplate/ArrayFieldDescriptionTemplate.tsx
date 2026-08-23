import type { FormContextType, RJSFSchema, ArrayFieldDescriptionProps } from '@rjsf/utils';

/** The `ArrayFieldDescriptionTemplate` component renders the description for an array field
 * with DaisyUI styling, displaying it as a small text with accent color.
 *
 * @param props - The `ArrayFieldDescriptionProps` for the component
 */
export default function ArrayFieldDescriptionTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldDescriptionProps<T, S, F>) {
  const { description } = props;
  return (
    <div>
      <div className='text-sm text-accent'>{description}</div>
    </div>
  );
}
