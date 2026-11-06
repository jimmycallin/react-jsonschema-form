import type { CheckboxProps } from '@mui/material/Checkbox';
import Checkbox from '@mui/material/Checkbox';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { FormGroupProps } from '@mui/material/FormGroup';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import type { FormContextType, GenericObjectType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { useCheckboxesWidgetProps } from '@rjsf/utils';

import { getMuiProps, withInputSlot } from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the CheckboxesWidget. */
export interface CheckboxesWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the CheckboxesWidget. */
  rjsfSlotProps?: {
    /** Props applied to the `FormGroup` container. */
    formGroup?: FormGroupProps;
    /** Props applied to the individual `Checkbox` components. */
    checkbox?: CheckboxProps;
    /** Props applied to the `FormControlLabel` components wrapping each checkbox. */
    formControlLabel?: FormControlLabelProps;
  };
}

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
  const { label, options } = props;
  const checkboxes = useCheckboxesWidgetProps<T, S, F>(props, { drawsLabel: true });

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, CheckboxesWidgetMuiProps>(options);
  // A `required` the form author gives the `Checkbox` goes on its `<input>`, as `RadioWidget`'s does, rather than on the
  // `Checkbox`, whose `FormControlLabel` would mark each option's label `*`
  const { required: authorRequired, ...checkboxProps } = muiSlotProps?.checkbox ?? {};
  const checkboxSlotProps = withInputSlot(
    { ...checkboxes.optionProps, required: authorRequired },
    checkboxProps.slotProps,
  );

  return (
    <>
      {/* No `for`, which can't name the group's wrapper: the group points its `aria-labelledby` at the label instead */}
      {checkboxes.drawsLabel && (
        <FormLabel id={checkboxes.labelId} required={checkboxes.required}>
          {label}
        </FormLabel>
      )}
      {/* The plan's group attributes go beneath the form author's, as the plan's control attributes do on each checkbox */}
      <FormGroup
        {...checkboxes.groupProps}
        {...otherMuiProps}
        {...muiSlotProps?.formGroup}
        id={checkboxes.id}
        row={checkboxes.inline}
      >
        {checkboxes.options.map((option) => (
          <FormControlLabel
            {...muiSlotProps?.formControlLabel}
            control={
              <Checkbox
                {...checkboxProps}
                id={option.id}
                name={checkboxes.name}
                checked={option.checked}
                value={option.value}
                disabled={checkboxes.disabled || option.disabled}
                autoFocus={checkboxProps.autoFocus ?? option.autoFocus}
                onChange={(event) => option.onCheckedChange(event.target.checked)}
                onBlur={option.onBlur}
                onFocus={option.onFocus}
                slotProps={checkboxSlotProps}
              />
            }
            key={option.index}
            label={option.label}
          />
        ))}
      </FormGroup>
    </>
  );
}
