import { Label, makeStyles, Slider } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, useRangeWidgetProps, widgetDrawsLabelText } from '@rjsf/utils';

const useStyles = makeStyles({
  // Fluent's `Slider` keeps a 120px minimum width, which would push it out of a narrower layout grid column
  slider: { minWidth: 0 },
});

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label } = props;
  const classes = useStyles();
  const range = useRangeWidgetProps<T, S, F>(props);
  // A label holding only a required field's `*` would name the slider "star", so one is drawn only with text
  const hideLabel = !widgetDrawsLabelText<T, S, F>(props);

  return (
    <>
      {labelValue(
        <Label required={range.required} htmlFor={range.id}>
          {label}
        </Label>,
        hideLabel,
      )}
      <Slider
        className={classes.slider}
        disabled={range.disabled}
        onChange={(_, data) => range.onChange(data.value)}
        onBlur={range.onBlur}
        onFocus={range.onFocus}
        value={range.value}
        id={range.id}
        name={range.name}
        required={range.required}
        autoFocus={range.autoFocus}
        {...range.spec}
        {...range.ariaProps}
      />
    </>
  );
}
