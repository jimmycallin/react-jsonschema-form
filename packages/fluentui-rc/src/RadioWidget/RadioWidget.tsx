import { Label, Radio, RadioGroup } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { useRadioWidgetProps } from '@rjsf/utils';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const radio = useRadioWidgetProps<T, S, F>(props, { drawsLabel: true });

  return (
    <>
      {radio.drawsLabel && (
        <Label id={radio.labelId} required={radio.required}>
          {props.label}
        </Label>
      )}
      <RadioGroup
        id={radio.id}
        name={radio.name}
        required={radio.required}
        layout={radio.inline ? 'horizontal' : 'vertical'}
        value={radio.value || undefined}
        onChange={(_, data) => radio.onChange(data.value)}
        {...radio.groupProps}
      >
        {radio.options.map((option) => (
          <Radio
            id={option.id}
            autoFocus={option.autoFocus}
            label={option.label}
            value={option.value}
            key={option.index}
            disabled={radio.disabled || option.disabled}
            onFocus={option.onFocus}
            onBlur={option.onBlur}
            {...radio.optionProps}
          />
        ))}
      </RadioGroup>
    </>
  );
}
