import type { FormContextType, RJSFSchema } from '@rjsf/utils';
import { ariaDescribedByIds, getInputProps } from '@rjsf/utils';
import type { InputNumberChangeEvent } from 'primereact/inputnumber';
import { InputNumber } from 'primereact/inputnumber';

import type { PrimeWidgetProps } from '../util';
import { getPrimeOptions } from '../util';

/** The `UpDownWidget` renders an input component for a number.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function UpDownWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: PrimeWidgetProps<InputNumberChangeEvent, T, S, F>) {
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
  const primeOptions = getPrimeOptions<T, S, F>(options);
  const { showButtons, buttonLayout, useGrouping, minFractionDigits, maxFractionDigits, locale, currency } =
    primeOptions;
  const primeProps = primeOptions.prime || {};

  const handleChange = (event: InputNumberChangeEvent) => onChange(event.value === null ? options.emptyValue : value);
  const handleBlur = () => onBlur?.(id, value);
  const handleFocus = () => onFocus?.(id, value);

  return (
    <InputNumber
      id={id}
      name={id}
      {...primeProps}
      placeholder={placeholder}
      step={Number.isNaN(Number(inputProps.step)) ? 1 : Number(inputProps.step)}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      style={buttonLayout === 'vertical' ? { width: '4em' } : {}}
      showButtons={typeof showButtons === 'undefined' ? true : !!showButtons}
      buttonLayout={buttonLayout ?? 'stacked'}
      useGrouping={!!useGrouping}
      minFractionDigits={minFractionDigits}
      maxFractionDigits={maxFractionDigits}
      locale={locale}
      mode={currency ? 'currency' : 'decimal'}
      currency={currency}
      value={Number.isNaN(Number(value)) ? null : Number(value)}
      invalid={rawErrors.length > 0}
      onChange={onChangeOverride || handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
    />
  );
}
