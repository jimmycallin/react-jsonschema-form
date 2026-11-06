import type { ChangeEvent } from 'react';
import { NativeSelect } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, SelectWidgetOption, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  hasWidgetErrors,
  labelValue,
  SelectedOptionDescription,
  useSelectWidgetProps,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { getChakra } from '../utils.ts';

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

/** The `NativeSelectWidget` renders a native `<select>` styled by Chakra
 *
 * @param props - The `WidgetProps` for this component
 */
export default function NativeSelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { options, label, readonly } = props;
  const select = useSelectWidgetProps<T, S, F>(props);
  const { multiple } = select;
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);

  return (
    <Field
      mb={1}
      disabled={select.disabled}
      required={select.required}
      readOnly={readonly}
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, !drawsLabel)}
      id={select.id}
      {...getChakra(options)}
    >
      <SelectedOptionDescription {...select.descriptionProps} />
      <NativeSelect.Root>
        <NativeSelect.Field
          id={select.id}
          name={select.name}
          multiple={multiple}
          onBlur={select.onBlur}
          onChange={(event) => select.onChange(getValue(event, multiple))}
          onFocus={select.onFocus}
          autoFocus={select.autoFocus}
          value={select.value}
          {...select.ariaProps}
        >
          {select.showPlaceholderOption ? (
            <option value='' disabled hidden>
              {select.placeholder || ''}
            </option>
          ) : undefined}
          {select.groupedOptions.map((item) =>
            'options' in item ? (
              <optgroup key={`optgroup-${item.label}`} label={item.label}>
                {item.options.map(renderOption)}
              </optgroup>
            ) : (
              renderOption(item)
            ),
          )}
        </NativeSelect.Field>
        {!multiple && <NativeSelect.Indicator />}
      </NativeSelect.Root>
    </Field>
  );
}
