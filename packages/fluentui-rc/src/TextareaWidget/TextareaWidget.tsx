import type { ChangeEvent } from 'react';
import { Label, Textarea, makeStyles } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, useTextareaWidgetProps, widgetDrawsLabelText } from '@rjsf/utils';

const useStyles = makeStyles({
  label: {
    paddingTop: '2px',
    paddingBottom: '2px',
    marginBottom: '2px',
  },
});

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: WidgetProps<T, S, F> & {
    /** A handler that replaces the textarea's own change handling */
    onChangeOverride?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  },
) {
  const { label, onChangeOverride } = props;
  // A label holding only a required field's `*` would name the textarea "star", so one is drawn only with text
  const hideLabel = !widgetDrawsLabelText<T, S, F>(props);
  const classes = useStyles();
  const textarea = useTextareaWidgetProps<T, S, F>(props);

  return (
    <>
      {labelValue(
        <Label
          htmlFor={textarea.id}
          required={textarea.required}
          disabled={textarea.disabled}
          className={classes.label}
        >
          {label}
        </Label>,
        hideLabel,
      )}
      <Textarea
        id={textarea.id}
        name={textarea.name}
        placeholder={textarea.placeholder}
        autoFocus={textarea.autoFocus}
        required={textarea.required}
        disabled={textarea.disabled || textarea.readOnly}
        value={textarea.value}
        onChange={onChangeOverride ?? ((event) => textarea.onChange(event.target.value))}
        onFocus={textarea.onFocus}
        onBlur={textarea.onBlur}
        {...textarea.ariaProps}
        rows={textarea.rows ?? 5}
      />
    </>
  );
}
