import type { FocusEvent } from 'react';
import { useCallback, useMemo } from 'react';
import { Select, MultiSelect } from '@mantine/core';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  labelValue,
  logUnsupportedDefaultForEnum,
  SelectedOptionDescription,
} from '@rjsf/utils';

import { cleanupOptions } from '../utils';

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
  const {
    id,
    htmlName,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    multiple,
    rawErrors,
    schema,
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const themeProps = cleanupOptions(options);
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const handleChange = useCallback(
    (nextValue: string | string[] | null) => {
      if (!disabled && !readonly && onChange) {
        // A cleared single select hands back `null`, which the decoder treats the same as the empty string
        onChange(enumOptionValueDecoder<S>(nextValue ?? '', enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue, optionValueFormat],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue, optionValueFormat],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue, optionValueFormat],
  );

  const selectOptions = useMemo(() => {
    if (Array.isArray(enumOptions)) {
      return enumOptions.map((option, index) => ({
        key: String(index),
        value: enumOptionValueEncoder(option.value, index, optionValueFormat),
        label: option.label,
        disabled: Array.isArray(enumDisabled) && enumDisabled.includes(option.value),
      }));
    }
    return [];
  }, [enumDisabled, enumOptions, optionValueFormat]);

  const sharedProps = {
    id,
    name: htmlName || id,
    label: labelValue(label || undefined, hideLabel, false),
    data: selectOptions,
    onChange: !readonly ? handleChange : undefined,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
    autoFocus: autofocus,
    placeholder,
    disabled: disabled || readonly,
    required,
    error: rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined,
    searchable: true,
    'aria-describedby': ariaDescribedByIds(id),
    comboboxProps: { withinPortal: false },
    ...themeProps,
  };

  // Mantine's `MultiSelect` needs a string list and its `Select` needs a string or `null` when nothing is selected
  const selected = enumOptionSelectedValue<S>(
    value,
    enumOptions,
    Boolean(multiple),
    optionValueFormat,
    multiple ? [] : '',
  );
  const multiSelected = Array.isArray(selected) ? selected : [];
  const singleSelected = typeof selected === 'string' && selected !== '' ? selected : null;

  return (
    <>
      <SelectedOptionDescription {...props} />
      {multiple ? (
        <MultiSelect {...sharedProps} value={multiSelected} />
      ) : (
        <Select {...sharedProps} value={singleSelected} />
      )}
    </>
  );
}
