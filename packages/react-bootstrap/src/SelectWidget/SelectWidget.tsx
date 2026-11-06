import type { ChangeEvent } from 'react';
import type { FormContextType, RJSFSchema, SelectWidgetOption, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, SelectedOptionDescription, useSelectWidgetProps } from '@rjsf/utils';
import { FormSelect } from 'react-bootstrap';

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

export default function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const select = useSelectWidgetProps<T, S, F>(props);
  const { multiple } = select;

  return (
    <>
      <FormSelect
        id={select.id}
        name={select.name}
        value={select.value}
        required={select.required}
        multiple={multiple}
        disabled={select.disabled}
        autoFocus={select.autoFocus}
        isInvalid={hasWidgetErrors<T, S, F>(props)}
        onBlur={select.onBlur}
        onFocus={select.onFocus}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => select.onChange(getValue(event, multiple))}
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
      </FormSelect>
      <SelectedOptionDescription {...select.descriptionProps} />
    </>
  );
}
