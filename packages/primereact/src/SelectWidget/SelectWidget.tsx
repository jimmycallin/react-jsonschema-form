import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';

import { getPrimeProps } from '../util';

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { multiple = false } = props;

  return (
    <>
      {multiple ? <MultiSelectWidget {...props} /> : <SingleSelectWidget {...props} />}
      <SelectedOptionDescription {...props} />
    </>
  );
}

function SingleSelectWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  schema,
  id,
  htmlName,
  name, // remove this from dropdownProps
  options,
  label,
  hideLabel,
  required,
  disabled,
  placeholder,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  errorSchema,
  rawErrors = [],
  registry,
  uiSchema,
  hideError,
  ...dropdownProps
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const primeProps = getPrimeProps<T, S, F>(options);

  const isMultiple = typeof multiple === 'undefined' ? false : multiple;

  const emptyValue = isMultiple ? [] : '';
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, isMultiple);

  const handleChange = (e: { value: string | string[] }) =>
    onChange(enumOptionValueDecoder<S>(e.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, optEmptyVal));
  const { ...dropdownRemainingProps } = dropdownProps;

  return (
    <Dropdown
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={enumOptionSelectedValue<S>(value, enumOptions, isMultiple, optionValueFormat, emptyValue)}
      options={(enumOptions ?? []).map(({ value: enumValue, label: enumLabel }, i: number) => ({
        label: enumLabel,
        value: enumOptionValueEncoder(enumValue, i, optionValueFormat),
        disabled: Array.isArray(enumDisabled) && enumDisabled.includes(enumValue),
      }))}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      aria-describedby={ariaDescribedByIds(id)}
      {...dropdownRemainingProps}
    />
  );
}

function MultiSelectWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  options,
  disabled,
  placeholder,
  readonly,
  value,
  multiple = false,
  autofocus,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const primeProps = getPrimeProps<T, S, F>(options);

  const emptyValue = multiple ? [] : '';

  const handleChange = (e: { value: string | string[] }) =>
    onChange(enumOptionValueDecoder<S>(e.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, optEmptyVal));

  return (
    <MultiSelect
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={enumOptionSelectedValue<S>(value, enumOptions, multiple, optionValueFormat, emptyValue)}
      options={(enumOptions ?? []).map(({ value: enumValue, label: enumLabel }, i: number) => ({
        label: enumLabel,
        value: enumOptionValueEncoder(enumValue, i, optionValueFormat),
        disabled: Array.isArray(enumDisabled) && enumDisabled.includes(enumValue),
      }))}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      display={options.display === 'chip' ? 'chip' : 'comma'}
      aria-describedby={ariaDescribedByIds(id)}
      pt={{ root: { style: { position: 'relative' } } }}
    />
  );
}
