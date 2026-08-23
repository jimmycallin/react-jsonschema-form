import { useCallback } from 'react';
import { DateInput } from '@mantine/dates';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, labelValue } from '@rjsf/utils';
import dayjs from 'dayjs';

const dateParser = (input: string, format?: string) => {
  if (!input) {
    return null;
  }
  const d = dayjs(input, format);
  return d.isValid() ? d.toDate() : null;
};

const dateFormat = (date?: Date | string, format?: string) => {
  if (!date) {
    return '';
  }
  return dayjs(date).format(format || 'YYYY-MM-DD');
};

/** The extra prop the Date-Time widgets pass down to `DateTimeInput`, which is not part of `WidgetProps` */
interface DateTimeInputFormats {
  /** The dayjs format to use when the `ui:options` do not carry a `valueFormat` */
  defaultValueFormat: string;
}

/** The `DateTimeInput` is a base component that used by other Date-Time widget components.
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeInput<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F> & DateTimeInputFormats) {
  const {
    id,
    name,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    rawErrors,
    onChange,
    onBlur,
    onFocus,
    defaultValueFormat,
  } = props;
  // The formats come out of the arbitrarily-keyed `ui:options`, so they arrive as `unknown`
  const { valueFormat: rawValueFormat, displayFormat: rawDisplayFormat, ...options } = props.options;
  const valueFormat = typeof rawValueFormat === 'string' ? rawValueFormat : defaultValueFormat;
  const displayFormat = typeof rawDisplayFormat === 'string' ? rawDisplayFormat : valueFormat;

  const handleChange = useCallback(
    (nextValue: string | null) => {
      onChange(dateFormat(nextValue ?? undefined, valueFormat));
    },
    [onChange, valueFormat],
  );

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  return (
    <DateInput
      id={id}
      name={name}
      value={dateParser(value, valueFormat)}
      dateParser={(v) => dateParser(v, displayFormat)}
      placeholder={placeholder || undefined}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      label={labelValue(label || undefined, hideLabel, false)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      {...options}
      aria-describedby={ariaDescribedByIds(id)}
      popoverProps={{ withinPortal: false }}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
      valueFormat={displayFormat}
    />
  );
}
