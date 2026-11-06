import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import type { RadioProps } from '@mui/material/Radio';
import Radio from '@mui/material/Radio';
import type { RadioGroupProps } from '@mui/material/RadioGroup';
import RadioGroup from '@mui/material/RadioGroup';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { useRadioWidgetProps } from '@rjsf/utils';

import { getMuiProps, withInputSlot } from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the RadioWidget. */
export interface RadioWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the RadioWidget. */
  rjsfSlotProps?: {
    /** Props applied to the `RadioGroup` component. */
    radioGroup?: RadioGroupProps;
    /** Props applied to the individual `Radio` components. */
    radio?: RadioProps;
    /** Props applied to the `FormControlLabel` components wrapping each radio button. */
    formControlLabel?: FormControlLabelProps;
  };
}

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
  const { options, label } = props;
  const radio = useRadioWidgetProps<T, S, F>(props, { drawsLabel: true });

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, RadioWidgetMuiProps>(options);
  // `required`, the field's or one the form author gives the `Radio`, which replaces it, goes on the `<input>` rather
  // than the `Radio`, whose `FormControlLabel` would mark each option's label `*`
  const { required: authorRequired, ...radioProps } = muiSlotProps?.radio ?? {};
  const radioSlotProps = withInputSlot(
    { ...radio.optionProps, required: authorRequired ?? radio.required },
    radioProps.slotProps,
  );

  return (
    <>
      {/* No `for`, which can't name the group's wrapper: the group points its `aria-labelledby` at the label instead */}
      {radio.drawsLabel && (
        <FormLabel id={radio.labelId} required={radio.required}>
          {label}
        </FormLabel>
      )}
      {/* The plan's group attributes go beneath the form author's, as the plan's control attributes do on each radio */}
      <RadioGroup
        {...radio.groupProps}
        {...otherMuiProps}
        {...muiSlotProps?.radioGroup}
        id={radio.id}
        name={radio.name}
        value={radio.value}
        row={radio.inline}
        onChange={(_, value) => radio.onChange(value)}
      >
        {radio.options.map((option) => (
          <FormControlLabel
            {...muiSlotProps?.formControlLabel}
            control={
              <Radio
                {...radioProps}
                name={radio.name}
                id={option.id}
                autoFocus={radioProps.autoFocus ?? option.autoFocus}
                onFocus={option.onFocus}
                onBlur={option.onBlur}
                color='primary'
                slotProps={radioSlotProps}
              />
            }
            label={option.label}
            value={option.value}
            key={option.index}
            disabled={radio.disabled || option.disabled}
          />
        ))}
      </RadioGroup>
    </>
  );
}
