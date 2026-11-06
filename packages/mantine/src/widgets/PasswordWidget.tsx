import { PasswordInput } from '@mantine/core';
import { SchemaExamples } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, useBaseInputProps, widgetDrawsLabel } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../utils.tsx';

/**
 * The `PasswordWidget` component renders a password input element.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label, options, registry, schema } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const input = useBaseInputProps<T, S, F>({ ...props, type: 'password' });
  const { ClearButton } = registry.templates.ButtonTemplates;

  const themeProps = cleanupOptions(options, props);

  const ariaDescribedByProps = useInputAriaProps('PasswordInput', props, input.ariaProps);

  const error = getWidgetError<T, S, F>(props);
  return (
    <>
      <PasswordInput
        id={input.id}
        name={input.name}
        value={input.value}
        placeholder={input.placeholder || undefined}
        required={input.required}
        disabled={input.disabled || input.readOnly}
        autoFocus={input.autoFocus}
        autoComplete={input.inputProps.autoComplete}
        list={input.listId}
        label={labelValue(label || undefined, hideLabel, false)}
        onChange={(event) => input.onChange(event.target.value)}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
        error={error}
        // Mantine's `PasswordInput` renders its input without the `aria-invalid` the other inputs get from `Input`
        aria-invalid={!!error || undefined}
        {...themeProps}
        {...ariaDescribedByProps}
        {...getDescriptionProps(props)}
      />
      {input.showClearButton && <ClearButton registry={registry} onClick={input.onClear} />}
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </>
  );
}
