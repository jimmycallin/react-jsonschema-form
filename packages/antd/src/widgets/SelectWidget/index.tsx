import { useMemo, useState } from 'react';
import type { FormContextType, RJSFSchema, SelectWidgetOption, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { SelectedOptionDescription, useSelectWidgetProps } from '@rjsf/utils';
import type { SelectProps } from 'antd';
import { Select } from 'antd';
import type { DefaultOptionType } from 'antd/es/select/index.js';

import useControlState from '../../controlState.ts';

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
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { disabled, readonly, registry, required } = props;
  const select = useSelectWidgetProps<T, S, F>(props);
  const [open, setOpen] = useState(false);
  const control = useControlState<T, S, F>({ disabled, readonly, registry });

  const filterOption: SelectProps['filterOption'] = (input, option) => {
    // A group is offered here before its own options are, and matching one keeps every option it holds, including the
    // ones the search rules out, so groups are rejected and left to be kept by whichever of their options match
    if (option?.options) {
      return false;
    }
    if (option && typeof option.label === 'string') {
      // labels are strings in this context
      return option.label.toLowerCase().includes(input.toLowerCase());
    }
    return false;
  };

  const getPopupContainer = SelectWidget.getPopupContainerCallback();

  const { disabledDomValues, enabledDomValues } = useMemo(() => {
    const drawnOptions = select.groupedOptions.flatMap((item) => ('options' in item ? item.options : [item]));
    return {
      disabledDomValues: new Set(drawnOptions.filter((option) => option.disabled).map(({ value }) => value)),
      enabledDomValues: drawnOptions.filter((option) => !option.disabled).map(({ value }) => value),
    };
  }, [select.groupedOptions]);

  // With no empty placeholder to fall back on, a native `<select>` that holds no option selects its first enabled one in
  // the order they are drawn, or none at all, so the `Select` draws that one too
  const holdsNoOption = !select.multiple && select.value === '' && !select.showPlaceholderOption;
  const fallbackDomValue = holdsNoOption ? enabledDomValues[0] : undefined;
  // An empty single selection is left unset, so the `Select` shows its placeholder
  const selectValue = fallbackDomValue ?? (select.value === '' ? undefined : select.value);

  // A native `<select>` posts one entry per selected option, in the order the options are drawn, but none for a
  // selected option that is disabled
  const postedValues = select.multiple
    ? enabledDomValues.filter((domValue) => select.value.includes(domValue))
    : [holdsNoOption ? fallbackDomValue : select.value].filter(
        (domValue) => domValue !== undefined && !disabledDomValues.has(domValue),
      );

  const selectOptions = useMemo(() => {
    const toOptionType = ({
      index,
      value,
      label,
      disabled: optionDisabled,
    }: SelectWidgetOption): DefaultOptionType => ({
      disabled: optionDisabled,
      key: String(index),
      value,
      label,
    });
    const enumOptionsList: DefaultOptionType[] = select.groupedOptions.map((item) =>
      'options' in item ? { label: item.label, options: item.options.map(toOptionType) } : toOptionType(item),
    );
    if (select.showPlaceholderOption) {
      enumOptionsList.unshift({ value: '', label: select.placeholder || '' });
    }
    return enumOptionsList;
  }, [select.groupedOptions, select.placeholder, select.showPlaceholderOption]);

  return (
    <>
      <Select
        open={open}
        autoFocus={select.autoFocus}
        disabled={control.disabled}
        getPopupContainer={getPopupContainer}
        id={select.id}
        mode={select.multiple ? 'multiple' : undefined}
        onBlur={select.onBlur}
        onChange={select.onChange}
        onFocus={select.onFocus}
        placeholder={select.placeholder}
        style={SELECT_STYLE}
        value={selectValue}
        // When the open change is called, set the open state, needed so that the select opens properly in the playground
        onOpenChange={setOpen}
        showSearch={{ filterOption }}
        {...select.ariaProps}
        aria-required={required || undefined}
        aria-readonly={control.ariaReadonly}
        options={selectOptions}
      />
      {/* antd's `Select` renders no native control, so the value a native submit or `FormData` reads is carried by
      hidden inputs, as a native `<select>` posts one entry per selected option, or its empty placeholder */}
      {postedValues.map((domValue) => (
        <input key={domValue} type='hidden' name={select.name} value={domValue} disabled={control.disabled} />
      ))}
      <SelectedOptionDescription {...select.descriptionProps} />
    </>
  );
}

/** Give the playground a place to hook into the `getPopupContainer` callback generation function so that it can be
 * disabled while in the playground. Since the callback is a simple function, it can be returned by this static
 * "generator" function. The default never returns `undefined`; the return type allows it because that is how the
 * playground's replacement turns the callback off. A trigger without a parent element gets `document.body`, antd's own
 * default container.
 */
SelectWidget.getPopupContainerCallback = (): ((node: HTMLElement) => HTMLElement) | undefined => (node) =>
  node.parentElement ?? document.body;
