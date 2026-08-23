import type { ChangeEvent, FocusEvent } from 'react';
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
import FormSelect from 'react-bootstrap/FormSelect';

export default function SelectWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  schema,
  id,
  htmlName,
  options,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  rawErrors = [],
  registry,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options;

  const emptyValue = multiple ? [] : '';
  const optionValueFormat = getOptionValueFormat(options);

  function getValue(event: FocusEvent<HTMLSelectElement> | ChangeEvent<HTMLSelectElement>, isMultiple?: boolean) {
    if (isMultiple) {
      return Array.from(event.target.selectedOptions, (option) => option.value);
    }
    return event.target.value;
  }
  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, !!multiple, optionValueFormat, emptyValue);
  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  return (
    <>
      <FormSelect
        id={id}
        name={htmlName || id}
        value={selectValue}
        required={required}
        multiple={multiple}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        className={rawErrors.length > 0 ? 'is-invalid' : ''}
        onBlur={
          onBlur &&
          ((event: FocusEvent<HTMLSelectElement>) => {
            const newValue = getValue(event, multiple);
            onBlur(id, enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyValue));
          })
        }
        onFocus={
          onFocus &&
          ((event: FocusEvent<HTMLSelectElement>) => {
            const newValue = getValue(event, multiple);
            onFocus(id, enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyValue));
          })
        }
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          const newValue = getValue(event, multiple);
          onChange(enumOptionValueDecoder<S>(newValue, enumOptions, optionValueFormat, optEmptyValue));
        }}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {showPlaceholderOption && <option value=''>{placeholder}</option>}
        {enumOptions?.map(({ value: enumValue, label: enumLabel }, i: number) => {
          const isDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(enumValue);
          return (
            <option
              key={String(enumValue)}
              id={enumLabel}
              value={enumOptionValueEncoder(enumValue, i, optionValueFormat)}
              disabled={isDisabled}
            >
              {enumLabel}
            </option>
          );
        })}
      </FormSelect>
      <SelectedOptionDescription
        id={id}
        multiple={multiple}
        options={options}
        registry={registry}
        uiSchema={uiSchema}
        value={value}
      />
    </>
  );
}
