import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { numericWidgetStoresString, toInputValue, useBaseInputProps } from '@rjsf/utils';
import { Input, InputNumber } from 'antd';

import useControlState from '../../controlState.ts';

const INPUT_STYLE = {
  width: '100%',
};

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const { disabled, registry, onChangeOverride, options, readonly, schema, value } = props;
  // `InputNumber` reports only the parsed value, never the `ChangeEvent` an `onChangeOverride` is declared to
  // receive, so a widget that supplies one gets the plain input every other theme renders for a numeric field.
  // `InputNumber` wraps its input and steps through its own `step`, which takes a number rather than `'any'`
  const plainInput = Boolean(onChangeOverride);
  const input = useBaseInputProps<T, S, F>(props, plainInput);
  const control = useControlState<T, S, F>({ disabled, readonly, registry });
  const { ClearButton } = registry.templates.ButtonTemplates;

  const { min, max, ...restInputProps } = input.inputProps;

  const isNumeric = !plainInput && (input.inputProps.type === 'number' || input.inputProps.type === 'integer');

  // A string is handed over as it is, as a string field that `ui:inputType: 'number'` renders here stores one, and
  // `InputNumber` keeps the digits a conversion to a number would round. Its `stringMode` writes such a field a string
  // with those digits too
  const numberValue = typeof value === 'number' || typeof value === 'string' ? value : undefined;
  const stringMode = numericWidgetStoresString<S>(schema, value);

  // `InputNumber` shows whatever string or number it's given, where a native number input blanks all but a number
  const showClearButton = isNumeric
    ? Boolean(options.allowClearTextInputs) && !readonly && !disabled && Boolean(toInputValue(numberValue))
    : input.showClearButton;
  const field = isNumeric ? (
    <InputNumber
      autoFocus={input.autoFocus}
      disabled={control.disabled}
      id={input.id}
      name={input.name}
      onBlur={input.onBlur}
      onChange={input.onChange}
      onFocus={input.onFocus}
      placeholder={input.placeholder}
      readOnly={input.readOnly}
      required={input.required}
      style={INPUT_STYLE}
      changeOnWheel={false}
      list={input.listId}
      title={input.title}
      {...restInputProps}
      min={typeof min === 'number' ? min : undefined}
      max={typeof max === 'number' ? max : undefined}
      type={undefined}
      stringMode={stringMode}
      value={numberValue}
      {...input.ariaProps}
    />
  ) : (
    <Input
      autoFocus={input.autoFocus}
      disabled={control.disabled}
      id={input.id}
      name={input.name}
      onBlur={input.onBlur}
      onChange={onChangeOverride ?? ((event) => input.onChange(event.target.value))}
      onFocus={input.onFocus}
      placeholder={input.placeholder}
      readOnly={input.readOnly}
      required={input.required}
      style={INPUT_STYLE}
      list={input.listId}
      title={input.title}
      {...input.inputProps}
      value={value === undefined ? undefined : input.value}
      {...input.ariaProps}
    />
  );

  return (
    <>
      {field}
      {showClearButton && <ClearButton registry={registry} onClick={input.onClear} />}
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </>
  );
}
