import { useMemo, useState } from 'react';
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
import type { SelectProps } from 'antd';
import { Select } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';

import { getAntdFormContext, selectEmptyValue } from '../../utils';

const SELECT_STYLE = {
  width: '100%',
};

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  autofocus,
  disabled,
  registry,
  id,
  htmlName,
  multiple,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  value,
  schema,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const [open, setOpen] = useState(false);
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = getAntdFormContext(formContext);

  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const handleChange = (nextValue: string | string[]) =>
    onChange(enumOptionValueDecoder<S>(nextValue, enumOptions, optionValueFormat, emptyValue));

  const handleBlur = () => onBlur(id, enumOptionValueDecoder<S>(value, enumOptions, optionValueFormat, emptyValue));

  const handleFocus = () => onFocus(id, enumOptionValueDecoder<S>(value, enumOptions, optionValueFormat, emptyValue));

  const filterOption: SelectProps['filterOption'] = (input, option) => {
    if (option && typeof option.label === 'string') {
      // labels are strings in this context
      return option.label.toLowerCase().includes(input.toLowerCase());
    }
    return false;
  };

  const getPopupContainer = SelectWidget.getPopupContainerCallback();

  const selectValue = enumOptionSelectedValue<S>(
    value,
    enumOptions,
    !!multiple,
    optionValueFormat,
    selectEmptyValue(emptyValue),
  );

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    name: htmlName || id,
  };

  const showPlaceholderOption = !multiple && schema.default === undefined;
  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const selectOptions: DefaultOptionType[] | undefined = useMemo(() => {
    if (Array.isArray(enumOptions)) {
      const enumOptionsList: DefaultOptionType[] = enumOptions.map(
        ({ value: optionValue, label: optionLabel }, index) => ({
          disabled: Array.isArray(enumDisabled) && enumDisabled.includes(optionValue),
          key: String(index),
          value: enumOptionValueEncoder(optionValue, index, optionValueFormat),
          label: optionLabel,
        }),
      );

      if (showPlaceholderOption) {
        enumOptionsList.unshift({ value: '', label: placeholder || '' });
      }
      return enumOptionsList;
    }
    return undefined;
  }, [enumDisabled, enumOptions, placeholder, showPlaceholderOption, optionValueFormat]);

  return (
    <>
      <Select
        open={open}
        autoFocus={autofocus}
        disabled={disabled || (readonlyAsDisabled && readonly)}
        getPopupContainer={getPopupContainer}
        id={id}
        mode={multiple ? 'multiple' : undefined}
        onBlur={!readonly ? handleBlur : undefined}
        onChange={!readonly ? handleChange : undefined}
        onFocus={!readonly ? handleFocus : undefined}
        placeholder={placeholder}
        style={SELECT_STYLE}
        value={selectValue}
        {...extraProps}
        // When the open change is called, set the open state, needed so that the select opens properly in the playground
        onOpenChange={setOpen}
        showSearch={{ filterOption }}
        aria-describedby={ariaDescribedByIds(id)}
        options={selectOptions}
      />
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

/** Give the playground a place to hook into the `getPopupContainer` callback generation function so that it can be
 * disabled while in the playground. Since the callback is a simple function, it can be returned by this static
 * "generator" function.
 */
// `parentElement` is nullable, but antd only calls this for a mounted trigger, which always has a parent
SelectWidget.getPopupContainerCallback = () => (node: HTMLElement) => node.parentElement as HTMLElement;
