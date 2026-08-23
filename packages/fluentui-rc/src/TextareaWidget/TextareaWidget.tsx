import type { ChangeEvent, FocusEvent } from 'react';
import type { TextareaProps } from '@fluentui/react-components';
import { Label, Textarea, makeStyles } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, labelValue } from '@rjsf/utils';

/** The props of the `TextareaWidget`: the standard `WidgetProps` plus the `onChangeOverride` that
 * `BaseInputTemplateProps` documents. It arrives through the `WidgetProps` index signature, which types it `unknown`,
 * and it is typed here for the change event of the fluentui `Textarea` that this widget renders.
 */
type TextareaWidgetProps<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = WidgetProps<T, S, F> & {
  /** An optional handler that replaces the change handler this widget provides to the `Textarea` */
  onChangeOverride?: TextareaProps['onChange'];
};

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
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: TextareaWidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    placeholder,
    required,
    readonly,
    disabled,
    value,
    label,
    hideLabel,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
  } = props;
  const classes = useStyles();
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, target?.value);

  const rows = options.rows ?? 5;

  return (
    <>
      {labelValue(
        <Label htmlFor={id} required={required} disabled={disabled} className={classes.label}>
          {label}
        </Label>,
        hideLabel,
      )}
      <Textarea
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
        rows={rows}
      />
    </>
  );
}
