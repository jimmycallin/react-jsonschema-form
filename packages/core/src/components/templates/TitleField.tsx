import type { FormContextType, TitleFieldProps, RJSFSchema } from '@rjsf/utils';

const REQUIRED_FIELD_SYMBOL = '*';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: TitleFieldProps<T, S, F>) {
  const { id, title, required, optionalDataControl } = props;
  return (
    <legend id={id}>
      {title}
      {required && <span className='required'>{REQUIRED_FIELD_SYMBOL}</span>}
      {optionalDataControl && (
        <span className='pull-right' style={{ marginBottom: '2px' }}>
          {optionalDataControl}
        </span>
      )}
    </legend>
  );
}
