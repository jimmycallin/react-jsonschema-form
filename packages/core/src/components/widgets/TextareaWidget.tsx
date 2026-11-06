import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { useTextareaWidgetProps } from '@rjsf/utils';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const textarea = useTextareaWidgetProps<T, S, F>(props);
  return (
    <textarea
      id={textarea.id}
      name={textarea.name}
      className={props.registry.classMap.textarea}
      value={textarea.value}
      placeholder={textarea.placeholder}
      required={textarea.required}
      disabled={textarea.disabled}
      readOnly={textarea.readOnly}
      autoFocus={textarea.autoFocus}
      rows={textarea.rows}
      onBlur={textarea.onBlur}
      onFocus={textarea.onFocus}
      onChange={(event) => textarea.onChange(event.target.value)}
      {...textarea.ariaProps}
    />
  );
}

export default TextareaWidget;
