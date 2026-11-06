import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { useTextareaWidgetProps } from '@rjsf/utils';
import { Input } from 'antd';

import useControlState from '../../controlState.ts';

const INPUT_STYLE = {
  width: '100%',
};

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { disabled, readonly, registry, value } = props;
  const textarea = useTextareaWidgetProps<T, S, F>(props);
  const control = useControlState<T, S, F>({ disabled, readonly, registry });

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    type: 'textarea',
  };

  return (
    <Input.TextArea
      autoFocus={textarea.autoFocus}
      disabled={control.disabled}
      id={textarea.id}
      name={textarea.name}
      onBlur={textarea.onBlur}
      onChange={(event) => textarea.onChange(event.target.value)}
      onFocus={textarea.onFocus}
      placeholder={textarea.placeholder}
      readOnly={textarea.readOnly}
      required={textarea.required}
      rows={textarea.rows ?? 4}
      style={INPUT_STYLE}
      value={value === undefined ? undefined : textarea.value}
      {...extraProps}
      {...textarea.ariaProps}
    />
  );
}
