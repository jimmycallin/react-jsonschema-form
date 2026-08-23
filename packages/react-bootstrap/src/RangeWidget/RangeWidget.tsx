import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { rangeSpec } from '@rjsf/utils';
import FormRange from 'react-bootstrap/FormRange';

export default function RangeWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, value, disabled, onChange, onBlur, onFocus, schema } = props;

  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) => onChange(newValue);
  const handleBlur = ({ target: { value: newValue } }: FocusEvent<HTMLInputElement>) => onBlur(id, newValue);
  const handleFocus = ({ target: { value: newValue } }: FocusEvent<HTMLInputElement>) => onFocus(id, newValue);

  const rangeProps = {
    value,
    id,
    name: id,
    disabled,
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    ...rangeSpec<S>(schema),
  };

  return (
    <>
      <FormRange {...rangeProps} />
      <span className='range-view'>{value}</span>
    </>
  );
}
