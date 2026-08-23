import type { ChangeEvent } from 'react';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { ariaDescribedByIds, getInputProps } from '@rjsf/utils';
import { Password } from 'primereact/password';

import { getPrimeProps } from '../util';

/** The `PasswordWidget` renders a `Password` component
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    placeholder,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    type,
    rawErrors = [],
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const primeProps = getPrimeProps<T, S, F>(options);

  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = () => onBlur?.(id, value);
  const handleFocus = () => onFocus?.(id, value);

  return (
    <Password
      id={id}
      name={id}
      placeholder={placeholder}
      {...primeProps}
      {...inputProps}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      value={value || ''}
      invalid={rawErrors.length > 0}
      onChange={onChangeOverride || handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      pt={{ root: { style: { display: 'flex', flexDirection: 'column' } } }}
    />
  );
}
