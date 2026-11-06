import type { ComboboxParsedItem, OptionsFilter } from '@mantine/core';
import { defaultOptionsFilter, MultiSelect, Select } from '@mantine/core';
import type { FormContextType, RJSFSchema, SelectWidgetOption, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, SelectedOptionDescription, useSelectWidgetProps, widgetAriaProps } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../utils.tsx';

/** Mantine's default filter keeps a group in the dropdown even when the search matched none of its options, which
 * leaves a bare heading behind, so the groups it emptied are dropped here.
 */
const optionsFilter: OptionsFilter = (input) =>
  (defaultOptionsFilter(input) as ComboboxParsedItem[]).filter((item) => !('group' in item) || item.items.length > 0);

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
  const { label, options } = props;
  const select = useSelectWidgetProps<T, S, F>(props);
  const themeProps = cleanupOptions(options, props);

  const toComboboxItem = ({ index, value, label: itemLabel, disabled }: SelectWidgetOption) => ({
    key: String(index),
    value,
    label: itemLabel,
    disabled,
  });
  const data = select.groupedOptions.map((item) =>
    'options' in item ? { group: item.label, items: item.options.map(toComboboxItem) } : toComboboxItem(item),
  );

  // Mantine describes the input through its `InputWrapper` context rather than by an `aria-describedby` prop. An
  // `aria-label` in the options, spread onto the select as Mantine's own prop, names it as its caller's would
  const optionsAriaLabel = typeof options['aria-label'] === 'string' ? options['aria-label'] : undefined;
  const ariaDescribedByProps = useInputAriaProps<T, S, F>(
    select.multiple ? 'MultiSelect' : 'Select',
    props,
    widgetAriaProps<T, S, F>({ ...props, 'aria-label': props['aria-label'] || optionsAriaLabel }),
  );

  // The focused element is the search input, whose value is the selected option's label rather than an encoded option
  // value, so the focus handlers report the form data
  const sharedProps = {
    id: select.id,
    name: select.name,
    label: labelValue(label || undefined, select.descriptionProps.hideLabel, false),
    data,
    onBlur: select.onBlur,
    onFocus: select.onFocus,
    autoFocus: select.autoFocus,
    placeholder: select.placeholder,
    disabled: select.disabled,
    required: select.required,
    error: getWidgetError<T, S, F>(props),
    searchable: true,
    filter: optionsFilter,
    comboboxProps: { withinPortal: false },
    ...themeProps,
    ...ariaDescribedByProps,
    ...getDescriptionProps(props),
  };

  return (
    <>
      <SelectedOptionDescription {...select.descriptionProps} />
      {select.multiple ? (
        <MultiSelect
          {...sharedProps}
          // Its search input, the element a user focuses, takes no `required`, which goes to the hidden input holding
          // the values, so it says it as a native select's attribute would
          aria-required={select.required || undefined}
          value={select.value}
          onChange={select.onChange}
        />
      ) : (
        <Select
          // A select whose schema has a default offers no empty choice, as the other themes' leave out their placeholder
          // option, so the option selector of an `anyOf`/`oneOf` field holds an option unless the field's `ui:options`
          // set `allowDeselect` or `clearable`
          allowDeselect={select.showPlaceholderOption}
          {...sharedProps}
          // Mantine holds no selection as `null`, and reports a cleared one as `null` too
          value={select.value || null}
          onChange={select.onChange}
        />
      )}
    </>
  );
}
