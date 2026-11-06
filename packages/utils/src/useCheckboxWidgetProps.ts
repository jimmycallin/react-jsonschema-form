'use client';

import { useCallback } from 'react';

import getControlAttributes from './getControlAttributes.ts';
import schemaRequiresTrueValue from './schemaRequiresTrueValue.ts';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import useSelectFocusHandlers from './useSelectFocusHandlers.ts';
import widgetDrawsLabel from './widgetDrawsLabel.ts';

export interface UseCheckboxWidgetPropsResult {
  /** The checkbox's id */
  id: string;
  /** The checkbox's name, for a native form submission */
  name: string;
  /** Whether the checkbox is checked, which it is for truthy form data */
  checked: boolean;
  /** Whether the checkbox must be checked, which it must only where the schema requires `true`, since an unchecked
   * checkbox fails a browser's `required` check whatever `false` the schema allows
   */
  required: boolean;
  /** Whether the checkbox is disabled, which it is when the field is disabled or read-only */
  disabled: boolean;
  /** Whether the checkbox takes focus when it mounts */
  autoFocus: boolean;
  /** Whether the widget draws the field's label beside the checkbox, which it does unless its plan gives the label to
   * another component or the label is hidden
   */
  drawsLabel: boolean;
  /** The checkbox's `aria-*` attributes */
  ariaProps: Omit<ControlAttributes, 'required'>;
  /** Reports whether the checkbox is checked as form data. It reports nothing while the field is disabled or read-only */
  onChange: (checked: boolean) => void;
  /** Reports the form data to `onFocus`. It takes no argument, so it can be handed to any control's focus event */
  onFocus: () => void;
  /** Reports the form data to `onBlur`. It takes no argument, so it can be handed to any control's blur event */
  onBlur: () => void;
}

/** Hook which holds what every `CheckboxWidget` does whatever its UI library: it reads whether the checkbox is checked,
 * marks it required only where the schema requires `true`, says whether the widget draws the field's label, and
 * supplies the checkbox's id, name and `aria-*` attributes. The handlers report nothing while the field is disabled or
 * read-only. To be used by theme specific `CheckboxWidget` implementations, and by an app's own.
 *
 * @param props - The `WidgetProps` for the `CheckboxWidget`
 * @returns - The `UseCheckboxWidgetPropsResult` to be used within a `CheckboxWidget` implementation
 */
export default function useCheckboxWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): UseCheckboxWidgetPropsResult {
  const {
    id,
    htmlName,
    schema,
    options,
    value,
    required = false,
    disabled = false,
    readonly = false,
    autofocus = false,
    onChange,
    onFocus,
    onBlur,
    presentation,
  } = props;
  const inactive = disabled || readonly;
  const handleChange = useCallback(
    (checked: boolean) => {
      if (!inactive) {
        onChange(checked);
      }
    },
    [inactive, onChange],
  );
  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>(
    { id, value, options, onFocus, onBlur },
    inactive,
  );

  return {
    id,
    name: htmlName || id,
    checked: Boolean(value),
    required: required && schemaRequiresTrueValue<S>(schema),
    disabled: inactive,
    autoFocus: autofocus,
    drawsLabel: widgetDrawsLabel<T, S, F>(props),
    ariaProps: getControlAttributes<T, S, F>({ id, presentation }),
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
}
