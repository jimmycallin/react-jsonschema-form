'use client';

import { useCallback } from 'react';

import getControlAttributes from './getControlAttributes.ts';
import numericWidgetStoresString from './numericWidgetStoresString.ts';
import rangeSpec from './rangeSpec.ts';
import toNumericValue from './toNumericValue.ts';
import type {
  ControlAttributes,
  FormContextType,
  RangeSpecType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from './types.ts';
import useSelectFocusHandlers from './useSelectFocusHandlers.ts';

export interface UseRangeWidgetPropsResult {
  /** The control's id */
  id: string;
  /** The control's name, for a native form submission */
  name: string;
  /** Whether the field is required */
  required: boolean | undefined;
  /** Whether the control is disabled, which it is when the field is disabled or read-only, since a slider has no
   * read-only state of its own
   */
  disabled: boolean;
  /** Whether the control takes focus when it mounts */
  autoFocus: boolean;
  /** The `min`, `max` and `step` the schema's `minimum`, `maximum` and `multipleOf` set, holding only those it sets, so
   * it can be spread onto a control whose own defaults fill the rest
   */
  spec: RangeSpecType;
  /** The form data as a number, or `undefined` where it holds none */
  value: number | undefined;
  /** The control's `aria-*` attributes */
  ariaProps: Omit<ControlAttributes, 'required'>;
  /** Reports the number the control moved to as form data: a string where the schema stores the number as one, and
   * `ui:emptyValue` for `undefined`
   */
  onChange: (value: number | undefined) => void;
  /** Reports the form data to `onFocus`. It takes no argument, so it can be handed to any control's focus event */
  onFocus: () => void;
  /** Reports the form data to `onBlur`. It takes no argument, so it can be handed to any control's blur event */
  onBlur: () => void;
}

/** Hook which holds what every `RangeWidget` does whatever its UI library: it reads the form data as a number, takes
 * the slider's `min`, `max` and `step` from the schema's `minimum`, `maximum` and `multipleOf`, writes a moved value
 * back as the number or string the schema stores, and supplies the control's id, name and `aria-*` attributes. The
 * handlers report nothing while the field is disabled or read-only. To be used by theme specific `RangeWidget`
 * implementations, and by an app's own.
 *
 * @param props - The `WidgetProps` for the `RangeWidget`
 * @returns - The `UseRangeWidgetPropsResult` to be used within a `RangeWidget` implementation
 */
export default function useRangeWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): UseRangeWidgetPropsResult {
  const {
    id,
    htmlName,
    schema,
    options,
    value,
    required,
    disabled = false,
    readonly = false,
    autofocus = false,
    onChange,
    onFocus,
    onBlur,
    presentation,
  } = props;
  const inactive = disabled || readonly;
  const storesString = numericWidgetStoresString<S>(schema, value);
  const { emptyValue } = options;

  const handleChange = useCallback(
    (next: number | undefined) => {
      if (inactive) {
        return;
      }
      if (next === undefined) {
        onChange(emptyValue);
      } else {
        onChange(storesString ? String(next) : next);
      }
    },
    [inactive, onChange, emptyValue, storesString],
  );
  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>(
    { id, value, options, onFocus, onBlur },
    inactive,
  );

  return {
    id,
    name: htmlName || id,
    required,
    disabled: inactive,
    autoFocus: autofocus,
    spec: rangeSpec<S>(schema),
    value: toNumericValue(value),
    ariaProps: getControlAttributes<T, S, F>({ id, presentation }),
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
}
