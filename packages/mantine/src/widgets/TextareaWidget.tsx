import type { ReactElement } from 'react';
import { Textarea } from '@mantine/core';
import type { StrictRJSFSchema, RJSFSchema, FormContextType, WidgetProps } from '@rjsf/utils';
import { labelValue, useTextareaWidgetProps, widgetDrawsLabel } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../utils.tsx';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): ReactElement {
  const { label, options } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const textarea = useTextareaWidgetProps<T, S, F>(props);

  const themeProps = cleanupOptions(options, props);

  const ariaDescribedByProps = useInputAriaProps('Textarea', props);
  const error = getWidgetError<T, S, F>(props);

  return (
    <Textarea
      id={textarea.id}
      name={textarea.name}
      value={textarea.value}
      placeholder={textarea.placeholder || undefined}
      rows={textarea.rows}
      required={textarea.required}
      disabled={textarea.disabled || textarea.readOnly}
      autoFocus={textarea.autoFocus}
      label={labelValue(label || undefined, hideLabel, false)}
      onChange={(event) => textarea.onChange(event.target.value)}
      onBlur={textarea.onBlur}
      onFocus={textarea.onFocus}
      error={error}
      {...themeProps}
      {...ariaDescribedByProps}
      {...getDescriptionProps(props)}
    />
  );
}
