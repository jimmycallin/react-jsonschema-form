import type { ColorInputProps } from '@mantine/core';
import { ColorInput } from '@mantine/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, useBaseInputProps, widgetDrawsLabel } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../utils.tsx';

const COLOR_FORMATS = ['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla'] as const satisfies readonly NonNullable<
  ColorInputProps['format']
>[];

/** Whether `value` is a format `ColorInput` takes, since `colorFormat` is an option `ui:options` doesn't declare */
function isColorFormat(value: unknown): value is (typeof COLOR_FORMATS)[number] {
  return COLOR_FORMATS.some((format) => format === value);
}

/** The `ColorWidget` component uses the `ColorInput` from Mantine, allowing users to pick a color.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ColorWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label, options } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const input = useBaseInputProps<T, S, F>({ ...props, type: 'color' });

  const themeProps = cleanupOptions(options, props);

  const ariaDescribedByProps = useInputAriaProps('ColorInput', props);
  const error = getWidgetError<T, S, F>(props);

  return (
    <ColorInput
      id={input.id}
      name={input.name}
      value={String(input.value)}
      placeholder={input.placeholder || undefined}
      format={isColorFormat(options.colorFormat) ? options.colorFormat : undefined}
      required={input.required}
      disabled={input.disabled || input.readOnly}
      autoFocus={input.autoFocus}
      label={labelValue(label || undefined, hideLabel, false)}
      onChange={input.onChange}
      onBlur={input.onBlur}
      onFocus={input.onFocus}
      error={error}
      {...themeProps}
      popoverProps={{ withinPortal: false }}
      {...ariaDescribedByProps}
      {...getDescriptionProps(props)}
    />
  );
}
