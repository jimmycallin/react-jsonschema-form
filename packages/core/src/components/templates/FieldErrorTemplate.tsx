import type { FieldErrorProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], fieldPathId } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldPathId);

  return (
    <div>
      <ul id={id} className='error-detail bs-callout bs-callout-info'>
        {errors
          .filter((elem) => !!elem)
          .map((error, index: number) => (
            // oxlint-disable-next-line react/no-array-index-key
            <li className='text-danger' key={index}>
              {error}
            </li>
          ))}
      </ul>
    </div>
  );
}
