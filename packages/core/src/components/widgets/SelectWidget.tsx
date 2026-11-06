import type { ChangeEvent } from 'react';
import type { FormContextType, RJSFSchema, SelectWidgetOption, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { SelectedOptionDescription, useSelectWidgetProps } from '@rjsf/utils';

function getValue(event: ChangeEvent<HTMLSelectElement>, multiple: boolean) {
  const select = event.currentTarget;
  return multiple ? Array.from(select.selectedOptions, (option) => option.value) : select.value;
}

function renderOption({ index, value, disabled, label }: SelectWidgetOption) {
  return (
    <option key={index} value={value} disabled={disabled}>
      {label}
    </option>
  );
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const select = useSelectWidgetProps<T, S, F>(props);
  const { multiple } = select;

  return (
    <>
      <SelectedOptionDescription {...select.descriptionProps} />
      <select
        id={select.id}
        name={select.name}
        multiple={multiple}
        className={props.registry.classMap.select}
        value={select.value}
        required={select.required}
        disabled={select.disabled}
        autoFocus={select.autoFocus}
        onBlur={select.onBlur}
        onFocus={select.onFocus}
        onChange={(event) => select.onChange(getValue(event, multiple))}
        {...select.ariaProps}
      >
        {select.showPlaceholderOption && <option value=''>{select.placeholder}</option>}
        {select.groupedOptions.map((item) =>
          'options' in item ? (
            <optgroup key={`optgroup-${item.label}`} label={item.label}>
              {item.options.map(renderOption)}
            </optgroup>
          ) : (
            renderOption(item)
          ),
        )}
      </select>
    </>
  );
}

export default SelectWidget;
