import { TextInput, NumberInput } from '@mantine/core';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import {
  callerInputProps,
  labelValue,
  numericWidgetStoresString,
  useBaseInputProps,
  widgetDrawsLabel,
} from '@rjsf/utils';

import {
  cleanupOptions,
  getDescriptionProps,
  getWidgetError,
  numberInputOwnKeys,
  useInputAriaProps,
} from '../utils.tsx';

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const { schema, value, label, onChangeOverride, options, children, registry } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { ClearButton } = registry.templates.ButtonTemplates;

  // Mantine's `NumberInput` reports only the parsed value, never the `ChangeEvent` an `onChangeOverride` is declared
  // to receive, and sets an `inputMode` of its own over any it is given, so a widget that names either gets the plain
  // input every other theme renders for a numeric field.
  const plainInput = Boolean(onChangeOverride) || 'inputMode' in props;
  const input = useBaseInputProps<T, S, F>(props, plainInput);
  const isNumeric = !plainInput && (input.inputProps.type === 'number' || input.inputProps.type === 'integer');
  // `NumberInput`'s own options would land on a `TextInput` as unknown attributes
  const optionProps = cleanupOptions(options, props, isNumeric ? undefined : numberInputOwnKeys);
  // `ui:options` spreads onto the input as Mantine props, so the props a widget passes go after it to win. A `pattern`
  // there replaces the derived one, so it drops the title that names it, as a passed `pattern` does
  const themeProps = {
    ...optionProps,
    ...('pattern' in optionProps && { title: undefined }),
    ...callerInputProps(props),
  };
  const descriptionProps = getDescriptionProps(props);

  // `NumberInput` reports a number once its text parses as one, and on blur trims leading zeroes by parsing the text,
  // which rounds the digits past a number's precision, so a string field turns that trim off and gets a string back
  const storesString = numericWidgetStoresString<S>(schema, value);

  const componentProps = {
    id: input.id,
    name: input.name,
    label: labelValue(label || undefined, hideLabel, false),
    required: input.required,
    autoFocus: input.autoFocus,
    disabled: input.disabled || input.readOnly,
    onBlur: input.onBlur,
    onFocus: input.onFocus,
    placeholder: input.placeholder,
    error: getWidgetError<T, S, F>(props),
    list: input.listId,
    title: input.title,
  };

  const { min, max, ...restInputProps } = input.inputProps;

  const ariaDescribedByProps = useInputAriaProps<T, S, F>(
    isNumeric ? 'NumberInput' : 'TextInput',
    props,
    input.ariaProps,
  );

  const field = isNumeric ? (
    <NumberInput
      onChange={(next) => input.onChange(storesString && next !== '' ? String(next) : next)}
      {...componentProps}
      {...restInputProps}
      {...themeProps}
      step={typeof input.inputProps.step === 'number' ? input.inputProps.step : 1}
      {...(storesString && { trimLeadingZeroesOnBlur: false })}
      type='text'
      {...ariaDescribedByProps}
      {...descriptionProps}
      value={input.value}
      min={typeof min === 'number' ? min : undefined}
      max={typeof max === 'number' ? max : undefined}
    />
  ) : (
    <TextInput
      onChange={onChangeOverride ?? ((event) => input.onChange(event.target.value))}
      {...componentProps}
      {...input.inputProps}
      {...themeProps}
      {...ariaDescribedByProps}
      {...descriptionProps}
      value={input.value}
    />
  );

  // `NumberInput` is a text input that shows a partial number such as `5.` or `-`, which a native number input blanks
  const showClearButton = isNumeric
    ? Boolean(options.allowClearTextInputs) &&
      !input.disabled &&
      !input.readOnly &&
      (typeof value === 'number' || typeof value === 'string') &&
      Boolean(input.value)
    : input.showClearButton;

  return (
    <>
      {field}
      {showClearButton && <ClearButton registry={registry} onClick={input.onClear} />}
      {children}
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </>
  );
}
