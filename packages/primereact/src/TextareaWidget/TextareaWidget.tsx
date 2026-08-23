import type { ChangeEvent } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { InputTextarea } from 'primereact/inputtextarea';

import { getPrimeProps } from '../util';

/** The `TextareaWidget` is a widget for rendering input fields as textarea using PrimeReact.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, value, required, disabled, readonly, autofocus, onChange, onBlur, onFocus, options } = props;
  const primeProps = getPrimeProps<T, S, F>(options);

  let rows = 5;
  // noinspection SuspiciousTypeOfGuard
  if (typeof options.rows === 'string' || typeof options.rows === 'number') {
    rows = Number(options.rows);
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value === '' ? options.emptyValue : event.target.value);
  };

  return (
    <InputTextarea
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={value || ''}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      rows={rows}
      onChange={handleChange}
      onBlur={onBlur && ((event) => onBlur(id, event.target.value))}
      onFocus={onFocus && ((event) => onFocus(id, event.target.value))}
    />
  );
}
