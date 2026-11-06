import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { useCheckboxWidgetProps } from '@rjsf/utils';
import { Checkbox, theme } from 'antd';

import useControlState from '../../controlState.ts';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { disabled, registry, label, readonly } = props;
  const checkbox = useCheckboxWidgetProps<T, S, F>(props);
  const { token } = theme.useToken();
  const control = useControlState<T, S, F>({ disabled, readonly, required: checkbox.required, registry });

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = { onBlur: checkbox.onBlur, onFocus: checkbox.onFocus };
  return (
    <Checkbox
      autoFocus={checkbox.autoFocus}
      checked={checkbox.checked}
      disabled={control.disabled}
      id={checkbox.id}
      name={checkbox.name}
      required={control.toggleRequired}
      aria-readonly={control.ariaReadonly}
      onChange={(event) => checkbox.onChange(event.target.checked)}
      {...extraProps}
      {...checkbox.ariaProps}
    >
      {checkbox.drawsLabel && label ? (
        <>
          {label}
          {checkbox.required && (
            <span aria-hidden='true' style={{ color: token.colorError, marginLeft: 2 }}>
              *
            </span>
          )}
        </>
      ) : undefined}
    </Checkbox>
  );
}
