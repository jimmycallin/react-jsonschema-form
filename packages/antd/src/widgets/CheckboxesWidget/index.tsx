import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { useCheckboxesWidgetProps } from '@rjsf/utils';
import { Checkbox } from 'antd';

import useControlState from '../../controlState.ts';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { disabled, readonly, registry } = props;
  const control = useControlState<T, S, F>({ disabled, readonly, registry });
  const checkboxes = useCheckboxesWidgetProps<T, S, F>(props);

  // Antd's typescript definitions for `Checkbox.Group` do not contain `id`, which it does use when provided, so it is
  // spread on via `extraProps` to avoid a typescript error
  const extraProps = { id: checkboxes.id };

  return checkboxes.options.length > 0 ? (
    <Checkbox.Group
      name={checkboxes.name}
      onChange={checkboxes.onChange}
      value={checkboxes.value}
      {...extraProps}
      {...checkboxes.groupProps}
    >
      {checkboxes.options.map((option) => (
        <span key={option.index}>
          <Checkbox
            id={option.id}
            name={checkboxes.name}
            autoFocus={option.autoFocus}
            // `undefined` rather than `false` for an enabled option, since antd reads its `DisabledContext` only when
            // the checkbox leaves `disabled` unset
            disabled={control.disabled || option.disabled || undefined}
            aria-readonly={control.ariaReadonly}
            value={option.value}
            onBlur={option.onBlur}
            onFocus={option.onFocus}
            {...checkboxes.optionProps}
          >
            {option.label}
          </Checkbox>
          {!checkboxes.inline && <br />}
        </span>
      ))}
    </Checkbox.Group>
  ) : null;
}
