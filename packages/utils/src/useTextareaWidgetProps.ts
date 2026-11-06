'use client';

import getControlAttributes from './getControlAttributes.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import type { UseBaseInputPropsResult } from './useBaseInputProps.ts';
import useBaseInputProps from './useBaseInputProps.ts';

export type UseTextareaWidgetPropsResult = Pick<
  UseBaseInputPropsResult,
  | 'id'
  | 'name'
  | 'required'
  | 'disabled'
  | 'readOnly'
  | 'autoFocus'
  | 'placeholder'
  | 'value'
  | 'ariaProps'
  | 'onChange'
  | 'onFocus'
  | 'onBlur'
> & {
  /** The `ui:options.rows` the textarea is drawn with, where it is a whole number of rows */
  rows: number | undefined;
};

/** Hook which holds what every `TextareaWidget` does whatever its UI library: it shows the form data as the textarea's
 * string, reports an emptied textarea as `ui:emptyValue`, reads `ui:options.rows`, and supplies the textarea's id, name
 * and `aria-*` attributes. Its change handler reports nothing while the field is disabled or read-only. To be used by
 * theme specific `TextareaWidget` implementations, and by an app's own.
 *
 * @param props - The `WidgetProps` for the `TextareaWidget`
 * @returns - The `UseTextareaWidgetPropsResult` to be used within a `TextareaWidget` implementation
 */
export default function useTextareaWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): UseTextareaWidgetPropsResult {
  const input = useBaseInputProps<T, S, F>(props);
  const { rows } = props.options;
  return {
    id: input.id,
    name: input.name,
    required: input.required,
    disabled: input.disabled,
    readOnly: input.readOnly,
    autoFocus: input.autoFocus,
    placeholder: input.placeholder,
    value: input.value,
    // A textarea draws no datalist, so it isn't described by one
    ariaProps: getControlAttributes<T, S, F>(props),
    rows: typeof rows === 'number' && Number.isInteger(rows) && rows > 0 ? rows : undefined,
    onChange: input.onChange,
    onFocus: input.onFocus,
    onBlur: input.onBlur,
  };
}
